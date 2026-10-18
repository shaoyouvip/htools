import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadImageBedSettings, saveImageBedSettings } from "../../admin-api";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import { SettingsStatusBadge } from "./SettingsStatusBadge";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type {
  ImageBedSettings,
  ImageBedUploadChannel,
  ImageBedUploadNameType
} from "../../types";


const IMAGE_BED_UPLOAD_CHANNELS: ImageBedUploadChannel[] = [
  "telegram",
  "cfr2",
  "s3",
  "discord",
  "huggingface",
  "webdav"
];
const IMAGE_BED_UPLOAD_NAME_TYPES: ImageBedUploadNameType[] = [
  "default",
  "index",
  "origin",
  "short"
];

export function ImageBedSettingsCard({
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
  const emptyForm: Omit<ImageBedSettings, "available"> = {
    enabled: false,
    baseUrl: "",
    uploadChannel: "telegram",
    channelName: "",
    uploadNameType: "default",
    uploadFolder: ""
  };
  const [settings, setSettings] = useState<ImageBedSettings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const loadRequestRef = useRef(0);

  function applySettings(next: ImageBedSettings, syncForm = true) {
    setSettings(next);
    if (syncForm) {
      const { available: _available, ...nextForm } = next;
      setForm(nextForm);
    }
  }

  async function loadSettings(signal?: AbortSignal) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const loaded = await loadImageBedSettings(token, { signal });
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

  const hasSavedConfig = Boolean(settings?.baseUrl);
  const dirty = Boolean(settings && (
    form.baseUrl.trim() !== settings.baseUrl ||
    form.uploadChannel !== settings.uploadChannel ||
    form.channelName.trim() !== settings.channelName ||
    form.uploadNameType !== settings.uploadNameType ||
    form.uploadFolder.trim().replace(/^\/+|\/+$/g, "") !== settings.uploadFolder
  ));

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
    next: Omit<ImageBedSettings, "available">,
    message: string,
    syncForm = true
  ) {
    if (saving) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveImageBedSettings(next, token);
      applySettings(saved, syncForm);
      setStatus(message);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  function saveForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persist({ ...form, enabled: settings?.enabled ?? false }, maintenanceText.imageBedUpdated);
  }

  function toggleEnabled() {
    if (!settings) return;
    const enabled = !settings.enabled;
    const { available: _available, ...stored } = settings;
    void persist(
      { ...stored, enabled },
      enabled
        ? maintenanceText.imageBedEnabledMessage
        : maintenanceText.imageBedDisabledMessage,
      false
    );
  }

  function getChannelLabel(channel: ImageBedUploadChannel) {
    if (channel === "cfr2") return maintenanceText.imageBedChannelR2;
    if (channel === "s3") return maintenanceText.imageBedChannelS3;
    if (channel === "discord") return maintenanceText.imageBedChannelDiscord;
    if (channel === "huggingface") return maintenanceText.imageBedChannelHuggingFace;
    if (channel === "webdav") return maintenanceText.imageBedChannelWebDav;
    return maintenanceText.imageBedChannelTelegram;
  }

  function getUploadNameTypeLabel(type: ImageBedUploadNameType) {
    if (type === "index") return maintenanceText.imageBedNameTypeIndex;
    if (type === "origin") return maintenanceText.imageBedNameTypeOrigin;
    if (type === "short") return maintenanceText.imageBedNameTypeShort;
    return maintenanceText.imageBedNameTypeDefault;
  }

  return (
    <article className="source-public-card image-bed-settings-card" {...getAdminLoadingProps(loading && !loadError)}>
      {loadError ? (
        <AdminSettingsLoadError
          isRetrying={loading}
          message={getLocalizedErrorMessage(loadError, t)}
          onRetry={() => void loadSettings()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.imageBedTitle}
        />
      ) : (
        <>
          <div className="source-card-heading">
            <h3>{maintenanceText.imageBedTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="image-bed-settings-description image-bed-settings-configuration"
              disabled={saving || !settings?.available || (!settings.enabled && !hasSavedConfig)}
              disabledLabel={settings?.available && hasSavedConfig
                ? maintenanceText.imageBedDisabled
                : maintenanceText.serviceUnavailable}
              enabled={settings?.enabled ?? false}
              enabledLabel={maintenanceText.imageBedEnabled}
              onChange={toggleEnabled}
            />
            <p id="image-bed-settings-description">{maintenanceText.imageBedDescription}</p>
            <div className="turnstile-config-help" id="image-bed-settings-configuration">
              <span><code>IMGBED_TOKEN</code>{` = ${maintenanceText.imageBedTokenLabel}`}</span>
            </div>
          </div>
          <form
            aria-describedby="image-bed-settings-description image-bed-settings-configuration"
            className="proxy-settings-form"
            onSubmit={saveForm}
          >
            <label className="source-url-field">
              {maintenanceText.imageBedUrlLabel}
              <input
                disabled={saving}
                maxLength={2048}
                onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
                placeholder={maintenanceText.imageBedUrlPlaceholder}
                type="url"
                value={form.baseUrl}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.imageBedChannelLabel}
              <select
                disabled={saving}
                onChange={(event) => setForm({
                  ...form,
                  uploadChannel: event.target.value as ImageBedUploadChannel
                })}
                value={form.uploadChannel}
              >
                {IMAGE_BED_UPLOAD_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>{getChannelLabel(channel)}</option>
                ))}
              </select>
            </label>
            <label className="source-url-field">
              {maintenanceText.imageBedChannelNameLabel}
              <input
                disabled={saving}
                maxLength={80}
                onChange={(event) => setForm({ ...form, channelName: event.target.value })}
                placeholder={maintenanceText.imageBedChannelNamePlaceholder}
                value={form.channelName}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.imageBedNameTypeLabel}
              <select
                disabled={saving}
                onChange={(event) => setForm({
                  ...form,
                  uploadNameType: event.target.value as ImageBedUploadNameType
                })}
                value={form.uploadNameType}
              >
                {IMAGE_BED_UPLOAD_NAME_TYPES.map((type) => (
                  <option key={type} value={type}>{getUploadNameTypeLabel(type)}</option>
                ))}
              </select>
            </label>
            <label className="source-url-field">
              {maintenanceText.imageBedFolderLabel}
              <input
                disabled={saving}
                maxLength={200}
                onChange={(event) => setForm({ ...form, uploadFolder: event.target.value })}
                placeholder={maintenanceText.imageBedFolderPlaceholder}
                value={form.uploadFolder}
              />
            </label>
            <div className="source-public-actions">
              <button className="ghost-button" disabled={saving || !dirty} type="submit">
                {maintenanceText.imageBedSave}
              </button>
            </div>
          </form>
        </>
      )}
      <AdminSkeletonLines loading={loading && !loadError} />
    </article>
  );
}

