import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const docsPath = path.join(repoRoot, "docs/ui-spec.md");
const outputDir = path.join(repoRoot, "output");

const liveReadyAssets = [
  "live-ready-desktop-chat.png",
  "live-ready-desktop-settings.png",
  "live-ready-desktop-github.png",
  "live-ready-desktop-matrix.png",
  "live-ready-mobile-chat.png",
  "live-ready-mobile-matrix.png",
];

function formatLocalTimestamp(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function toCaptureSlot(fileName) {
  return fileName.replace(/^live-ready-/, "").replace(/\.png$/, "");
}

const groupsByTimestamp = new Map();

for (const fileName of liveReadyAssets) {
  const assetPath = path.join(outputDir, fileName);
  const stats = statSync(assetPath);
  const timestamp = formatLocalTimestamp(stats.mtime);
  const slot = toCaptureSlot(fileName);

  if (!groupsByTimestamp.has(timestamp)) {
    groupsByTimestamp.set(timestamp, []);
  }
  groupsByTimestamp.get(timestamp).push(slot);
}

const sortedGroups = Array.from(groupsByTimestamp.entries())
  .sort(([left], [right]) => right.localeCompare(left))
  .map(([timestamp, slots]) => {
    const sortedSlots = [...slots].sort((a, b) => a.localeCompare(b));
    return `\`${timestamp}\` (${sortedSlots.map((slot) => `\`${slot}\``).join(", ")})`;
  });

const evidenceLine = `**Capture evidence (mtime, local):** ${sortedGroups.join(" and ")}.`;
const evidencePattern = /^\*\*Capture evidence \(mtime, local\):\*\*.*$/m;

const originalDoc = readFileSync(docsPath, "utf8");

if (!evidencePattern.test(originalDoc)) {
  throw new Error("Capture evidence marker line not found in docs/ui-spec.md");
}

const updatedDoc = originalDoc.replace(evidencePattern, evidenceLine);

if (updatedDoc !== originalDoc) {
  writeFileSync(docsPath, updatedDoc, "utf8");
  process.stdout.write(`Updated capture evidence in ${docsPath}\n`);
} else {
  process.stdout.write("Capture evidence already up to date.\n");
}
