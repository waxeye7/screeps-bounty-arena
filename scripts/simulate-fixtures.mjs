#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { listSimulationFixtures } from "./simulation-fixtures.mjs";
import { runOfflineSimulation } from "./simulate.mjs";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  const { values } = parseArgs({
    options: {
      ticks: { type: "string", default: "1000" },
      "require-rcl": { type: "string", default: "2" },
      "require-rcl-by": { type: "string", default: "1000" },
      "max-failures": { type: "string", default: "0" },
      json: { type: "boolean", default: false },
    },
  });

  const ticks = parsePositiveInteger(values.ticks, "--ticks");
  const requireRcl = parsePositiveInteger(
    values["require-rcl"],
    "--require-rcl",
  );
  const requireRclBy = parsePositiveInteger(
    values["require-rcl-by"],
    "--require-rcl-by",
  );
  const maxFailures = parseNonNegativeInteger(
    values["max-failures"],
    "--max-failures",
  );

  const gates = { requireRcl, requireRclBy, maxFailures };
  const suite = runFixtureSuite({ ticks, gates });

  if (values.json) {
    console.log(JSON.stringify(suite, null, 2));
  } else {
    console.log(formatFixtureMatrix(suite));
  }

  if (!suite.ok) {
    process.exitCode = 1;
  }
}

export function runFixtureSuite({ ticks, gates = {} }) {
  const requireRcl = gates.requireRcl ?? 2;
  const requireRclBy = gates.requireRclBy ?? ticks;

  const fixtures = listSimulationFixtures();
  const entries = fixtures.map((fixture) => {
    const result = runOfflineSimulation({
      ticks,
      fixtureName: fixture.name,
      gates: {
        requireRcl,
        requireRclBy,
        maxFailures: gates.maxFailures ?? 0,
      },
    });

    const rclGate = result.gates.find((g) => g.name === "required-rcl");
    const highestMilestone =
      result.milestones[result.milestones.length - 1];

    let keyMilestone;
    if (rclGate) {
      if (rclGate.reachedTick !== undefined) {
        keyMilestone = {
          label: `RCL ${rclGate.targetRcl} @ tick ${rclGate.reachedTick}`,
          tick: rclGate.reachedTick,
          rcl: rclGate.targetRcl,
          reached: true,
        };
      } else {
        const hr = highestMilestone?.rcl ?? result.final.rcl;
        keyMilestone = {
          label: `RCL ${rclGate.targetRcl} not reached (highest ${hr})`,
          tick: null,
          rcl: rclGate.targetRcl,
          reached: false,
          highestRcl: hr,
        };
      }
    } else if (highestMilestone) {
      keyMilestone = {
        label: `RCL ${highestMilestone.rcl} @ tick ${highestMilestone.tick}`,
        tick: highestMilestone.tick,
        rcl: highestMilestone.rcl,
        reached: true,
      };
    } else {
      keyMilestone = {
        label: "N/A",
        tick: null,
        rcl: result.final.rcl,
        reached: false,
      };
    }

    return {
      name: fixture.name,
      description: fixture.description,
      ok: result.ok,
      finalRcl: result.final.rcl,
      failures: result.failures.length,
      gates: result.gates,
      keyMilestone,
    };
  });

  return {
    ok: entries.every((e) => e.ok),
    suite: "fixture-matrix-v1",
    ticks,
    requiredRcl: requireRcl,
    requiredRclBy: requireRclBy,
    maxFailures: gates.maxFailures ?? 0,
    fixtures: entries,
  };
}

function formatFixtureMatrix(suite) {
  const lines = [
    "## Fixture Matrix",
    "",
    `- Suite: \`${suite.suite}\``,
    `- Ticks: ${suite.ticks}`,
    `- Required RCL: ${suite.requiredRcl} by tick ${suite.requiredRclBy}`,
    `- Max failures: ${suite.maxFailures}`,
    `- OK: ${suite.ok ? "yes" : "no"}`,
    "",
    "| Fixture | Result | Final RCL | Failures | Key milestone |",
    "| --- | --- | ---: | ---: | --- |",
    ...suite.fixtures.map(
      (f) =>
        `| ${f.name} | ${f.ok ? "PASS" : "FAIL"} | ${f.finalRcl} | ${f.failures} | ${f.keyMilestone.label} |`,
    ),
    "",
    "### Gate details",
    ...suite.fixtures.flatMap((f) => {
      if (!f.gates?.length) return [];
      return f.gates.map(
        (g) =>
          `- ${g.ok ? "PASS" : "FAIL"} ${f.name}: ${g.name} expected ${g.expected}, actual ${g.actual}`,
      );
    }),
    "",
  ];

  return lines.join("\n");
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got ${value}`);
  }
  return parsed;
}

function parseNonNegativeInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer, got ${value}`);
  }
  return parsed;
}
