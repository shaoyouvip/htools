import { useCallback, useId, useState } from "react";
import {
  CATEGORY_ICON_NAMES,
  MAX_CATEGORY_SVG_LENGTH,
  normalizeCategoryIcon,
  type CategoryIcon as CategoryIconValue,
  type CategoryIconName
} from "../category-icon-settings";
import { translations, type Messages } from "../i18n";
import { getCategoryLabel } from "../tool-helpers";
import { AdminDialogActions, Dialog } from "./AdminDialog";
import { CategoryIcon, type CategoryIconImageStatus } from "./CategoryIcon";

type IconMode = "default" | "lucide" | "image";

export function AdminCategoryIconDialog({
  category,
  error,
  icon,
  onClose,
  onSave,
  saving,
  t
}: {
  category: string;
  error?: string;
  icon?: CategoryIconValue;
  onClose: () => void;
  onSave: (icon: CategoryIconValue | null) => void;
  saving: boolean;
  t: Messages;
}) {
  const text = t.categoryIcons;
  const formId = useId();
  const initialIcon = normalizeCategoryIcon(icon);
  const [mode, setMode] = useState<IconMode>(
    initialIcon?.type === "svg" ? "image" : initialIcon?.type ?? "default"
  );
  const [selectedName, setSelectedName] = useState<CategoryIconName>(
    initialIcon?.type === "lucide" ? initialIcon.value : "tags"
  );
  const [customValue, setCustomValue] = useState(
    initialIcon && initialIcon.type !== "lucide" ? initialIcon.value : ""
  );
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState(false);
  const [imageState, setImageState] = useState<{ source: string; status: CategoryIconImageStatus }>();
  const categoryLabel = getCategoryLabel(category, t);
  const trimmedCustomValue = customValue.trim();
  const isSvgInput = trimmedCustomValue.startsWith("<") ||
    trimmedCustomValue.startsWith("\\<") || trimmedCustomValue.startsWith("```");
  const imageIcon = normalizeCategoryIcon({ type: isSvgInput ? "svg" : "image", value: customValue });
  const previewIcon = mode === "lucide"
    ? { type: "lucide" as const, value: selectedName }
    : mode === "image" ? imageIcon ?? undefined : undefined;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredNames = CATEGORY_ICON_NAMES.filter((name) =>
    `${name} ${translations.zh.categoryIcons.iconNames[name]} ${translations.en.categoryIcons.iconNames[name]}`
      .toLowerCase().includes(normalizedQuery)
  );
  const handleImageStatus = useCallback((status: CategoryIconImageStatus, source: string) => {
    setImageState({ status, source });
  }, []);
  const imageStatus = mode === "image" && imageIcon
    ? imageState?.source === imageIcon.value ? imageState.status : "loading"
    : undefined;

  function changeMode(nextMode: IconMode) {
    setMode(nextMode);
    setValidationError(false);
  }

  return (
    <Dialog
      closeDisabled={saving}
      closeLabel={t.actions.close}
      description={text.description}
      onClose={onClose}
      panelClassName="tool-editor-dialog admin-category-icon-dialog"
      title={text.title(categoryLabel)}
      footer={
        <AdminDialogActions
          disabled={saving}
          formId={formId}
          leading={
            <button
              className="ghost-button admin-category-icon-restore"
              disabled={saving || mode === "default"}
              onClick={() => changeMode("default")}
              type="button"
            >
              {text.restoreDefault}
            </button>
          }
          primaryLabel={text.save}
        />
      }
    >
      <form
        aria-busy={saving}
        className="tool-form admin-category-icon-form"
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          if (mode === "image" && trimmedCustomValue && !imageIcon) {
            setValidationError(true);
            return;
          }
          onSave(previewIcon ?? null);
        }}
      >
        <div className="admin-segmented-toggle admin-category-icon-mode" aria-label={text.modeLabel} role="group">
          {(["default", "lucide", "image"] as const).map((item) => (
            <button
              aria-pressed={mode === item}
              className={mode === item ? "is-active" : ""}
              data-icon-mode={item}
              disabled={saving}
              key={item}
              onClick={() => changeMode(item)}
              type="button"
            >
              {text[`${item}Mode`]}
            </button>
          ))}
        </div>

        <div className="admin-category-icon-stage">
          {mode === "default" ? (
            <div className="admin-category-icon-default">
              <CategoryIcon category={category} size={32} />
              <p>{text.defaultHint}</p>
            </div>
          ) : mode === "lucide" ? (
            <>
              <input
                aria-label={text.searchPlaceholder}
                className="admin-category-icon-search"
                disabled={saving}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={text.searchPlaceholder}
                type="search"
                value={query}
              />
              <div className="admin-category-icon-grid" aria-label={text.lucideMode} role="group">
                {filteredNames.length ? filteredNames.map((name) => (
                  <button
                    aria-label={text.iconNames[name]}
                    aria-pressed={selectedName === name}
                    className="menu-option admin-category-icon-choice"
                    data-icon-name={name}
                    disabled={saving}
                    key={name}
                    onClick={() => setSelectedName(name)}
                    title={text.iconNames[name]}
                    type="button"
                  >
                    <CategoryIcon category={category} icon={{ type: "lucide", value: name }} />
                  </button>
                )) : <p className="admin-category-icon-empty" role="status">{text.noResults}</p>}
              </div>
            </>
          ) : (
            <label className="tool-form-field">
              <span className="tool-form-label">{text.imageUrlLabel}</span>
              <textarea
                aria-describedby={`${formId}-image-hint`}
                aria-invalid={validationError}
                autoCapitalize="none"
                autoComplete="off"
                className="admin-category-icon-url"
                disabled={saving}
                maxLength={MAX_CATEGORY_SVG_LENGTH}
                onChange={(event) => {
                  setCustomValue(event.target.value);
                  setValidationError(false);
                }}
                placeholder={text.imageUrlPlaceholder}
                rows={5}
                spellCheck={false}
                value={customValue}
              />
              <small className="admin-category-icon-hint" id={`${formId}-image-hint`}>{text.imageHint}</small>
              {validationError ? <small className="submit-field-error" role="alert">{text.invalidImageUrl}</small> : null}
            </label>
          )}
        </div>

        <div className="admin-category-icon-preview">
          <span>{text.preview}</span>
          <div>
            <CategoryIcon category={category} icon={previewIcon} onImageStatusChange={handleImageStatus} />
            <strong title={categoryLabel}>{categoryLabel}</strong>
          </div>
        </div>
        <p className="admin-category-icon-status" aria-live="polite">
          {imageStatus === "error" ? text.imageLoadFailed : imageStatus === "loading" ? text.imageLoading : ""}
        </p>
        {error ? <p className="submit-field-error" role="alert">{error}</p> : null}
      </form>
    </Dialog>
  );
}
