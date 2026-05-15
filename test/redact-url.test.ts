import { describe, expect, it } from "vitest";
import {
  buildMaskedReportUrl,
  collectSecrets,
  redactPrivateServerText,
  stripUrlUserInfo,
} from "../scripts/redact-url.mjs";

describe("private-server URL redaction helper", () => {
  it("strips userinfo from display URLs", () => {
    expect(stripUrlUserInfo("http://user:pass@localhost:21025/")).toBe("http://localhost:21025");
  });

  it("builds a masked report URL when credentials are present", () => {
    expect(buildMaskedReportUrl("http://user:pass@localhost:21025/")).toBe(
      "http://redacted:redacted@localhost:21025",
    );
    expect(buildMaskedReportUrl("http://localhost:21025/")).toBe("http://localhost:21025");
  });

  it("collects token, username, and password secrets from env", () => {
    expect(
      collectSecrets({
        SCREEPS_SERVER_URL: "http://user%20name:pass%2Fword@localhost:21025",
        SCREEPS_TOKEN: "secret-token",
        SCREEPS_USERNAME: "cli-user",
        SCREEPS_PASSWORD: "cli-pass",
      }),
    ).toEqual(
      expect.arrayContaining([
        "secret-token",
        "cli-user",
        "cli-pass",
        "user%20name",
        "user name",
        "pass%2Fword",
        "pass/word",
      ]),
    );
  });

  it("redacts env secrets and known token patterns from arbitrary text", () => {
    const output = redactPrivateServerText(
      [
        "server=http://user:pass@localhost:21025",
        "Authorization: Bearer abc123",
        'payload={"token":"abc123","password":"pass","username":"user"}',
        "query=?token=abc123&username=user",
      ].join("\n"),
      {
        SCREEPS_SERVER_URL: "http://user:pass@localhost:21025",
        SCREEPS_TOKEN: "abc123",
      },
      { redactKnownTokenPatterns: true },
    );

    expect(output).toContain("server=http://redacted:redacted@localhost:21025");
    expect(output).toContain("Authorization: Bearer [redacted]");
    expect(output).toContain('payload={"token":"[redacted]","password":"[redacted]","username":"[redacted]"}');
    expect(output).toContain("query=?token=[redacted]&username=[redacted]");
    expect(output).not.toContain("abc123");
    expect(output).not.toContain("user:pass");
  });
});
