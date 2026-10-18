import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CategoryIcon as CategoryIconValue } from "../category-icon-settings";
import { CategoryIcon } from "./CategoryIcon";
import type { Messages } from "../i18n";
import { getCategoryLabel } from "../tool-helpers";

export function CategoryRail({
  activeCategory,
  categories,
  categoryIcons,
  isLoading,
  onSelect,
  showSkeletons,
  skeletonItems,
  t
}: {
  activeCategory: string;
  categories: string[];
  categoryIcons: Record<string, CategoryIconValue>;
  isLoading: boolean;
  onSelect: (category: string) => void;
  showSkeletons: boolean;
  skeletonItems: number;
  t: Messages;
}) {
  return (
    <aside className="category-rail">
      {isLoading ? (
        showSkeletons ? (
          <>
            {Array.from({ length: skeletonItems }).map((_, index) => (
              <div className="category-item category-item-skeleton" aria-hidden="true" key={index}>
                <span className="skeleton-shimmer skeleton-line is-long" />
              </div>
            ))}
          </>
        ) : null
      ) : (
        categories.map((category) => {
          return (
            <button
              aria-pressed={category === activeCategory}
              className={`category-item ${category === activeCategory ? "is-active" : ""}`}
              key={category}
              type="button"
              onClick={() => onSelect(category)}
            >
              <CategoryIcon category={category} icon={categoryIcons[category]} size={20} />
              <span>{getCategoryLabel(category, t)}</span>
            </button>
          );
        })
      )}
    </aside>
  );
}

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

function getPaginationItems(totalPages: number, currentPage: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const normalizedCurrent = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePages = new Set<number>([
    1,
    totalPages,
    normalizedCurrent - 1,
    normalizedCurrent,
    normalizedCurrent + 1
  ]);

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => visiblePages.add(page));
  } else if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (page) => visiblePages.add(page)
    );
  }

  const pages = Array.from(visiblePages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  return pages.reduce<PaginationItem[]>((items, page, index) => {
    const previousPage = pages[index - 1];
    if (previousPage && page - previousPage === 2) items.push(previousPage + 1);
    else if (previousPage && page - previousPage > 2) {
      items.push(page < normalizedCurrent ? "ellipsis-left" : "ellipsis-right");
    }
    items.push(page);
    return items;
  }, []);
}

export function DirectoryPagination({
  currentPage,
  hasNextPage,
  isLoading,
  onPageChange,
  t,
  totalPages
}: {
  currentPage: number;
  hasNextPage: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  t: Messages;
  totalPages: number | null;
}) {
  const items = totalPages === null ? [currentPage] : getPaginationItems(totalPages, currentPage);

  return (
    <nav className="category-pagination" aria-label={t.pagination.label}>
      <button
        aria-label={t.pagination.previous}
        className="pagination-arrow"
        disabled={currentPage <= 1 || isLoading}
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft aria-hidden="true" size={16} />
      </button>
      {items.map((page) =>
        typeof page === "number" ? (
          <button
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={t.pagination.page(page)}
            className={page === currentPage ? "is-active" : ""}
            disabled={isLoading}
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ) : (
          <button
            aria-label={t.pagination.more}
            className="pagination-ellipsis"
            disabled
            key={page}
            type="button"
          >
            ...
          </button>
        )
      )}
      <button
        aria-label={t.pagination.next}
        className="pagination-arrow"
        disabled={!hasNextPage || isLoading}
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </nav>
  );
}
