#!/usr/bin/env node

import { parseArgs } from "node:util";
import { runOfflineSimulation, formatMarkdownReport } from "./simulate.mjs";

const { values } = parseArgs({
  options: {
    ticks: { type: "string", short: "t", default: "1000" },
    seed: { type: "string", default: "private-test-server" },
    markdown: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
  },
});

const ticks = Number.parseInt(values.ticks, 10);
if (!Number.isFinite(ticks) || ticks <= 0) {
  throw new Error(`--ticks must be a positive integer, got ${values.ticks}`);
}

const result = runOfflineSimulation({
  ticks,
  seed: values.seed,
  spawnConfig: "balanced",
});

const status = {
  environment: "private/test-server smoke placeholder",
  serverUrl: process.env.SCREEPS_SERVER_URL || "http://127.0.0.1:21025",
  branch: process.env.SCREEPS_BRANCH || "sandbox",
  hasToken: Boolean(process.env.SCREEPS_TOKEN),
  simulation: result,
};

if (values.json) {
  console.log(JSON.stringify(status, null, 2));
} else if (values.markdown) {
  console.log(formatMarkdownReport(result));
} else {
  console.log("Screeps private/test-server status smoke");
  console.log(`server: ${status.serverUrl}`);
  console.log(`branch: ${status.branch}`);
  console.log(`token configured: ${status.hasToken ? "yes" : "no"}`);
  console.log(`ticks: ${result.ticks}`);
  console.log(`ok: ${result.ok}`);
  console.log(`final RCL: ${result.final.rcl}`);
  console.log(`creeps: ${result.final.creeps}`);
  console.log(`failures: ${result.failures.length}`);
}
