import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  AuditAction,
  ImportJobStatus,
  SkillStatus,
} from "../src/generated/prisma/enums";
import type {
  GitImportJobStatus as DomainGitImportJobStatus,
  SkillStatus as DomainSkillStatus,
} from "../src/lib/domain";
import { hashPassword } from "../src/lib/auth-credentials";
import { INTERNAL_AUTH_USERS } from "../src/lib/internal-users";
import {
  collectSeedUsers,
  seedUserIdForName,
  type DatabaseUserSeed,
} from "../src/lib/seed-users";
import {
  auditActionToDatabase,
  importJobStatusToDatabase,
  skillStatusToDatabase,
} from "../src/lib/prisma-mappers";
import { seededStore } from "../src/lib/seed-data";

const SEED_PASSWORD_BY_USER_ID: Record<string, string | undefined> = {
  "admin-1": process.env.SKILLS_REPO_SEED_ADMIN_PASSWORD,
  "employee-1": process.env.SKILLS_REPO_SEED_EMPLOYEE_PASSWORD,
};

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

    for (const user of users) {
      const password = SEED_PASSWORD_BY_USER_ID[user.id];

      if (password) {
        const secret = await hashPassword(password);
        await transaction.userPasswordCredential.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            passwordHash: secret.passwordHash,
            passwordSalt: secret.passwordSalt,
          },
          update: {
            passwordHash: secret.passwordHash,
            passwordSalt: secret.passwordSalt,
          },
        });
      } else {
        await transaction.userPasswordCredential.deleteMany({
          where: { userId: user.id },
        });
      }
    }

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
              authorId: seedUserIdForName(version.author, INTERNAL_AUTH_USERS),
              publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
              publisherId: version.publisher
                ? seedUserIdForName(version.publisher, INTERNAL_AUTH_USERS)
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
  return collectSeedUsers({
    internalUsers: INTERNAL_AUTH_USERS,
    versionActors: seededStore.skills.flatMap((skill) =>
      skill.versions.map((version) => ({
        author: version.author,
        publisher: version.publisher,
      })),
    ),
  });
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
