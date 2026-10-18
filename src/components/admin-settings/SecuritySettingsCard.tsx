import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadAdminSecuritySettings, updateAdminPassword } from "../../admin-api";
import { formatAdminDate } from "../../admin-helpers";
import { getLocalizedErrorMessage } from "../../site-helpers";
import { AdminSettingsLoadError } from "../AdminPanelStates";
import { useLoadingSkeleton } from "../../useLoadingSkeleton";
import {
  AdminSkeletonLines,
  getAdminLoadingProps
} from "../admin-skeletons";
import type { getAdminMaintenanceText } from "../../admin-text";
import type { Messages } from "../../i18n";
import type { AdminSecuritySettings } from "../../types";

type SecurityField = "current" | "new" | "confirm";

const EMPTY_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export function SecuritySettingsCard({
  maintenanceText,
  onDirtyChange,
  onLoadingChange,
  onTokenChange,
  reloadKey,
  setStatus,
  t,
  token
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  onLoadingChange: (loading: boolean) => void;
  onTokenChange: (token: string) => void;
  reloadKey: number;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
}) {
  const [settings, setSettings] = useState<AdminSecuritySettings | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const loadRequestRef = useRef(0);
  const [invalidField, setInvalidField] = useState<SecurityField | null>(null);
  const writeInProgressRef = useRef(false);
  const showSkeleton = useLoadingSkeleton(loading, 0);
  const isDirty = Object.values(form).some((value) => Boolean(value.trim()));

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
    onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  function describedBy(field: SecurityField) {
    return invalidField === field
      ? "security-settings-description global-operation-status"
      : "security-settings-description";
  }

  function getErrorMessage(error: unknown) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "";

    if (errorCode === "INVALID_PASSWORD") {
      return maintenanceText.securityCurrentIncorrect;
    }

    if (errorCode === "PASSWORD_UNCHANGED") {
      return maintenanceText.securityUnchanged;
    }

    const message = getLocalizedErrorMessage(error, t);

    if (message === "currentPassword is required.") {
      return maintenanceText.securityCurrentRequired;
    }

    if (message === "newPassword is required.") {
      return maintenanceText.securityNewRequired;
    }

    if (message === "Current password is incorrect.") {
      return maintenanceText.securityCurrentIncorrect;
    }

    if (message === "New password must be different from the current password.") {
      return maintenanceText.securityUnchanged;
    }

    return message;
  }

  async function loadSettings(signal?: AbortSignal) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const loaded = await loadAdminSecuritySettings(token, { signal });
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
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("");
    setInvalidField(null);

    const reject = (field: SecurityField, message: string) => {
      setInvalidField(field);
      setStatus(message);
      formElement
        .querySelector<HTMLInputElement>(`[data-security-field="${field}"]`)
        ?.focus();
    };

    if (!form.currentPassword.trim()) {
      reject("current", maintenanceText.securityCurrentRequired);
      return;
    }

    if (!form.newPassword.trim()) {
      reject("new", maintenanceText.securityNewRequired);
      return;
    }

    if (!form.confirmPassword.trim()) {
      reject("confirm", maintenanceText.securityConfirmRequired);
      return;
    }

    const currentPassword = form.currentPassword.trim();
    const newPassword = form.newPassword.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (newPassword !== confirmPassword) {
      reject("confirm", maintenanceText.securityMismatch);
      return;
    }

    if (newPassword === currentPassword) {
      reject("new", maintenanceText.securityUnchanged);
      return;
    }

    if (writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setSaving(true);

    try {
      const result = await updateAdminPassword(
        { currentPassword, newPassword },
        token
      );
      onTokenChange(result.token);
      setSettings(result.settings);
      setForm(EMPTY_FORM);
      setInvalidField(null);
      setStatus(maintenanceText.securityUpdated);
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "";
      const nextInvalidField: SecurityField | null =
        errorCode === "INVALID_PASSWORD"
          ? "current"
          : errorCode === "PASSWORD_UNCHANGED"
            ? "new"
            : null;
      setInvalidField(nextInvalidField);
      if (nextInvalidField) {
        formElement
          .querySelector<HTMLInputElement>(
            `[data-security-field="${nextInvalidField}"]`
          )
          ?.focus();
      }
      setStatus(getErrorMessage(error));
    } finally {
      writeInProgressRef.current = false;
      setSaving(false);
    }
  }

  return (
    <article className="source-public-card admin-security-card" {...getAdminLoadingProps(loading && !loadError, showSkeleton)}>
      {loadError ? (
        <AdminSettingsLoadError
          isRetrying={loading}
          message={getLocalizedErrorMessage(loadError, t)}
          onRetry={() => void loadSettings()}
          retryLabel={maintenanceText.systemRetry}
          title={maintenanceText.securityTitle}
        />
      ) : (
        <>
          <div>
            <h3>{maintenanceText.securityTitle}</h3>
            <p id="security-settings-description">{maintenanceText.securityDescription}</p>
            <p className="security-settings-updated-at">
              {!loading && settings?.updatedAt
                ? maintenanceText.securityUpdatedAt(formatAdminDate(settings.updatedAt))
                : null}
            </p>
          </div>
          <form aria-describedby="security-settings-description" className="admin-security-form" onSubmit={save}>
            <label>
              {maintenanceText.securityCurrent}
              <input
                aria-describedby={describedBy("current")}
                aria-invalid={invalidField === "current"}
                autoComplete="current-password"
                data-security-field="current"
                disabled={saving}
                type="password"
                value={form.currentPassword}
                onChange={(event) => {
                  setForm({ ...form, currentPassword: event.target.value });
                  if (invalidField === "current") setInvalidField(null);
                }}
              />
            </label>
            <label>
              {maintenanceText.securityNew}
              <input
                aria-describedby={describedBy("new")}
                aria-invalid={invalidField === "new"}
                autoComplete="new-password"
                data-security-field="new"
                disabled={saving}
                type="password"
                value={form.newPassword}
                onChange={(event) => {
                  setForm({ ...form, newPassword: event.target.value });
                  if (invalidField === "new") setInvalidField(null);
                }}
              />
            </label>
            <label>
              {maintenanceText.securityConfirm}
              <input
                aria-describedby={describedBy("confirm")}
                aria-invalid={invalidField === "confirm"}
                autoComplete="new-password"
                data-security-field="confirm"
                disabled={saving}
                type="password"
                value={form.confirmPassword}
                onChange={(event) => {
                  setForm({ ...form, confirmPassword: event.target.value });
                  if (invalidField === "confirm") setInvalidField(null);
                }}
              />
            </label>
            <button className="primary-button" disabled={saving || !isDirty}
              type="submit"
            >
              {maintenanceText.securitySave}
            </button>
          </form>
        </>
      )}
      <AdminSkeletonLines loading={loading && !loadError} visible={showSkeleton} />
    </article>
  );
}
