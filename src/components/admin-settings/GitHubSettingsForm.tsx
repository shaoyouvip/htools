import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadGitHubSettings, saveGitHubSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import { useLoadingSkeleton } from "../../useLoadingSkeleton";
import { AdminSkeletonLines, getAdminLoadingProps } from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type { GitHubSettings, GitHubSettingsInput } from "../../types";

export function GitHubSettingsForm({
  maintenanceText,
  onDirtyChange,
  onStatus,
  reloadKey,
  token,
  t
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  onStatus: (message: string) => void;
  reloadKey: number;
  token: string;
  t: Messages;
}) {
  const [settings, setSettings] = useState<GitHubSettings | null>(null);
  const [form, setForm] = useState<GitHubSettingsInput>({
    enabled: false,
    owner: "",
    repo: "",
    labels: ["tool-submission"]
  });
  const [isSaving, setIsSaving] = useState(false);
  const writeInProgressRef = useRef(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<unknown>(null);
  const [settingsReloadKey, setSettingsReloadKey] = useState(0);
  const settingsLoadRequestRef = useRef(0);
  const settingsLoadAbortRef = useRef<AbortController | null>(null);
  const appliedReloadKeyRef = useRef(reloadKey);
  const showSettingsSkeleton = useLoadingSkeleton(isLoadingSettings, 0);
  const isDirty = Boolean(settings) && (
    form.owner !== settings?.owner ||
    form.repo !== settings?.repo ||
    JSON.stringify(form.labels) !== JSON.stringify(settings?.labels)
  );
  const hasSavedSubmissionConfig = Boolean(
    settings?.owner.trim() && settings.repo.trim()
  );
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange]
  );

  useEffect(() => {
    const requestId = ++settingsLoadRequestRef.current;
    settingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    settingsLoadAbortRef.current = controller;

    async function loadSettings() {
      setIsLoadingSettings(true);

      try {
        const loaded = await loadGitHubSettings(token, {
          signal: controller.signal
        });

        if (settingsLoadRequestRef.current !== requestId) return;
        setSettings(loaded);
        setSettingsError(null);

        if (appliedReloadKeyRef.current !== reloadKey || !isDirtyRef.current) {
          setForm({
            enabled: loaded.enabled,
            owner: loaded.owner,
            repo: loaded.repo,
            labels: loaded.labels
          });
        }
        appliedReloadKeyRef.current = reloadKey;
      } catch (error) {
        if (
          settingsLoadRequestRef.current === requestId &&
          !controller.signal.aborted
        ) {
          setSettingsError(error);
        }
      } finally {
        if (settingsLoadRequestRef.current === requestId) {
          setIsLoadingSettings(false);
          if (settingsLoadAbortRef.current === controller) {
            settingsLoadAbortRef.current = null;
          }
        }
      }
    }

    void loadSettings();

    return () => {
      controller.abort();
      if (settingsLoadRequestRef.current === requestId) {
        settingsLoadRequestRef.current += 1;
      }
    };
  }, [reloadKey, settingsReloadKey, token]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setIsSaving(true);
    onStatus("");

    try {
      if (
        form.enabled &&
        (!form.owner.trim() || !form.repo.trim())
      ) {
        onStatus(
          getLocalizedErrorMessage(
            new Error(
              "owner and repo are required when GitHub submissions are enabled."
            ),
            t
          )
        );
        return;
      }

      const saved = await saveGitHubSettings(form, token);
      setSettings(saved);
      setForm({
        enabled: saved.enabled,
        owner: saved.owner,
        repo: saved.repo,
        labels: saved.labels
      });
      onStatus(t.githubSettings.saved);
    } catch (error) {
      onStatus(getLocalizedErrorMessage(error, t));
    } finally {
      writeInProgressRef.current = false;
      setIsSaving(false);
    }
  }

  async function toggleEnabled() {
    if (!settings || writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setIsSaving(true);
    onStatus(String());

    try {
      const saved = await saveGitHubSettings({
        enabled: !settings.enabled,
        owner: settings.owner,
        repo: settings.repo,
        labels: settings.labels
      }, token);
      setSettings(saved);
      setForm((current) => ({ ...current, enabled: saved.enabled }));
      onStatus(saved.enabled
        ? maintenanceText.githubSubmissionEnabledMessage
        : maintenanceText.githubSubmissionDisabledMessage);
    } catch (error) {
      onStatus(getLocalizedErrorMessage(error, t));
    } finally {
      writeInProgressRef.current = false;
      setIsSaving(false);
    }
  }

  if (settingsError) {
    return (
      <AdminSettingsLoadError
        isRetrying={isLoadingSettings}
        message={getLocalizedErrorMessage(settingsError, t)}
        onRetry={() => {
          if (isLoadingSettings || settingsLoadAbortRef.current) return;
          setIsLoadingSettings(true);
          setSettingsReloadKey((current) => current + 1);
        }}
        retryLabel={maintenanceText.systemRetry}
        title={maintenanceText.githubSubmissionTitle}
      />
    );
  }

  return (
    <form
      aria-describedby="github-settings-description"
      className="tool-form github-settings-form"
      onSubmit={handleSave}
      {...getAdminLoadingProps(isLoadingSettings, showSettingsSkeleton)}
    >
      <div className="settings-card-heading github-settings-heading">
        <div>
          <h3>{maintenanceText.githubSubmissionTitle}</h3>
        </div>
        <SettingsStatusBadge
          ariaDescribedBy="github-settings-description"
          disabled={isSaving || (!settings?.enabled && !hasSavedSubmissionConfig)}
          disabledLabel={hasSavedSubmissionConfig
            ? t.githubSettings.statusDisabled
            : maintenanceText.serviceUnavailable}
          enabled={settings?.enabled ?? false}
          enabledLabel={t.githubSettings.statusEnabled}
          onChange={() => void toggleEnabled()}
        />
        <p id="github-settings-description">{maintenanceText.githubSubmissionDescription}</p>
      </div>

      <div className="settings-grid">
        <label>
          {t.githubSettings.owner}
          <input
            value={form.owner}
            onChange={(event) =>
              setForm({ ...form, owner: event.target.value })
            }
            placeholder="owner"
          />
        </label>
        <label>
          {t.githubSettings.repo}
          <input
            value={form.repo}
            onChange={(event) => setForm({ ...form, repo: event.target.value })}
            placeholder="repo"
          />
        </label>
      </div>

      <label>
        {t.githubSettings.labels}
        <input
          value={form.labels.join(", ")}
          onChange={(event) =>
            setForm({
              ...form,
              labels: event.target.value
                .split(",")
                .map((label) => label.trim())
                .filter(Boolean)
            })
          }
          placeholder={t.githubSettings.labelsPlaceholder}
        />
      </label>

      <div className="source-public-actions github-settings-actions">
        <button className="ghost-button" disabled={isSaving || !isDirty}
          type="submit"
        >
          {t.actions.saveSettings}
        </button>
      </div>
      <AdminSkeletonLines loading={isLoadingSettings} visible={showSettingsSkeleton} />
    </form>
  );
}

