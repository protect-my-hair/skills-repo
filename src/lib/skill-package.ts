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
      ...createAssetFiles("references", version.references),
      ...createAssetFiles("scripts", version.scripts),
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

function createAssetFiles(
  directory: "references" | "scripts",
  files: SkillVersion["references"] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (files ?? []).map((file) => [`${directory}/${file.path}`, file.content]),
  );
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
