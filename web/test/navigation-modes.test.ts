import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIMARY_WORKSPACES,
  SECONDARY_WORKSPACES,
  isPrimaryWorkspace,
  isSecondaryWorkspace,
  filterWorkspacesForMode,
} from "../src/lib/work-mode.js";

test("PRIMARY_WORKSPACES contains exactly five required primaries in order", () => {
  assert.deepEqual(
    [...PRIMARY_WORKSPACES],
    ["chat", "workbench", "matrix", "settings", "perf"],
  );
});

test("SECONDARY_WORKSPACES contains exactly the four expert-only tabs", () => {
  assert.deepEqual(
    [...SECONDARY_WORKSPACES],
    ["review", "community", "models", "evidence"],
  );
});

test("isPrimaryWorkspace and isSecondaryWorkspace are mutually exclusive and exhaustive", () => {
  const all = [...PRIMARY_WORKSPACES, ...SECONDARY_WORKSPACES];
  for (const mode of all) {
    assert.equal(isPrimaryWorkspace(mode), !isSecondaryWorkspace(mode), `${mode} classification`);
  }
});

test("filterWorkspacesForMode keeps all nine in expert and only five in beginner", () => {
  const items = [
    { mode: "chat" },
    { mode: "workbench" },
    { mode: "review" },
    { mode: "community" },
    { mode: "models" },
    { mode: "evidence" },
    { mode: "matrix" },
    { mode: "settings" },
    { mode: "perf" },
  ];
  assert.equal(filterWorkspacesForMode(items, "expert").length, 9);
  const beginner = filterWorkspacesForMode(items, "beginner");
  assert.equal(beginner.length, 5);
  for (const item of beginner) {
    assert.equal(isPrimaryWorkspace(item.mode), true, `${item.mode} must be primary`);
  }
});

test("filterWorkspacesForMode never drops primaries and never keeps secondaries in beginner", () => {
  const items = [
    { mode: "chat" },
    { mode: "matrix" },
    { mode: "settings" },
    { mode: "review" },
    { mode: "evidence" },
  ];
  const beginner = filterWorkspacesForMode(items, "beginner");
  assert.deepEqual(beginner.map((item) => item.mode), ["chat", "matrix", "settings"]);
});
