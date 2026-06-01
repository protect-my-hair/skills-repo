export const GRID_PAGE_SIZE = 12;
export const TABLE_PAGE_SIZE = 20;
const DEFAULT_VISIBLE_PAGE_COUNT = 5;

export interface PaginationInput {
  currentPage: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
}

export interface VisiblePageInput {
  currentPage: number;
  totalPages: number;
  maxVisiblePages?: number;
}

export function paginateItems<T>(
  items: T[],
  { currentPage, pageSize }: PaginationInput,
): PaginationResult<T> {
  const normalizedPageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const normalizedCurrentPage = clamp(currentPage, 1, totalPages);

  if (totalItems === 0) {
    return {
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems,
      startItem: 0,
      endItem: 0,
    };
  }

  const startIndex = (normalizedCurrentPage - 1) * normalizedPageSize;
  const endIndex = Math.min(startIndex + normalizedPageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    currentPage: normalizedCurrentPage,
    totalPages,
    totalItems,
    startItem: startIndex + 1,
    endItem: endIndex,
  };
}

export function getVisiblePageNumbers({
  currentPage,
  totalPages,
  maxVisiblePages = DEFAULT_VISIBLE_PAGE_COUNT,
}: VisiblePageInput): number[] {
  const visibleCount = Math.max(1, maxVisiblePages);
  const normalizedTotalPages = Math.max(1, totalPages);
  const normalizedCurrentPage = clamp(currentPage, 1, normalizedTotalPages);
  const pageCount = Math.min(visibleCount, normalizedTotalPages);
  const halfWindow = Math.floor(pageCount / 2);
  const maxStartPage = normalizedTotalPages - pageCount + 1;
  const startPage = clamp(normalizedCurrentPage - halfWindow, 1, maxStartPage);

  return Array.from({ length: pageCount }, (_, index) => startPage + index);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
