export function ActivityRow({
  title,
  additions,
  deletions,
  age,
  onPress,
  quickActions = [],
}: {
  title: string;
  additions: number;
  deletions: number;
  age: string;
  onPress: () => void;
  quickActions?: Array<{
    label: string;
    onPress: () => void;
    tone?: "primary" | "danger" | "neutral";
  }>;
}) {
  return (
    <div className="mobile-activity-row-wrap">
      <button type="button" className="mobile-activity-row" onClick={onPress}>
        <span className="mobile-activity-dot" aria-hidden="true">•</span>
        <span className="mobile-activity-copy">
          <strong>{title}</strong>
          <small>
            <span className="mobile-additions">+{additions}</span>
            {" "}
            <span className="mobile-deletions">-{deletions}</span>
            {" · "}
            {age}
          </small>
        </span>
      </button>
      {quickActions.length > 0 ? (
        <div className="inline-quick-actions" aria-label="Activity quick actions">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`inline-quick-action inline-quick-action-${action.tone ?? "neutral"}`}
              onClick={(event) => {
                event.stopPropagation();
                action.onPress();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
