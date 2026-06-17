import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block C (Mobile-Tab-Adapter) regression gate for the chat composer.
 *
 * R10 (Chat Composer Mobile Height) audit fix:
 *   - The mobile chat composer textarea must auto-resize between
 *     `min-height: 36px` and `max-height: clamp(44px, 24dvh, 200px)`.
 *   - The component must wire an auto-resize mechanism (useLayoutEffect /
 *     useEffect on scrollHeight or explicit onInput prop).
 *   - The submit button stays absolutely positioned at ≥ 34 px tap target.
 *
 * Strategy: source-level assertion on critical.css + ComposeZone.tsx. The
 * existing test framework runs `node --test --import tsx` from the repo
 * root, and tsx applies the classic JSX transform to imported source files
 * (the tsconfig.json for the web workspace only applies when tsx is loaded
 * from the `web/` directory). ComposeZone imports only named hooks from
 * "react" and does not import the default `React`, so a render-time smoke
 * test would crash with "React is not defined" — we keep the assertions
 * source-level, consistent with `use-console-theme.test.ts`.
 */

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");
const composeSource = () => readFileSync(
  "web/src/components/mobile/chat/ComposeZone.tsx",
  "utf8",
);

test("mobile chat composer textarea declares min-height 36px and max-height clamp(44px, 24dvh, 200px)", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.governed-composer\s+textarea\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected .app-shell-mobile .governed-composer textarea rule in critical.css");

  assert.match(
    match[1],
    /min-height:\s*36px/,
    "textarea min-height must be 36px",
  );
  // The audit fix replaces `max-height: 96px` with a clamp(44px, 24dvh, 200px)
  // so long prompts can auto-resize up to 200 px while still respecting the
  // 44 px minimum tap target when the field collapses.
  const maxMatch = match[1].match(/max-height:\s*([^;]+);/);
  assert.ok(maxMatch, "textarea must declare a max-height");
  const raw = maxMatch[1].trim();
  assert.match(
    raw,
    /clamp\(\s*44px\s*,\s*24dvh\s*,\s*200px\s*\)/,
    "mobile composer max-height must use clamp(44px, 24dvh, 200px) so long prompts auto-resize up to 200px",
  );
});

test("mobile compose field has align-items: flex-end so submit button anchors to the baseline", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.mobile-compose-field\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected .app-shell-mobile .mobile-compose-field rule");
  assert.match(match[1], /align-items:\s*flex-end/);
});

test("mobile compose submit button remains absolutely positioned and ≥ 34 px tap target", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.mobile-compose-submit\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected .app-shell-mobile .mobile-compose-submit rule");
  assert.match(match[1], /position:\s*absolute/);
  assert.match(match[1], /min-height:\s*34px/);
});

test("ComposeZone source wires an auto-resize effect on input or scrollHeight", () => {
  const source = composeSource();
  // The auto-resize contract: a useLayoutEffect/useEffect that updates the
  // textarea height to min(scrollHeight, MAX) — OR an explicit onInput prop.
  const hasAutoResize = /useLayoutEffect[\s\S]*?scrollHeight/.test(source)
    || /useEffect[\s\S]*?scrollHeight/.test(source)
    || /onInput\s*=/.test(source);
  assert.ok(
    hasAutoResize,
    "ComposeZone must wire an auto-resize mechanism (useLayoutEffect/useEffect on scrollHeight or onInput prop)",
  );
});

test("ComposeZone keeps the chat-send data-testid and aria-disabled plumbing", () => {
  const source = composeSource();
  // The composer must keep its existing data-testid for the integration
  // test surface, and must wire aria-disabled on the submit button so
  // screen readers announce the disabled state.
  assert.match(
    source,
    /data-testid="chat-composer"/,
    "ComposeZone must render <textarea data-testid='chat-composer'>",
  );
  assert.match(
    source,
    /data-testid="chat-send"/,
    "ComposeZone must render <button data-testid='chat-send'>",
  );
  assert.match(
    source,
    /aria-disabled=\{submitDisabled\}/,
    "ComposeZone must wire aria-disabled on the submit button",
  );
});

test("ComposeZone auto-resize caps the textarea at a 200 px ceiling (not 96 px)", () => {
  const source = composeSource();
  // The previous value was 96 px; Block C raises it to 200 px so a long
  // prompt no longer scrolls inside a tiny input. Accept either the literal
  // `200` or a `COMPOSE_AUTO_RESIZE_MAX_PX` constant whose declaration
  // resolves to 200.
  assert.doesNotMatch(
    source,
    /Math\.min\(textarea\.scrollHeight,\s*96\)/,
    "ComposeZone must not cap the auto-resize at the old 96 px ceiling",
  );
  const hasLiteral200 = /Math\.min\(\s*textarea\.scrollHeight\s*,\s*200\s*\)/.test(source);
  const hasConstant = /COMPOSE_AUTO_RESIZE_MAX_PX\s*=\s*200/.test(source)
    && /Math\.min\(\s*textarea\.scrollHeight\s*,\s*COMPOSE_AUTO_RESIZE_MAX_PX\s*\)/.test(source);
  assert.ok(
    hasLiteral200 || hasConstant,
    "ComposeZone must cap the auto-resize at scrollHeight, 200 — either as a literal or via a constant bound to 200",
  );
});
