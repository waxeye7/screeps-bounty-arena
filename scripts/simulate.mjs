#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

function main() {
  const { values } = parseArgs({
    options: {
      ticks: { type: "string", short: "t", default: "1000" },
      json: { type: "boolean", default: false },
      markdown: { type: "boolean", default: false },
      seed: { type: "string", default: "screeps-bounty-arena" },
      "room-seed": { type: "string" },
      "spawn-seed": { type: "string" },
      "spawn-config": { type: "string", default: "balanced" },
    },
  });

  const ticks = Number.parseInt(values.ticks, 10);
  if (!Number.isFinite(ticks) || ticks <= 0) {
    throw new Error(`--ticks must be a positive integer, got ${values.ticks}`);
  }

  const result = runOfflineSimulation({
    ticks,
    seed: values.seed,
    roomSeed: values["room-seed"],
    spawnSeed: values["spawn-seed"],
    spawnConfig: values["spawn-config"],
  });

  if (values.json && values.markdown) {
    throw new Error("Use only one output mode: --json or --markdown");
  }

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (values.markdown) {
    console.log(formatMarkdownReport(result));
  } else {
    console.log(formatSummary(result));
  }
}

export function runOfflineSimulation({
  ticks,
  seed = "screeps-bounty-arena",
  roomSeed,
  spawnSeed,
  spawnConfig = "balanced",
}) {
  const seeds = normalizeSimulationSeeds({
    seed,
    roomSeed,
    spawnSeed,
    spawnConfig,
  });
  const roomRng = mulberry32(hashSeed(seeds.roomSeed));
  const spawnRng = mulberry32(
    hashSeed(`${seeds.spawnSeed}:${seeds.spawnConfig}`),
  );
  const room = {
    tick: 0,
    rcl: 1,
    controllerProgress: 0,
    energy: 300,
    energyCapacity: 300,
    creeps: 1,
    constructionProgress: 0,
    failures: [],
  };

  const milestones = [];
  for (let tick = 1; tick <= ticks; tick += 1) {
    room.tick = tick;

    const harvestRate = room.creeps * (8 + Math.floor(roomRng() * 3));
    const upkeep = Math.max(0, room.creeps - 2) * 2;
    room.energy = Math.min(
      room.energyCapacity,
      room.energy + harvestRate - upkeep,
    );

    const spawnCost = nextSpawnCost(spawnRng, seeds.spawnConfig);
    if (
      room.energy >= spawnCost &&
      room.creeps < desiredCreepsForRcl(room.rcl)
    ) {
      room.energy -= spawnCost;
      room.creeps += 1;
    }

    const upgradeSpend = Math.min(room.energy, 12 + room.creeps * 2);
    room.energy -= upgradeSpend;
    room.controllerProgress += upgradeSpend;

    const buildSpend = Math.min(room.energy, room.rcl >= 2 ? 8 : 3);
    room.energy -= buildSpend;
    room.constructionProgress += buildSpend;

    if (room.constructionProgress >= room.energyCapacity) {
      room.energyCapacity += 50;
      room.constructionProgress = 0;
    }

    const nextRclProgress = progressForNextRcl(room.rcl);
    if (room.controllerProgress >= nextRclProgress && room.rcl < 8) {
      room.controllerProgress -= nextRclProgress;
      room.rcl += 1;
      room.energyCapacity += 100;
      milestones.push({
        tick,
        rcl: room.rcl,
        energyCapacity: room.energyCapacity,
        creeps: room.creeps,
      });
    }

    if (room.energy < 0 || room.creeps <= 0) {
      room.failures.push({
        tick,
        reason: "invalid colony state",
        energy: room.energy,
        creeps: room.creeps,
      });
      break;
    }
  }

  return {
    ok: room.failures.length === 0,
    ticks,
    seed,
    seeds,
    final: {
      rcl: room.rcl,
      controllerProgress: room.controllerProgress,
      energy: room.energy,
      energyCapacity: room.energyCapacity,
      creeps: room.creeps,
    },
    milestones,
    failures: room.failures,
  };
}

function normalizeSimulationSeeds({
  seed = "screeps-bounty-arena",
  roomSeed,
  spawnSeed,
  spawnConfig = "balanced",
}) {
  return {
    baseSeed: seed,
    roomSeed: roomSeed || `${seed}:room`,
    spawnSeed: spawnSeed || `${seed}:spawn`,
    spawnConfig,
  };
}

function nextSpawnCost(rng, spawnConfig) {
  const profiles = {
    conservative: [200, 200, 250],
    balanced: [200, 250, 300],
    aggressive: [250, 300, 350],
  };
  const costs = profiles[spawnConfig] ?? profiles.balanced;
  return costs[Math.floor(rng() * costs.length)];
}

function desiredCreepsForRcl(rcl) {
  return Math.min(3 + rcl, 12);
}

function progressForNextRcl(rcl) {
  return (
    [0, 200, 450, 900, 1600, 2800, 5000, 9000][rcl] ?? Number.POSITIVE_INFINITY
  );
}

export function formatMarkdownReport(result) {
  const lines = [
    `## Screeps Simulation Report`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Ticks | ${result.ticks} |`,
    `| Seed | \`${result.seed}\` |`,
    `| Room seed | \`${result.seeds.roomSeed}\` |`,
    `| Spawn seed | \`${result.seeds.spawnSeed}\` |`,
    `| Spawn config | \`${result.seeds.spawnConfig}\` |`,
    `| OK | ${result.ok ? "yes" : "no"} |`,
    `| Final RCL | ${result.final.rcl} |`,
    `| Energy capacity | ${result.final.energyCapacity} |`,
    `| Creep count | ${result.final.creeps} |`,
    `| Failures | ${result.failures.length} |`,
    ``,
    `### Milestones`,
  ];

  if (result.milestones.length) {
    for (const milestone of result.milestones) {
      lines.push(
        `- Tick ${milestone.tick}: reached RCL ${milestone.rcl} with ${milestone.creeps} creeps and ${milestone.energyCapacity} energy capacity.`,
      );
    }
  } else {
    lines.push("- No RCL milestones reached.");
  }

  lines.push(``, `### Failures`);
  if (result.failures.length) {
    for (const failure of result.failures) {
      lines.push(`- Tick ${failure.tick}: ${failure.reason}`);
    }
  } else {
    lines.push("- None.");
  }

  return lines.join("\n");
}

function formatSummary(result) {
  const lines = [
    `Screeps Bounty Arena offline simulation`,
    `ticks: ${result.ticks}`,
    `seed: ${result.seed}`,
    `room seed: ${result.seeds.roomSeed}`,
    `spawn seed: ${result.seeds.spawnSeed}`,
    `spawn config: ${result.seeds.spawnConfig}`,
    `ok: ${result.ok}`,
    `final RCL: ${result.final.rcl}`,
    `creeps: ${result.final.creeps}`,
    `energy capacity: ${result.final.energyCapacity}`,
  ];

  if (result.milestones.length) {
    lines.push("milestones:");
    for (const milestone of result.milestones) {
      lines.push(`- tick ${milestone.tick}: reached RCL ${milestone.rcl}`);
    }
  }

  if (result.failures.length) {
    lines.push("failures:");
    for (const failure of result.failures) {
      lines.push(`- tick ${failure.tick}: ${failure.reason}`);
    }
  }

  return lines.join("\n");
}

function hashSeed(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
