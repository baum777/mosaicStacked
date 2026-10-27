import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldRegisterPwa, shouldReloadOnControllerChange } from "../src/pwa.js";

function createMemorySessionStorage() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

test("PWA registration is disabled in dev so stale shell caches cannot own the header", () => {
  assert.equal(
    shouldRegisterPwa({
      isDev: true,
      isSecureContext: true,
      hasServiceWorker: true,
    }),
    false,
  );
});

test("PWA registration remains available in secure production browsers", () => {
  assert.equal(
    shouldRegisterPwa({
      isDev: false,
      isSecureContext: true,
      hasServiceWorker: true,
    }),
    true,
  );
});

test("controllerchange reload is allowed once and guarded against loops", () => {
  const storage = createMemorySessionStorage();

  assert.equal(shouldReloadOnControllerChange(1_000, storage), true);
  assert.equal(shouldReloadOnControllerChange(2_000, storage), false, "within the guard window no further reload may fire");
  assert.equal(shouldReloadOnControllerChange(20_000, storage), true, "after the guard window a new reload is allowed");
});

test("controllerchange reload handles unavailable sessionStorage defensively", () => {
  assert.equal(shouldReloadOnControllerChange(1_000, null), false);
});

test("service worker serves unhashed assets network-first and hashed assets cache-first", async () => {
  const swSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

  assert.match(swSource, /mosaicstacked-shell-v6/);
  assert.match(swSource, /isHashedBuildAsset/);
  assert.match(swSource, /\/assets\//);
  assert.match(swSource, /matchInPreviousCaches/, "chunk 404s must fall back to the previous cache");

  const hashedBranch = swSource.slice(swSource.indexOf("isHashedBuildAsset(url.pathname)"), swSource.indexOf("// Unhashed assets"));
  const unhashedBranch = swSource.slice(swSource.indexOf("// Unhashed assets"));

  assert.match(unhashedBranch, /await fetch\(request\)/, "unhashed assets must try the network first");
  assert.ok(
    unhashedBranch.indexOf("await fetch(request)") < unhashedBranch.indexOf("cache.match(request)", unhashedBranch.indexOf("await fetch(request)")),
    "unhashed assets must hit the network before the cache",
  );
  assert.match(hashedBranch, /cache\.match\(request\)/, "hashed assets must consult the cache first");
  assert.ok(
    hashedBranch.indexOf("cache.match(request)") < hashedBranch.indexOf("await fetch(request)"),
    "hashed assets must check the cache before the network",
  );
});

test("service worker retains one previous cache version to protect stale tabs", async () => {
  const swSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

  assert.match(swSource, /version < currentVersion - 1/, "only caches older than the directly previous version may be deleted");
  assert.match(swSource, /readCacheVersion/);
});

test("HTML head uses lightweight bundled favicon and theme-aware manifests", async () => {
  const markup = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(markup, /<meta name="theme-color" content="#050c14"/);
  assert.match(markup, /\/favicon\/favicon-transparent\.ico/);
  assert.match(markup, /\/favicon\/favicon-transparent-32\.png/);
  assert.match(markup, /\/manifest-light\.webmanifest/);
  assert.match(markup, /\/manifest-dark\.webmanifest/);
  assert.match(markup, /\/icons\/light\/apple-touch-icon-light-180\.png/);
  assert.match(markup, /\/icons\/dark\/apple-touch-icon-dark-180\.png/);
});

test("theme-aware PWA manifests are branded and point to bundled PNG icons", async () => {
  const [lightManifest, darkManifest] = await Promise.all([
    readFile(new URL("../public/manifest-light.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest-dark.webmanifest", import.meta.url), "utf8"),
  ]);

  const light = JSON.parse(lightManifest) as { name: string; icons: Array<{ src: string; type: string }> };
  const dark = JSON.parse(darkManifest) as { name: string; icons: Array<{ src: string; type: string }> };

  assert.equal(light.name, "MosaicStacked");
  assert.equal(dark.name, "MosaicStacked");
  assert.ok(light.icons.some((icon) => icon.src === "/icons/light/icon-light-192.png" && icon.type === "image/png"));
  assert.ok(dark.icons.some((icon) => icon.src === "/icons/dark/icon-dark-192.png" && icon.type === "image/png"));
});
