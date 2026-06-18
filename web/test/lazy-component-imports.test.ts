import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block F (Performance & Bundle) regression gate for F1.
 *
 * F1: MarkdownMessage and GuideOverlay must be lazy-loaded out of the
 *     workspace chunks (ChatWorkspace and MatrixWorkspace). They used
 *     to be imported at the top of those files, which pulled the
 *     ~161 kB / ~48 kB gzip markdown chunk (and the ~32 kB / ~12 kB
 *     gzip GuideOverlay chunk) into the workspace's critical-path
 *     chunk.
 *
 * The fix replaces the value import with a `React.lazy(() => …)`
 *     declaration and wraps each call site in `<Suspense>`.
 *
 * The chunk-prefix whitelist in `web/vite.config.ts` must include the
 *     new chunk names so the lazy chunks are NOT preloaded.
 *
 * Strategy: source-level assertions. The lazy conversion and the chunk
 * whitelist are best verified by reading the source; behaviour in the
 * browser is already covered by the integration suite.
 */

const chatWorkspacePath = "web/src/components/ChatWorkspace.tsx";
const matrixWorkspacePath = "web/src/components/MatrixWorkspace.tsx";
const vitePath = "web/vite.config.ts";

function readChatWorkspace() {
  return readFileSync(chatWorkspacePath, "utf8");
}

function readMatrixWorkspace() {
  return readFileSync(matrixWorkspacePath, "utf8");
}

function readVite() {
  return readFileSync(vitePath, "utf8");
}

function topLevelValueImports(source: string) {
  return source
    .split("\n")
    .filter((line) => line.startsWith("import "))
    .filter((line) => !/\btype\b/.test(line));
}

function importsNamedComponent(source: string, filePath: string, componentName: string) {
  return topLevelValueImports(source).some((line) => {
    if (!line.includes(`from "${filePath}"`) && !line.includes(`from '${filePath}'`)) {
      return false;
    }
    // Strip the `from "..."` clause so the component name match only
    // looks at the import-specifier side, not the path string.
    const specifiers = line.replace(/\bfrom\s+["'][^"']+["']\s*;?\s*$/, "");
    return new RegExp(`\\b${componentName}\\b`).test(specifiers);
  });
}

test("F1: ChatWorkspace no longer imports MarkdownMessage as a value at the top level", () => {
  const source = readChatWorkspace();
  assert.equal(
    importsNamedComponent(source, "./MarkdownMessage.js", "MarkdownMessage"),
    false,
    "ChatWorkspace must not import MarkdownMessage eagerly; use React.lazy",
  );
});

test("F1: ChatWorkspace no longer imports GuideOverlay as a value at the top level", () => {
  const source = readChatWorkspace();
  assert.equal(
    importsNamedComponent(source, "./GuideOverlay.js", "GuideOverlay"),
    false,
    "ChatWorkspace must not import GuideOverlay eagerly; use React.lazy",
  );
});

test("F1: MatrixWorkspace no longer imports GuideOverlay as a value at the top level", () => {
  const source = readMatrixWorkspace();
  assert.equal(
    importsNamedComponent(source, "./GuideOverlay.js", "GuideOverlay"),
    false,
    "MatrixWorkspace must not import GuideOverlay eagerly; use React.lazy",
  );
});

test("F1: ChatWorkspace declares a LazyMarkdownMessage dynamic loader via React.lazy", () => {
  const source = readChatWorkspace();
  assert.match(
    source,
    /(?:const|let|var)\s+LazyMarkdownMessage\s*=\s*lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']\.\/MarkdownMessage\.js["']\s*\)/,
    "ChatWorkspace must declare `const LazyMarkdownMessage = lazy(() => import(\"./MarkdownMessage.js\"))` (with optional .then mapping)",
  );
});

test("F1: ChatWorkspace declares a LazyGuideOverlay dynamic loader via React.lazy", () => {
  const source = readChatWorkspace();
  assert.match(
    source,
    /(?:const|let|var)\s+LazyGuideOverlay\s*=\s*lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']\.\/GuideOverlay\.js["']\s*\)/,
    "ChatWorkspace must declare `const LazyGuideOverlay = lazy(() => import(\"./GuideOverlay.js\"))` (with optional .then mapping)",
  );
});

test("F1: MatrixWorkspace declares a LazyGuideOverlay dynamic loader via React.lazy", () => {
  const source = readMatrixWorkspace();
  assert.match(
    source,
    /(?:const|let|var)\s+LazyGuideOverlay\s*=\s*lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']\.\/GuideOverlay\.js["']\s*\)/,
    "MatrixWorkspace must declare `const LazyGuideOverlay = lazy(() => import(\"./GuideOverlay.js\"))` (with optional .then mapping)",
  );
});

test("F1: ChatWorkspace wraps LazyGuideOverlay / LazyMarkdownMessage call sites in a Suspense boundary", () => {
  const source = readChatWorkspace();
  assert.match(
    source,
    /<Suspense[\s\S]*?<\/Suspense>/,
    "ChatWorkspace must wrap lazy call sites in <Suspense>...</Suspense>",
  );
});

test("F1: MatrixWorkspace wraps LazyGuideOverlay call sites in a Suspense boundary", () => {
  const source = readMatrixWorkspace();
  assert.match(
    source,
    /<Suspense[\s\S]*?<\/Suspense>/,
    "MatrixWorkspace must wrap lazy call sites in <Suspense>...</Suspense>",
  );
});

test("F1: vite.config.ts DEFERRED_PRELOAD_CHUNK_PREFIXES contains the MarkdownMessage chunk prefix", () => {
  const source = readVite();
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array literal in vite.config.ts");
  const arrayBody = match[1];
  assert.match(
    arrayBody,
    /["']MarkdownMessage["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must include \"MarkdownMessage\" so the new lazy chunk is deferred from preload",
  );
});

test("F1: vite.config.ts DEFERRED_PRELOAD_CHUNK_PREFIXES contains the GuideOverlay chunk prefix", () => {
  const source = readVite();
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array literal in vite.config.ts");
  const arrayBody = match[1];
  assert.match(
    arrayBody,
    /["']GuideOverlay["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must include \"GuideOverlay\" so the new lazy chunk is deferred from preload",
  );
});
