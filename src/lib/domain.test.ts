import { describe, expect, test } from "vitest";

import {
  filterSkills,
  getSkillSummary,
  getVersionState,
  type Skill,
  type TrackedVersion,
} from "./domain";

const skills: Skill[] = [
  {
    id: "rag-helper",
    name: "RAG Helper",
    description: "Retrieval prompt templates for support agents",
    category: "Knowledge",
    tags: ["rag", "support"],
    compatibleTools: ["Codex", "Claude"],
    status: "published",
    visibility: "public",
    ownerId: "admin-1",
    ownerName: "Mira Admin",
    maintainingTeam: "AI Platform",
    source: "Curated Git",
    updatedAt: "2026-05-28T10:00:00.000Z",
    maintainers: ["Ada Chen"],
    installMethod: "Install from internal registry",
    dependencies: ["vector-index"],
    readme: "Use this skill when answering support questions.",
    references: [],
    scripts: [],
    currentVersionId: "rag-v2",
    versions: [
      {
        id: "rag-v1",
        version: "1.0.0",
        content: "Old content",
        changelog: "Initial release",
        createdAt: "2026-05-01T10:00:00.000Z",
        author: "Ada Chen",
        publishedAt: "2026-05-01T10:00:00.000Z",
        publisher: "Ada Chen",
        references: [],
        scripts: [],
      },
      {
        id: "rag-v2",
        version: "1.2.0",
        content: "New content",
        changelog: "Improved retrieval checklist",
        createdAt: "2026-05-28T10:00:00.000Z",
        author: "Ada Chen",
        publishedAt: "2026-05-28T10:00:00.000Z",
        publisher: "Ada Chen",
        references: [],
        scripts: [],
      },
    ],
  },
  {
    id: "finance-review",
    name: "Finance Review",
    description: "Review operating expense anomalies",
    category: "Finance",
    tags: ["review"],
    compatibleTools: ["Claude"],
    status: "pending_review",
    visibility: "public",
    ownerId: "admin-1",
    ownerName: "Mira Admin",
    maintainingTeam: "Finance Ops",
    source: "Manual",
    updatedAt: "2026-05-29T09:00:00.000Z",
    maintainers: ["Lin Zhao"],
    installMethod: "Pending publication",
    dependencies: [],
    readme: "Draft finance workflow.",
    references: [],
    scripts: [],
    currentVersionId: null,
    versions: [
      {
        id: "finance-v1",
        version: "0.1.0",
        content: "Draft",
        changelog: "Draft created",
        createdAt: "2026-05-29T09:00:00.000Z",
        author: "Lin Zhao",
        references: [],
        scripts: [],
      },
    ],
  },
];

const trackedVersions: TrackedVersion[] = [
  {
    userId: "employee-1",
    skillId: "rag-helper",
    versionId: "rag-v1",
  },
];

describe("skill domain", () => {
  test("filters Skills by search, category, status, team or source, tool, and version state", () => {
    const result = filterSkills(skills, {
      query: "retrieval",
      category: "Knowledge",
      status: "published",
      teamOrSource: "AI Platform",
      tool: "Codex",
      versionState: "upgrade_available",
      userId: "employee-1",
      trackedVersions,
    });

    expect(result.map((skill) => skill.id)).toEqual(["rag-helper"]);
  });

  test("detects upgrade prompts when a tracked version is behind the current release", () => {
    const state = getVersionState(skills[0], trackedVersions, "employee-1");

    expect(state).toEqual({
      state: "upgrade_available",
      trackedVersion: "1.0.0",
      currentVersion: "1.2.0",
    });
  });

  test("summarizes dashboard totals for statistics cards", () => {
    const summary = getSkillSummary(skills);

    expect(summary).toMatchObject({
      total: 2,
      published: 1,
      pendingReview: 1,
      categories: 2,
      recentlyUpdated: 2,
    });
  });
});
