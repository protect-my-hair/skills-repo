import { getPrismaClient } from "../src/lib/prisma";
import { getCurrentVersion, type Skill } from "../src/lib/domain";
import { conflictError, toErrorPayload } from "../src/lib/api-errors";
import { INTERNAL_AUTH_USERS, toActor } from "../src/lib/internal-users";
import type { SkillStoreSnapshot } from "../src/lib/seed-data";
import {
  hasDatabaseConfigured,
  readSkillsSnapshot,
  updateSkillsSnapshot,
} from "../src/lib/skill-repository";
import {
  applyBulkAction,
  createSkillDraft,
  importSkillFromGit,
  trackSkillVersion,
  transitionSkill,
  updateSkillContent,
} from "../src/lib/skill-service";

type PrismaClientInstance = ReturnType<typeof getPrismaClient>;

const prisma = getPrismaClient();

main().catch(async (error: unknown) => {
  console.error(`Database smoke failed: ${safeErrorMessage(error)}`);
  await prisma.$disconnect();
  process.exitCode = 1;
});

async function main(): Promise<void> {
  if (!hasDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for database smoke");
  }

  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error("AUTH_SECRET is required for deployment smoke");
  }

  const adminUser = INTERNAL_AUTH_USERS.find((user) => user.role === "admin");
  const employeeUser = INTERNAL_AUTH_USERS.find((user) => user.role === "employee");

  assert(adminUser, "Seeded admin user is required");
  assert(employeeUser, "Seeded employee user is required");

  const admin = toActor(adminUser);
  const employee = toActor(employeeUser);
  let originalSnapshot: SkillStoreSnapshot | null = null;

  try {
    originalSnapshot = await readSkillsSnapshot();
    assertSeededSnapshot(originalSnapshot);

    await verifyUniqueConstraints(prisma, originalSnapshot);
    await verifyErrorShapes();
    await verifyWorkflowRoundTrip(originalSnapshot, admin, employee);

    const counts = await collectCounts(prisma);
    console.log(
      [
        "Database smoke passed",
        `users=${counts.users}`,
        `skills=${counts.skills}`,
        `skillVersions=${counts.skillVersions}`,
        `trackedVersions=${counts.trackedVersions}`,
        `auditLogs=${counts.auditLogs}`,
        `gitImportSources=${counts.gitImportSources}`,
        `gitImportJobs=${counts.gitImportJobs}`,
      ].join(" "),
    );
  } finally {
    if (originalSnapshot) {
      const snapshotToRestore = originalSnapshot;
      await updateSkillsSnapshot(() => snapshotToRestore);
    }

    await prisma.$disconnect();
  }
}

async function verifyUniqueConstraints(
  client: PrismaClientInstance,
  snapshot: SkillStoreSnapshot,
): Promise<void> {
  const trackedVersion = snapshot.trackedVersions[0];
  const skillWithVersion = snapshot.skills.find((skill) => skill.versions.length > 0);
  const existingVersion = skillWithVersion?.versions[0];

  assert(trackedVersion, "Seeded tracked version is required");
  assert(skillWithVersion, "Seeded Skill with version is required");
  assert(existingVersion, "Seeded SkillVersion is required");

  await expectUniqueConstraint("TrackedVersion user+skill", () =>
    client.trackedVersion.create({
      data: {
        userId: trackedVersion.userId,
        skillId: trackedVersion.skillId,
        versionId: trackedVersion.versionId,
      },
    }),
  );

  await expectUniqueConstraint("SkillVersion skill+version", () =>
    client.skillVersion.create({
      data: {
        id: `smoke-duplicate-version-${Date.now()}`,
        skillId: skillWithVersion.id,
        version: existingVersion.version,
        content: "Duplicate smoke content",
        changelog: "Duplicate smoke changelog",
        authorId: "admin-1",
      },
    }),
  );

  const sourceId = `smoke-source-${Date.now()}`;
  const repositoryUrl = "https://git.company.local/skills/smoke-unique-source";

  try {
    await client.gitImportSource.create({
      data: {
        id: sourceId,
        repositoryUrl,
        repositoryName: "smoke-unique-source",
        trustedHost: "git.company.local",
      },
    });

    await expectUniqueConstraint("GitImportSource repositoryUrl", () =>
      client.gitImportSource.create({
        data: {
          id: `${sourceId}-duplicate`,
          repositoryUrl,
          repositoryName: "smoke-unique-source-copy",
          trustedHost: "git.company.local",
        },
      }),
    );
  } finally {
    await client.gitImportSource.deleteMany({ where: { repositoryUrl } });
  }
}

async function verifyWorkflowRoundTrip(
  originalSnapshot: SkillStoreSnapshot,
  admin: ReturnType<typeof toActor>,
  employee: ReturnType<typeof toActor>,
): Promise<void> {
  const suffix = Date.now();
  const now = new Date().toISOString();
  let snapshot = originalSnapshot;

  const manualResult = createSkillDraft(
    {
      name: `Database Smoke Manual ${suffix}`,
      description: "Temporary manual Skill for database smoke verification",
      category: "Smoke",
      tags: ["smoke"],
      compatibleTools: ["Codex"],
      maintainingTeam: "Smoke Team",
      maintainers: [admin.name],
      installMethod: "Smoke verification only",
      dependencies: [],
      readme: "## Smoke\nTemporary verification content.",
      version: `0.0.${suffix}`,
      changelog: "Created by database smoke verification.",
    },
    admin,
    now,
  );

  snapshot = {
    ...snapshot,
    skills: [manualResult.skill, ...snapshot.skills],
    auditLogs: [manualResult.auditLog, ...snapshot.auditLogs],
  };

  const importResult = importSkillFromGit(
    {
      repositoryUrl: `https://git.company.local/skills/database-smoke-${suffix}`,
      repositoryName: `database-smoke-${suffix}`,
      name: `Database Smoke Import ${suffix}`,
      description: "Temporary imported Skill for database smoke verification",
      category: "Smoke",
      compatibleTools: ["Codex"],
      maintainingTeam: "Smoke Team",
      readme: "## Smoke Import\nTemporary controlled Git verification content.",
      version: `0.1.${suffix}`,
      changelog: "Imported by database smoke verification.",
    },
    admin,
    now,
  );

  snapshot = {
    ...snapshot,
    skills: [importResult.skill, ...snapshot.skills],
    auditLogs: [importResult.auditLog, ...snapshot.auditLogs],
    gitImportSources: [importResult.importSource, ...snapshot.gitImportSources],
    gitImportJobs: [importResult.importJob, ...snapshot.gitImportJobs],
  };

  const publishedSkill = snapshot.skills.find(
    (skill) => skill.status === "published" && skill.currentVersionId,
  );
  assert(publishedSkill, "Published seeded Skill is required");

  const editResult = updateSkillContent(
    publishedSkill,
    {
      readme: `${publishedSkill.readme}\n\nSmoke update ${suffix}.`,
      version: `9.9.${suffix}`,
      changelog: "Updated by database smoke verification.",
    },
    admin,
    now,
  );

  snapshot = replaceSkill(snapshot, editResult.skill, editResult.auditLog);

  const versionToPublish = editResult.skill.versions.at(-1)?.id;
  assert(versionToPublish, "Edited version is required");

  const transitionResult = transitionSkill(editResult.skill, "published", admin, {
    versionId: versionToPublish,
    now,
  });

  snapshot = replaceSkill(snapshot, transitionResult.skill, transitionResult.auditLog);

  const bulkResult = applyBulkAction(
    snapshot.skills,
    {
      type: "change_category",
      skillIds: [manualResult.skill.id, importResult.skill.id],
      category: "Database Smoke",
    },
    admin,
    now,
  );

  snapshot = {
    ...snapshot,
    skills: bulkResult.skills,
    auditLogs: [...bulkResult.auditLogs, ...snapshot.auditLogs],
  };

  const trackTarget = snapshot.skills.find((skill) => skill.id === publishedSkill.id);
  assert(trackTarget, "Track target Skill is required");

  const targetVersion = getCurrentVersion(trackTarget) ?? trackTarget.versions[0];
  assert(targetVersion, "Track target version is required");

  const trackResult = trackSkillVersion(
    snapshot.skills,
    snapshot.trackedVersions,
    {
      skillId: trackTarget.id,
      versionId: targetVersion.id,
    },
    employee,
    now,
  );

  snapshot = {
    ...snapshot,
    trackedVersions: trackResult.trackedVersions,
    auditLogs: [trackResult.auditLog, ...snapshot.auditLogs],
  };

  await updateSkillsSnapshot(() => snapshot);

  const saved = await readSkillsSnapshot();

  assert(
    saved.skills.some((skill) => skill.id === manualResult.skill.id),
    "Manual create flow did not persist",
  );
  assert(
    saved.skills.some((skill) => skill.id === importResult.skill.id),
    "Git import flow did not persist",
  );
  assert(
    saved.gitImportJobs.some((job) => job.id === importResult.importJob.id),
    "Git import job did not persist",
  );
  assert(
    saved.auditLogs.some((log) => log.action === "track_version"),
    "Track audit log did not persist",
  );
}

async function verifyErrorShapes(): Promise<void> {
  const conflictPayload = toErrorPayload(conflictError("Duplicate"));
  const internalPayload = toErrorPayload(new Error("C:/secret/path leaked"));

  assert(conflictPayload.status === 409, "Conflict error status is unstable");
  assert(conflictPayload.body.code === "conflict", "Conflict error code is unstable");
  assert(internalPayload.status === 500, "Internal error status is unstable");
  assert(internalPayload.body.error === "Request failed", "Internal error leaked details");
}

async function expectUniqueConstraint(
  label: string,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    const payload = toErrorPayload(error);

    if (payload.status === 409 && payload.body.code === "conflict") {
      return;
    }

    throw new Error(`${label} failed with unexpected error shape`);
  }

  throw new Error(`${label} unique constraint did not fire`);
}

function assertSeededSnapshot(snapshot: SkillStoreSnapshot): void {
  assert(snapshot.skills.length > 0, "Seeded Skills are required");
  assert(snapshot.trackedVersions.length > 0, "Seeded tracked versions are required");
  assert(snapshot.auditLogs.length > 0, "Seeded audit logs are required");
}

function replaceSkill(
  snapshot: SkillStoreSnapshot,
  skill: Skill,
  auditLog: SkillStoreSnapshot["auditLogs"][number],
): SkillStoreSnapshot {
  return {
    ...snapshot,
    skills: snapshot.skills.map((item) => (item.id === skill.id ? skill : item)),
    auditLogs: [auditLog, ...snapshot.auditLogs],
  };
}

async function collectCounts(client: PrismaClientInstance): Promise<{
  users: number;
  skills: number;
  skillVersions: number;
  trackedVersions: number;
  auditLogs: number;
  gitImportSources: number;
  gitImportJobs: number;
}> {
  const [
    users,
    skills,
    skillVersions,
    trackedVersions,
    auditLogs,
    gitImportSources,
    gitImportJobs,
  ] = await Promise.all([
    client.user.count(),
    client.skill.count(),
    client.skillVersion.count(),
    client.trackedVersion.count(),
    client.auditLog.count(),
    client.gitImportSource.count(),
    client.gitImportJob.count(),
  ]);

  return {
    users,
    skills,
    skillVersions,
    trackedVersions,
    auditLogs,
    gitImportSources,
    gitImportJobs,
  };
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
