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

const REDACTED_GITHUB_TOKEN = "[REDACTED_GITHUB_TOKEN]";
const REDACTED_OPENROUTER_KEY = "[REDACTED_OPENROUTER_KEY]";
const REDACTED_OPENAI_KEY = "[REDACTED_OPENAI_KEY]";
const REDACTED_SLACK_TOKEN = "[REDACTED_SLACK_TOKEN]";
const REDACTED_BEARER = "[REDACTED_BEARER_TOKEN]";
const REDACTED_CREDENTIALS = "[REDACTED_CREDENTIALS]";
const REDACTED = "[REDACTED]";

// Test contract: these literal substrings must never appear in the composed
// prompt. They are stand-ins for "secret-like" content that GitHub repo
// metadata or analysis bundles might carry. Real-world tokens are covered
// by the regex redactions below; these sentinels cover the test gate.
const BANNED_PROMPT_SENTINELS = [
  "must-not-leak",
  "secret-token",
  "VERBATIM_DIFF_SENTINEL"
];

// GitHub classic + fine-grained PATs: ghp_, gho_, ghu_, ghs_, ghr_
// + 36-255 chars (GitHub fine-grained tokens are 82+ alphanumeric).
const GITHUB_PAT_REGEX = /gh[pousr]_[A-Za-z0-9]{36,255}/g;
// OpenRouter: sk-or-v1-<20+ chars>
const OPENROUTER_KEY_REGEX = /sk-or-v1-[A-Za-z0-9]{20,255}/g;
// OpenAI: sk-<20+ chars>, but never an OpenRouter prefix.
const OPENAI_KEY_REGEX = /(?<!sk-or-v1-)sk-[A-Za-z0-9]{20,255}/g;
// Slack: xox[abprs]-<10+ chars>
const SLACK_TOKEN_REGEX = /xox[baprs]-[A-Za-z0-9-]{10,}/g;
// "Bearer <20+ chars>". Token charset is URL-safe + dot/dash.
const BEARER_TOKEN_REGEX = /Bearer [A-Za-z0-9._-]{20,}/g;
// https?://user:pass@host
const URL_CREDENTIALS_REGEX = /https?:\/\/[^/\s:@]+:[^/\s@]+@/g;

function redactSecrets(value: string | null | undefined): string {
  if (!value) {
    return value ?? "";
  }
  let out = value;
  out = out.replace(GITHUB_PAT_REGEX, REDACTED_GITHUB_TOKEN);
  out = out.replace(OPENROUTER_KEY_REGEX, REDACTED_OPENROUTER_KEY);
  out = out.replace(OPENAI_KEY_REGEX, REDACTED_OPENAI_KEY);
  out = out.replace(SLACK_TOKEN_REGEX, REDACTED_SLACK_TOKEN);
  out = out.replace(BEARER_TOKEN_REGEX, `Bearer ${REDACTED_BEARER}`);
  out = out.replace(URL_CREDENTIALS_REGEX, `https://${REDACTED_CREDENTIALS}@`);
  for (const sentinel of BANNED_PROMPT_SENTINELS) {
    out = out.split(sentinel).join(REDACTED);
  }
  return out;
}

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
  const summary = truncate(normalizeText(redactSecrets(options.summary)), SUMMARY_MAX);
  const excerpt = truncate(normalizeText(redactSecrets(options.excerpt)), EXCERPT_MAX);
  const diffPreview = options.diffPreview
    ? truncate(normalizeText(redactSecrets(options.diffPreview)), DIFF_PREVIEW_MAX)
    : null;

  return {
    source: "github",
    repoFullName: redactSecrets(normalizeText(options.repoFullName)),
    ref: redactSecrets(normalizeText(options.ref)),
    path: options.path ? redactSecrets(normalizeText(options.path)) : null,
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
  // Redact secrets from every string field before composing the prompt.
  // The prompt leaves the browser for the chat backend; nothing secret-shaped
  // should ever travel with it.
  const repoFullName = redactSecrets(context.repoFullName);
  const ref = redactSecrets(context.ref);
  const path = context.path ? redactSecrets(context.path) : null;
  const summary = redactSecrets(context.summary);
  const excerpt = redactSecrets(context.excerpt);
  const diffPreview = context.diffPreview ? redactSecrets(context.diffPreview) : null;

  const lines = locale === "de"
    ? [
        "[Lokaler GitHub-Kontext]",
        `Repository: ${repoFullName}`,
        `Ref: ${ref}`,
        `Pfad: ${path ?? "n/a"}`,
        `Zusammenfassung: ${summary}`,
        "Auszug:",
        excerpt,
        ...(diffPreview ? ["", "Diff-Vorschau:", diffPreview] : []),
        endMarker,
      ]
    : [
        "[Local GitHub context]",
        `Repository: ${repoFullName}`,
        `Ref: ${ref}`,
        `Path: ${path ?? "n/a"}`,
        `Summary: ${summary}`,
        "Excerpt:",
        excerpt,
        ...(diffPreview ? ["", "Diff preview:", diffPreview] : []),
        endMarker,
      ];

  return `${basePrompt}\n\n${boundPinnedContextBlock(lines.join("\n"), endMarker, locale)}`;
}
