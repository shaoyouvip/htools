import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadRssHubSettings, saveRssHubSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import { normalizeRssHubBaseUrl } from "../../../shared/rsshub";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type { RssHubSettings } from "../../types";

export function RssHubSettingsCard({
  maintenanceText,
  onDirtyChange,
  reloadKey,
  setStatus,
  t,
  token
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  reloadKey: number;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
}) {
  const [settings, setSettings] = useState<RssHubSettings | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const loadRequestRef = useRef(0);
  const dirty = Boolean(settings && baseUrl.trim() !== settings.baseUrl);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange]
  );

  async function loadSettings(signal?: AbortSignal) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const loaded = await loadRssHubSettings(token, { signal });
      if (signal?.aborted || loadRequestRef.current !== requestId) return;
      setSettings(loaded);
      setBaseUrl(loaded.baseUrl);
      setLoadError(null);
    } catch (error) {
      if (!signal?.aborted && loadRequestRef.current === requestId) {
        setLoadError(error);
      }
    } finally {
      if (!signal?.aborted && loadRequestRef.current === requestId) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadSettings(controller.signal);
    return () => {
      controller.abort();
      loadRequestRef.current += 1;
    };
  }, [reloadKey, token]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveRssHubSettings({
        enabled: settings?.enabled ?? true,
        baseUrl
      }, token);
      setSettings(saved);
      setBaseUrl(saved.baseUrl);
      setStatus(maintenanceText.rssHubUpdated);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled() {
    if (!settings || saving) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveRssHubSettings({
        enabled: !settings.enabled,
        baseUrl: settings.baseUrl
      }, token);
      setSettings(saved);
      setStatus(saved.enabled
        ? maintenanceText.rssHubEnabledMessage
        : maintenanceText.rssHubDisabledMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <article className="source-public-card rsshub-settings-card">
        <AdminSettingsLoadError
          isRetrying={loading}
          message={getLocalizedErrorMessage(loadError, t)}
          onRetry={() => void loadSettings()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.rssHubTitle}
        />
      </article>
    );
  }

  return (
    <article className="source-public-card rsshub-settings-card" {...getAdminLoadingProps(loading)}>
      <div className="source-card-heading">
        <h3>{maintenanceText.rssHubTitle}</h3>
        <SettingsStatusBadge
          ariaDescribedBy="rsshub-settings-description"
          disabled={saving}
          disabledLabel={maintenanceText.rssHubDisabled}
          enabled={settings?.enabled ?? true}
          enabledLabel={maintenanceText.rssHubEnabled}
          onChange={() => void toggleEnabled()}
        />
        <p id="rsshub-settings-description">{maintenanceText.rssHubDescription}</p>
      </div>
      <form
        aria-describedby="rsshub-settings-description"
        className="proxy-settings-form"
        onSubmit={save}
      >
        <label className="source-url-field">
          {maintenanceText.rssHubUrlLabel}
          <input
            disabled={saving}
            maxLength={2048}
            onBlur={() => {
              const normalized = normalizeRssHubBaseUrl(baseUrl);
              if (normalized) setBaseUrl(normalized);
            }}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={maintenanceText.rssHubUrlPlaceholder}
            type="url"
            value={baseUrl}
          />
        </label>
        <div className="source-public-actions">
          <button className="ghost-button" disabled={saving || !dirty} type="submit">
            {maintenanceText.rssHubSave}
          </button>
        </div>
      </form>
      <AdminSkeletonLines loading={loading} />
    </article>
  );
}

