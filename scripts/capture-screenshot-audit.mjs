import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const targetUrl = process.env.SCREENSHOT_AUDIT_URL ?? "https://mosaicstacked.vercel.app";
const rootDir = process.cwd();
const tabsDir = path.join(rootDir, "assets", "Screenshots", "01-tabs");
const flowsDir = path.join(rootDir, "assets", "Screenshots", "02-cta-flows");
const reportPath = path.join(rootDir, "assets", "Screenshots", "screenshot-audit-report.md");

const devices = [
  ["iphone-xr", "iPhone XR", 414, 896, "iPhone"],
  ["iphone-14-pro-max", "iPhone 14 Pro Max", 430, 932, "iPhone"],
  ["iphone-12-pro", "iPhone 12 Pro", 390, 844, "iPhone"],
  ["samsung-galaxy-s8-plus", "Samsung Galaxy S8+", 360, 740, "Android"],
  ["samsung-galaxy-s20-ultra", "Samsung Galaxy S20 Ultra", 412, 915, "Android"],
  ["samsung-galaxy-a51-71", "Samsung Galaxy A51/71", 412, 914, "Android"],
  ["samsung-galaxy-s", "Samsung Galaxy S", 360, 640, "Android"],
  ["ipad-air", "iPad Air", 820, 1180, "iPad"],
  ["ipad-mini", "iPad Mini", 768, 1024, "iPad"],
  ["moto-g4", "Moto G4", 360, 640, "Android"],
].map(([id, label, width, height, family]) => ({
  id,
  label,
  viewport: { width, height },
  userAgent: family === "iPhone" || family === "iPad"
    ? `Mozilla/5.0 (${family}; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`
    : "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  isMobile: family !== "iPad",
  hasTouch: true,
}));

const themes = [
  ["light", "muted-light"],
  ["tokyo", "tokyo"],
];

const tabs = [
  ["chat", "chat-workspace", "Chat"],
  ["workbench", "github-workspace", "Workbench"],
  ["matrix", "matrix-workspace", "Matrix"],
  ["settings", "settings-workspace", "Settings"],
  ["perf", "performance-workspace", "Performance"],
  ["review", "review-workspace", "Review"],
  ["community", "community-workspace", "Community"],
  ["models", "models-workspace", "Models"],
  ["evidence", "evidence-workspace", "Evidence"],
];

function tabsForMode(workMode) {
  if (workMode === "beginner") {
    return tabs.filter(([mode]) => ["chat", "workbench", "matrix", "settings", "perf"].includes(mode));
  }
  return tabs;
}

function shellState(workMode, activeTab) {
  return {
    activeTab,
    workMode,
    expertMode: workMode === "expert",
    savedAt: new Date().toISOString(),
  };
}

async function preparePage(page, { themeValue, workMode, activeTab }) {
  await page.addInitScript(({ themeValue: initTheme, workMode: initWorkMode, activeTab: initTab }) => {
    window.localStorage.setItem("mosaicstacked.console.theme.v1", initTheme);
    window.localStorage.setItem("mosaicstacked.console.shell.v2", JSON.stringify({
      activeTab: initTab,
      workMode: initWorkMode,
      expertMode: initWorkMode === "expert",
      savedAt: new Date().toISOString(),
    }));
    window.localStorage.setItem("mosaicstacked.console.locale.v1", "en");
  }, { themeValue, workMode, activeTab });
}

async function waitForStableWorkspace(page, testId) {
  await page.waitForLoadState("domcontentloaded");
  await page.getByTestId("app-shell").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByTestId(testId).waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(650);
}

async function captureTabs(browser) {
  const captured = [];
  const failures = [];

  for (const device of devices) {
    for (const [themeName, themeValue] of themes) {
      for (const workMode of ["beginner", "expert"]) {
        for (const [tabMode, testId, tabLabel] of tabsForMode(workMode)) {
          const context = await browser.newContext({
            viewport: device.viewport,
            userAgent: device.userAgent,
            isMobile: device.isMobile,
            hasTouch: device.hasTouch,
            deviceScaleFactor: 2,
            colorScheme: themeName === "light" ? "light" : "dark",
          });
          const page = await context.newPage();
          await preparePage(page, { themeValue, workMode, activeTab: tabMode });

          const fileName = `${device.id}__${themeName}__${workMode}__${tabMode}.png`;
          const filePath = path.join(tabsDir, fileName);
          const url = new URL("/console", targetUrl);
          url.searchParams.set("mode", tabMode);

          try {
            await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
            await waitForStableWorkspace(page, testId);
            await page.screenshot({ path: filePath, fullPage: false, animations: "disabled" });
            captured.push({
              device: device.label,
              theme: themeName,
              workMode,
              tab: tabLabel,
              file: `assets/Screenshots/01-tabs/${fileName}`,
            });
          } catch (error) {
            failures.push({
              device: device.label,
              theme: themeName,
              workMode,
              tab: tabLabel,
              status: "not-reachable",
              reason: error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 240) : String(error),
            });
          } finally {
            await context.close();
          }
        }
      }
    }
  }

  return { captured, failures };
}

async function captureSafeCtaFlows(browser) {
  const flows = [];
  const skipped = [];
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    userAgent: devices[1].userAgent,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await context.newPage();
  await preparePage(page, { themeValue: "muted-light", workMode: "expert", activeTab: "settings" });
  const settingsUrl = new URL("/console", targetUrl);
  settingsUrl.searchParams.set("mode", "settings");
  await page.goto(settingsUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
  await waitForStableWorkspace(page, "settings-workspace");

  const flowBase = "settings__work-mode-toggle";
  const before = path.join(flowsDir, `${flowBase}__01-before-click.png`);
  const after = path.join(flowsDir, `${flowBase}__02-after-click.png`);
  await page.screenshot({ path: before, fullPage: false, animations: "disabled" });
  const beginnerButton = page.getByRole("button", { name: /Beginner|Basis/i }).first();
  if (await beginnerButton.count()) {
    await beginnerButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: after, fullPage: false, animations: "disabled" });
    flows.push({
      tab: "Settings",
      cta: "Beginner/Basis mode toggle",
      risk: "safe",
      status: "documented",
      screenshots: [
        "assets/Screenshots/02-cta-flows/settings__work-mode-toggle__01-before-click.png",
        "assets/Screenshots/02-cta-flows/settings__work-mode-toggle__02-after-click.png",
      ],
    });
  } else {
    skipped.push({ tab: "Settings", cta: "Beginner/Basis mode toggle", reason: "CTA not visible in selected viewport/state" });
  }

  skipped.push(
    { tab: "Chat", cta: "Send / Run chat", reason: "Would trigger a production provider call" },
    { tab: "Workbench", cta: "Execute / approval actions", reason: "Could perform backend-owned GitHub actions; stopped before production-impacting flow" },
    { tab: "Matrix", cta: "Execute / post actions", reason: "Could perform Matrix write/approval flow; stopped before production-impacting flow" },
    { tab: "Settings", cta: "Connect / disconnect integrations, save credentials", reason: "OAuth or credential-changing action" },
  );

  await context.close();
  return { flows, skipped };
}

function buildReport({ captured, failures, flows, skipped }) {
  const now = new Date().toISOString();
  const tabRows = captured.map((item, index) =>
    `| ${index + 1} | ${item.device} / ${item.theme} / ${item.workMode} / ${item.tab} | [${path.basename(item.file)}](./01-tabs/${path.basename(item.file)}) |`,
  );
  const flowRows = flows.map((flow) =>
    `| ${flow.tab} | ${flow.cta} | ${flow.risk} | ${flow.status} | ${flow.screenshots.map((shot) => `[${path.basename(shot)}](./02-cta-flows/${path.basename(shot)})`).join("<br>")} |`,
  );
  const skippedRows = skipped.map((item) => `| ${item.tab} | ${item.cta} | ${item.reason} |`);
  const failureRows = failures.map((item) => `| ${item.tab} | ${item.device} / ${item.theme} / ${item.workMode} | ${item.reason} |`);

  return `# Screenshot Audit Report

## Ziel

- URL oder Page: ${targetUrl}/console
- Startpunkt: Production console, direct tab URLs via \`/console?mode=<tab>\`
- Login durchgefuehrt: Nein
- Datum/Uhrzeit: ${now}

## Erfasste Tabs

| Nr. | Tab | Screenshot |
|---:|---|---|
${tabRows.join("\n")}

## CTA-Flows

| Tab | CTA | Risiko | Status | Screenshots |
|---|---|---|---|---|
${flowRows.length ? flowRows.join("\n") : "| - | - | - | not-reachable | - |"}

## Abgebrochene oder uebersprungene CTAs

| Tab | CTA | Grund |
|---|---|---|
${skippedRows.join("\n")}

## Nicht erreichbare Screenshots

| Tab | Kontext | Grund |
|---|---|---|
${failureRows.length ? failureRows.join("\n") : "| - | - | Keine |"}

## Beobachtungen

- Fehlende Ladezustaende: Keine blockierenden Ladezustaende waehrend der erfolgreichen Captures beobachtet.
- Defekte Links: Nicht vollstaendig geprueft; Fokus dieses Laufs war tabellarische Responsiveness-Abdeckung.
- Leere States: Mehrere Flaechen zeigen erwartete nicht-verbundene oder lokale Evidence States, weil kein Login durchgefuehrt wurde.
- Layout-Probleme: Siehe Screenshot-Korpus fuer visuelle Auswertung pro Device.
- Nicht erreichbare Tabs: ${failures.length ? `${failures.length} Capture-Kontexte fehlgeschlagen.` : "Keine in diesem Lauf."}
- Riskante CTAs: Provider-Calls, GitHub/Matrix Execute, OAuth/Disconnect und Credential-Saves wurden nicht ausgefuehrt.
- Login-/Session-Probleme: Kein Login angefordert oder durchgefuehrt.
`;
}

await mkdir(tabsDir, { recursive: true });
await mkdir(flowsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const tabResult = await captureTabs(browser);
  const ctaResult = await captureSafeCtaFlows(browser);
  await writeFile(reportPath, buildReport({ ...tabResult, ...ctaResult }), "utf8");
  console.log(JSON.stringify({
    ok: tabResult.failures.length === 0,
    targetUrl,
    capturedTabs: tabResult.captured.length,
    failedTabs: tabResult.failures.length,
    documentedCtaFlows: ctaResult.flows.length,
    skippedCtas: ctaResult.skipped.length,
    reportPath,
  }, null, 2));
  if (tabResult.failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
