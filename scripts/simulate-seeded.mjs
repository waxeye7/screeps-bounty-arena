#!/usr/bin/env node

import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { runOfflineSimulation } from "./simulate.mjs";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  const { values } = parseArgs({
    options: {
      runs: { type: "string", default: "3" },
      ticks: { type: "string", default: "3000" },
      "seed-base": { type: "string" },
      "spawn-configs": { type: "string", default: "conservative,balanced,aggressive" },
      "require-rcl": { type: "string", default: "3" },
      "require-rcl-by": { type: "string", default: "3000" },
      json: { type: "boolean", default: false },
      markdown: { type: "boolean", default: false },
    },
  });

  if (values.json && values.markdown) {
    throw new Error("Use only one output mode: --json or --markdown");
  }

  const config = readConfig(values, process.env);
  const result = runSeededSuite(config);

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (values.markdown) {
    console.log(formatMarkdown(result));
  } else {
    console.log(formatText(result));
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

export function readConfig(values, env = process.env) {
  const runs = parsePositiveInteger(values.runs, "--runs");
  const ticks = parsePositiveInteger(values.ticks, "--ticks");
  const requireRcl = parsePositiveInteger(values["require-rcl"], "--require-rcl");
  const requireRclBy = parsePositiveInteger(values["require-rcl-by"], "--require-rcl-by");
  const spawnConfigs = String(values["spawn-configs"] || "balanced")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (spawnConfigs.length === 0) {
    throw new Error("--spawn-configs must include at least one config");
  }

  return {
    runs,
    ticks,
    seedBase: values["seed-base"] || defaultSeedBase(env),
    spawnConfigs,
    requireRcl,
    requireRclBy,
  };
}

export function runSeededSuite(config) {
  const cases = [];
  for (let index = 0; index < config.runs; index += 1) {
    const spawnConfig = config.spawnConfigs[index % config.spawnConfigs.length];
    const seed = `${config.seedBase}:run-${index + 1}:${spawnConfig}`;
    const result = runOfflineSimulation({
      ticks: config.ticks,
      seed,
      spawnConfig,
      gates: {
        requireRcl: config.requireRcl,
        requireRclBy: config.requireRclBy,
        maxFailures: 0,
      },
    });
    cases.push({
      index: index + 1,
      seed,
      spawnConfig,
      ok: result.ok,
      finalRcl: result.final.rcl,
      failures: result.failures.length,
      reached: result.gates.find((gate) => gate.name === "required-rcl")?.actual,
      result,
    });
  }

  return {
    ok: cases.every((entry) => entry.ok),
    suite: "seeded-offline-smoke-v1",
    seedBase: config.seedBase,
    ticks: config.ticks,
    runs: config.runs,
    spawnConfigs: config.spawnConfigs,
    requiredRcl: config.requireRcl,
    requiredRclBy: config.requireRclBy,
    cases,
  };
}

export function defaultSeedBase(env = process.env) {
  return (
    env.CI_SEED_BASE ||
    env.GITHUB_HEAD_SHA ||
    env.GITHUB_SHA ||
    env.GITHUB_RUN_ID ||
    `local-${new Date().toISOString()}`
  );
}

function formatText(result) {
  const lines = [
    "Screeps seeded simulation suite",
    `suite: ${result.suite}`,
    `seed base: ${result.seedBase}`,
    `ticks: ${result.ticks}`,
    `runs: ${result.runs}`,
    `required RCL: ${result.requiredRcl} by tick ${result.requiredRclBy}`,
    `ok: ${result.ok}`,
    "cases:",
  ];

  for (const entry of result.cases) {
    lines.push(
      `- ${entry.ok ? "PASS" : "FAIL"} run ${entry.index}: seed=${entry.seed} spawnConfig=${entry.spawnConfig} finalRcl=${entry.finalRcl} failures=${entry.failures} reached=${entry.reached}`,
    );
  }

  const failingCases = result.cases.filter(
    (entry) => !entry.ok && entry.result?.breadcrumbs?.length,
  );
  if (failingCases.length) {
    lines.push("breadcrumbs:");
    for (const entry of failingCases) {
      lines.push(
        `- run ${entry.index} (${entry.seed}): ${formatBreadcrumbsInline(entry.result.breadcrumbs)}`,
      );
    }
  }

  return lines.join("\n");
}

function formatMarkdown(result) {
  const lines = [
    "## Seeded Screeps Simulation Suite",
    "",
    `- Suite: \`${result.suite}\``,
    `- Seed base: \`${result.seedBase}\``,
    `- Ticks: ${result.ticks}`,
    `- Runs: ${result.runs}`,
    `- Required RCL: ${result.requiredRcl} by tick ${result.requiredRclBy}`,
    `- OK: ${result.ok ? "yes" : "no"}`,
    "",
    "| Run | Result | Seed | Spawn config | Final RCL | Failures | Gate result |",
    "| ---: | --- | --- | --- | ---: | ---: | --- |",
    ...result.cases.map((entry) =>
      `| ${entry.index} | ${entry.ok ? "PASS" : "FAIL"} | \`${entry.seed}\` | \`${entry.spawnConfig}\` | ${entry.finalRcl} | ${entry.failures} | ${entry.reached} |`,
    ),
    "",
    "Copy the seed base and failing run seed into the PR if this gate fails.",
  ];

  const failingCases = result.cases.filter(
    (entry) => !entry.ok && entry.result?.breadcrumbs?.length,
  );
  if (failingCases.length) {
    lines.push("", "### Breadcrumbs (failed runs)");
    for (const entry of failingCases) {
      lines.push(
        `- Run ${entry.index} (\`${entry.seed}\`): ${formatBreadcrumbsInline(entry.result.breadcrumbs)}`,
      );
    }
  }

  return lines.join("\n");
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got ${value}`);
  }
  return parsed;
}

function formatBreadcrumbsInline(breadcrumbs) {
  return breadcrumbs
    .map((entry) => `tick ${entry.tick}: ${entry.summary}`)
    .join(" | ");
}
