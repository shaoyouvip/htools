import { ArrowUpRight, RefreshCw } from "lucide-react";
import { isChineseLocaleText } from "../article-helpers";
import type { Messages } from "../i18n";

export function AdminEmptyState({
  action,
  className = "",
  description,
  title
}: {
  action?: { label: string; onClick: () => void; tone?: "primary" | "ghost" };
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <section className={`admin-empty-state ${className}`.trim()}>
      <div className="empty-state-title">
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
      {action ? (
        <button className={`${
            action.tone === "ghost" ? "ghost-button" : "primary-button"
          } empty-state-action`}
          type="button"
          onClick={action.onClick}
        >
          {action.label}
          {action.tone === "ghost" ? null : <ArrowUpRight size={15} />}
        </button>
      ) : null}
    </section>
  );
}

export function AdminInitialLoadError({
  isRetrying = false,
  message,
  onRetry,
  t
}: {
  isRetrying?: boolean;
  message: string;
  onRetry: () => void;
  t?: Messages;
}) {
  const isChinese = t ? isChineseLocaleText(t) : /[㐀-鿿]/u.test(message);

  return (
    <section aria-busy={isRetrying} className="admin-empty-state" role="alert">
      <div className="empty-state-title">
        <RefreshCw size={28} />
        <h2>{isChinese ? "加载失败" : "Unable to load"}</h2>
      </div>
      <p>{message}</p>
      <button className="ghost-button empty-state-action"
        disabled={isRetrying}
        type="button"
        onClick={onRetry}
      >
        {isChinese ? "重新加载" : "Try again"}
      </button>
    </section>
  );
}

export function AdminSettingsLoadError({
  isRetrying,
  message,
  onRetry,
  retryLabel,
  title
}: {
  isRetrying: boolean;
  message: string;
  onRetry: () => void;
  retryLabel: string;
  title: string;
}) {
  return (
    <div aria-busy={isRetrying} className="settings-card-error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      <button aria-busy={isRetrying} className="ghost-button" disabled={isRetrying}
        type="button" onClick={onRetry}
      >
        {retryLabel}
      </button>
    </div>
  );
}
