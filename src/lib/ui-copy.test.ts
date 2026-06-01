import { describe, expect, test } from "vitest";

import { PRODUCT_NAME, ROLE_LABELS, STATUS_LABELS, UI_COPY } from "./ui-copy";

describe("UI copy", () => {
  test("uses Skills Repo as the product name", () => {
    expect(PRODUCT_NAME).toBe("Skills Repo");
  });

  test("uses Chinese labels for core console chrome", () => {
    expect(UI_COPY.loading).toBe("正在加载 Skills Repo...");
    expect(UI_COPY.stats.totalSkills).toBe("Skills 总数");
    expect(UI_COPY.filters.allStatuses).toBe("全部状态");
    expect(UI_COPY.pagination.range).toBe("{start}-{end} / {total}");
    expect(UI_COPY.pagination.first).toBe("首页");
    expect(UI_COPY.pagination.previous).toBe("上一页");
    expect(UI_COPY.pagination.next).toBe("下一页");
    expect(UI_COPY.pagination.last).toBe("末页");
    expect(UI_COPY.actions.logout).toBe("登出");
    expect(UI_COPY.header.description).toContain("Curated internal agent skills");
    expect(UI_COPY.header.tags.collectedSkills).toBe("Collected SKILL.md files");
  });

  test("uses Chinese labels for statuses and demo roles", () => {
    expect(STATUS_LABELS.pending_review).toBe("待审核");
    expect(STATUS_LABELS.published).toBe("已上架");
    expect(ROLE_LABELS.employee).toBe("员工");
    expect(ROLE_LABELS.admin).toBe("管理员");
  });
});
