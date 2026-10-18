import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadUmamiSettings, saveUmamiSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import { useLoadingSkeleton } from "../../useLoadingSkeleton";
import {
  hasCompleteUmamiSettings,
  normalizeUmamiScriptUrl,
  normalizeUmamiWebsiteId
} from "../../umami";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type { UmamiSettings } from "../../types";

const EMPTY_FORM: UmamiSettings = {
  enabled: false,
  scriptUrl: "",
  websiteId: ""
};

export function UmamiSettingsCard({
  maintenanceText,
  onDirtyChange,
  onSettingsChange,
  reloadKey,
  setStatus,
  t,
  token
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  onSettingsChange: (settings: UmamiSettings) => void;
  reloadKey: number;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
}) {
  const [settings, setSettings] = useState<UmamiSettings | null>(null);
  const [form, setForm] = useState<UmamiSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const loadRequestRef = useRef(0);
  const savingRef = useRef(false);
  const showSkeleton = useLoadingSkeleton(loading, 0);
  const hasSavedConfig = hasCompleteUmamiSettings(settings ?? EMPTY_FORM);
  const isDirty = Boolean(
    settings &&
      (form.scriptUrl.trim() !== settings.scriptUrl ||
        form.websiteId.trim() !== settings.websiteId)
  );

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange]
  );

  function applySettings(next: UmamiSettings, syncForm = true) {
    const normalized = {
      enabled: next.enabled,
      scriptUrl: normalizeUmamiScriptUrl(next.scriptUrl),
      websiteId: normalizeUmamiWebsiteId(next.websiteId)
    };

    setSettings(normalized);
    if (syncForm) setForm(normalized);
    onSettingsChange(normalized);
  }

  async function loadSettings(signal?: AbortSignal) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const loaded = await loadUmamiSettings(token, { signal });
      if (signal?.aborted || loadRequestRef.current !== requestId) return;
      applySettings(loaded);
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
  async function persist(
    nextSettings: UmamiSettings,
    syncFormAfterSave: boolean,
    successMessage: string
  ) {
    if (savingRef.current) return;

    const rawScriptUrl = nextSettings.scriptUrl.trim();
    const scriptUrl = normalizeUmamiScriptUrl(rawScriptUrl);
    const websiteId = normalizeUmamiWebsiteId(nextSettings.websiteId);

    if (rawScriptUrl && !scriptUrl) {
      setStatus(maintenanceText.umamiInvalidUrl);
      return;
    }

    if (nextSettings.enabled && (!scriptUrl || !websiteId)) {
      setStatus(maintenanceText.umamiRequired);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setStatus("");

    try {
      const saved = await saveUmamiSettings(
        { enabled: nextSettings.enabled, scriptUrl, websiteId },
        token
      );
      applySettings(saved, syncFormAfterSave);
      setStatus(successMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persist(
      {
        enabled: settings?.enabled ?? false,
        scriptUrl: form.scriptUrl,
        websiteId: form.websiteId
      },
      true,
      maintenanceText.umamiUpdated
    );
  }

  function toggleEnabled() {
    if (!settings) return;
    const enabled = !settings.enabled;
    void persist(
      { ...settings, enabled },
      false,
      enabled
        ? maintenanceText.umamiEnabledMessage
        : maintenanceText.umamiDisabledMessage
    );
  }

  return (
    <article className="source-public-card umami-settings-card" {...getAdminLoadingProps(loading && !loadError, showSkeleton)}>
      {loadError ? (
        <AdminSettingsLoadError
          isRetrying={loading}
          message={getLocalizedErrorMessage(loadError, t)}
          onRetry={() => void loadSettings()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.umamiTitle}
        />
      ) : (
        <>
          <div className="source-card-heading">
            <h3>{maintenanceText.umamiTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="umami-settings-description"
              disabled={saving || (!settings?.enabled && !hasSavedConfig)}
              disabledLabel={hasSavedConfig
                ? maintenanceText.umamiDisabled
                : maintenanceText.serviceUnavailable}
              enabled={settings?.enabled ?? false}
              enabledLabel={maintenanceText.umamiEnabled}
              onChange={() => toggleEnabled()}
            />
            <p id="umami-settings-description">
              {maintenanceText.umamiDescription}
            </p>
          </div>
          <form
            aria-describedby="umami-settings-description"
            className="proxy-settings-form"
            onSubmit={save}
          >
            <label className="source-url-field">
              {maintenanceText.umamiScriptUrlLabel}
              <input
                disabled={saving}
                maxLength={2048}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scriptUrl: event.target.value
                  }))
                }
                placeholder={maintenanceText.umamiScriptUrlPlaceholder}
                type="url"
                value={form.scriptUrl}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.umamiWebsiteIdLabel}
              <input
                disabled={saving}
                maxLength={200}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    websiteId: event.target.value
                  }))
                }
                placeholder={maintenanceText.umamiWebsiteIdPlaceholder}
                type="text"
                value={form.websiteId}
              />
            </label>
            <div className="source-public-actions">
              <button className="ghost-button" disabled={saving || !isDirty}
                type="submit"
              >
                {maintenanceText.umamiSave}
              </button>
            </div>
          </form>
        </>
      )}
      <AdminSkeletonLines loading={loading && !loadError} visible={showSkeleton} />
    </article>
  );
}
