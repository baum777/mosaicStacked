import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "../src/components/mobile/shared/SegmentedControl.js";

/**
 * Block E (Authority & Polish) audit-closure test for R8.
 *
 * Block C widened the SegmentedControl prop type from a fixed 2-tuple
 * to a generic `SegmentedControlOption<TValue>[]` array so the
 * DiffSheet can render 3 tabs. Block C left the regression test for
 * Block E. This file closes the audit gap with a focused, source-
 * aware render test that:
 *
 *   1. Locks the source signature (`options: SegmentedControlOption<TValue>[]`).
 *   2. Verifies 2-option, 3-option, and 4-option renders produce the
 *      right number of buttons with the right `aria-pressed` flag.
 *   3. Verifies the rendered group has the `aria-label` from `label`.
 *
 * Render-test infrastructure note (mirrors `mobile-compose-zone.test.ts`):
 * The test framework runs `node --test --import tsx` from the repo root
 * and tsx applies the classic JSX transform to imported source files.
 * `SegmentedControl.tsx` was widened in Block C without an explicit
 * `import React from "react"`, so a render-time test would crash with
 * "React is not defined" (Vite is unaffected because Vite uses the
 * automatic JSX transform keyed off `web/tsconfig.json`). Block E's
 * "do not touch the Block C file" constraint is honored by publishing
 * `React` onto `globalThis` for the duration of these tests so the
 * classic transform can resolve `React.createElement`. Block F (or a
 * follow-up Block C patch) should add the import to the source.
 *
 * Source change is in place; this test is a regression guard only.
 */

const sourcePath = "web/src/components/mobile/shared/SegmentedControl.tsx";

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

function renderControl<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: SegmentedControlOption<TValue>[];
  onChange?: (value: TValue) => void;
}) {
  // Publish React as a global so the classic JSX transform in
  // SegmentedControl.tsx can resolve `React.createElement` without the
  // source file importing React. See file header for context.
  (globalThis as unknown as { React: typeof React }).React = React;
  return renderToStaticMarkup(
    React.createElement(SegmentedControl, {
      label,
      value,
      options,
      onChange: onChange ?? (() => undefined),
    }),
  );
}

test("SegmentedControl source keeps the generic options array signature (R8 audit closure)", () => {
  const source = readSource();

  assert.match(
    source,
    /options:\s*SegmentedControlOption<TValue>\[\]/,
    "SegmentedControl must accept `options: SegmentedControlOption<TValue>[]` (Block C widening)",
  );
});

test("SegmentedControl renders exactly 2 buttons and marks the active one aria-pressed=true", () => {
  const options: SegmentedControlOption<"a" | "b">[] = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];
  const markup = renderControl({
    label: "Pair",
    value: "b",
    options,
  });

  const buttonMatches = markup.match(/<button[^>]*>/g) ?? [];
  assert.equal(buttonMatches.length, 2, `expected exactly 2 buttons, got ${buttonMatches.length}`);

  assert.match(
    markup,
    /<button[^>]*aria-pressed="true"[^>]*>Beta<\/button>/,
    "active option (Beta) must carry aria-pressed=true",
  );
  assert.match(
    markup,
    /<button[^>]*aria-pressed="false"[^>]*>Alpha<\/button>/,
    "inactive option (Alpha) must carry aria-pressed=false",
  );
});

test("SegmentedControl renders exactly 3 buttons for a 3-option list (used by DiffSheet)", () => {
  const options: SegmentedControlOption<"chat" | "diff" | "patch">[] = [
    { value: "chat", label: "Chat" },
    { value: "diff", label: "Diff" },
    { value: "patch", label: "Patch" },
  ];
  const markup = renderControl({
    label: "Diff sheet tabs",
    value: "diff",
    options,
  });

  const buttonMatches = markup.match(/<button[^>]*>/g) ?? [];
  assert.equal(buttonMatches.length, 3, `expected exactly 3 buttons, got ${buttonMatches.length}`);

  assert.match(
    markup,
    /<button[^>]*aria-pressed="true"[^>]*>Diff<\/button>/,
    "middle option (Diff) must carry aria-pressed=true",
  );
});

test("SegmentedControl renders exactly 4 buttons for a 4-option list", () => {
  const options: SegmentedControlOption<"w1" | "w2" | "w3" | "w4">[] = [
    { value: "w1", label: "Workbench-1" },
    { value: "w2", label: "Workbench-2" },
    { value: "w3", label: "Workbench-3" },
    { value: "w4", label: "Workbench-4" },
  ];
  const markup = renderControl({
    label: "Four stages",
    value: "w1",
    options,
  });

  const buttonMatches = markup.match(/<button[^>]*>/g) ?? [];
  assert.equal(buttonMatches.length, 4, `expected exactly 4 buttons, got ${buttonMatches.length}`);
});

test("SegmentedControl wraps the group with role='group' and an aria-label from the label prop", () => {
  const options: SegmentedControlOption<"a" | "b">[] = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];
  const markup = renderControl({
    label: "Pair toggle",
    value: "a",
    options,
  });

  assert.match(
    markup,
    /<div[^>]*role="group"[^>]*aria-label="Pair toggle"[^>]*>/,
    "group must carry role='group' and the supplied aria-label",
  );
  assert.match(
    markup,
    /aria-label="Pair toggle"/,
    "rendered markup must contain the exact aria-label from the label prop",
  );
});
