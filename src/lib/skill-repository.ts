import type { PrismaClient } from "@/generated/prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import {
  AuditAction,
  ImportJobStatus,
  SkillStatus,
  SkillVisibility,
} from "@/generated/prisma/enums";

import type {
  GitImportJob as DomainGitImportJob,
  GitImportSource as DomainGitImportSource,
  SkillAssetFile,
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
  skillVisibilityFromDatabase,
  skillVisibilityToDatabase,
} from "./prisma-mappers";
import { normalizeSkillAssetFiles } from "./skill-assets";
import { getPrismaClient } from "./prisma";
import {
  collectSeedUsers,
  seedUserIdForName,
  type DatabaseUserSeed,
} from "./seed-users";
import type { SkillStoreSnapshot } from "./seed-data";
import { readStore, updateStore } from "./store";

type SnapshotUpdater = (snapshot: SkillStoreSnapshot) => SkillStoreSnapshot;

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
      visibility: skillVisibilityFromDatabase(skill.visibility),
      ownerId: skill.ownerId,
      ownerName: skill.ownerName,
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
      references: toDomainAssetFiles(skill.referenceFiles, "references"),
      scripts: toDomainAssetFiles(skill.scriptFiles, "scripts"),
      currentVersionId: skill.currentVersionId,
      versions: skill.versions.map(toDomainVersion),
      reviewSubmittedAt: skill.reviewSubmittedAt?.toISOString(),
      reviewReviewerName: skill.reviewReviewerName ?? undefined,
      reviewReviewedAt: skill.reviewReviewedAt?.toISOString(),
      reviewRejectionReason: skill.reviewRejectionReason ?? undefined,
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
            visibility: skillVisibilityToDatabase(skill.visibility) as typeof SkillVisibility[keyof typeof SkillVisibility],
            ownerId: skill.ownerId,
            ownerName: skill.ownerName,
            maintainingTeam: skill.maintainingTeam,
            source: skill.source,
            repositoryUrl: skill.sourceMetadata?.repositoryUrl,
            repositoryName: skill.sourceMetadata?.repositoryName,
            updatedAt: new Date(skill.updatedAt),
            maintainers: skill.maintainers,
            installMethod: skill.installMethod,
            dependencies: skill.dependencies,
            readme: skill.readme,
            referenceFiles: toPrismaAssetFiles(skill.references),
            scriptFiles: toPrismaAssetFiles(skill.scripts),
            reviewSubmittedAt: skill.reviewSubmittedAt ? new Date(skill.reviewSubmittedAt) : null,
            reviewReviewerName: skill.reviewReviewerName,
            reviewReviewedAt: skill.reviewReviewedAt ? new Date(skill.reviewReviewedAt) : null,
            reviewRejectionReason: skill.reviewRejectionReason,
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
              referenceFiles: toPrismaAssetFiles(version.references),
              scriptFiles: toPrismaAssetFiles(version.scripts),
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
  referenceFiles: unknown;
  scriptFiles: unknown;
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
    references: toDomainAssetFiles(version.referenceFiles, "references"),
    scripts: toDomainAssetFiles(version.scriptFiles, "scripts"),
    createdAt: version.createdAt.toISOString(),
    author: version.author.name ?? version.authorId,
    publishedAt: version.publishedAt?.toISOString(),
    publisher: version.publisher?.name ?? undefined,
  };
}

function toDomainAssetFiles(
  files: unknown,
  groupName: "references" | "scripts",
): SkillAssetFile[] {
  if (!Array.isArray(files)) {
    return [];
  }

  return normalizeSkillAssetFiles(files as SkillAssetFile[], groupName);
}

function toPrismaAssetFiles(files: SkillAssetFile[] | undefined): InputJsonValue {
  return (files ?? []).map((file) => ({
    path: file.path,
    content: file.content,
    ...(file.description ? { description: file.description } : {}),
    ...(file.language ? { language: file.language } : {}),
  })) as InputJsonValue;
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
  return collectSeedUsers({
    internalUsers: INTERNAL_AUTH_USERS,
    versionActors: snapshot.skills.flatMap((skill) =>
      skill.versions.map((version) => ({
        author: version.author,
        publisher: version.publisher,
      })),
    ),
  });
}

function userIdForName(name: string): string {
  return seedUserIdForName(name, INTERNAL_AUTH_USERS);
}
