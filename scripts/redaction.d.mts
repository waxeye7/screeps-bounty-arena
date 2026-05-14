export function sanitizeUrlForDisplay(value: string): string;
export function buildRedactions(env: Record<string, string | undefined>): string[];
export function redact(value: string, redactions: string[]): string;
