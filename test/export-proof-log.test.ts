import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const script = "scripts/export-proof-log.mjs";

describe("proof log export", () => {
  it("exports a JSON proof with correct fields", () => {
    const output = execFileSync("node", [script], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
        SCREEPS_TOKEN: "secret-token",
        SCREEPS_COMMIT_SHA: "abc123",
      },
    });

    const proof = JSON.parse(output);
    expect(proof).toMatchObject({
      commitSha: "abc123",
      serverUrl: "http://localhost:21025",
      branch: "agent-sandbox",
      hasToken: true,
      dryRun: true,
      tickCount: "N/A (simulation only)",
      rcl: "N/A (simulation only)",
      note: "Proof requires real server run; this export is config + dry-run only",
    });
    expect(new Date(proof.generatedAt).toString()).not.toBe("Invalid Date");
  });

  it("never includes token in output", () => {
    const output = execFileSync("node", [script], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
        SCREEPS_TOKEN: "super-secret-token",
        SCREEPS_COMMIT_SHA: "abc123",
      },
    });

    expect(output).toContain('"hasToken": true');
    expect(output).not.toContain("super-secret-token");
  });

  it("uses git SHA or 'unknown' for commitSha", () => {
    const output = execFileSync("node", [script], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_COMMIT_SHA: "",
      },
    });

    const proof = JSON.parse(output);
    expect(proof.commitSha).toMatch(/^[0-9a-f]{40}$|^unknown$/);
  });

  it("writes to --out file when specified", () => {
    const dir = mkdtempSync(join(tmpdir(), "proof-log-"));
    const outPath = join(dir, "proof.json");

    const output = execFileSync("node", [script, "--out", outPath], {
      encoding: "utf8",
      env: {
        ...process.env,
        SCREEPS_SERVER_URL: "http://localhost:21025",
        SCREEPS_BRANCH: "agent-sandbox",
        SCREEPS_TOKEN: "secret-token",
        SCREEPS_COMMIT_SHA: "def456",
      },
    });

    expect(output).toContain("Proof log written to:");
    expect(existsSync(outPath)).toBe(true);

    const proof = JSON.parse(readFileSync(outPath, "utf8"));
    expect(proof.commitSha).toBe("def456");
    expect(proof.serverUrl).toBe("http://localhost:21025");
    expect(proof.branch).toBe("agent-sandbox");
    expect(proof.hasToken).toBe(true);
  });
});
