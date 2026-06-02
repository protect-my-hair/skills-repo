import { afterEach, describe, expect, test, vi } from "vitest";

const prismaClientRef = vi.hoisted(() => ({
  current: undefined as unknown,
}));

vi.mock("./prisma", () => ({
  getPrismaClient: () => prismaClientRef.current,
}));

import { updateSkillsSnapshot } from "./skill-repository";

describe("skill repository", () => {
  afterEach(() => {
    prismaClientRef.current = undefined;
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  test("persists legacy snapshots with missing optional asset fields as empty lists", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/skills-repo-test");
    const createdSkills: Array<Record<string, unknown>> = [];
    const createdVersions: Array<Record<string, unknown>> = [];
    const transaction = createPrismaTransactionMock(
      createdSkills,
      createdVersions,
    );

    prismaClientRef.current = {
      $transaction: vi.fn(async (callback) => callback(transaction)),
      skill: {
        findMany: vi.fn().mockResolvedValue([createPrismaSkillRow()]),
      },
      trackedVersion: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      auditLog: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gitImportSource: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gitImportJob: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    await expect(
      updateSkillsSnapshot((current) => ({
        ...current,
        skills: current.skills.map((skill) => ({
          ...skill,
          references: undefined,
          scripts: undefined,
          versions: skill.versions.map((version) => ({
            ...version,
            references: undefined,
            scripts: undefined,
          })),
        })) as unknown as typeof current.skills,
      })),
    ).resolves.toMatchObject({
      skills: [{ id: "legacy-skill" }],
    });

    expect(createdSkills[0]?.referenceFiles).toEqual([]);
    expect(createdSkills[0]?.scriptFiles).toEqual([]);
    expect(createdVersions[0]?.referenceFiles).toEqual([]);
    expect(createdVersions[0]?.scriptFiles).toEqual([]);
  });

  test("preserves internal admin details when snapshot authors include Mira Admin", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/skills-repo-test");
    const createdSkills: Array<Record<string, unknown>> = [];
    const createdVersions: Array<Record<string, unknown>> = [];
    const userUpserts: Array<Record<string, unknown>> = [];
    const transaction = createPrismaTransactionMock(
      createdSkills,
      createdVersions,
      userUpserts,
    );

    prismaClientRef.current = {
      $transaction: vi.fn(async (callback) => callback(transaction)),
      skill: {
        findMany: vi.fn().mockResolvedValue([createPrismaSkillRow()]),
      },
      trackedVersion: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      auditLog: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gitImportSource: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gitImportJob: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    await updateSkillsSnapshot((current) => current);

    const adminUpsert = userUpserts.find(
      (upsert) =>
        (upsert.where as Record<string, unknown> | undefined)?.id === "admin-1",
    );

    expect(adminUpsert).toMatchObject({
      create: {
        id: "admin-1",
        name: "Mira Admin",
        email: "admin@skills.local",
        role: "ADMIN",
      },
      update: {
        name: "Mira Admin",
        email: "admin@skills.local",
        role: "ADMIN",
      },
    });
  });
});

function createPrismaTransactionMock(
  createdSkills: Array<Record<string, unknown>>,
  createdVersions: Array<Record<string, unknown>>,
  userUpserts: Array<Record<string, unknown>> = [],
) {
  return {
    trackedVersion: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    auditLog: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    gitImportJob: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    gitImportSource: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
    },
    skill: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockImplementation(({ data }) => {
        createdSkills.push(data);
        return Promise.resolve(data);
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    skillVersion: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockImplementation(({ data }) => {
        createdVersions.push(data);
        return Promise.resolve(data);
      }),
    },
    user: {
      upsert: vi.fn().mockImplementation((payload) => {
        userUpserts.push(payload);
        return Promise.resolve({});
      }),
    },
  };
}

function createPrismaSkillRow() {
  const now = new Date("2026-06-02T08:00:00.000Z");

  return {
    id: "legacy-skill",
    name: "Legacy Skill",
    description: "A skill with historical data shape",
    category: "Tools",
    tags: ["legacy"],
    compatibleTools: ["Codex"],
    status: "DRAFT",
    visibility: "PUBLIC",
    ownerId: "admin-1",
    ownerName: "Mira Admin",
    maintainingTeam: "Platform",
    source: "Manual",
    repositoryUrl: null,
    repositoryName: null,
    updatedAt: now,
    maintainers: ["Mira Admin"],
    installMethod: "Download package",
    dependencies: [],
    readme: "## Usage\nRun the checklist.",
    referenceFiles: [],
    scriptFiles: [],
    currentVersionId: null,
    versions: [
      {
        id: "legacy-v1",
        version: "0.1.0",
        content: "## Usage\nRun the checklist.",
        changelog: "Initial draft",
        referenceFiles: [],
        scriptFiles: [],
        createdAt: now,
        authorId: "admin-1",
        publishedAt: null,
        publisherId: null,
        author: { name: "Mira Admin" },
        publisher: null,
      },
    ],
    reviewSubmittedAt: null,
    reviewReviewerName: null,
    reviewReviewedAt: null,
    reviewRejectionReason: null,
  };
}
