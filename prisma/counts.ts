import { getPrismaClient } from "../src/lib/prisma";

const label = readLabel(process.argv);
const prisma = getPrismaClient();

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database counts failed");
  await prisma.$disconnect();
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const [
    users,
    skills,
    skillVersions,
    trackedVersions,
    auditLogs,
    gitImportSources,
    gitImportJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.skill.count(),
    prisma.skillVersion.count(),
    prisma.trackedVersion.count(),
    prisma.auditLog.count(),
    prisma.gitImportSource.count(),
    prisma.gitImportJob.count(),
  ]);

  console.log(
    [
      label,
      `users=${users}`,
      `skills=${skills}`,
      `skillVersions=${skillVersions}`,
      `trackedVersions=${trackedVersions}`,
      `auditLogs=${auditLogs}`,
      `gitImportSources=${gitImportSources}`,
      `gitImportJobs=${gitImportJobs}`,
    ].join(" "),
  );

  await prisma.$disconnect();
}

function readLabel(argv: string[]): string {
  const labelIndex = argv.indexOf("--label");
  const value = labelIndex >= 0 ? argv[labelIndex + 1] : undefined;

  return value?.trim() || "Database counts";
}
