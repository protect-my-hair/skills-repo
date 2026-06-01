import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  AuditAction,
  ImportJobStatus,
  SkillStatus,
  UserRole,
} from "../src/generated/prisma/enums";
import type {
  GitImportJobStatus as DomainGitImportJobStatus,
  SkillStatus as DomainSkillStatus,
} from "../src/lib/domain";
import { INTERNAL_AUTH_USERS } from "../src/lib/internal-users";
import {
  auditActionToDatabase,
  importJobStatusToDatabase,
  skillStatusToDatabase,
} from "../src/lib/prisma-mappers";
import { seededStore } from "../src/lib/seed-data";

interface DatabaseUserSeed {
  id: string;
  name: string;
  email: string | null;
  role: typeof UserRole[keyof typeof UserRole];
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

async function main(): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.trackedVersion.deleteMany();
    await transaction.auditLog.deleteMany();
    await transaction.gitImportJob.deleteMany();
    await transaction.gitImportSource.deleteMany();
    await transaction.skill.updateMany({ data: { currentVersionId: null } });
    await transaction.skillVersion.deleteMany();
    await transaction.skill.deleteMany();

    const users = collectUsers();

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
      seededStore.gitImportSources.map((source) =>
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
      seededStore.skills.map((skill) =>
        transaction.skill.create({
          data: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            tags: skill.tags,
            compatibleTools: skill.compatibleTools,
            status: toDatabaseSkillStatus(skill.status),
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

    for (const skill of seededStore.skills) {
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
      seededStore.trackedVersions.map((trackedVersion) =>
        transaction.trackedVersion.create({
          data: trackedVersion,
        }),
      ),
    );

    await Promise.all(
      seededStore.auditLogs.map((auditLog) =>
        transaction.auditLog.create({
          data: {
            id: auditLog.id,
            actorId: auditLog.actorId,
            action: toDatabaseAuditAction(auditLog.action),
            targetId: auditLog.targetId,
            targetName: auditLog.targetName,
            createdAt: new Date(auditLog.createdAt),
            summary: auditLog.summary,
          },
        }),
      ),
    );

    await Promise.all(
      seededStore.gitImportJobs.map((job) =>
        transaction.gitImportJob.create({
          data: {
            id: job.id,
            sourceId: job.sourceId,
            skillId: job.skillId,
            actorId: job.actorId,
            status: toDatabaseImportJobStatus(job.status),
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

  const [userCount, skillCount, trackedCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.skill.count(),
    prisma.trackedVersion.count(),
    prisma.auditLog.count(),
  ]);

  console.log(
    `Seeded demo data into skills_repo: users=${userCount}, skills=${skillCount}, trackedVersions=${trackedCount}, auditLogs=${auditCount}`,
  );

  await prisma.$disconnect();
}

function collectUsers(): DatabaseUserSeed[] {
  const users = new Map<string, DatabaseUserSeed>();

  for (const user of INTERNAL_AUTH_USERS) {
    users.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "admin" ? UserRole.ADMIN : UserRole.EMPLOYEE,
    });
  }

  for (const skill of seededStore.skills) {
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

function toDatabaseSkillStatus(
  status: DomainSkillStatus,
): typeof SkillStatus[keyof typeof SkillStatus] {
  const value = skillStatusToDatabase(status);

  return SkillStatus[value as keyof typeof SkillStatus] ?? SkillStatus.DRAFT;
}

function toDatabaseAuditAction(
  action: string,
): typeof AuditAction[keyof typeof AuditAction] {
  const value = auditActionToDatabase(action);

  return AuditAction[value as keyof typeof AuditAction] ?? AuditAction.EDIT;
}

function toDatabaseImportJobStatus(
  status: DomainGitImportJobStatus,
): typeof ImportJobStatus[keyof typeof ImportJobStatus] {
  const value = importJobStatusToDatabase(status);

  return ImportJobStatus[value as keyof typeof ImportJobStatus] ?? ImportJobStatus.FAILED;
}
