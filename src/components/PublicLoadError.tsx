import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Messages } from "../i18n";

export function PublicLoadError({
  busy,
  children,
  message,
  onRetry,
  t
}: {
  busy: boolean;
  children?: ReactNode;
  message: string;
  onRetry: () => void;
  t: Messages;
}) {
  return (
    <div aria-busy={busy} className="empty-state article-empty-state public-load-error" role="alert">
      <div className="empty-state-title">
        <CircleAlert size={24} />
        <h2>{t.empty.connectionTitle}</h2>
      </div>
      <p>{message}</p>
      <button className="ghost-button empty-state-action" disabled={busy} onClick={onRetry} type="button">
        {t.actions.retry}
      </button>
      {children}
    </div>
  );
}
