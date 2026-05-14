#!/usr/bin/env node

/**
 * export-proof-log.mjs
 *
 * Exports a JSON proof log for private-server deploy verification.
 * Never includes the token value in any output.
 *
 * Usage:
 *   node scripts/export-proof-log.mjs              # prints JSON to stdout
 *   node scripts/export-proof-log.mjs --out proof.json  # writes JSON to file
 *
 * Environment variables:
 *   SCREEPS_SERVER_URL   - target server URL (default: http://127.0.0.1:21025)
 *   SCREEPS_BRANCH       - deploy branch     (default: sandbox)
 *   SCREEPS_TOKEN        - auth token (NEVER printed; only its presence is noted)
 *   SCREEPS_COMMIT_SHA   - optional; falls back to `git rev-parse HEAD` or 'unknown'
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** Resolve the current commit SHA without leaking any secrets. */
export function resolveCommitSha(env) {
  if (env.SCREEPS_COMMIT_SHA && env.SCREEPS_COMMIT_SHA.trim() !== "") {
    return env.SCREEPS_COMMIT_SHA.trim();
  }
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "unknown";
  }
}

/** Build the proof log object. The token value is NEVER included. */
export function buildProofLog(env) {
  const commitSha = resolveCommitSha(env);
  const serverUrl = env.SCREEPS_SERVER_URL || "http://127.0.0.1:21025";
  const branch = env.SCREEPS_BRANCH || "sandbox";
  const hasToken = Boolean(env.SCREEPS_TOKEN && env.SCREEPS_TOKEN.trim() !== "");
  const dryRun = env.SCREEPS_DRY_RUN !== "0";

  return {
    generatedAt: new Date().toISOString(),
    commitSha,
    serverUrl,
    branch,
    hasToken,
    dryRun,
    tickCount: "N/A (simulation only)",
    rcl: "N/A (simulation only)",
    note: "Proof requires real server run; this export is config + dry-run only",
  };
}

/** Parse --out <path> flag from argv. */
export function parseArgs(argv) {
  const outIdx = argv.indexOf("--out");
  const outPath = outIdx !== -1 && argv[outIdx + 1] ? argv[outIdx + 1] : null;
  return { outPath };
}

function main() {
  const { outPath } = parseArgs(process.argv.slice(2));
  const proof = buildProofLog(process.env);
  const json = JSON.stringify(proof, null, 2);

  if (outPath) {
    const dest = resolve(outPath);
    writeFileSync(dest, json + "\n", "utf8");
    console.log(`Proof log written to: ${dest}`);
  } else {
    process.stdout.write(json + "\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
