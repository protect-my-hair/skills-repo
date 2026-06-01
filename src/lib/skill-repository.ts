import type { PrismaClient } from "@/generated/prisma/client";
import {
  AuditAction,
  ImportJobStatus,
  SkillStatus,
  UserRole,
} from "@/generated/prisma/enums";

import type {
  GitImportJob as DomainGitImportJob,
  GitImportSource as DomainGitImportSource,
  SkillVersion as DomainSkillVersion,
} from "./domain";
import { INTERNAL_AUTH_USERS } from "./internal-users";
import {
  auditActionFromDatabase,
  auditActionToDatabase,
  importJobStatusFromDatabase,
  importJobStatusToDatabase,
  skillStatusFromDatabase,
  skillStatusToDatabase,
} from "./prisma-mappers";
import { getPrismaClient } from "./prisma";
import type { SkillStoreSnapshot } from "./seed-data";
import { readStore, updateStore } from "./store";

type SnapshotUpdater = (snapshot: SkillStoreSnapshot) => SkillStoreSnapshot;

interface DatabaseUserSeed {
  id: string;
  name: string;
  email: string | null;
  role: typeof UserRole[keyof typeof UserRole];
}

export async function readSkillsSnapshot(): Promise<SkillStoreSnapshot> {
  if (!hasDatabaseConfigured()) {
    return readStore();
  }

  return readPrismaSnapshot(getPrismaClient());
}

export async function updateSkillsSnapshot(
  updater: SnapshotUpdater,
): Promise<SkillStoreSnapshot> {
  if (!hasDatabaseConfigured()) {
    return updateStore(updater);
  }

  const prisma = getPrismaClient();
  const current = await readPrismaSnapshot(prisma);
  const next = updater(current);
  await writePrismaSnapshot(prisma, next);
  return next;
}

export function hasDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function readPrismaSnapshot(
  prisma: PrismaClient,
): Promise<SkillStoreSnapshot> {
  const [skills, trackedVersions, auditLogs, gitImportSources, gitImportJobs] =
    await Promise.all([
    prisma.skill.findMany({
      include: {
        versions: {
          include: {
            author: true,
            publisher: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.trackedVersion.findMany(),
    prisma.auditLog.findMany({
      include: {
        actor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.gitImportSource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.gitImportJob.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    skills: skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      tags: skill.tags,
      compatibleTools: skill.compatibleTools,
      status: skillStatusFromDatabase(skill.status),
      maintainingTeam: skill.maintainingTeam,
      source: skill.source,
      sourceMetadata:
        skill.repositoryUrl || skill.repositoryName
          ? {
              repositoryUrl: skill.repositoryUrl ?? undefined,
              repositoryName: skill.repositoryName ?? undefined,
            }
          : undefined,
      updatedAt: skill.updatedAt.toISOString(),
      maintainers: skill.maintainers,
      installMethod: skill.installMethod,
      dependencies: skill.dependencies,
      readme: skill.readme,
      currentVersionId: skill.currentVersionId,
      versions: skill.versions.map(toDomainVersion),
    })),
    trackedVersions: trackedVersions.map((trackedVersion) => ({
      userId: trackedVersion.userId,
      skillId: trackedVersion.skillId,
      versionId: trackedVersion.versionId,
    })),
    auditLogs: auditLogs.map((auditLog) => ({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorName: auditLog.actor.name ?? auditLog.actorId,
      action: auditActionFromDatabase(auditLog.action),
      targetId: auditLog.targetId,
      targetName: auditLog.targetName,
      createdAt: auditLog.createdAt.toISOString(),
      summary: auditLog.summary,
    })),
    gitImportSources: gitImportSources.map(toDomainImportSource),
    gitImportJobs: gitImportJobs.map(toDomainImportJob),
  };
}

async function writePrismaSnapshot(
  prisma: PrismaClient,
  snapshot: SkillStoreSnapshot,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.trackedVersion.deleteMany();
    await transaction.auditLog.deleteMany();
    await transaction.gitImportJob.deleteMany();
    await transaction.gitImportSource.deleteMany();
    await transaction.skill.updateMany({ data: { currentVersionId: null } });
    await transaction.skillVersion.deleteMany();
    await transaction.skill.deleteMany();

    const users = collectUsers(snapshot);
    await Promise.all(
      users.map((user) =>
        transaction.user.upsert({
          where: { id: user.id },
          create: user,
          update: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        }),
      ),
    );

    await Promise.all(
      snapshot.gitImportSources.map((source) =>
        transaction.gitImportSource.create({
          data: {
            id: source.id,
            repositoryUrl: source.repositoryUrl,
            repositoryName: source.repositoryName,
            trustedHost: source.trustedHost,
            createdAt: new Date(source.createdAt),
          },
        }),
      ),
    );

    await Promise.all(
      snapshot.skills.map((skill) =>
        transaction.skill.create({
          data: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            tags: skill.tags,
            compatibleTools: skill.compatibleTools,
            status: skillStatusToDatabase(skill.status) as typeof SkillStatus[keyof typeof SkillStatus],
            maintainingTeam: skill.maintainingTeam,
            source: skill.source,
            repositoryUrl: skill.sourceMetadata?.repositoryUrl,
            repositoryName: skill.sourceMetadata?.repositoryName,
            updatedAt: new Date(skill.updatedAt),
            maintainers: skill.maintainers,
            installMethod: skill.installMethod,
            dependencies: skill.dependencies,
            readme: skill.readme,
          },
        }),
      ),
    );

    for (const skill of snapshot.skills) {
      await Promise.all(
        skill.versions.map((version) =>
          transaction.skillVersion.create({
            data: {
              id: version.id,
              skillId: skill.id,
              version: version.version,
              content: version.content,
              changelog: version.changelog,
              createdAt: new Date(version.createdAt),
              authorId: userIdForName(version.author),
              publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
              publisherId: version.publisher
                ? userIdForName(version.publisher)
                : null,
            },
          }),
        ),
      );

      if (skill.currentVersionId) {
        await transaction.skill.update({
          where: { id: skill.id },
          data: { currentVersionId: skill.currentVersionId },
        });
      }
    }

    await Promise.all(
      snapshot.trackedVersions.map((trackedVersion) =>
        transaction.trackedVersion.create({
          data: trackedVersion,
        }),
      ),
    );

    await Promise.all(
      snapshot.auditLogs.map((auditLog) =>
        transaction.auditLog.create({
          data: {
            id: auditLog.id,
            actorId: auditLog.actorId,
            action: auditActionToDatabase(auditLog.action) as typeof AuditAction[keyof typeof AuditAction],
            targetId: auditLog.targetId,
            targetName: auditLog.targetName,
            createdAt: new Date(auditLog.createdAt),
            summary: auditLog.summary,
          },
        }),
      ),
    );

    await Promise.all(
      snapshot.gitImportJobs.map((job) =>
        transaction.gitImportJob.create({
          data: {
            id: job.id,
            sourceId: job.sourceId,
            skillId: job.skillId,
            actorId: job.actorId,
            status: importJobStatusToDatabase(job.status) as typeof ImportJobStatus[keyof typeof ImportJobStatus],
            sourceRef: job.sourceRef,
            sourceCommit: job.sourceCommit,
            error: job.error,
            createdAt: new Date(job.createdAt),
            completedAt: job.completedAt ? new Date(job.completedAt) : null,
          },
        }),
      ),
    );
  });
}

interface PrismaSkillVersionRow {
  id: string;
  version: string;
  content: string;
  changelog: string;
  createdAt: Date;
  authorId: string;
  publishedAt: Date | null;
  publisherId: string | null;
  author: { name: string | null };
  publisher: { name: string | null } | null;
}

function toDomainVersion(version: PrismaSkillVersionRow): DomainSkillVersion {
  return {
    id: version.id,
    version: version.version,
    content: version.content,
    changelog: version.changelog,
    createdAt: version.createdAt.toISOString(),
    author: version.author.name ?? version.authorId,
    publishedAt: version.publishedAt?.toISOString(),
    publisher: version.publisher?.name ?? undefined,
  };
}

interface PrismaGitImportSourceRow {
  id: string;
  repositoryUrl: string;
  repositoryName: string;
  trustedHost: string;
  createdAt: Date;
}

function toDomainImportSource(
  source: PrismaGitImportSourceRow,
): DomainGitImportSource {
  return {
    id: source.id,
    repositoryUrl: source.repositoryUrl,
    repositoryName: source.repositoryName,
    trustedHost: source.trustedHost,
    createdAt: source.createdAt.toISOString(),
  };
}

interface PrismaGitImportJobRow {
  id: string;
  sourceId: string;
  skillId: string | null;
  actorId: string;
  status: string;
  sourceRef: string | null;
  sourceCommit: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

function toDomainImportJob(job: PrismaGitImportJobRow): DomainGitImportJob {
  return {
    id: job.id,
    sourceId: job.sourceId,
    skillId: job.skillId,
    actorId: job.actorId,
    status: importJobStatusFromDatabase(job.status),
    sourceRef: job.sourceRef ?? undefined,
    sourceCommit: job.sourceCommit ?? undefined,
    error: job.error ?? undefined,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  };
}

function collectUsers(snapshot: SkillStoreSnapshot): DatabaseUserSeed[] {
  const users = new Map<string, DatabaseUserSeed>();

  for (const user of INTERNAL_AUTH_USERS) {
    users.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "admin" ? UserRole.ADMIN : UserRole.EMPLOYEE,
    });
  }

  for (const skill of snapshot.skills) {
    for (const version of skill.versions) {
      users.set(userIdForName(version.author), userSeedForName(version.author));

      if (version.publisher) {
        users.set(
          userIdForName(version.publisher),
          userSeedForName(version.publisher),
        );
      }
    }
  }

  return [...users.values()];
}

function userSeedForName(name: string): DatabaseUserSeed {
  return {
    id: userIdForName(name),
    name,
    email: null,
    role: UserRole.EMPLOYEE,
  };
}

function userIdForName(name: string): string {
  const internalUser = INTERNAL_AUTH_USERS.find((user) => user.name === name);

  if (internalUser) {
    return internalUser.id;
  }

  return `user-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
