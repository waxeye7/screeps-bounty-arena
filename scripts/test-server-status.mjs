#!/usr/bin/env node

import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { runOfflineSimulation, formatMarkdownReport } from "./simulate.mjs";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.env).catch((error) => {
    console.error(redactSecrets(error.stack || error.message, process.env));
    process.exitCode = 1;
  });
}

async function main(env) {
  const { values } = parseArgs({
    options: {
      ticks: { type: "string", short: "t", default: "1000" },
      seed: { type: "string", default: "private-test-server" },
      markdown: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      room: { type: "string" },
      shard: { type: "string", default: "shard0" },
      "timeout-ms": { type: "string", default: "1500" },
    },
  });

  const config = readStatusConfig({ env, values });
  const status = await collectServerStatus(config);

  if (values.json) {
    console.log(redactSecrets(JSON.stringify(status, null, 2), env));
  } else if (values.markdown) {
    console.log(redactSecrets(formatStatusMarkdown(status), env));
  } else {
    console.log(redactSecrets(formatStatusText(status), env));
  }
}

export function readStatusConfig({ env = process.env, values = {} } = {}) {
  const ticks = parsePositiveInteger(values.ticks ?? "1000", "--ticks");
  const timeoutMs = parsePositiveInteger(values["timeout-ms"] ?? "1500", "--timeout-ms");

  return {
    serverUrl: normalizeServerUrl(env.SCREEPS_SERVER_URL || "http://127.0.0.1:21025"),
    username: env.SCREEPS_USERNAME || "",
    branch: env.SCREEPS_BRANCH || "sandbox",
    token: env.SCREEPS_TOKEN || "",
    room: values.room || env.SCREEPS_ROOM || "",
    shard: values.shard || env.SCREEPS_SHARD || "shard0",
    ticks,
    seed: values.seed || "private-test-server",
    timeoutMs,
  };
}

export async function collectServerStatus(config) {
  const endpoints = buildStatusEndpoints(config);
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await fetchStatusEndpoint(endpoint, config));
  }

  const reachable = results.some((result) => result.reachable);
  const serverData = summarizeAvailableData(results);
  const simulation = runOfflineSimulation({
    ticks: config.ticks,
    seed: config.seed,
    spawnConfig: "balanced",
  });

  return {
    environment: "private/test-server status",
    checkedAt: new Date().toISOString(),
    serverUrl: redactUrl(config.serverUrl),
    branch: config.branch,
    username: config.username || "not configured",
    tokenConfigured: Boolean(config.token),
    room: config.room || "not configured",
    shard: config.shard,
    reachable,
    fallback: reachable
      ? "server API responded; offline simulation kept as comparison only"
      : "server/API unavailable; using offline simulation fallback",
    endpoints: results.map((result) => ({
      name: result.name,
      url: redactUrl(result.url),
      reachable: result.reachable,
      status: result.status,
      summary: result.summary,
    })),
    serverData,
    simulation,
  };
}

export function buildStatusEndpoints(config) {
  const endpoints = [
    { name: "version", url: buildUrl(config.serverUrl, "/api/version") },
  ];

  if (config.token) {
    endpoints.push({
      name: "auth",
      url: buildUrl(config.serverUrl, "/api/auth/me"),
      needsToken: true,
    });
    endpoints.push({
      name: "memory",
      url: buildUrl(config.serverUrl, "/api/user/memory", {
        path: "",
        branch: config.branch,
      }),
      needsToken: true,
    });
  }

  if (config.room) {
    endpoints.push({
      name: "room-status",
      url: buildUrl(config.serverUrl, "/api/game/room-status", {
        room: config.room,
      }),
    });
    endpoints.push({
      name: "room-overview",
      url: buildUrl(config.serverUrl, "/api/game/room-overview", {
        room: config.room,
        shard: config.shard,
        interval: "8",
      }),
    });
  }

  return endpoints;
}

async function fetchStatusEndpoint(endpoint, config) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(endpoint.url, {
      signal: controller.signal,
      headers: requestHeaders(config, endpoint),
    });
    const text = await response.text();
    const redactedText = redactSecrets(text, {
      SCREEPS_TOKEN: config.token,
      SCREEPS_SERVER_URL: config.serverUrl,
    });

    return {
      name: endpoint.name,
      url: endpoint.url,
      reachable: true,
      status: response.status,
      ok: response.ok,
      data: parseJson(redactedText),
      summary: summarizeEndpointResponse(response.status, redactedText),
    };
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      reachable: false,
      status: "unreachable",
      ok: false,
      data: null,
      summary: redactSecrets(error.message, {
        SCREEPS_TOKEN: config.token,
        SCREEPS_SERVER_URL: config.serverUrl,
      }),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function requestHeaders(config, endpoint) {
  const headers = { Accept: "application/json" };
  if (endpoint.needsToken && config.token) {
    headers["X-Token"] = config.token;
  }
  if (endpoint.needsToken && config.username) {
    headers["X-Username"] = config.username;
  }
  return headers;
}

function summarizeAvailableData(results) {
  const facts = {
    user: "unavailable",
    tick: "unavailable",
    rcl: "unavailable",
  };

  for (const result of results) {
    if (!result.data) continue;
    if (facts.user === "unavailable") facts.user = findFirst(result.data, USER_KEYS);
    if (facts.tick === "unavailable") facts.tick = findFirst(result.data, TICK_KEYS);
    if (facts.rcl === "unavailable") facts.rcl = findFirst(result.data, RCL_KEYS);
  }

  return facts;
}

const USER_KEYS = new Set(["username", "user", "name"]);
const TICK_KEYS = new Set(["tick", "gameTime", "time"]);
const RCL_KEYS = new Set(["rcl", "level", "controllerLevel"]);

function findFirst(value, keys, depth = 0) {
  if (depth > 6 || value === null || typeof value !== "object") return "unavailable";

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirst(item, keys, depth + 1);
      if (found !== "unavailable") return found;
    }
    return "unavailable";
  }

  for (const [key, item] of Object.entries(value)) {
    if (keys.has(key) && isPrintableStatusValue(item)) return String(item);
  }

  for (const item of Object.values(value)) {
    const found = findFirst(item, keys, depth + 1);
    if (found !== "unavailable") return found;
  }

  return "unavailable";
}

function isPrintableStatusValue(value) {
  return ["string", "number", "boolean"].includes(typeof value) && String(value).length <= 120;
}

function summarizeEndpointResponse(status, text) {
  const firstLine = text.trim().split("\n").find(Boolean) || "(empty response)";
  return `HTTP ${status}: ${firstLine.slice(0, 240)}`;
}

export function formatStatusText(status) {
  return [
    "Screeps private/test-server status",
    `server: ${status.serverUrl}`,
    `branch: ${status.branch}`,
    `user: ${status.username}`,
    `token configured: ${status.tokenConfigured ? "yes (redacted)" : "no"}`,
    `reachable: ${status.reachable ? "yes" : "no"}`,
    `fallback: ${status.fallback}`,
    `server tick: ${status.serverData.tick}`,
    `server RCL: ${status.serverData.rcl}`,
    `server user: ${status.serverData.user}`,
    "",
    "API probes:",
    ...status.endpoints.map(
      (endpoint) =>
        `- ${endpoint.name}: ${endpoint.status} (${endpoint.reachable ? "reachable" : "unreachable"}) ${endpoint.summary}`,
    ),
    "",
    "Offline comparison:",
    `ticks: ${status.simulation.ticks}`,
    `ok: ${status.simulation.ok}`,
    `final RCL: ${status.simulation.final.rcl}`,
    `creeps: ${status.simulation.final.creeps}`,
    `failures: ${status.simulation.failures.length}`,
  ].join("\n");
}

export function formatStatusMarkdown(status) {
  return `## Screeps private/test-server status

Generated: ${status.checkedAt}

### Target

- Server: ${status.serverUrl}
- Branch: ${status.branch}
- User: ${status.username}
- Token configured: ${status.tokenConfigured ? "yes (redacted)" : "no"}
- Reachable: ${status.reachable ? "yes" : "no"}
- Fallback: ${status.fallback}

### Server data

- User: ${status.serverData.user}
- Tick: ${status.serverData.tick}
- RCL: ${status.serverData.rcl}

### API probes

${status.endpoints
  .map(
    (endpoint) =>
      `- ${endpoint.name}: ${endpoint.status} (${endpoint.reachable ? "reachable" : "unreachable"}) - ${endpoint.summary}`,
  )
  .join("\n")}

### Offline comparison

${formatMarkdownReport(status.simulation)}
`;
}

function buildUrl(serverUrl, pathname, params = {}) {
  const url = new URL(pathname, `${serverUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}

function normalizeServerUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("SCREEPS_SERVER_URL must start with http:// or https://");
  }
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function redactUrl(value) {
  const url = new URL(value);
  url.username = url.username ? "[redacted]" : "";
  url.password = url.password ? "[redacted]" : "";
  for (const key of Array.from(url.searchParams.keys())) {
    if (/token|password|secret|key/i.test(key)) {
      url.searchParams.set(key, "[redacted]");
    }
  }
  return url.toString().replace(/\/$/, "");
}

export function redactSecrets(value, env = process.env) {
  let output = String(value);
  const secrets = [
    env.SCREEPS_TOKEN,
    ...extractUrlSecrets(env.SCREEPS_SERVER_URL),
  ].filter((secret) => secret && secret.length >= 4);

  for (const secret of secrets) {
    output = output.split(secret).join("[redacted]");
  }

  return output;
}

function extractUrlSecrets(value) {
  if (!value) return [];
  try {
    const url = new URL(value);
    return [
      url.password,
      ...Array.from(url.searchParams.entries())
        .filter(([key]) => /token|password|secret|key/i.test(key))
        .map(([, secret]) => secret),
    ].filter(Boolean);
  } catch {
    return [];
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got ${value}`);
  }
  return parsed;
}
