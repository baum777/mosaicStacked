import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const targetUrl = process.env.SCREENSHOT_AUDIT_URL ?? "https://mosaicstacked.vercel.app";
const rootDir = process.cwd();
const flowsDir = path.join(rootDir, "assets", "Screenshots", "02-cta-flows");

await mkdir(flowsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem("mosaicstacked.console.theme.v1", "muted-light");
    window.localStorage.setItem("mosaicstacked.console.locale.v1", "en");
    window.localStorage.setItem("mosaicstacked.console.shell.v2", JSON.stringify({
      activeTab: "settings",
      workMode: "expert",
      expertMode: true,
      savedAt: new Date().toISOString(),
    }));
  });

  const url = new URL("/console", targetUrl);
  url.searchParams.set("mode", "settings");
  await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByTestId("app-shell").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByTestId("settings-workspace").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByTestId("console-theme-tokyo").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(500);

  const before = path.join(flowsDir, "settings__theme-tokyo__01-before-click.png");
  const after = path.join(flowsDir, "settings__theme-tokyo__02-after-click.png");
  await page.screenshot({ path: before, fullPage: false, animations: "disabled" });
  await page.getByTestId("console-theme-tokyo").click();
  await page.getByTestId("app-shell").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: after, fullPage: false, animations: "disabled" });

  console.log(JSON.stringify({
    ok: true,
    documentedCtaFlows: 1,
    screenshots: [
      "assets/Screenshots/02-cta-flows/settings__theme-tokyo__01-before-click.png",
      "assets/Screenshots/02-cta-flows/settings__theme-tokyo__02-after-click.png",
    ],
  }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
