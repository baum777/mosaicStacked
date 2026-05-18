import { createHmac, timingSafeEqual } from "node:crypto";
import type { AppEnv } from "./env.js";
import type { IntegrationConnectionRecord, IntegrationProvider } from "./integration-auth-store.js";

const INTEGRATION_CONNECTION_COOKIE = "mosaicstacked_integration_connection";
const INTEGRATION_CONNECTION_COOKIE_VERSION = "v1";
const INTEGRATION_CONNECTION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function isProductionDeployment() {
  return process.env.NODE_ENV === "production";
}

function signPayload(sessionSecret: string, payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

function compareStringsSecurely(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function readCookieValue(cookieHeader: string | string[] | undefined, cookieName: string) {
  const header = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

  if (!header) {
    return null;
  }

  for (const segment of header.split(";")) {
    const trimmed = segment.trim();

    if (!trimmed.startsWith(`${cookieName}=`)) {
      continue;
    }

    try {
      return decodeURIComponent(trimmed.slice(cookieName.length + 1));
    } catch {
      return null;
    }
  }

  return null;
}

export function buildIntegrationConnectionCookie(input: {
  env: AppEnv;
  sessionId: string;
  provider: IntegrationProvider;
  connection: IntegrationConnectionRecord;
}) {
  const sessionSecret = input.env.MOSAIC_STACK_SESSION_SECRET.trim();

  if (sessionSecret.length === 0 || !input.connection.connected) {
    return null;
  }

  const payload = Buffer.from(JSON.stringify({
    provider: input.provider,
    sessionId: input.sessionId,
    connectedAt: input.connection.connectedAt,
    lastVerifiedAt: input.connection.lastVerifiedAt,
    safeIdentityLabel: input.connection.safeIdentityLabel,
    source: input.connection.source,
    expiresAtMs: Date.now() + INTEGRATION_CONNECTION_MAX_AGE_SECONDS * 1000
  }), "utf8").toString("base64url");
  const signature = signPayload(sessionSecret, payload);
  const value = `${INTEGRATION_CONNECTION_COOKIE_VERSION}.${payload}.${signature}`;
  const attributes = [
    `${INTEGRATION_CONNECTION_COOKIE}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${INTEGRATION_CONNECTION_MAX_AGE_SECONDS}`,
    "SameSite=Lax"
  ];

  if (isProductionDeployment()) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function buildClearIntegrationConnectionCookie() {
  const attributes = [
    `${INTEGRATION_CONNECTION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax"
  ];

  if (isProductionDeployment()) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function readSignedIntegrationConnectionCookie(input: {
  cookieHeader: string | string[] | undefined;
  env: AppEnv;
  provider: IntegrationProvider;
  sessionId: string | null | undefined;
}): IntegrationConnectionRecord | null {
  const sessionSecret = input.env.MOSAIC_STACK_SESSION_SECRET.trim();
  const sessionId = input.sessionId?.trim() ?? "";

  if (sessionSecret.length === 0 || sessionId.length === 0) {
    return null;
  }

  const rawCookie = readCookieValue(input.cookieHeader, INTEGRATION_CONNECTION_COOKIE);

  if (!rawCookie) {
    return null;
  }

  const [version, payload, signature] = rawCookie.split(".");

  if (version !== INTEGRATION_CONNECTION_COOKIE_VERSION || !payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(sessionSecret, payload);

  if (!compareStringsSecurely(expectedSignature, signature)) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (record.provider !== input.provider || record.sessionId !== sessionId) {
    return null;
  }

  if (typeof record.expiresAtMs !== "number" || !Number.isFinite(record.expiresAtMs) || record.expiresAtMs <= Date.now()) {
    return null;
  }

  if (record.source !== "user_connected" && record.source !== "user_connected_stub") {
    return null;
  }

  return {
    connected: true,
    connectedAt: typeof record.connectedAt === "string" ? record.connectedAt : null,
    lastVerifiedAt: typeof record.lastVerifiedAt === "string" ? record.lastVerifiedAt : null,
    safeIdentityLabel: typeof record.safeIdentityLabel === "string" ? record.safeIdentityLabel : null,
    lastErrorCode: null,
    source: record.source
  };
}
