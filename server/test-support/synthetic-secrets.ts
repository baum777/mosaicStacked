import { randomUUID } from "node:crypto";

/**
 * Synthetic fixture secrets for offline tests.
 *
 * Values are derived at runtime inside the test process. They are placeholders
 * with no relationship to real credentials; tests deliberately assert against
 * the runtime value instead of a hardcoded literal so fixtures can never be
 * mistaken for (or rot into) deployable secrets.
 */
export function createSyntheticSecret(label: string): string {
  return `synthetic-${label}-${randomUUID()}`;
}

/**
 * OpenRouter-shaped synthetic key (kept for fixtures that exercise key-format
 * handling). The value is still runtime-generated and not a real credential.
 */
export function createSyntheticOpenRouterKey(label: string): string {
  return `sk-or-v1-synthetic-${label}-${randomUUID().replaceAll("-", "")}`;
}
