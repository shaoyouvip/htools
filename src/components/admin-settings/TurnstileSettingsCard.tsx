import { useEffect, useRef, useState } from "react";
import { loadTurnstileSettings, saveTurnstileSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import { useLoadingSkeleton } from "../../useLoadingSkeleton";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type { TurnstileSettings } from "../../types";

export function TurnstileSettingsCard({
  maintenanceText,
  reloadKey,
  setStatus,
  t,
  token
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  reloadKey: number;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
}) {
  const [settings, setSettings] = useState<TurnstileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const loadRequestRef = useRef(0);
  const writeInProgressRef = useRef(false);
  const showSkeleton = useLoadingSkeleton(loading, 0);

  async function loadSettings(signal?: AbortSignal) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const loaded = await loadTurnstileSettings(token, { signal });
      if (signal?.aborted || loadRequestRef.current !== requestId) return;
      setSettings(loaded);
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

  async function toggleEnabled() {
    if (saving || (!settings?.available && !settings?.enabled)) return;
    if (writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveTurnstileSettings(!settings.enabled, token);
      setSettings(saved);
      setStatus(saved.enabled
        ? maintenanceText.turnstileEnabledMessage
        : maintenanceText.turnstileDisabledMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      writeInProgressRef.current = false;
      setSaving(false);
    }
  }

  return (
    <article className="source-public-card turnstile-settings-card" {...getAdminLoadingProps(loading && !loadError, showSkeleton)}>
      {loadError ? (
        <AdminSettingsLoadError
          isRetrying={loading}
          message={getLocalizedErrorMessage(loadError, t)}
          onRetry={() => void loadSettings()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.turnstileTitle}
        />
      ) : (
        <div className="source-card-heading">
          <h3>{maintenanceText.turnstileTitle}</h3>
          <SettingsStatusBadge
            ariaDescribedBy="turnstile-settings-description turnstile-settings-configuration"
            disabled={saving || !settings?.available}
            disabledLabel={settings?.available
              ? maintenanceText.turnstileDisabled
              : maintenanceText.serviceUnavailable}
            enabled={settings?.enabled ?? false}
            enabledLabel={maintenanceText.turnstileEnabled}
            onChange={() => void toggleEnabled()}
          />
          <p id="turnstile-settings-description">{maintenanceText.turnstileDescription}</p>
          <div className="turnstile-config-help" id="turnstile-settings-configuration">
            <span>
              <code>TURNSTILE_SITE_KEY</code>
              {` = ${maintenanceText.turnstileSiteKeyLabel}`}
            </span>
            <span>
              <code>TURNSTILE_SECRET_KEY</code>
              {` = ${maintenanceText.turnstileSecretKeyLabel}`}
            </span>
          </div>
        </div>
      )}
      <AdminSkeletonLines loading={loading && !loadError} visible={showSkeleton} />
    </article>
  );
}
