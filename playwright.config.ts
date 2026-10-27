import { defineConfig } from "@playwright/test";

const previewHost = process.env.MOSAICSTACK_BROWSER_HOST?.trim() || "127.0.0.1";
const previewPort = process.env.MOSAICSTACK_BROWSER_PORT?.trim() || "4173";
const previewUrl = `http://${previewHost}:${previewPort}`;

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: previewUrl,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // The v6 service worker claims clients and reloads on controllerchange,
    // which resets app state mid-test and bypasses page.route API mocks.
    // Browser specs exercise UI behavior, not SW lifecycle — keep them deterministic.
    serviceWorkers: "block"
  },
  webServer: {
    command: "node scripts/browser-preview-server.mjs",
    url: previewUrl,
    reuseExistingServer: true,
    timeout: 240_000,
    env: {
      MOSAICSTACK_BROWSER_HOST: previewHost,
      MOSAICSTACK_BROWSER_PORT: previewPort,
      MOSAICSTACK_BROWSER_PORTS: previewPort,
      VITE_API_BASE_URL: previewUrl
    }
  }
});
