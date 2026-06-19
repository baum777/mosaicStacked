import assert from "node:assert/strict";
import test from "node:test";
import {
  EN_COPY,
  DE_COPY,
} from "../src/lib/localization.js";

const FORBIDDEN_TOKENS_EN = [
  "local-restored",
  "backend-fresh",
  "backend-owned",
];

const FORBIDDEN_TOKENS_DE = [
  "local-restored",
  "backend-fresh",
  "backend-owned",
  "Local diagnostic (not sent to backend)",
  "Credential Source",
  "Last verified",
  "Last error",
  "OpenRouter key configured",
  "Instance configured",
  "User connected",
  "Legacy stub connection",
  "Copy draft",
];

function walk(node: unknown, path: string[] = []): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = [];
  if (node == null || typeof node !== "object") {
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      out.push(...walk(item, [...path, String(index)]));
    });
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") {
      out.push({ path: `${[...path, key].join(".")}`, value });
    } else if (typeof value === "function") {
      // function-typed copy values (e.g. validation(20)) are exercised in dedicated tests.
      out.push({ path: `${[...path, key].join(".")}`, value: "[function]" });
    } else {
      out.push(...walk(value, [...path, key]));
    }
  }
  return out;
}

test("EN copy never leaks any raw system token as a visible string", () => {
  const strings = walk(EN_COPY);
  for (const { path, value } of strings) {
    if (value === "[function]") continue;
    for (const token of FORBIDDEN_TOKENS_EN) {
      assert.equal(
        value.includes(token),
        false,
        `EN copy at ${path} must not contain raw token "${token}" (got: ${value})`,
      );
    }
  }
});

test("DE copy never leaks any raw system token or English fallback", () => {
  const strings = walk(DE_COPY);
  for (const { path, value } of strings) {
    if (value === "[function]") continue;
    for (const token of FORBIDDEN_TOKENS_DE) {
      assert.equal(
        value.includes(token),
        false,
        `DE copy at ${path} must not contain raw token "${token}" (got: ${value})`,
      );
    }
  }
});

test("DE settings.adapter.source labels are meaningfully German", () => {
  assert.equal(DE_COPY.settings.adapter.source.instance_configured, "Vom Server konfiguriert");
  assert.equal(DE_COPY.settings.adapter.source.user_connected, "Vom Nutzer verbunden");
  assert.equal(DE_COPY.settings.adapter.source.user_connected_stub, "Legacy Stub-Verbindung");
  assert.equal(DE_COPY.settings.adapter.source.not_connected, "Nicht verbunden");
});

test("DE openRouter copy uses German instead of mixed-language fallback", () => {
  assert.equal(DE_COPY.settings.openRouter.manualConfigLabel, "Lokale Diagnostik (nicht an Backend gesendet)");
  assert.equal(DE_COPY.settings.openRouter.configured, "OpenRouter-Key gespeichert");
  assert.equal(DE_COPY.settings.openRouter.statusConfigured, "konfiguriert");
  assert.equal(DE_COPY.settings.openRouter.statusMissingKey, "Key fehlt");
  assert.equal(DE_COPY.settings.openRouter.statusMissingModel, "Modell fehlt");
  assert.equal(DE_COPY.settings.openRouter.statusUnavailable, "nicht verfügbar");
});

test("Matrix composer copy has a German variant for copy draft", () => {
  assert.equal(DE_COPY.matrix.copyDraft, "Entwurf kopieren");
  assert.equal(EN_COPY.matrix.copyDraft, "Copy draft");
});

test("Journal recent-events label is localized for both locales", () => {
  assert.equal(EN_COPY.settings.journalRecentEventsLabel, "Recent receipts");
  assert.equal(DE_COPY.settings.journalRecentEventsLabel, "Letzte Belege");
});

test("Route ownership badge and helper copy is localized for both locales", () => {
  assert.equal(EN_COPY.shell.routeOwnershipBadge, "Backend-only");
  assert.equal(DE_COPY.shell.routeOwnershipBadge, "Nur Backend");
  assert.match(EN_COPY.shell.routeOwnershipHelper, /GitHub and Matrix are not browser integrations/);
  assert.match(DE_COPY.shell.routeOwnershipHelper, /sind keine Browser-Integrationen/);
});
