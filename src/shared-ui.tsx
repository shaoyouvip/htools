import { ArrowUpRight } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { SiteSettings } from "./types";
import {
  DEFAULT_SITE_ICON_URL,
  addSiteIconRetryParam,
  getSiteDisplayName,
  getSiteSubtitle,
  isSiteIconDataUrl
} from "./site-helpers";
import { SITE_LOGO_FALLBACK_DATA_URL } from "./site-logo-fallback";
import { getEffectiveTags } from "../shared/effective-tags";

export const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined);

export function useSiteSettings() {
  const settings = useContext(SiteSettingsContext);

  if (!settings) {
    throw new Error("SiteSettingsContext is not available.");
  }

  return settings;
}

export function PublicGlowAction({
  children,
  className = "",
  disabled = false,
  href,
  onClick,
  showArrow = true,
  type = "button"
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  showArrow?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}) {
  const content = (
    <>
      <span>{children}</span>
      {showArrow ? <ArrowUpRight aria-hidden="true" size={17} /> : null}
    </>
  );
  const actionClassName = `primary-button public-glow-action ${className}`.trim();

  if (href) {
    return (
      <a
        aria-disabled={disabled || undefined}
        className={actionClassName}
        href={disabled ? undefined : href}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={actionClassName}
      disabled={disabled}
      type={type}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
    >
      {content}
    </button>
  );
}

export function SiteBrandMark({
  className = "",
  iconUrl: previewIconUrl
}: {
  className?: string;
  iconUrl?: string;
}) {
  const settings = useSiteSettings();
  const iconUrl = (previewIconUrl ?? settings.iconUrl).trim();

  // 按图片源重建状态，避免快速触发的加载失败被后续 effect 重置。
  return (
    <SiteBrandImage
      key={iconUrl}
      className={className}
      iconUrl={iconUrl}
    />
  );
}

function SiteBrandImage({
  className,
  iconUrl
}: {
  className: string;
  iconUrl: string;
}) {
  const [useEmbeddedIcon, setUseEmbeddedIcon] = useState(false);
  const [useDefaultIcon, setUseDefaultIcon] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const displayIconUrl = useDefaultIcon ? DEFAULT_SITE_ICON_URL : iconUrl || DEFAULT_SITE_ICON_URL;
  const iconSrc = useMemo(
    () => useEmbeddedIcon ? SITE_LOGO_FALLBACK_DATA_URL : addSiteIconRetryParam(displayIconUrl, retryToken),
    [displayIconUrl, retryToken, useEmbeddedIcon]
  );

  function handleImageError() {
    if (displayIconUrl === DEFAULT_SITE_ICON_URL) {
      setUseEmbeddedIcon(true);
      return;
    }

    if (!retryToken && !isSiteIconDataUrl(iconUrl)) {
      const nextRetryToken = Date.now();
      if (addSiteIconRetryParam(iconUrl, nextRetryToken) !== iconUrl) {
        setRetryToken(nextRetryToken);
        return;
      }
    }

    setUseDefaultIcon(true);
    setRetryToken(0);
  }

  return (
    <span className={`brand-mark ${className} has-site-icon`.trim()}>
      <img
        key={iconSrc}
        className="site-brand-icon"
        src={iconSrc}
        alt=""
        onError={useEmbeddedIcon ? undefined : handleImageError}
      />
    </span>
  );
}

export function SiteBrandIdentity({
  markClassName = "",
  showSubtitle = false
}: {
  markClassName?: string;
  showSubtitle?: boolean;
}) {
  const settings = useSiteSettings();
  const siteName = getSiteDisplayName(settings);

  return (
    <>
      <SiteBrandMark className={markClassName} />
      {showSubtitle ? (
        <span>
          <strong>{siteName}</strong>
          <small>{getSiteSubtitle(settings)}</small>
        </span>
      ) : (
        <span>{siteName}</span>
      )}
    </>
  );
}

export function SkeletonVisibility({
  children,
  visible
}: {
  children: ReactNode;
  visible: boolean;
}) {
  if (!visible) return null;
  return <>{children}</>;
}

export function CompactTagRow({
  fallbackCategory = "",
  tags,
  visibleCount: maxVisibleCount
}: {
  fallbackCategory?: string;
  tags: string[];
  visibleCount?: number;
}) {
  const displayTags = useMemo(
    () => getEffectiveTags(tags, fallbackCategory),
    [fallbackCategory, tags]
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitCount, setFitCount] = useState(displayTags.length);
  const visibleLimit = maxVisibleCount ?? fitCount;
  const visibleTags = displayTags.slice(0, Math.min(visibleLimit, displayTags.length));
  const hiddenCount = Math.max(displayTags.length - visibleTags.length, 0);

  useEffect(() => {
    if (maxVisibleCount !== undefined) {
      return;
    }

    const row = rowRef.current;
    const measure = measureRef.current;

    if (!row || !measure) {
      return;
    }

    const rowElement = row;
    const measureElement = measure;

    function updateFitCount() {
      const availableWidth = Math.floor(rowElement.clientWidth);

      if (availableWidth <= 0) {
        return;
      }

      const gap = Number.parseFloat(getComputedStyle(measureElement).columnGap || "0") || 0;
      const tagWidths = Array.from(
        measureElement.querySelectorAll<HTMLElement>("[data-tag-measure]")
      ).map((element) => Math.ceil(element.getBoundingClientRect().width));
      const moreWidths = new Map(
        Array.from(measureElement.querySelectorAll<HTMLElement>("[data-more-count]")).map(
          (element) => [
            Number(element.dataset.moreCount),
            Math.ceil(element.getBoundingClientRect().width)
          ]
        )
      );

      let nextFitCount = 0;

      for (let count = displayTags.length; count >= 0; count -= 1) {
        const hidden = displayTags.length - count;
        const tagsWidth = tagWidths
          .slice(0, count)
          .reduce((total, width, index) => total + width + (index > 0 ? gap : 0), 0);
        const moreWidth = hidden > 0 ? moreWidths.get(hidden) ?? 0 : 0;
        const totalWidth = tagsWidth + moreWidth + (count > 0 && hidden > 0 ? gap : 0);

        if (totalWidth <= availableWidth + 1) {
          nextFitCount = count;
          break;
        }
      }

      setFitCount((current) => (current === nextFitCount ? current : nextFitCount));
    }

    updateFitCount();

    const resizeObserver = new ResizeObserver(updateFitCount);
    resizeObserver.observe(rowElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [displayTags, maxVisibleCount]);

  return (
    <div className="tag-row-shell">
      <div className="tag-row" ref={rowRef}>
        {visibleTags.map((tag, index) => {
          const displayTag = tag.trim().replace(/^#+/, "");

          return (
            <span className="tag" key={`${displayTag}-${index}`}>
              {displayTag}
            </span>
          );
        })}
        {hiddenCount > 0 ? <span className="tag tag-more">+{hiddenCount}</span> : null}
      </div>
      {maxVisibleCount === undefined ? (
        <div className="tag-row tag-row-measure" ref={measureRef} aria-hidden="true">
          {displayTags.map((tag, index) => {
            const displayTag = tag.trim().replace(/^#+/, "");

            return (
              <span className="tag" data-tag-measure="" key={`${displayTag}-${index}`}>
                {displayTag}
              </span>
            );
          })}
          {displayTags.map((_, index) => {
            const count = displayTags.length - index;

            return (
              <span
                className="tag tag-more"
                data-more-count={count}
                key={`more-${count}`}
              >
                +{count}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
