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

  it("prints a dry-run upload plan without leaking tokens", () => {
    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "--eval",
        "import { readDeployConfig, validateConfig, uploadBundle } from './scripts/deploy-test-server.mjs'; const config = readDeployConfig(process.env); validateConfig(config); console.log(JSON.stringify(uploadBundle(config)));",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://localhost:21025",
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_TOKEN: "fake-dry-run-token",
        },
      },
    );

    expect(output).toContain("DRY RUN");
    expect(output).toContain("http://localhost:21025");
    expect(output).toContain('{"dryRun":true}');
    expect(output).not.toContain("fake-dry-run-token");
  });

  it("prints a redacted real-upload notice without leaking tokens", () => {
    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "--eval",
        "import { readDeployConfig, validateConfig, uploadBundle } from './scripts/deploy-test-server.mjs'; const config = readDeployConfig(process.env); validateConfig(config); console.log(JSON.stringify(uploadBundle(config)));",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://localhost:21025",
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_DRY_RUN: "0",
          SCREEPS_TOKEN: "fake-real-upload-token",
        },
      },
    );

    expect(output).toContain("UPLOAD");
    expect(output).toContain("redacted");
    expect(output).toContain('{"dryRun":false,"note":"manual upload required"}');
    expect(output).not.toContain("fake-real-upload-token");
  });

  it("does not include the username in the deploy bundle", () => {
    const bundle = execFileSync(
      "node",
      [
        "--input-type=module",
        "--eval",
        "import { buildDeployBundle, readDeployConfig } from './scripts/deploy-test-server.mjs'; const config = readDeployConfig(process.env); process.stdout.write(buildDeployBundle(config));",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://localhost:21025",
          SCREEPS_USERNAME: "private-local-user",
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_TOKEN: "fake-bundle-token",
        },
      },
    );

    expect(bundle).toContain("Target: http://localhost:21025 / branch agent-sandbox");
    expect(bundle).not.toContain("private-local-user");
  });

  it("prints a status smoke report", () => {
    const output = execFileSync("node", ["scripts/test-server-status.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
      },
    });

    expect(output).toContain("Screeps private/test-server status smoke");
    expect(output).toContain("server: http://localhost:21025");
    expect(output).toContain("branch: agent-sandbox");
    expect(output).toContain("final RCL:");
    expect(output).toContain("failures: 0");
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
