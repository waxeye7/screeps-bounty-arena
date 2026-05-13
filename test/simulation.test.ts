import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("offline simulation", () => {
  it("runs a deterministic 1000 tick smoke simulation", () => {
    const output = execFileSync(
      "node",
      ["scripts/simulate.mjs", "--ticks", "1000", "--seed", "test", "--json"],
      {
        encoding: "utf8",
      },
    );
    const result = JSON.parse(output) as {
      ok: boolean;
      ticks: number;
      seeds: { roomSeed: string; spawnSeed: string; spawnConfig: string };
      final: { rcl: number; creeps: number; energyCapacity: number };
      milestones: Array<{ tick: number; rcl: number }>;
    };

    expect(result.ok).toBe(true);
    expect(result.ticks).toBe(1000);
    expect(result.seeds).toEqual({
      baseSeed: "test",
      roomSeed: "test:room",
      spawnSeed: "test:spawn",
      spawnConfig: "balanced",
    });
    expect(result.final.rcl).toBeGreaterThanOrEqual(2);
    expect(result.final.creeps).toBeGreaterThan(1);
    expect(result.final.energyCapacity).toBeGreaterThanOrEqual(300);
    expect(result.milestones.length).toBeGreaterThan(0);
  });

  it("prints a paste-ready markdown report", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/simulate.mjs",
        "--ticks",
        "1000",
        "--seed",
        "test",
        "--markdown",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("## Screeps Simulation Report");
    expect(output).toContain("| Room seed |");
    expect(output).toContain("| Spawn seed |");
    expect(output).toContain("| Spawn config |");
    expect(output).toContain("| Final RCL |");
    expect(output).toContain("| Energy capacity |");
    expect(output).toContain("| Creep count |");
    expect(output).toContain("| Failures |");
    expect(output).toContain("### Milestones");
  });
});
