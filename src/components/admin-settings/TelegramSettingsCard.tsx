import { useEffect, useRef, useState } from "react";
import { useLoadingSkeleton } from "../../useLoadingSkeleton";
import { saveTelegramSettings, testTelegramSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Locale, Messages } from "../../i18n";
import type { TelegramConnection, TelegramSettings } from "../../types";

export function TelegramSettingsCard({
  locale,
  maintenanceText,
  onDirtyChange,
  onReload,
  onSettingsChange,
  setStatus,
  settings,
  settingsError,
  loading,
  t,
  token
}: {
  locale: Locale;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => Promise<void>;
  onSettingsChange: (settings: TelegramSettings) => void;
  setStatus: (status: string) => void;
  settings: TelegramSettings;
  settingsError: unknown;
  loading: boolean;
  t: Messages;
  token: string;
}) {
  const [footerMarkdown, setFooterMarkdown] = useState(settings.footerMarkdown);
  const [target, setTarget] = useState(settings.target);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const preserveDraftRef = useRef<{ target: string; footerMarkdown: string } | null>(null);
  const testRequestIdRef = useRef(0);
  const showSkeleton = useLoadingSkeleton(loading, 0);
  const dirty = target !== settings.target || footerMarkdown !== settings.footerMarkdown;
  const error = settingsError
    ? getLocalizedErrorMessage(settingsError, t)
    : "";

  useEffect(() => {
    const preservedDraft = preserveDraftRef.current;
    preserveDraftRef.current = null;
    setTarget(preservedDraft?.target ?? settings.target);
    setFooterMarkdown(preservedDraft?.footerMarkdown ?? settings.footerMarkdown);
    setConnection(null);
  }, [settings]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange]
  );

  async function persist(
    next: { enabled: boolean; target: string; footerMarkdown: string },
    syncForm: boolean
  ) {
    if (saving) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveTelegramSettings(next, token);
      if (syncForm) {
        setTarget(saved.target);
        setFooterMarkdown(saved.footerMarkdown);
      }
      onSettingsChange(saved);
      setStatus(
        next.enabled !== settings.enabled
          ? saved.enabled
            ? maintenanceText.telegramEnabledMessage
            : maintenanceText.telegramDisabledMessage
          : maintenanceText.telegramUpdated
      );
    } catch (saveError) {
      preserveDraftRef.current = null;
      setStatus(getLocalizedErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    const testedTarget = target.trim();
    if (testing || !testedTarget) return;
    const requestId = testRequestIdRef.current + 1;
    testRequestIdRef.current = requestId;
    setConnection(null);
    setTesting(true);
    setStatus("");
    try {
      const connection = await testTelegramSettings(testedTarget, token);
      if (testRequestIdRef.current !== requestId) return;
      setConnection(connection);
      setStatus(
        maintenanceText.telegramConnected(
          connection.chatTitle,
          connection.botUsername,
          testedTarget !== settings.target
        )
      );
    } catch (testError) {
      if (testRequestIdRef.current !== requestId) return;
      setStatus(getLocalizedErrorMessage(testError, t));
    } finally {
      if (testRequestIdRef.current === requestId) {
        setTesting(false);
      }
    }
  }

  if (error) {
    return (
      <article className="source-public-card telegram-settings-card">
        <AdminSettingsLoadError
          isRetrying={loading}
          message={error}
          onRetry={() => void onReload()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.telegramTitle}
        />
      </article>
    );
  }

  return (
    <article className="source-public-card telegram-settings-card" {...getAdminLoadingProps(loading, showSkeleton)}>
      <div className="source-card-heading">
        <h3>{maintenanceText.telegramTitle}</h3>
        <SettingsStatusBadge
          ariaDescribedBy="telegram-settings-description telegram-settings-configuration"
          disabled={saving || testing || !settings.available}
          disabledLabel={settings.available
            ? maintenanceText.telegramDisabled
            : maintenanceText.serviceUnavailable}
          enabled={settings.enabled}
          enabledLabel={maintenanceText.telegramEnabled}
          onChange={(enabled) => {
            if (enabled && dirty) {
              setStatus(maintenanceText.telegramSaveBeforeEnable);
              return;
            }

            if (!enabled && dirty) {
              preserveDraftRef.current = { target, footerMarkdown };
              void persist({
                enabled: false,
                target: settings.target,
                footerMarkdown: settings.footerMarkdown
              }, false);
              return;
            }

            void persist({
              enabled,
              target,
              footerMarkdown
            }, false);
          }}
        />
        <p id="telegram-settings-description">{maintenanceText.telegramDescription}</p>
        <div className="turnstile-config-help" id="telegram-settings-configuration">
          <span><code>TGTOKEN</code>{` = ${maintenanceText.telegramTokenLabel}`}</span>
        </div>
      </div>
      {connection ? (
        <section className="tool-github-detail-card telegram-connection-details" aria-live="polite">
          <div className="tool-github-detail-grid telegram-connection-detail-grid">
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "机器人" : "Bot"}</span>
              <strong>
                {connection.botName || "Telegram Bot"}
                {connection.botUsername ? ` (@${connection.botUsername})` : ""}
              </strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "发送目标" : "Target"}</span>
              <strong>{connection.chatTitle}</strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "目标类型" : "Type"}</span>
              <strong>{getTelegramChatTypeLabel(connection.chatType, locale)}</strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "权限状态" : "Permission"}</span>
              <strong>
                {connection.canSend
                  ? locale === "zh" ? "可以发送消息" : "Can send messages"
                  : locale === "zh" ? "无法发送消息" : "Cannot send messages"}
              </strong>
            </div>
          </div>
        </section>
      ) : null}
      <form
        aria-describedby="telegram-settings-description telegram-settings-configuration"
        className="proxy-settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          void persist({ enabled: settings.enabled, target, footerMarkdown }, true);
        }}
      >
        <label className="source-url-field">
          {maintenanceText.telegramTargetLabel}
          <input
            autoComplete="off"
            disabled={saving}
            maxLength={40}
            onChange={(event) => {
              testRequestIdRef.current += 1;
              setTarget(event.target.value);
              setConnection(null);
              setTesting(false);
              setStatus("");
            }}
            placeholder={maintenanceText.telegramTargetPlaceholder}
            type="text"
            value={target}
          />
        </label>
        <label className="source-url-field telegram-footer-field">
          {maintenanceText.telegramFooterLabel}
          <input
            autoComplete="off"
            disabled={saving}
            maxLength={1000}
            onChange={(event) => setFooterMarkdown(event.target.value)}
            placeholder={maintenanceText.telegramFooterPlaceholder}
            type="text"
            value={footerMarkdown}
          />
        </label>
        <div className="source-public-actions telegram-settings-actions">
          <button className="ghost-button" disabled={saving || testing || !dirty}
            type="submit"
          >
            {maintenanceText.telegramSave}
          </button>
          <button className="ghost-button" disabled={saving || testing || !target.trim()}
            type="button"
            onClick={() => void testConnection()}
          >
            {maintenanceText.telegramTest}
          </button>
        </div>
      </form>
      <AdminSkeletonLines loading={loading} visible={showSkeleton} />
    </article>
  );
}

function getTelegramChatTypeLabel(type: string, locale: Locale) {
  const labels = locale === "zh"
    ? { private: "个人账户", group: "群组", supergroup: "超级群组", channel: "频道" }
    : { private: "Private chat", group: "Group", supergroup: "Supergroup", channel: "Channel" };
  return labels[type as keyof typeof labels] ?? type;
}
