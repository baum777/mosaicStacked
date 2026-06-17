import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block D (Performance-Tab & Bundle) regression gate for R9.
 *
 * R9: `web/vite.config.ts:manualChunks` must only reference packages that
 *     are declared in `web/package.json` dependencies. Today the function
 *     references `react-is`, `scheduler`, `react-router`, `highlight.js`,
 *     `shiki`, `framer-motion`, and `@radix-ui` — none of which are in
 *     `web/package.json` (only `react`, `react-dom`, `react-markdown`,
 *     `remark-gfm`). Tighten the function so it only handles the declared
 *     deps and emits a `vendor-markdown` chunk for the markdown library.
 *
 * Strategy: source-level assertions. The dead branches in `manualChunks`
 * are best caught statically so the build does not drift back to over-
 * chunking based on packages we never ship.
 */

const vitePath = "web/vite.config.ts";
const webPkgPath = "web/package.json";

function readVite() {
  return readFileSync(vitePath, "utf8");
}

function declaredDependencyNames(): Set<string> {
  const pkg = JSON.parse(readFileSync(webPkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
}

function extractManualChunksBody(source: string): string {
  const match = source.match(/manualChunks\s*\(\s*[^)]*\)\s*\{([\s\S]*?)\n\s{0,4}\}/);
  assert.ok(match, "expected to find a `manualChunks(id) { … }` function body in vite.config.ts");
  return match[1];
}

test("R9: vite.config.ts manualChunks only references packages declared in web/package.json", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);
  const declared = declaredDependencyNames();

  // Find every `/node_modules/<name>/` reference inside manualChunks and
  // assert each is in the declared-deps allowlist.
  const references = [...body.matchAll(/\/node_modules\/(@?[^/]+)\//g)];
  assert.ok(
    references.length > 0,
    "expected manualChunks to contain at least one /node_modules/<name>/ reference",
  );

  for (const ref of references) {
    const name = ref[1];
    assert.ok(
      declared.has(name),
      `manualChunks references \"/node_modules/${name}/\" but \`${name}\` is NOT declared in web/package.json dependencies. ` +
        `Declared deps: ${[...declared].join(", ")}`,
    );
  }
});

test("R9: manualChunks does not reference highlight.js, shiki, framer-motion, or any @radix-ui package", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);

  for (const dead of ["highlight.js", "shiki", "framer-motion"]) {
    assert.doesNotMatch(
      body,
      new RegExp(`/node_modules/${dead.replace(/\./g, "\\.")}/`),
      `manualChunks must not reference \"/node_modules/${dead}/\" — package is not declared in web/package.json`,
    );
  }

  // Any @radix-ui scoped package must be absent.
  assert.doesNotMatch(
    body,
    /\/node_modules\/@radix-ui\//,
    "manualChunks must not reference any \"/node_modules/@radix-ui/*\" — no @radix-ui package is declared in web/package.json",
  );
});

test("R9: manualChunks does not reference react-is, scheduler, or react-router (dead branches from prior R9 audit)", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);

  for (const dead of ["react-is", "scheduler", "react-router"]) {
    assert.doesNotMatch(
      body,
      new RegExp(`/node_modules/${dead}/`),
      `manualChunks must not reference \"/node_modules/${dead}/\" — package is not declared in web/package.json`,
    );
  }
});

test("R9: manualChunks does not return a dead vendor-router, vendor-syntax, or vendor-ui chunk name", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);

  assert.doesNotMatch(
    body,
    /return\s+["']vendor-router["']/,
    "manualChunks must not return \"vendor-router\" — react-router is not a declared dep",
  );
  assert.doesNotMatch(
    body,
    /return\s+["']vendor-syntax["']/,
    "manualChunks must not return \"vendor-syntax\" — highlight.js/shiki are not declared deps",
  );
  assert.doesNotMatch(
    body,
    /return\s+["']vendor-ui["']/,
    "manualChunks must not return \"vendor-ui\" — framer-motion/@radix-ui are not declared deps",
  );
});

test("R9: manualChunks routes react-markdown and remark-gfm into a vendor-markdown chunk", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);

  assert.match(
    body,
    /\/node_modules\/react-markdown\//,
    "manualChunks must reference /node_modules/react-markdown/ so the markdown library is split into its own chunk",
  );
  assert.match(
    body,
    /\/node_modules\/remark-gfm\//,
    "manualChunks must reference /node_modules/remark-gfm/ so the GFM plugin is co-located with react-markdown",
  );
  assert.match(
    body,
    /return\s+["']vendor-markdown["']/,
    "manualChunks must return \"vendor-markdown\" for the react-markdown / remark-gfm branch",
  );
});

test("R9: manualChunks still routes react and react-dom into a vendor-react chunk", () => {
  const source = readVite();
  const body = extractManualChunksBody(source);

  assert.match(
    body,
    /\/node_modules\/react\//,
    "manualChunks must reference /node_modules/react/ to bundle React into vendor-react",
  );
  assert.match(
    body,
    /\/node_modules\/react-dom\//,
    "manualChunks must reference /node_modules/react-dom/ to bundle ReactDOM into vendor-react",
  );
  assert.match(
    body,
    /return\s+["']vendor-react["']/,
    "manualChunks must still return \"vendor-react\" for the React core branch (regression guard)",
  );
});
