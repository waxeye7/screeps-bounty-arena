#!/usr/bin/env node

/**
 * Shared redaction helper for private-server tooling.
 *
 * Strips URL username/password for display, builds redaction values
 * from SCREEPS_TOKEN and URL userinfo, and provides a redact() function
 * to strip secrets from any string output.
 *
 * Usage:
 *   import { sanitizeUrlForDisplay, buildRedactions, redact } from "./redaction.mjs";
 */

/**
 * Strip username/password from a URL for safe display.
 * Returns the URL with userinfo removed, or "invalid URL" on parse failure.
 */
export function sanitizeUrlForDisplay(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "invalid URL";
  }
}

/**
 * Build a deduplicated array of secret values that need redaction.
 * Collects from SCREEPS_TOKEN and URL userinfo (username + password).
 */
export function buildRedactions(env) {
  const values = [env.SCREEPS_TOKEN].filter(Boolean);
  if (env.SCREEPS_SERVER_URL) {
    try {
      const url = new URL(env.SCREEPS_SERVER_URL);
      if (url.username) values.push(url.username, decodeURIComponent(url.username));
      if (url.password) values.push(url.password, decodeURIComponent(url.password));
    } catch {
      // Invalid URLs are handled generically.
    }
  }
  return [...new Set(values.filter((value) => String(value).length > 0))];
}

/**
 * Redact all known secret values from a string.
 */
export function redact(value, redactions) {
  let output = String(value || "");
  for (const secret of redactions) {
    output = output.split(String(secret)).join("[redacted]");
  }
  return output;
}
