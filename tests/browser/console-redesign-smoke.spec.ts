import { expect, test, type Page } from "@playwright/test";

const HEALTH_OK = {
  ok: true,
  service: "mosaicstacked-smoke",
  mode: "local",
  upstream: "openrouter",
  defaultModel: "default",
  allowedModelCount: 1,
  streaming: "sse",
  accessToken: "sk-smoke-openrouter-key",
};

const MODELS_OK = {
  ok: true,
  defaultModel: "default",
  models: ["default"],
  source: "backend-policy",
  providerTarget: "openrouter/auto",
};

const DIAGNOSTICS_OK = {
  ok: true,
  service: "mosaicstacked-smoke",
  runtimeMode: "local",
  diagnosticsGeneratedAt: "2026-05-30T12:00:00.000Z",
  processStartedAt: "2026-05-30T11:58:00.000Z",
  uptimeMs: 120000,
  models: {
    defaultPublicAlias: "default",
    publicAliases: ["default"],
  },
  routing: {
    mode: "policy",
    allowFallback: true,
    failClosed: true,
    requireBackendOwnedResolution: true,
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    limits: {
      chat: 30,
      auth_login: 8,
      github_propose: 10,
      github_execute: 6,
      matrix_execute: 6,
    },
    blockedByScope: {
      chat: 0,
      auth_login: 0,
      github_propose: 0,
      github_execute: 0,
      matrix_execute: 0,
    },
  },
  actionStore: {
    mode: "memory",
  },
  github: {
    configured: true,
    ready: true,
  },
  matrix: {
    configured: false,
    ready: false,
  },
  journal: {
    enabled: true,
    mode: "memory",
    maxEntries: 500,
    exposeRecentLimit: 50,
    recentCount: 0,
  },
  counters: {
    chatRequests: 0,
    chatStreamStarted: 0,
    chatStreamCompleted: 0,
    chatStreamError: 0,
    chatStreamAborted: 0,
    upstreamError: 0,
  },
};

const INTEGRATIONS_STATUS_OK = {
  ok: true,
  generatedAt: "2026-05-30T12:00:00.000Z",
  github: {
    status: "connect_available",
    credentialSource: "not_connected",
    capabilities: {
      read: "blocked",
      propose: "blocked",
      execute: "blocked",
      verify: "blocked",
    },
    executionMode: "disabled",
    labels: {
      identity: null,
      scope: "No allowed repositories configured.",
      allowedReposStatus: "missing",
    },
    lastVerifiedAt: null,
    lastErrorCode: null,
  },
  matrix: {
    status: "connect_available",
    credentialSource: "not_connected",
    capabilities: {
      read: "blocked",
      propose: "blocked",
      execute: "blocked",
      verify: "blocked",
    },
    executionMode: "disabled",
    labels: {
      identity: null,
      scope: "Matrix scope unavailable until backend config is ready.",
      homeserver: null,
      roomAccess: "unknown",
    },
    lastVerifiedAt: null,
    lastErrorCode: null,
  },
};

async function installConsoleSmokeMocks(page: Page) {
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(HEALTH_OK),
    });
  });

  await page.route("**/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MODELS_OK),
    });
  });

  await page.route("**/diagnostics", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DIAGNOSTICS_OK),
    });
  });

  await page.route("**/journal/recent", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, entries: [] }),
    });
  });

  await page.route("**/api/integrations/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(INTEGRATIONS_STATUS_OK),
    });
  });

  await page.route("**/settings/openrouter/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        configured: false,
        profileConfigured: false,
        envConfigured: false,
        defaultFree: { status: "unavailable" },
      }),
    });
  });
}

async function openConsole(page: Page, mode = "perf") {
  await installConsoleSmokeMocks(page);
  await page.goto(`/console?mode=${mode}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 15_000 });
}

test("smoke: performance workspace renders local evidence without leaking provider or Matrix secrets", async ({ page }) => {
  await openConsole(page, "perf");

  await expect(page.getByTestId("performance-workspace")).toBeVisible();
  await expect(page.getByText("Local performance gates")).toBeVisible();
  await expect(page.getByText("npm run perf:bundle:web", { exact: true })).toBeVisible();
  await expect(page.getByText("npm run test:browser", { exact: true })).toBeVisible();

  const body = page.locator("body");
  await expect(body).not.toContainText("sk-smoke-openrouter-key");
  await expect(body).not.toContainText("openrouter/auto");
  await expect(body).not.toContainText("sk-test-matrix-token");
});

test("smoke: scoped console themes switch, persist, and survive reload", async ({ page }) => {
  await openConsole(page, "perf");

  const shell = page.getByTestId("app-shell");
  await expect(shell).toHaveAttribute("data-console-theme", "tokyo");

  await page.getByTestId("console-theme-darkula").click();
  await expect(shell).toHaveAttribute("data-console-theme", "darkula");
  expect(await page.evaluate(() => window.localStorage.getItem("mosaicstacked.console.theme.v1"))).toBe("darkula");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("performance-workspace")).toBeVisible();
  await expect(shell).toHaveAttribute("data-console-theme", "darkula");

  await page.getByTestId("console-theme-muted-light").click();
  await expect(shell).toHaveAttribute("data-console-theme", "muted-light");
});

test("smoke: command palette filters grouped actions and keyboard shortcuts open perf", async ({ page }) => {
  await openConsole(page, "chat");

  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await expect(page.getByRole("dialog", { name: "Command Palette" })).toBeVisible();

  await page.getByRole("searchbox").fill("bundle");
  await expect(page.locator(".command-palette-group-label")).toContainText("Performance");
  await expect(page.locator(".command-palette-item")).toContainText("Open performance gates");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/console\?mode=perf$/);
  await expect(page.getByTestId("performance-workspace")).toBeVisible();

  await page.keyboard.press(process.platform === "darwin" ? "Meta+1" : "Control+1");
  await expect(page).toHaveURL(/\/console\?mode=chat$/);
  await page.keyboard.press(process.platform === "darwin" ? "Meta+5" : "Control+5");
  await expect(page).toHaveURL(/\/console\?mode=perf$/);
});

test("smoke: desktop session quick actions are hover and focus reachable", async ({ page }) => {
  await openConsole(page, "chat");
  await page.evaluate(() => {
    window.localStorage.setItem("mosaicstacked.console.shell.v2", JSON.stringify({
      activeTab: "chat",
      workMode: "expert",
      expertMode: true,
    }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 15_000 });

  const sessionItem = page.locator(".session-list-item").first();
  const quickActions = sessionItem.locator(".inline-quick-actions");
  await expect(sessionItem).toBeVisible();

  await sessionItem.hover();
  await expect(quickActions).toHaveCSS("opacity", "1");

  await sessionItem.locator(".session-list-select").focus();
  await expect(quickActions).toHaveCSS("opacity", "1");
  await expect(sessionItem.locator("[data-testid^='workspace-session-archive-']")).toBeVisible();
  await expect(sessionItem.locator("[data-testid^='workspace-session-delete-']")).toBeVisible();
});

test("smoke: mobile perf route remains usable without topbar theme toggle or horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openConsole(page, "perf");

  await expect(page.getByTestId("performance-workspace")).toBeVisible();
  await expect(page.locator(".mobile-topbar .theme-toggle-button")).toHaveCount(0);
  await expect(page.getByTestId("tab-perf")).toBeVisible();

  const overflow = await page.evaluate(() => ({
    htmlClientWidth: document.documentElement.clientWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(overflow.htmlScrollWidth).toBeLessThanOrEqual(overflow.htmlClientWidth);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth);
});
