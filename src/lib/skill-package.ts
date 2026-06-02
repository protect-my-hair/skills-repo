import JSZip from "jszip";

import type { Skill, SkillVersion } from "./domain";
import { validationError } from "./api-errors";
import {
  getSkillInstallAvailability,
  skillInstallUnavailableMessage,
} from "./skill-install";

export {
  INSTALL_TARGETS,
  createInstallCommand,
  getSkillInstallAvailability,
  getSkillPackageDownloadPath,
  skillInstallUnavailableMessage,
} from "./skill-install";
export type {
  InstallTarget,
  SkillInstallAvailability,
  SkillInstallUnavailableReason,
} from "./skill-install";

export interface SkillPackageDescriptor {
  fileName: string;
  files: Record<string, string>;
}

export interface SkillPackageArchive {
  fileName: string;
  buffer: Buffer;
}

export function createSkillPackageDescriptor(skill: Skill): SkillPackageDescriptor {
  const availability = getSkillInstallAvailability(skill);

  if (!availability.isInstallable || !availability.currentVersion) {
    throw validationError(skillInstallUnavailableMessage(availability.reason));
  }

  const version = availability.currentVersion;
  const fileName = `${safeFilePart(skill.id)}-${safeFilePart(version.version)}.zip`;

  return {
    fileName,
    files: {
      "SKILL.md": createSkillEntryFile(skill, version),
      "README.md": createPackageReadme(skill, version),
      "metadata.json": `${JSON.stringify(createPackageMetadata(skill, version), null, 2)}\n`,
    },
  };
}

export async function createSkillPackageArchive(skill: Skill): Promise<SkillPackageArchive> {
  const descriptor = createSkillPackageDescriptor(skill);
  const zip = new JSZip();

  for (const [path, content] of Object.entries(descriptor.files)) {
    zip.file(path, content);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return {
    fileName: descriptor.fileName,
    buffer,
  };
}

function createSkillEntryFile(skill: Skill, version: SkillVersion): string {
  return [
    "---",
    `name: ${frontmatterValue(skill.name)}`,
    `description: ${frontmatterValue(skill.description)}`,
    `version: ${frontmatterValue(version.version)}`,
    `category: ${frontmatterValue(skill.category)}`,
    `maintaining_team: ${frontmatterValue(skill.maintainingTeam)}`,
    "tools:",
    ...skill.compatibleTools.map((tool) => `  - ${frontmatterValue(tool)}`),
    "---",
    "",
    version.content.trim(),
    "",
  ].join("\n");
}

function createPackageReadme(skill: Skill, version: SkillVersion): string {
  const dependencies =
    skill.dependencies.length > 0
      ? skill.dependencies.map((dependency) => `- ${dependency}`).join("\n")
      : "- None";

  return [
    `# ${skill.name}`,
    "",
    `Version: ${version.version}`,
    `Tools: ${skill.compatibleTools.join(", ")}`,
    `Maintainer team: ${skill.maintainingTeam}`,
    "",
    "## Installation",
    "Expand this package into the target tool's local skills directory.",
    "",
    "## Original Install Method",
    skill.installMethod,
    "",
    "## Dependencies",
    dependencies,
    "",
    "## Usage",
    skill.readme.trim(),
    "",
  ].join("\n");
}

function createPackageMetadata(skill: Skill, version: SkillVersion) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    version: version.version,
    category: skill.category,
    compatibleTools: skill.compatibleTools,
    maintainingTeam: skill.maintainingTeam,
    maintainers: skill.maintainers,
    dependencies: skill.dependencies,
    generatedFromVersionId: version.id,
    publishedAt: version.publishedAt ?? null,
  };
}

function safeFilePart(value: string): string {
  const safeValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-|-$/g, "");

  return safeValue || "skill";
}

function frontmatterValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
