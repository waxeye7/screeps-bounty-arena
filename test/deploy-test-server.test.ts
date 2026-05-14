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

  it("prints a private-server status report with offline fallback", () => {
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
    expect(output).toContain("branch: agent-sandbox");
    expect(output).toContain("reachable:");
    expect(output).toContain("Offline comparison:");
    expect(output).toContain("final RCL:");
    expect(output).toContain("failures: 0");
  });

  it("reports unreachable local servers without failing the status command", () => {
    const output = execFileSync("node", ["scripts/test-server-status.mjs", "--ticks", "25", "--timeout-ms", "50"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://127.0.0.1:9",
        SCREEPS_BRANCH: "agent-sandbox",
      },
    });

    expect(output).toContain("reachable: no");
    expect(output).toContain("server/API unavailable");
    expect(output).toContain("Offline comparison:");
  });

  it("redacts tokens from status output", () => {
    const token = "super-secret-token";
    const urlPassword = "url-password-secret";
    const queryToken = "query-token-secret";
    const output = execFileSync("node", ["scripts/test-server-status.mjs", "--timeout-ms", "50"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: `http://local-user:${urlPassword}@127.0.0.1:9?token=${queryToken}`,
        SCREEPS_USERNAME: "local-agent",
        SCREEPS_BRANCH: "agent-sandbox",
        SCREEPS_TOKEN: token,
      },
    });

    expect(output).toContain("token configured: yes (redacted)");
    expect(output).toContain("[redacted]");
    expect(output).not.toContain(token);
    expect(output).not.toContain(urlPassword);
    expect(output).not.toContain(queryToken);
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
