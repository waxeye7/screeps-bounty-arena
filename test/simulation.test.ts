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
      metrics: {
        actions: number;
        cpuEstimate: number;
        byType: { harvest: number; spawn: number; upgrade: number; build: number };
      };
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
    expect(result.metrics.actions).toBeGreaterThan(1000);
    expect(result.metrics.cpuEstimate).toBeGreaterThan(0);
    expect(result.metrics.byType.harvest).toBeGreaterThan(0);
    expect(result.metrics.byType.upgrade).toBeGreaterThan(0);
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

  it("includes diagnostic fields in JSON output when a gate fails", () => {
    let stdout = "";
    let stderr = "";
    try {
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
      );
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string };
      stdout = e.stdout ?? "";
      stderr = e.stderr ?? "";
    }

    // JSON goes to stdout even on failure
    const result = JSON.parse(stdout) as {
      ok: boolean;
      gates: Array<{ name: string; ok: boolean; expected: unknown; actual: unknown }>;
      diagnostics: {
        failedGates: Array<{ name: string; expected: unknown; actual: unknown }>;
        finalTick: number;
        finalRcl: number;
        finalCreeps: number;
        finalEnergyCapacity: number;
        recentFailures: unknown[];
      };
    };

    expect(result.ok).toBe(false);

    // Gate results must include the failing required-rcl gate
    const rclGate = result.gates.find((g) => g.name === "required-rcl");
    expect(rclGate).toBeDefined();
    expect(rclGate?.ok).toBe(false);

    // diagnostics block must be present
    expect(result.diagnostics).toBeDefined();
    expect(result.diagnostics.failedGates.length).toBeGreaterThan(0);
    expect(result.diagnostics.failedGates[0].name).toBe("required-rcl");
    expect(result.diagnostics.finalTick).toBe(100);
    expect(typeof result.diagnostics.finalRcl).toBe("number");
    expect(typeof result.diagnostics.finalCreeps).toBe("number");
    expect(typeof result.diagnostics.finalEnergyCapacity).toBe("number");
    expect(Array.isArray(result.diagnostics.recentFailures)).toBe(true);

    // human-readable diagnostics must appear on stderr
    expect(stderr).toContain("GATE FAILURE DIAGNOSTICS");
    expect(stderr).toContain("required-rcl");
    expect(stderr).toContain("Final RCL:");
  });

  it("fails instead of silently falling back when spawn-config is invalid", () => {
    expect(() =>
      execFileSync(
        "node",
        ["scripts/simulate.mjs", "--spawn-config", "reckless", "--json"],
        {
          encoding: "utf8",
        },
      ),
    ).toThrow(/Invalid spawn-config/);
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
    expect(output).toContain("| Actions |");
    expect(output).toContain("| CPU estimate |");
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

  it("runs a fixture matrix suite successfully", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/simulate-fixtures.mjs",
        "--ticks",
        "1000",
        "--require-rcl",
        "2",
        "--require-rcl-by",
        "1000",
      ],
      { encoding: "utf8" },
    );

    expect(output).toContain("## Fixture Matrix");
    expect(output).toContain("| Fixture | Result | Final RCL | Failures | Key milestone |");
    expect(output).toContain("fresh-room-low-energy");
    expect(output).toContain("spawn-recovery-no-workers");
    expect(output).toContain("controller-rush-few-sources");
    expect(output).toContain("road-planner-site-cap");
    expect(output).toContain("PASS");
    expect(output).toContain("RCL 2 @ tick");
    expect(output).toContain("### Gate details");
    expect(output).toContain("max-failures");
  });

  it("exits non-zero when a fixture matrix gate fails", () => {
    let caught: unknown;
    try {
      execFileSync(
        "node",
        [
          "scripts/simulate-fixtures.mjs",
          "--ticks",
          "100",
          "--require-rcl",
          "8",
          "--require-rcl-by",
          "100",
        ],
        { encoding: "utf8" },
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    const err = caught as { stdout?: string };
    const stdout = String(err.stdout ?? "");
    expect(stdout).toContain("FAIL");
    expect(stdout).toContain("RCL 8 not reached");
  });

  it("produces valid JSON output", () => {
    const output = execFileSync(
      "node",
      ["scripts/simulate-fixtures.mjs", "--json"],
      { encoding: "utf8" },
    );
    const suite = JSON.parse(output) as {
      ok: boolean;
      suite: string;
      ticks: number;
      requiredRcl: number;
      requiredRclBy: number;
      maxFailures: number;
      fixtures: Array<{
        name: string;
        ok: boolean;
        finalRcl: number;
        failures: number;
        keyMilestone: { label: string; tick: number | null; rcl: number; reached: boolean };
      }>;
    };

    expect(suite.ok).toBe(true);
    expect(suite.suite).toBe("fixture-matrix-v1");
    expect(suite.ticks).toBe(1000);
    expect(suite.requiredRcl).toBe(2);
    expect(suite.requiredRclBy).toBe(1000);
    expect(suite.maxFailures).toBe(0);
    expect(suite.fixtures.length).toBe(4);
    expect(suite.fixtures.every((f) => f.ok)).toBe(true);
    expect(suite.fixtures.every((f) => f.finalRcl >= 2)).toBe(true);
    expect(suite.fixtures.every((f) => f.keyMilestone.reached)).toBe(true);
    expect(suite.fixtures.map((f) => f.name)).toEqual([
      "fresh-room-low-energy",
      "spawn-recovery-no-workers",
      "controller-rush-few-sources",
      "road-planner-site-cap",
    ]);
  });
});
