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

  it("redacts URL credentials from local-server proof output", () => {
    const output = execFileSync(
      "node",
      ["scripts/local-server-proof.mjs", "--compose-dir", "does-not-exist", "--markdown"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SCREEPS_SERVER_URL: "http://local-user:local-pass@localhost:21025",
          SCREEPS_BRANCH: "agent-sandbox",
          SCREEPS_TOKEN: "super-secret-token",
        },
      },
    );

    expect(output).toContain("Server URL: http://localhost:21025");
    expect(output).not.toContain("local-user");
    expect(output).not.toContain("local-pass");
    expect(output).not.toContain("super-secret-token");
  });

  it("uses the local Compose env file when proof capture has one", () => {
    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        `
          import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
          import { tmpdir } from "node:os";
          import { join } from "node:path";
          import { buildComposeArgs } from "./scripts/local-server-proof.mjs";

          const dir = mkdtempSync(join(tmpdir(), "screeps-proof-"));
          try {
            const composeFile = join(dir, "docker-compose.yml");
            const envFile = join(dir, ".env");
            writeFileSync(composeFile, "services: {}\\n", "utf8");
            writeFileSync(envFile, "SCREEPS_LAUNCHER_HOST=127.0.0.1\\n", "utf8");
            console.log(JSON.stringify(buildComposeArgs({ composeFile, envFile, args: ["ps"] })));
          } finally {
            rmSync(dir, { recursive: true, force: true });
          }
        `,
      ],
      { encoding: "utf8" },
    );

    const args = JSON.parse(output);
    expect(args).toContain("--env-file");
    expect(args.some((arg: string) => arg.endsWith(".env"))).toBe(true);
    expect(args).toEqual(expect.arrayContaining(["compose", "-f", "ps"]));
  });
});
