import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SwipeDeck } from "../src/components/shared/SwipeDeck.js";

test("SwipeDeck wires tabs to tabpanels with accessible ids", () => {
  const markup = renderToStaticMarkup(
    React.createElement(SwipeDeck, {
      ariaLabel: "Example deck",
      panels: [
        { id: "first", label: "First", content: React.createElement("p", null, "First panel") },
        { id: "second", label: "Second", content: React.createElement("p", null, "Second panel") },
      ],
    }),
  );

  assert.match(markup, /role="tablist"/);
  assert.match(markup, /id="swipe-deck-tab-first"/);
  assert.match(markup, /aria-controls="swipe-deck-panel-first"/);
  assert.match(markup, /id="swipe-deck-panel-first"/);
  assert.match(markup, /role="tabpanel"/);
  assert.match(markup, /aria-labelledby="swipe-deck-tab-first"/);
  assert.match(markup, /id="swipe-deck-tab-second"/);
  assert.match(markup, /aria-controls="swipe-deck-panel-second"/);
  assert.match(markup, /id="swipe-deck-panel-second"/);
  assert.match(markup, /aria-labelledby="swipe-deck-tab-second"/);
});
