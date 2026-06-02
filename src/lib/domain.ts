export type SkillStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "deprecated"
  | "archived";

export type ActorRole = "employee" | "admin";
export type SkillVisibility = "personal" | "public";

export type VersionState = "current" | "upgrade_available" | "not_tracked";
export type GitImportJobStatus = "queued" | "succeeded" | "failed";

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
}

export interface SkillVersion {
  id: string;
  version: string;
  content: string;
  changelog: string;
  createdAt: string;
  author: string;
  publishedAt?: string;
  publisher?: string;
  references: SkillAssetFile[];
  scripts: SkillAssetFile[];
}

export interface SkillSourceMetadata {
  repositoryUrl?: string;
  repositoryName?: string;
}

export interface SkillAssetFile {
  path: string;
  content: string;
  description?: string;
  language?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  compatibleTools: string[];
  status: SkillStatus;
  visibility: SkillVisibility;
  ownerId: string;
  ownerName: string;
  maintainingTeam: string;
  source: string;
  sourceMetadata?: SkillSourceMetadata;
  updatedAt: string;
  maintainers: string[];
  installMethod: string;
  dependencies: string[];
  readme: string;
  references: SkillAssetFile[];
  scripts: SkillAssetFile[];
  currentVersionId: string | null;
  versions: SkillVersion[];
  reviewSubmittedAt?: string;
  reviewReviewerName?: string;
  reviewReviewedAt?: string;
  reviewRejectionReason?: string;
}

export interface TrackedVersion {
  userId: string;
  skillId: string;
  versionId: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string;
  targetName: string;
  createdAt: string;
  summary: string;
}

export interface GitImportSource {
  id: string;
  repositoryUrl: string;
  repositoryName: string;
  trustedHost: string;
  createdAt: string;
}

export interface GitImportJob {
  id: string;
  sourceId: string;
  skillId: string | null;
  actorId: string;
  status: GitImportJobStatus;
  sourceRef?: string;
  sourceCommit?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SkillFilters {
  query?: string;
  category?: string;
  status?: SkillStatus | "all";
  teamOrSource?: string;
  tool?: string;
  versionState?: VersionState | "all";
  userId?: string;
  trackedVersions?: TrackedVersion[];
}

export interface SkillSummary {
  total: number;
  published: number;
  pendingReview: number;
  categories: number;
  recentlyUpdated: number;
}

export interface VersionStateResult {
  state: VersionState;
  trackedVersion: string | null;
  currentVersion: string | null;
}

const RECENT_UPDATE_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SKILL_STATUSES: SkillStatus[] = [
  "draft",
  "pending_review",
  "published",
  "deprecated",
  "archived",
];

export function getCurrentVersion(skill: Skill): SkillVersion | null {
  if (!skill.currentVersionId) {
    return null;
  }

  return (
    skill.versions.find((version) => version.id === skill.currentVersionId) ??
    null
  );
}

export function getVersionState(
  skill: Skill,
  trackedVersions: TrackedVersion[],
  userId: string,
): VersionStateResult {
  const currentVersion = getCurrentVersion(skill);
  const tracked = trackedVersions.find(
    (item) => item.userId === userId && item.skillId === skill.id,
  );

  if (!tracked) {
    return {
      state: "not_tracked",
      trackedVersion: null,
      currentVersion: currentVersion?.version ?? null,
    };
  }

  const trackedVersion = skill.versions.find(
    (version) => version.id === tracked.versionId,
  );

  if (!currentVersion || !trackedVersion) {
    return {
      state: "not_tracked",
      trackedVersion: trackedVersion?.version ?? null,
      currentVersion: currentVersion?.version ?? null,
    };
  }

  const state =
    compareVersions(trackedVersion.version, currentVersion.version) < 0
      ? "upgrade_available"
      : "current";

  return {
    state,
    trackedVersion: trackedVersion.version,
    currentVersion: currentVersion.version,
  };
}

export function filterSkills(skills: Skill[], filters: SkillFilters): Skill[] {
  const normalizedQuery = normalize(filters.query);
  const normalizedCategory = normalize(filters.category);
  const normalizedTeamOrSource = normalize(filters.teamOrSource);
  const normalizedTool = normalize(filters.tool);

  return skills.filter((skill) => {
    const searchable = normalize(
      [
        skill.name,
        skill.description,
        skill.category,
        skill.maintainingTeam,
        skill.source,
        skill.tags.join(" "),
        skill.compatibleTools.join(" "),
      ].join(" "),
    );

    if (normalizedQuery && !searchable.includes(normalizedQuery)) {
      return false;
    }

    if (normalizedCategory && normalize(skill.category) !== normalizedCategory) {
      return false;
    }

    if (filters.status && filters.status !== "all" && skill.status !== filters.status) {
      return false;
    }

    if (
      normalizedTeamOrSource &&
      normalize(skill.maintainingTeam) !== normalizedTeamOrSource &&
      normalize(skill.source) !== normalizedTeamOrSource
    ) {
      return false;
    }

    if (
      normalizedTool &&
      !skill.compatibleTools.some((tool) => normalize(tool) === normalizedTool)
    ) {
      return false;
    }

    if (
      filters.versionState &&
      filters.versionState !== "all" &&
      filters.userId
    ) {
      const versionState = getVersionState(
        skill,
        filters.trackedVersions ?? [],
        filters.userId,
      );

      if (versionState.state !== filters.versionState) {
        return false;
      }
    }

    return true;
  });
}

export function getSkillSummary(
  skills: Skill[],
  now: Date = new Date(),
): SkillSummary {
  const categories = new Set(skills.map((skill) => skill.category)).size;
  const recentCutoff = now.getTime() - RECENT_UPDATE_WINDOW_DAYS * MS_PER_DAY;
  const recentlyUpdated = skills.filter(
    (skill) => new Date(skill.updatedAt).getTime() >= recentCutoff,
  ).length;

  return {
    total: skills.length,
    published: skills.filter((skill) => skill.status === "published").length,
    pendingReview: skills.filter((skill) => skill.status === "pending_review")
      .length,
    categories,
    recentlyUpdated,
  };
}

export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

export function normalize(value: string | undefined | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function parseVersion(version: string): number[] {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}
