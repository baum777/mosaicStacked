import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPinnedChatContextPrompt,
  createPinnedChatContext,
  type PinnedChatContext
} from "../src/lib/pinned-chat-context.js";

const MAX_BLOCK_LENGTH = 8_000;
const FORBIDDEN_FRAGMENTS = [
  "must-not-leak",
  "secret-token",
  "VERBATIM_DIFF_SENTINEL"
];

function buildFixture(): PinnedChatContext {
  return createPinnedChatContext({
    repoFullName: "acme/console-with-secret-token",
    ref: "main",
    path: "server/src/routes/github.ts",
    summary: "Guard execute flows behind backend approval. secret-token in summary.",
    excerpt: "Sensitive content excerpt with secret-token must-not-leak embedded",
    diffPreview: "diff with secret-token must-not-leak VERBATIM_DIFF_SENTINEL unchanged",
    createdAt: "2026-04-21T08:03:00.000Z"
  });
}

test("buildPinnedChatContextPrompt never serializes the redaction-banned secret fragments", () => {
  const context = buildFixture();
  const prompt = buildPinnedChatContextPrompt("base prompt", context, "en");

  for (const fragment of FORBIDDEN_FRAGMENTS) {
    assert.equal(
      prompt.includes(fragment),
      false,
      `pinned prompt must not contain "${fragment}" but did`
    );
  }
});

test("buildPinnedChatContextPrompt drops the verbatim diff preview when the block overflows", () => {
  const context = createPinnedChatContext({
    repoFullName: "acme/console",
    ref: "main",
    path: "server/src/routes/github.ts",
    summary: "summary",
    excerpt: `${"A".repeat(7_200)}\nA-final`,
    diffPreview: `diff-start\n${"B".repeat(4_000)}\ndiff-end`,
    createdAt: "2026-04-21T08:04:00.000Z"
  });

  const prompt = buildPinnedChatContextPrompt("base prompt", context, "en");
  // When the block saturates the cap, the diff preview is dropped
  // and a localized truncation marker is appended.
  assert.match(prompt, /\[Context truncated to 8000 characters\]/);
  assert.equal(prompt.includes("diff-end"), false);
});

test("buildPinnedChatContextPrompt output is bounded by the documented length cap", () => {
  const oversized = createPinnedChatContext({
    repoFullName: "acme/console",
    ref: "main",
    path: "server/src/routes/github.ts",
    summary: "summary",
    excerpt: `${"A".repeat(8_000)}A-final`,
    diffPreview: `${"B".repeat(8_000)}B-final`,
    createdAt: "2026-04-21T08:04:00.000Z"
  });

  const basePrompt = "base prompt";
  const englishPrompt = buildPinnedChatContextPrompt(basePrompt, oversized, "en");
  const englishBlockLength = englishPrompt.length - (basePrompt.length + 2); // base + "\n\n" prefix
  assert.ok(
    englishBlockLength <= MAX_BLOCK_LENGTH,
    `English pinned prompt block length ${englishBlockLength} exceeded cap ${MAX_BLOCK_LENGTH}`
  );

  const germanPrompt = buildPinnedChatContextPrompt(basePrompt, oversized, "de");
  const germanBlockLength = germanPrompt.length - (basePrompt.length + 2);
  assert.ok(
    germanBlockLength <= MAX_BLOCK_LENGTH,
    `German pinned prompt block length ${germanBlockLength} exceeded cap ${MAX_BLOCK_LENGTH}`
  );
});

test("createPinnedChatContext normalizes the repo slug (trim, no leading slash, no trailing whitespace)", () => {
  const context = createPinnedChatContext({
    repoFullName: "  acme/console  ",
    ref: "main",
    path: "server/src/routes/github.ts",
    summary: "summary",
    excerpt: "excerpt",
    diffPreview: null,
    createdAt: "2026-04-21T08:00:00.000Z"
  });

  assert.equal(context.repoFullName, "acme/console");
  assert.equal(context.ref, "main");
  assert.equal(context.path, "server/src/routes/github.ts");
});

test("buildPinnedChatContextPrompt always begins with the user base prompt and includes the localized header", () => {
  const context = buildFixture();
  const basePrompt = "find regressions in the execute gate";

  const englishPrompt = buildPinnedChatContextPrompt(basePrompt, context, "en");
  assert.ok(englishPrompt.startsWith(`${basePrompt}\n\n`));
  assert.match(englishPrompt, /\[Local GitHub context\]/);

  const germanPrompt = buildPinnedChatContextPrompt(basePrompt, context, "de");
  assert.ok(germanPrompt.startsWith(`${basePrompt}\n\n`));
  assert.match(germanPrompt, /\[Lokaler GitHub-Kontext\]/);
});

test("createPinnedChatContext redacts BANNED_PROMPT_SENTINELS from the stored object itself", () => {
  const context = buildFixture();
  const stringFields: Array<keyof PinnedChatContext> = [
    "repoFullName",
    "ref",
    "path",
    "summary",
    "excerpt",
    "diffPreview"
  ];

  for (const field of stringFields) {
    const value = context[field];
    if (typeof value !== "string") {
      continue;
    }
    for (const fragment of FORBIDDEN_FRAGMENTS) {
      assert.equal(
        value.includes(fragment),
        false,
        `PinnedChatContext.${field} must not contain "${fragment}" but did`
      );
    }
  }
});
