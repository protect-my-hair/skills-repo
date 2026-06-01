import { describe, expect, test } from "vitest";

import {
  GRID_PAGE_SIZE,
  TABLE_PAGE_SIZE,
  getVisiblePageNumbers,
  paginateItems,
} from "./pagination";

const items = Array.from({ length: 37 }, (_, index) => `skill-${index + 1}`);

describe("pagination helpers", () => {
  test("uses the confirmed dashboard page sizes", () => {
    expect(GRID_PAGE_SIZE).toBe(12);
    expect(TABLE_PAGE_SIZE).toBe(20);
  });

  test("slices the requested page and reports the visible range", () => {
    const result = paginateItems(items, {
      currentPage: 2,
      pageSize: GRID_PAGE_SIZE,
    });

    expect(result.items).toEqual([
      "skill-13",
      "skill-14",
      "skill-15",
      "skill-16",
      "skill-17",
      "skill-18",
      "skill-19",
      "skill-20",
      "skill-21",
      "skill-22",
      "skill-23",
      "skill-24",
    ]);
    expect(result).toMatchObject({
      currentPage: 2,
      totalPages: 4,
      totalItems: 37,
      startItem: 13,
      endItem: 24,
    });
  });

  test("clamps an out-of-range page to the last valid page", () => {
    const result = paginateItems(items, {
      currentPage: 8,
      pageSize: TABLE_PAGE_SIZE,
    });

    expect(result.items).toEqual(items.slice(20));
    expect(result).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      startItem: 21,
      endItem: 37,
    });
  });

  test("returns an empty state without a misleading page range", () => {
    const result = paginateItems([], {
      currentPage: 3,
      pageSize: GRID_PAGE_SIZE,
    });

    expect(result).toEqual({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      startItem: 0,
      endItem: 0,
    });
  });

  test("keeps page-number controls focused around the current page", () => {
    expect(getVisiblePageNumbers({ currentPage: 1, totalPages: 10 })).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(getVisiblePageNumbers({ currentPage: 5, totalPages: 10 })).toEqual([
      3, 4, 5, 6, 7,
    ]);
    expect(getVisiblePageNumbers({ currentPage: 10, totalPages: 10 })).toEqual([
      6, 7, 8, 9, 10,
    ]);
  });
});
