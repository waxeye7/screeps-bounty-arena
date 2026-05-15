export function stripUrlUserInfo(
  value: string,
  options?: { invalidValue?: string },
): string;

export function buildMaskedReportUrl(
  value: string,
  options?: { invalidValue?: string },
): string;

export function collectSecrets(env: Record<string, string | undefined>): string[];

export function redactPrivateServerText(
  value: string,
  env: Record<string, string | undefined>,
  options?: { redactKnownTokenPatterns?: boolean },
): string;
