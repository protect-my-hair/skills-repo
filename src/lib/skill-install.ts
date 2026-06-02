import { getCurrentVersion, type Skill, type SkillVersion } from "./domain";

export const INSTALL_TARGETS = [
  {
    id: "codex",
    label: "Codex",
    directory: ".codex\\skills",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    directory: ".claude\\skills",
  },
] as const;

export type InstallTarget = (typeof INSTALL_TARGETS)[number]["id"];
export type SkillInstallUnavailableReason = "not_published" | "no_current_version";

export interface SkillInstallAvailability {
  isInstallable: boolean;
  reason: SkillInstallUnavailableReason | null;
  currentVersion: SkillVersion | null;
}

export function getSkillInstallAvailability(skill: Skill): SkillInstallAvailability {
  const currentVersion = getCurrentVersion(skill);

  if (skill.status !== "published") {
    return {
      isInstallable: false,
      reason: "not_published",
      currentVersion,
    };
  }

  if (!currentVersion) {
    return {
      isInstallable: false,
      reason: "no_current_version",
      currentVersion,
    };
  }

  return {
    isInstallable: true,
    reason: null,
    currentVersion,
  };
}

export function getSkillPackageDownloadPath(skill: Pick<Skill, "id">): string {
  return `/api/skills/${encodeURIComponent(skill.id)}/package`;
}

export function createInstallCommand({
  skill,
  target,
  origin,
}: {
  skill: Pick<Skill, "id">;
  target: InstallTarget;
  origin?: string;
}): string {
  const targetConfig = INSTALL_TARGETS.find((item) => item.id === target) ?? INSTALL_TARGETS[0];
  const skillId = escapePowerShellSingleQuotedValue(skill.id);
  const downloadUrl = escapePowerShellSingleQuotedValue(
    `${normalizeOrigin(origin)}${getSkillPackageDownloadPath(skill)}`,
  );
  const targetPath = escapePowerShellSingleQuotedValue(
    `${targetConfig.directory}\\${skill.id}`,
  );

  return [
    `$skill = '${skillId}'`,
    `$zip = Join-Path $env:TEMP "$skill.zip"`,
    `Invoke-WebRequest -Uri '${downloadUrl}' -OutFile $zip`,
    `$target = Join-Path $env:USERPROFILE '${targetPath}'`,
    "New-Item -ItemType Directory -Force -Path $target | Out-Null",
    "Expand-Archive -LiteralPath $zip -DestinationPath $target -Force",
  ].join("; ");
}

export function skillInstallUnavailableMessage(
  reason: SkillInstallUnavailableReason | null,
): string {
  if (reason === "no_current_version") {
    return "No current published version is available";
  }

  return "Only published Skills can be installed";
}

function normalizeOrigin(origin: string | undefined): string {
  return origin?.replace(/\/+$/g, "") ?? "";
}

function escapePowerShellSingleQuotedValue(value: string): string {
  return value.replaceAll("'", "''");
}
