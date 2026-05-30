import type { Locale } from "./localization.js";

export type PinnedChatContext = {
  source: "github";
  repoFullName: string;
  ref: string;
  path: string | null;
  summary: string;
  excerpt: string;
  diffPreview: string | null;
  createdAt: string;
};

const SUMMARY_MAX = 240;
const EXCERPT_MAX = 4_000;
const DIFF_PREVIEW_MAX = 8_000;
const PINNED_CONTEXT_BLOCK_MAX = 8_000;

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function truncate(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max).trimEnd()}…`;
}

function getPinnedContextTruncationMarker(locale: Locale) {
  return locale === "de"
    ? "[Kontext gekuerzt auf 8000 Zeichen]"
    : "[Context truncated to 8000 characters]";
}

function boundPinnedContextBlock(block: string, endMarker: string, locale: Locale) {
  if (block.length <= PINNED_CONTEXT_BLOCK_MAX) {
    return block;
  }

  const marker = getPinnedContextTruncationMarker(locale);
  const suffix = `\n${marker}\n${endMarker}`;
  const endSuffix = `\n${endMarker}`;
  const blockWithoutEndMarker = block.endsWith(endSuffix)
    ? block.slice(0, -endSuffix.length)
    : block;
  const prefixMax = Math.max(0, PINNED_CONTEXT_BLOCK_MAX - suffix.length);

  return `${blockWithoutEndMarker.slice(0, prefixMax).trimEnd()}${suffix}`;
}

export function createPinnedChatContext(options: {
  repoFullName: string;
  ref: string;
  path: string | null;
  summary: string;
  excerpt: string;
  diffPreview: string | null;
  createdAt?: string;
}): PinnedChatContext {
  const summary = truncate(normalizeText(options.summary), SUMMARY_MAX);
  const excerpt = truncate(normalizeText(options.excerpt), EXCERPT_MAX);
  const diffPreview = options.diffPreview
    ? truncate(normalizeText(options.diffPreview), DIFF_PREVIEW_MAX)
    : null;

  return {
    source: "github",
    repoFullName: normalizeText(options.repoFullName),
    ref: normalizeText(options.ref),
    path: options.path ? normalizeText(options.path) : null,
    summary,
    excerpt,
    diffPreview,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

export function buildPinnedChatContextPrompt(basePrompt: string, context: PinnedChatContext | null, locale: Locale) {
  if (!context) {
    return basePrompt;
  }

  const endMarker = locale === "de" ? "[Ende lokaler GitHub-Kontext]" : "[End local GitHub context]";
  const lines = locale === "de"
    ? [
        "[Lokaler GitHub-Kontext]",
        `Repository: ${context.repoFullName}`,
        `Ref: ${context.ref}`,
        `Pfad: ${context.path ?? "n/a"}`,
        `Zusammenfassung: ${context.summary}`,
        "Auszug:",
        context.excerpt,
        ...(context.diffPreview ? ["", "Diff-Vorschau:", context.diffPreview] : []),
        endMarker,
      ]
    : [
        "[Local GitHub context]",
        `Repository: ${context.repoFullName}`,
        `Ref: ${context.ref}`,
        `Path: ${context.path ?? "n/a"}`,
        `Summary: ${context.summary}`,
        "Excerpt:",
        context.excerpt,
        ...(context.diffPreview ? ["", "Diff preview:", context.diffPreview] : []),
        endMarker,
      ];

  return `${basePrompt}\n\n${boundPinnedContextBlock(lines.join("\n"), endMarker, locale)}`;
}
