#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}

export function main(argv = process.argv) {
  const { values } = parseArgs({
    args: argv.slice(2),
    options: {
      "compose-dir": { type: "string", default: "examples/local-screeps-server" },
      out: { type: "string" },
      markdown: { type: "boolean", default: true },
      "log-tail": { type: "string", default: "120" },
    },
  });

  const composeDir = resolve(String(values["compose-dir"]));
  const logTail = Number.parseInt(String(values["log-tail"]), 10);
  const safeTail = Number.isFinite(logTail) && logTail > 0 ? logTail : 120;
  const proof = collectProof({ composeDir, logTail: safeTail });
  const markdown = formatProof(proof);

  if (values.out) {
    const outPath = resolve(String(values.out));
    mkdirSync(resolve(outPath, ".."), { recursive: true });
    writeFileSync(outPath, markdown, "utf8");
    console.log(`Wrote local Screeps proof template to ${outPath}`);
  } else {
    console.log(markdown);
  }
}

export function collectProof({ composeDir, logTail = 120 }) {
  const composeFile = join(composeDir, "docker-compose.yml");
  const configFile = join(composeDir, "config.yml");
  const envFile = join(composeDir, ".env");
  const composeArgs = (args) => buildComposeArgs({ composeFile, envFile, args });
  const redactions = buildRedactions(process.env);
  const dockerVersion = run("docker", ["--version"]);
  const composeVersion = run("docker", ["compose", "version"]);
  const composePs = existsSync(composeFile)
    ? run("docker", composeArgs(["ps"]))
    : missing("docker-compose.yml not found");
  const screepsLogs = existsSync(composeFile)
    ? run("docker", composeArgs(["logs", `--tail=${logTail}`, "screeps"]))
    : missing("docker-compose.yml not found");

  return {
    generatedAt: new Date().toISOString(),
    composeDir,
    files: {
      composeFile: existsSync(composeFile),
      configFile: existsSync(configFile),
      envFile: existsSync(envFile),
    },
    dockerVersion,
    composeVersion,
    composePs,
    screepsLogs,
    redactions,
    env: {
      serverUrl: sanitizeUrlForDisplay(
        process.env.SCREEPS_SERVER_URL || "http://127.0.0.1:21025",
      ),
      branch: process.env.SCREEPS_BRANCH || "sandbox",
      hasToken: Boolean(process.env.SCREEPS_TOKEN),
    },
  };
}

export function buildComposeArgs({ composeFile, envFile, args }) {
  const composeArgs = ["compose"];
  if (existsSync(envFile)) {
    composeArgs.push("--env-file", envFile);
  }
  composeArgs.push("-f", composeFile, ...args);
  return composeArgs;
}

export function formatProof(proof) {
  const redactions = proof.redactions || [];
  return `## Local Screeps private-server proof

Generated: ${proof.generatedAt}

### Environment

- Server URL: ${proof.env.serverUrl}
- Branch: ${proof.env.branch}
- Token configured: ${proof.env.hasToken ? "yes (redacted)" : "no"}
- Compose dir: ${proof.composeDir}
- docker-compose.yml present: ${proof.files.composeFile ? "yes" : "no"}
- config.yml present: ${proof.files.configFile ? "yes" : "no"}
- .env present: ${proof.files.envFile ? "yes (not shown)" : "no"}

### Docker

\`\`\`text
${clip(proof.dockerVersion.output)}
${clip(proof.composeVersion.output)}
\`\`\`

### Compose status

\`\`\`text
${clip(redact(proof.composePs.output, redactions))}
\`\`\`

### Screeps server logs tail

\`\`\`text
${clip(redact(proof.screepsLogs.output, redactions))}
\`\`\`

### Required PR notes

- Commit SHA tested:
- Seed/config used:
- Room/server reset command used:
- Tick count observed:
- Final RCL / behavior observed:
- Regression test added/updated:
- GitHub-attached clip/GIF, if any:

Do not paste secrets. Do not link external archives. Attach short videos directly to GitHub when needed.
`;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 15_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) return { ok: false, output: `${command} ${args.join(" ")} failed: ${result.error.message}` };
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { ok: result.status === 0, output: output || `(no output; exit ${result.status})` };
}

function missing(message) {
  return { ok: false, output: message };
}

function clip(value, max = 12_000) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... clipped ...`;
}

export function sanitizeUrlForDisplay(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid SCREEPS_SERVER_URL";
  }
}

export function buildRedactions(env) {
  const values = [env.SCREEPS_TOKEN].filter(Boolean);
  if (env.SCREEPS_SERVER_URL) {
    try {
      const url = new URL(env.SCREEPS_SERVER_URL);
      if (url.username) values.push(url.username, decodeURIComponent(url.username));
      if (url.password) values.push(url.password, decodeURIComponent(url.password));
    } catch {
      // Invalid URLs are represented generically in proof output.
    }
  }
  return [...new Set(values.filter((value) => String(value).length > 0))];
}

function redact(value, redactions) {
  let output = String(value || "");
  for (const secret of redactions) {
    output = output.split(String(secret)).join("[redacted]");
  }
  return output;
}
