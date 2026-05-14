import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("private test-server workflow", () => {
  it("prepares a credential-free sandbox deploy bundle", () => {
    const output = execFileSync("node", ["scripts/deploy-test-server.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
        SCREEPS_TOKEN: "secret-token",
      },
    });

    expect(output).toContain("Prepared Screeps private/test-server deploy bundle");
    expect(output).toContain("branch: agent-sandbox");
    expect(output).toContain("server: http://localhost:21025");

    const bundlePath = join(process.cwd(), "dist", "main.js");
    expect(existsSync(bundlePath)).toBe(true);

    const bundle = readFileSync(bundlePath, "utf8");
    expect(bundle).toContain("Target: http://localhost:21025 / branch agent-sandbox");
    expect(bundle).not.toContain("secret-token");
  });

  it("refuses non-dry-run mode without a token", () => {
    expect(() =>
      execFileSync("node", ["scripts/deploy-test-server.mjs"], {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_DRY_RUN: "0",
          SCREEPS_TOKEN: "",
        },
      }),
    ).toThrow(/SCREEPS_TOKEN/);
  });

  it("prints a status report with offline fallback data", () => {
    const output = execFileSync("node", ["scripts/test-server-status.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
      },
    });

    expect(output).toContain("Screeps private/test-server status");
    expect(output).toContain("server: http://localhost:21025");
    expect(output).toContain("reachable:");
    expect(output).toContain("branch: agent-sandbox");
    expect(output).toContain("offline final RCL:");
    expect(output).toContain("offline failures: 0");
  });

  it("reports unreachable servers clearly in JSON mode", () => {
    const output = execFileSync(
      "node",
      ["scripts/test-server-status.mjs", "--json", "--timeout-ms", "200"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://127.0.0.1:1",
          SCREEPS_BRANCH: "agent-sandbox",
        },
      },
    );

    const status = JSON.parse(output);
    expect(status.reachable).toBe(false);
    expect(status.fallback).toContain("server/API unavailable");
    expect(status.probes.some((probe: { ok: boolean }) => !probe.ok)).toBe(true);
    expect(status.simulation.final.rcl).toBeGreaterThanOrEqual(1);
  });

  it("redacts tokens from private-server status output", () => {
    const token = "super-secret-status-token";
    const output = execFileSync(
      "node",
      ["scripts/test-server-status.mjs", "--json", "--timeout-ms", "200"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: `http://agent-user:${token}@127.0.0.1:1`,
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_USERNAME: "agent-user",
          SCREEPS_TOKEN: token,
        },
      },
    );

    expect(output).not.toContain(token);
    const status = JSON.parse(output);
    expect(status.serverUrl).toContain("redacted");
    expect(status.user).toBe("agent-user");
    expect(status.tokenConfigured).toBe(true);
    expect(status.probes.some((probe: { reason?: string }) => probe.reason === "token not configured")).toBe(false);
  });

  it("generates a local-server proof block without leaking tokens", () => {
    const output = execFileSync(
      "node",
      ["scripts/local-server-proof.mjs", "--compose-dir", "does-not-exist", "--markdown"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://localhost:21025",
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_TOKEN: "super-secret-token",
        },
      },
    );

    expect(output).toContain("## Local Screeps private-server proof");
    expect(output).toContain("Server URL: http://localhost:21025");
    expect(output).toContain("Branch: agent-sandbox");
    expect(output).toContain("Token configured: yes (redacted)");
    expect(output).toContain("docker-compose.yml not found");
    expect(output).not.toContain("super-secret-token");
  });
});
