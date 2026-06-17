import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block C (Mobile-Tab-Adapter) regression gate for the Workbench DiffSheet
 * patch tab.
 *
 * Audit fix ("Diff Patch Preview (Mobile)"):
 *   - The DiffSheet must support 3 tabs: Chat / Diff / Patch.
 *   - When the user picks Patch, each file's `patch` string is rendered inside
 *     a `<pre class="mobile-diff-patch">` with line-level added/removed styling.
 *   - The default tab remains Chat.
 *
 * The patch is a GitHub unified diff. Lines start with:
 *   `+` added, `-` removed, ` ` context.
 * We assert the renderer classifies `+` lines as added and `-` lines as removed.
 *
 * Strategy: source-level assertion on DiffSheet.tsx + critical.css. The
 * existing test framework runs `node --test --import tsx` from the repo
 * root; tsx applies the classic JSX transform to imported source files
 * (the web tsconfig.json is only honoured when tsx is loaded from
 * `web/`), and the BottomSheet helper does not import the default React.
 * A render-time smoke test would crash with "React is not defined" — we
 * keep the assertions source-level, consistent with
 * `use-console-theme.test.ts` and the rest of the Block C gates.
 */

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");
const diffSheetSource = () => readFileSync(
  "web/src/components/mobile/github/DiffSheet.tsx",
  "utf8",
);

test("DiffSheet source declares a 3-option SegmentedControl with chat / diff / patch", () => {
  const source = diffSheetSource();
  // Match any object literal in the options array, regardless of position.
  // JavaScript regex does not support backreferences (\1), so use two
  // capture groups and pair them up by index.
  const optionsRegex = /\{\s*value:\s*"(chat|diff|patch)"\s*,\s*label:\s*"(Chat|Diff|Patch)"\s*\}/g;
  const found = source.match(optionsRegex) ?? [];
  const labels = found.map((m) => m.match(/value:\s*"(\w+)"/)?.[1]).filter(Boolean);
  assert.deepEqual(
    labels.sort(),
    ["chat", "diff", "patch"],
    `DiffSheet must declare exactly three SegmentedControl options: chat, diff, patch. Found: ${labels.join(", ")}`,
  );
});

test("DiffSheet source renders the chat summary branch on the default Chat tab", () => {
  const source = diffSheetSource();
  // The default branch must render the summary paragraph + early-return
  // the diff / patch branches until the user picks a different tab.
  assert.match(
    source,
    /tab === "chat" \?\s*\(\s*<p className="mobile-diff-sheet-summary">\{summary\}<\/p>/,
    "DiffSheet must render the Chat summary as the default tab",
  );
});

test("DiffSheet source renders the file list on the Diff tab branch", () => {
  const source = diffSheetSource();
  assert.match(
    source,
    /tab === "diff" \? \(\s*<div className="mobile-diff-file-list">/,
    "DiffSheet must render <div className='mobile-diff-file-list'> on the Diff tab branch",
  );
});

test("DiffSheet source renders a <pre className='mobile-diff-patch'> on the Patch tab branch", () => {
  const source = diffSheetSource();
  assert.match(
    source,
    /<pre className="mobile-diff-patch"/,
    "DiffSheet must render <pre className='mobile-diff-patch'> on the Patch tab branch",
  );
  // The renderer must walk the patch line-by-line and pick the kind
  // from the leading character.
  assert.match(
    source,
    /function\s+classifyPatchLine\s*\(\s*line\s*:\s*string\s*\)/,
    "DiffSheet must declare a classifyPatchLine(line) helper for line classification",
  );
  assert.match(
    source,
    /line\.startsWith\("\+"\)/,
    "classifyPatchLine must recognise '+' lines as added",
  );
  assert.match(
    source,
    /line\.startsWith\("-"\)/,
    "classifyPatchLine must recognise '-' lines as removed",
  );
  // The CSS classes for added / removed / context lines must be wired via
  // a template literal so the runtime class resolves to the kind value.
  assert.match(
    source,
    /mobile-diff-patch-line-\$\{kind\}/,
    "DiffSheet must wire the per-line class via `mobile-diff-patch-line-${kind}`",
  );
  // The CSS must define the matching line classes.
  const css = criticalSource();
  assert.match(
    css,
    /\.app-shell-mobile\s+\.mobile-diff-patch-line-added/,
    "critical.css must declare .mobile-diff-patch-line-added",
  );
  assert.match(
    css,
    /\.app-shell-mobile\s+\.mobile-diff-patch-line-removed/,
    "critical.css must declare .mobile-diff-patch-line-removed",
  );
  assert.match(
    css,
    /\.app-shell-mobile\s+\.mobile-diff-patch-line-context/,
    "critical.css must declare .mobile-diff-patch-line-context",
  );
});

test("critical.css declares the .app-shell-mobile .mobile-diff-patch rule", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.mobile-diff-patch\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    match,
    "expected .app-shell-mobile .mobile-diff-patch rule in critical.css",
  );
  // Must be monospaced + scrollable.
  assert.match(match[1], /overflow(-x|-y)?:\s*auto/);
  assert.match(match[1], /font-family:[^;]*mono/);
});
