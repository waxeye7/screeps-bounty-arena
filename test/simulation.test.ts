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
      trustLevel: string;
      caveat: string;
      seeds: { roomSeed: string; spawnSeed: string; spawnConfig: string };
      gates: Array<{ name: string; ok: boolean }>;
      final: { rcl: number; creeps: number; energyCapacity: number };
      milestones: Array<{ tick: number; rcl: number }>;
    };

    expect(result.ok).toBe(true);
    expect(result.ticks).toBe(1000);
    expect(result.trustLevel).toBe("smoke");
    expect(result.caveat).toContain("not a full Screeps engine");
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
    expect(result.gates).toContainEqual({
      name: "max-failures",
      ok: true,
      expected: 0,
      actual: 0,
    });
  });

  it("fails with a non-zero exit code when an explicit RCL gate is missed", () => {
    expect(() =>
      execFileSync(
        "node",
        [
          "scripts/simulate.mjs",
          "--ticks",
          "100",
          "--require-rcl",
          "8",
          "--json",
        ],
        {
          encoding: "utf8",
        },
      ),
    ).toThrow();
  });

  it("lists named simulation fixtures", () => {
    const output = execFileSync(
      "node",
      ["scripts/simulate.mjs", "--list-fixtures"],
      {
        encoding: "utf8",
      },
    );
    const fixtures = JSON.parse(output) as Array<{
      name: string;
      description: string;
    }>;

    expect(fixtures.map((fixture) => fixture.name)).toEqual(
      expect.arrayContaining([
        "fresh-room-low-energy",
        "spawn-recovery-no-workers",
        "controller-rush-few-sources",
        "road-planner-site-cap",
      ]),
    );
    expect(fixtures.every((fixture) => fixture.description.length > 20)).toBe(
      true,
    );
  });

  it("runs a named bad-start recovery fixture", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/simulate.mjs",
        "--fixture",
        "spawn-recovery-no-workers",
        "--ticks",
        "1000",
        "--require-rcl",
        "2",
        "--require-rcl-by",
        "1000",
        "--json",
      ],
      { encoding: "utf8" },
    );
    const result = JSON.parse(output) as {
      ok: boolean;
      seed: string;
      fixture: { name: string; description: string };
      seeds: { spawnConfig: string };
      final: { creeps: number; rcl: number };
    };

    expect(result.ok).toBe(true);
    expect(result.seed).toBe("fixture:spawn-recovery-no-workers");
    expect(result.fixture.name).toBe("spawn-recovery-no-workers");
    expect(result.seeds.spawnConfig).toBe("conservative");
    expect(result.final.creeps).toBeGreaterThan(0);
    expect(result.final.rcl).toBeGreaterThanOrEqual(2);
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
    expect(output).toContain("| Fixture |");
    expect(output).toContain("| Spawn seed |");
    expect(output).toContain("| Spawn config |");
    expect(output).toContain("Trust level: **smoke**");
    expect(output).toContain("| Model |");
    expect(output).toContain("| Final RCL |");
    expect(output).toContain("| Energy capacity |");
    expect(output).toContain("| Creep count |");
    expect(output).toContain("| Failures |");
    expect(output).toContain("### Gates");
    expect(output).toContain("### Milestones");
  });

  it("runs a reproducible seeded simulation suite", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/simulate-seeded.mjs",
        "--runs",
        "2",
        "--ticks",
        "1000",
        "--require-rcl",
        "2",
        "--require-rcl-by",
        "1000",
        "--seed-base",
        "unit-seed",
        "--json",
      ],
      { encoding: "utf8" },
    );
    const result = JSON.parse(output) as {
      ok: boolean;
      seedBase: string;
      cases: Array<{ seed: string; ok: boolean; spawnConfig: string }>;
    };

    expect(result.ok).toBe(true);
    expect(result.seedBase).toBe("unit-seed");
    expect(result.cases.map((entry) => entry.seed)).toEqual([
      "unit-seed:run-1:conservative",
      "unit-seed:run-2:balanced",
    ]);
    expect(result.cases.every((entry) => entry.ok)).toBe(true);
  });
});
