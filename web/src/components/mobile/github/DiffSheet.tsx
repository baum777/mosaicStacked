import React, { useState } from "react";
import { BottomSheet } from "../shared/BottomSheet.js";
import { SegmentedControl } from "../shared/SegmentedControl.js";

export type DiffSheetFile = {
  path: string;
  changeType: string;
  additions: number;
  deletions: number;
  patch?: string;
};

type DiffSheetTab = "chat" | "diff" | "patch";

function classifyPatchLine(line: string): "added" | "removed" | "context" {
  if (line.startsWith("+")) {
    return "added";
  }
  if (line.startsWith("-")) {
    return "removed";
  }
  return "context";
}

export function DiffSheet({
  open,
  title,
  summary,
  emptyLabel,
  files,
  initialTab,
  onDismiss,
}: {
  open: boolean;
  title: string;
  summary: string;
  emptyLabel: string;
  files: DiffSheetFile[];
  initialTab?: DiffSheetTab;
  onDismiss: () => void;
}) {
  const [tab, setTab] = useState<DiffSheetTab>(initialTab ?? "chat");

  return (
    <BottomSheet open={open} title={title} maxHeight="large" onDismiss={onDismiss}>
      <div className="mobile-diff-sheet">
        <SegmentedControl<DiffSheetTab>
          label={title}
          value={tab}
          options={[
            { value: "chat", label: "Chat" },
            { value: "diff", label: "Diff" },
            { value: "patch", label: "Patch" },
          ]}
          onChange={setTab}
        />
        {tab === "chat" ? (
          <p className="mobile-diff-sheet-summary">{summary}</p>
        ) : tab === "diff" ? (
          <div className="mobile-diff-file-list">
            {files.length > 0 ? files.map((file) => (
              <article className="mobile-diff-file-row" key={file.path}>
                <strong>{file.path}</strong>
                <span>{file.changeType}</span>
                <small>+{file.additions} -{file.deletions}</small>
              </article>
            )) : (
              <p className="mobile-diff-sheet-summary">{emptyLabel}</p>
            )}
          </div>
        ) : (
          <div className="mobile-diff-patch-list" data-testid="mobile-diff-patch-list">
            {files.length > 0 ? files.map((file) => (
              <article className="mobile-diff-patch-file" key={file.path}>
                <header className="mobile-diff-patch-file-header">
                  <strong>{file.path}</strong>
                  <span>{file.changeType}</span>
                </header>
                {file.patch ? (
                  <pre className="mobile-diff-patch" data-testid={`mobile-diff-patch-${file.path}`}>
                    {file.patch.split("\n").map((line, index) => {
                      const kind = classifyPatchLine(line);
                      return (
                        <span
                          key={index}
                          className={`mobile-diff-patch-line mobile-diff-patch-line-${kind}`}
                        >
                          {line || "\u00a0"}
                          {"\n"}
                        </span>
                      );
                    })}
                  </pre>
                ) : (
                  <p className="mobile-diff-patch-empty">{emptyLabel}</p>
                )}
              </article>
            )) : (
              <p className="mobile-diff-sheet-summary">{emptyLabel}</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
