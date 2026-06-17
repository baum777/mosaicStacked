import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_CHROME_PATH = "/home/baum/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const DEFAULT_URL = "http://127.0.0.1:3000/console?mode=chat";
const RUN_COUNT = Number.parseInt(process.env.LIGHTHOUSE_TTI_RUNS ?? "3", 10);
const TTI_BUDGET_MS = Number.parseInt(process.env.LIGHTHOUSE_TTI_BUDGET_MS ?? "2600", 10);
const TARGET_URL = process.env.LIGHTHOUSE_URL ?? DEFAULT_URL;
const FINAL_REPORT_PATH = process.env.LIGHTHOUSE_REPORT_PATH ?? "docs/lighthouse-report.json";
const PERF_CACHE_PATH = join(process.cwd(), "web", "src", "lib", "perf-cache.json");

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function formatMs(value) {
  return `${Math.round(value)} ms`;
}

if (!Number.isInteger(RUN_COUNT) || RUN_COUNT < 1) {
  console.error(`FAIL invalid LIGHTHOUSE_TTI_RUNS: ${process.env.LIGHTHOUSE_TTI_RUNS}`);
  process.exit(1);
}

const chromePath = process.env.CHROME_PATH ?? (existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined);
const workingDir = process.cwd();
const reportDir = mkdtempSync(join(tmpdir(), "mosaicstacked-lighthouse-"));
const runs = [];

try {
  for (let index = 0; index < RUN_COUNT; index += 1) {
    const reportPath = join(reportDir, `lighthouse-${index + 1}.json`);
    const args = [
      "lighthouse",
      TARGET_URL,
      "--preset=perf",
      "--form-factor=mobile",
      "--throttling-method=devtools",
      "--throttling.cpuSlowdownMultiplier=4",
      "--chrome-flags=--no-sandbox --disable-gpu --headless=new --disable-dev-shm-usage",
      "--only-categories=performance,accessibility",
      "--output=json",
      `--output-path=${reportPath}`,
    ];

    const result = spawnSync("npx", args, {
      cwd: workingDir,
      env: {
        ...process.env,
        ...(chromePath ? { CHROME_PATH: chromePath } : {}),
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status !== 0) {
      process.stderr.write(result.stdout);
      process.stderr.write(result.stderr);
      console.error(`FAIL Lighthouse run ${index + 1}/${RUN_COUNT} exited with ${result.status}`);
      process.exit(result.status ?? 1);
    }

    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const tti = report.audits?.interactive?.numericValue;
    const performance = report.categories?.performance?.score;
    const accessibility = report.categories?.accessibility?.score;

    if (typeof tti !== "number") {
      console.error(`FAIL Lighthouse run ${index + 1}/${RUN_COUNT} did not include audits.interactive.numericValue`);
      process.exit(1);
    }

    runs.push({
      index: index + 1,
      reportPath,
      tti,
      performance: typeof performance === "number" ? Math.round(performance * 100) : null,
      accessibility: typeof accessibility === "number" ? Math.round(accessibility * 100) : null,
    });

    console.log(
      `RUN ${index + 1}/${RUN_COUNT} TTI ${formatMs(tti)} | performance ${runs.at(-1).performance ?? "n/a"} | accessibility ${runs.at(-1).accessibility ?? "n/a"}`,
    );
  }

  const medianTti = median(runs.map((run) => run.tti));
  const medianRun = runs.find((run) => run.tti === medianTti) ?? runs[0];
  copyFileSync(medianRun.reportPath, FINAL_REPORT_PATH);

  // Persist the median-run lighthouse numbers + lastUpdated into the local
  // perf cache so the Performance tab can show real numbers after a perf run.
  // The `bundle` block is preserved as-is (managed by check-web-bundle-budget.mjs).
  try {
    const medianReport = JSON.parse(readFileSync(medianRun.reportPath, "utf8"));
    const lcpMs = medianReport.audits?.["largest-contentful-paint"]?.numericValue;
    const cls = medianReport.audits?.["cumulative-layout-shift"]?.numericValue;
    const fetchTime = medianReport.fetchTime;

    let previous = {};
    try {
      previous = JSON.parse(readFileSync(PERF_CACHE_PATH, "utf8"));
    } catch {
      previous = {};
    }

    const next = {
      ...previous,
      lastUpdated: new Date().toISOString(),
      lighthouse: {
        ...(typeof previous.lighthouse === "object" && previous.lighthouse !== null ? previous.lighthouse : {}),
        ...(typeof fetchTime === "string" ? { fetchTime } : {}),
        ...(typeof lcpMs === "number" ? { lcpMs } : {}),
        ...(typeof cls === "number" ? { cls } : {}),
        ttiMs: medianTti,
      },
    };

    writeFileSync(PERF_CACHE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  } catch (error) {
    console.error(`WARN could not write perf cache at ${PERF_CACHE_PATH}: ${error.message}`);
  }

  const pass = medianTti <= TTI_BUDGET_MS;
  console.log(`MEDIAN TTI ${formatMs(medianTti)} / budget ${formatMs(TTI_BUDGET_MS)} => ${pass ? "PASS" : "FAIL"}`);

  if (!pass) {
    process.exit(1);
  }
} finally {
  rmSync(reportDir, { recursive: true, force: true });
}
