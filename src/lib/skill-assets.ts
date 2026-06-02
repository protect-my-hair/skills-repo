import { validationError } from "./api-errors";
import type { SkillAssetFile } from "./domain";

export const SYSTEM_SKILL_CATEGORIES = [
  "Tools",
  "Research",
  "DevOps",
  "Development",
  "Testing&Security",
  "Content&Media",
  "Documentation",
  "Databases",
  "Data&AI",
] as const;

export type SkillAssetGroupName = "references" | "scripts";

export interface SkillAssetGroups {
  references?: SkillAssetFile[];
  scripts?: SkillAssetFile[];
}

export const MAX_SKILL_ASSET_FILES_PER_GROUP = 20;
export const MAX_SKILL_ASSET_FILE_BYTES = 200 * 1024;
export const MAX_SKILL_ASSET_TOTAL_BYTES = 2 * 1024 * 1024;
const MAX_SKILL_ASSET_PATH_LENGTH = 180;
const PACKAGE_DIRECTORIES = new Set(["references", "scripts"]);

export function isKnownSkillCategory(category: string): boolean {
  const normalizedCategory = category.trim();
  return SYSTEM_SKILL_CATEGORIES.some((item) => item === normalizedCategory);
}

export function validateSkillCategory(category: string): string {
  const normalizedCategory = category.trim();

  if (!normalizedCategory) {
    throw validationError("Category is required");
  }

  if (!isKnownSkillCategory(normalizedCategory)) {
    throw validationError("Category must be selected from the system directory");
  }

  return normalizedCategory;
}

export function normalizeSkillAssetGroups(
  groups: SkillAssetGroups,
): Required<SkillAssetGroups> {
  const references = normalizeSkillAssetFiles(groups.references, "references");
  const scripts = normalizeSkillAssetFiles(groups.scripts, "scripts");
  const totalBytes = [...references, ...scripts].reduce(
    (sum, file) => sum + byteLength(file.content),
    0,
  );

  if (totalBytes > MAX_SKILL_ASSET_TOTAL_BYTES) {
    throw validationError("Skill asset files exceed the total size limit");
  }

  return {
    references,
    scripts,
  };
}

export function normalizeSkillAssetFiles(
  files: SkillAssetFile[] | undefined,
  groupName: SkillAssetGroupName,
): SkillAssetFile[] {
  if (!files) {
    return [];
  }

  if (!Array.isArray(files)) {
    throw validationError(`${groupName} must be a file list`);
  }

  if (files.length > MAX_SKILL_ASSET_FILES_PER_GROUP) {
    throw validationError(`${groupName} exceeds the file count limit`);
  }

  const seenPaths = new Set<string>();

  return files.map((file) => {
    const normalizedPath = normalizeAssetPath(file.path, groupName);
    const normalizedContent = normalizeAssetContent(file.content, groupName);
    const lowerPath = normalizedPath.toLowerCase();

    if (seenPaths.has(lowerPath)) {
      throw validationError(`${groupName} path must be unique`);
    }

    seenPaths.add(lowerPath);

    return removeEmptyOptionalFields({
      path: normalizedPath,
      content: normalizedContent,
      description:
        typeof file.description === "string"
          ? file.description.trim()
          : undefined,
      language:
        typeof file.language === "string" ? file.language.trim() : undefined,
    });
  });
}

function normalizeAssetPath(path: string, groupName: SkillAssetGroupName): string {
  if (typeof path !== "string") {
    throw validationError(`${groupName} path is required`);
  }

  const normalizedPath = path.trim();

  if (
    !normalizedPath ||
    normalizedPath.length > MAX_SKILL_ASSET_PATH_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(normalizedPath) ||
    normalizedPath.includes("\\") ||
    normalizedPath.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalizedPath)
  ) {
    throw validationError(`${groupName} path must be a safe relative path`);
  }

  const segments = normalizedPath.split("/");

  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw validationError(`${groupName} path must be a safe relative path`);
  }

  if (PACKAGE_DIRECTORIES.has(segments[0]?.toLowerCase() ?? "")) {
    throw validationError(
      `${groupName} path must not include the package directory`,
    );
  }

  return segments.join("/");
}

function normalizeAssetContent(
  content: string,
  groupName: SkillAssetGroupName,
): string {
  if (typeof content !== "string" || !content.trim()) {
    throw validationError(`${groupName} content is required`);
  }

  if (byteLength(content) > MAX_SKILL_ASSET_FILE_BYTES) {
    throw validationError(`${groupName} content exceeds the file size limit`);
  }

  return content;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function removeEmptyOptionalFields(file: SkillAssetFile): SkillAssetFile {
  return {
    path: file.path,
    content: file.content,
    ...(file.description ? { description: file.description } : {}),
    ...(file.language ? { language: file.language } : {}),
  };
}
