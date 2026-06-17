import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContextStrip } from "../src/components/mobile/layout/ContextStrip.js";

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");

test("ContextStrip renders repo, branch, and file labels with file marked for ellipsis", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ContextStrip, {
      repoLabel: "owner/repo",
      branchLabel: "feature/block-a",
      fileLabel: "src/file.ts",
      status: "idle",
      ariaLabel: "Open command context",
      onPress: () => undefined,
    }),
  );

  assert.match(markup, /owner\/repo/);
  assert.match(markup, /feature\/block-a/);
  assert.match(markup, /src\/file\.ts/);
  assert.match(markup, /data-ellipsis/);
});

test("mobile context path allows at least the first two spans to remain readable", () => {
  const css = criticalSource();

  const pathRule = css.match(
    /\.app-shell-mobile\s+\.mobile-context-path\s*\{([\s\S]*?)\}/,
  );
  assert.ok(pathRule, "expected .app-shell-mobile .mobile-context-path rule");
  assert.match(pathRule[1], /min-width:\s*0/);
  assert.match(pathRule[1], /overflow:\s*hidden/);

  const spanRule = css.match(
    /\.app-shell-mobile\s+\.mobile-context-path\s+span\s*\{([\s\S]*?)\}/,
  );
  assert.ok(spanRule, "expected .app-shell-mobile .mobile-context-path span rule");
  assert.match(spanRule[1], /min-width:\s*0/);
  assert.match(spanRule[1], /overflow:\s*hidden/);
  assert.match(spanRule[1], /text-overflow:\s*ellipsis/);
  assert.match(spanRule[1], /white-space:\s*nowrap/);
  assert.match(spanRule[1], /flex:\s*0\s+1\s+auto/);
});

test("mobile context strip path keeps a visible gap between spans", () => {
  const css = criticalSource();

  const pathRule = css.match(
    /\.app-shell-mobile\s+\.mobile-context-path\s*\{([\s\S]*?)\}/,
  );
  assert.ok(pathRule, "expected .app-shell-mobile .mobile-context-path rule");
  assert.match(pathRule[1], /gap:\s*\d/);
});
