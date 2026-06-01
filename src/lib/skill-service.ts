import {
  type Actor,
  type AuditLog,
  type GitImportJob,
  type GitImportSource,
  type Skill,
  type SkillSourceMetadata,
  type SkillStatus,
  type SkillVersion,
  type TrackedVersion,
  SKILL_STATUSES,
} from "./domain";
import { forbiddenError, notFoundError, validationError } from "./api-errors";

export interface SkillDraftInput {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  compatibleTools: string[];
  maintainingTeam: string;
  maintainers: string[];
  installMethod: string;
  dependencies?: string[];
  readme: string;
  version: string;
  changelog: string;
}

export interface GitImportInput {
  repositoryUrl: string;
  repositoryName: string;
  name: string;
  description: string;
  category: string;
  compatibleTools: string[];
  maintainingTeam: string;
  readme: string;
  version: string;
  changelog: string;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  compatibleTools?: string[];
  maintainingTeam?: string;
  maintainers?: string[];
  installMethod?: string;
  dependencies?: string[];
  readme: string;
  version: string;
  changelog: string;
}

export interface TransitionOptions {
  versionId?: string;
  now: string;
}

export type BulkAction =
  | {
      type: "publish" | "unpublish" | "archive";
      skillIds: string[];
      versionId?: string;
    }
  | {
      type: "change_category";
      skillIds: string[];
      category: string;
    };

export interface MutationResult {
  skill: Skill;
  auditLog: AuditLog;
}

export interface GitImportMutationResult extends MutationResult {
  importSource: GitImportSource;
  importJob: GitImportJob;
}

export interface BulkMutationResult {
  skills: Skill[];
  auditLogs: AuditLog[];
}

export interface TrackVersionInput {
  skillId: string;
  versionId: string;
}

export interface TrackVersionResult {
  trackedVersions: TrackedVersion[];
  auditLog: AuditLog;
}

const CONTROLLED_GIT_HOST = "https://git.company.local/";

export function createSkillDraft(
  input: SkillDraftInput,
  actor: Actor,
  now: string,
): MutationResult {
  requireAdmin(actor);
  validateDraftInput(input);

  const skillId = toId(input.name);
  const version: SkillVersion = {
    id: `${skillId}-${toId(input.version)}`,
    version: input.version.trim(),
    content: input.readme.trim(),
    changelog: input.changelog.trim(),
    createdAt: now,
    author: actor.name,
  };

  const skill: Skill = {
    id: skillId,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    tags: normalizeList(input.tags ?? []),
    compatibleTools: normalizeList(input.compatibleTools),
    status: "draft",
    maintainingTeam: input.maintainingTeam.trim(),
    source: "Manual",
    updatedAt: now,
    maintainers: normalizeList(input.maintainers),
    installMethod: input.installMethod.trim(),
    dependencies: normalizeList(input.dependencies ?? []),
    readme: input.readme.trim(),
    currentVersionId: null,
    versions: [version],
  };

  return {
    skill,
    auditLog: createAuditLog(actor, "create_draft", skill, now),
  };
}

export function importSkillFromGit(
  input: GitImportInput,
  actor: Actor,
  now: string,
): GitImportMutationResult {
  requireAdmin(actor);
  validateControlledGitInput(input);

  const result = createSkillDraft(
    {
      name: input.name,
      description: input.description,
      category: input.category,
      tags: ["imported"],
      compatibleTools: input.compatibleTools,
      maintainingTeam: input.maintainingTeam,
      maintainers: [actor.name],
      installMethod: "Install from internal registry after publication",
      dependencies: [],
      readme: input.readme,
      version: input.version,
      changelog: input.changelog,
    },
    actor,
    now,
  );

  const sourceMetadata: SkillSourceMetadata = {
    repositoryUrl: input.repositoryUrl.trim(),
    repositoryName: input.repositoryName.trim(),
  };

  const skill = {
    ...result.skill,
    source: "Controlled Git",
    sourceMetadata,
  };

  return {
    skill,
    auditLog: createAuditLog(actor, "import_git", skill, now),
    importSource: createImportSource(input, now),
    importJob: createImportJob(input, skill, actor, now),
  };
}

export function updateSkillContent(
  skill: Skill,
  input: UpdateSkillInput,
  actor: Actor,
  now: string,
): MutationResult {
  requireAdmin(actor);
  validateText(input.readme, "Content body");
  validateText(input.version, "Version number");
  validateText(input.changelog, "Changelog");

  const version: SkillVersion = {
    id: `${skill.id}-${toId(input.version)}-${skill.versions.length + 1}`,
    version: input.version.trim(),
    content: input.readme.trim(),
    changelog: input.changelog.trim(),
    createdAt: now,
    author: actor.name,
  };

  const nextStatus = skill.status === "published" ? "pending_review" : skill.status;
  const updatedSkill: Skill = {
    ...skill,
    name: input.name?.trim() || skill.name,
    description: input.description?.trim() || skill.description,
    category: input.category?.trim() || skill.category,
    tags: input.tags ? normalizeList(input.tags) : skill.tags,
    compatibleTools: input.compatibleTools
      ? normalizeList(input.compatibleTools)
      : skill.compatibleTools,
    maintainingTeam: input.maintainingTeam?.trim() || skill.maintainingTeam,
    maintainers: input.maintainers
      ? normalizeList(input.maintainers)
      : skill.maintainers,
    installMethod: input.installMethod?.trim() || skill.installMethod,
    dependencies: input.dependencies
      ? normalizeList(input.dependencies)
      : skill.dependencies,
    readme: input.readme.trim(),
    status: nextStatus,
    updatedAt: now,
    versions: [...skill.versions, version],
  };

  return {
    skill: updatedSkill,
    auditLog: createAuditLog(actor, "edit", updatedSkill, now),
  };
}

export function transitionSkill(
  skill: Skill,
  targetStatus: SkillStatus,
  actor: Actor,
  options: TransitionOptions,
): MutationResult {
  requireAdmin(actor);

  if (!SKILL_STATUSES.includes(targetStatus)) {
    throw validationError("Unsupported status");
  }

  if (targetStatus === "published" && !options.versionId) {
    throw validationError("Publishing requires a version");
  }

  const nextVersions =
    targetStatus === "published"
      ? skill.versions.map((version) =>
          version.id === options.versionId
            ? {
                ...version,
                publishedAt: options.now,
                publisher: actor.name,
              }
            : version,
        )
      : skill.versions;

  const updatedSkill: Skill = {
    ...skill,
    status: targetStatus,
    updatedAt: options.now,
    currentVersionId:
      targetStatus === "published"
        ? options.versionId ?? skill.currentVersionId
        : skill.currentVersionId,
    versions: nextVersions,
  };

  return {
    skill: updatedSkill,
    auditLog: createAuditLog(actor, actionForStatus(targetStatus), updatedSkill, options.now),
  };
}

export function applyBulkAction(
  skills: Skill[],
  action: BulkAction,
  actor: Actor,
  now: string,
): BulkMutationResult {
  requireAdmin(actor);
  const selectedIds = new Set(action.skillIds);

  const results = skills.map((skill) => {
    if (!selectedIds.has(skill.id)) {
      return {
        skill,
        auditLog: null,
      };
    }

    if (action.type === "change_category") {
      validateText(action.category, "Category");
      const updatedSkill = {
        ...skill,
        category: action.category.trim(),
        updatedAt: now,
      };

      return {
        skill: updatedSkill,
        auditLog: createAuditLog(actor, "change_category", updatedSkill, now),
      };
    }

    const targetStatus = bulkActionToStatus(action.type);
    const versionId =
      action.type === "publish"
        ? action.versionId ?? skill.versions.at(-1)?.id
        : undefined;
    return transitionSkill(skill, targetStatus, actor, { versionId, now });
  });

  return {
    skills: results.map((result) => result.skill),
    auditLogs: results
      .map((result) => result.auditLog)
      .filter((log): log is AuditLog => Boolean(log)),
  };
}

export function trackSkillVersion(
  skills: Skill[],
  trackedVersions: TrackedVersion[],
  input: TrackVersionInput,
  actor: Actor,
  now: string,
): TrackVersionResult {
  validateText(input.skillId, "Skill id");
  validateText(input.versionId, "Version id");

  const skill = skills.find((item) => item.id === input.skillId);

  if (!skill || !canTrackSkill(actor, skill)) {
    throw notFoundError("Skill");
  }

  if (!skill.versions.some((version) => version.id === input.versionId)) {
    throw notFoundError("Version");
  }

  return {
    trackedVersions: [
      ...trackedVersions.filter(
        (item) => item.userId !== actor.id || item.skillId !== input.skillId,
      ),
      {
        userId: actor.id,
        skillId: input.skillId,
        versionId: input.versionId,
      },
    ],
    auditLog: createAuditLog(actor, "track_version", skill, now),
  };
}

export function requireAdmin(actor: Actor): void {
  if (actor.role !== "admin") {
    throw forbiddenError();
  }
}

function validateDraftInput(input: SkillDraftInput): void {
  validateText(input.name, "Skill name");
  validateText(input.description, "Description");
  validateText(input.category, "Category");
  validateText(input.maintainingTeam, "Owner/team");
  validateList(input.compatibleTools, "Compatible tools");
  validateList(input.maintainers, "Maintainers");
  validateText(input.installMethod, "Installation method");
  validateText(input.readme, "Content body");
  validateText(input.version, "Version number");
  validateText(input.changelog, "Changelog");
}

function validateControlledGitInput(input: GitImportInput): void {
  validateText(input.repositoryUrl, "Repository URL");
  validateText(input.repositoryName, "Repository name");

  if (!input.repositoryUrl.startsWith(CONTROLLED_GIT_HOST)) {
    throw validationError("Only controlled internal Git repositories are supported");
  }

  validateDraftInput({
    name: input.name,
    description: input.description,
    category: input.category,
    compatibleTools: input.compatibleTools,
    maintainingTeam: input.maintainingTeam,
    maintainers: ["importer"],
    installMethod: "Internal registry",
    readme: input.readme,
    version: input.version,
    changelog: input.changelog,
  });
}

function canTrackSkill(actor: Actor, skill: Skill): boolean {
  return (
    actor.role === "admin" ||
    skill.status === "published" ||
    skill.status === "deprecated"
  );
}

function validateText(value: string | undefined, label: string): void {
  if (!value?.trim()) {
    throw validationError(`${label} is required`);
  }
}

function validateList(values: string[] | undefined, label: string): void {
  if (!values || normalizeList(values).length === 0) {
    throw validationError(`${label} is required`);
  }
}

function normalizeList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function bulkActionToStatus(type: Exclude<BulkAction["type"], "change_category">): SkillStatus {
  if (type === "publish") {
    return "published";
  }

  if (type === "unpublish") {
    return "deprecated";
  }

  return "archived";
}

function actionForStatus(status: SkillStatus): string {
  const actionByStatus: Record<SkillStatus, string> = {
    draft: "move_to_draft",
    pending_review: "submit_review",
    published: "publish",
    deprecated: "unpublish",
    archived: "archive",
  };

  return actionByStatus[status];
}

function createAuditLog(
  actor: Actor,
  action: string,
  skill: Skill,
  now: string,
): AuditLog {
  return {
    id: `${skill.id}-${action}-${Date.parse(now)}`,
    actorId: actor.id,
    actorName: actor.name,
    action,
    targetId: skill.id,
    targetName: skill.name,
    createdAt: now,
    summary: `${actor.name} performed ${action} on ${skill.name}`,
  };
}

function createImportSource(input: GitImportInput, now: string): GitImportSource {
  const url = new URL(input.repositoryUrl.trim());
  const repositoryName = input.repositoryName.trim();

  return {
    id: `source-${toId(`${url.host}-${repositoryName || url.pathname}`)}`,
    repositoryUrl: input.repositoryUrl.trim(),
    repositoryName,
    trustedHost: url.host,
    createdAt: now,
  };
}

function createImportJob(
  input: GitImportInput,
  skill: Skill,
  actor: Actor,
  now: string,
): GitImportJob {
  const source = createImportSource(input, now);

  return {
    id: `${skill.id}-import-${Date.parse(now)}`,
    sourceId: source.id,
    skillId: skill.id,
    actorId: actor.id,
    status: "succeeded",
    createdAt: now,
    completedAt: now,
  };
}

function toId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
