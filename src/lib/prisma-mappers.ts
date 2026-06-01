import type { GitImportJobStatus, SkillStatus, SkillVisibility } from "./domain";

const SKILL_STATUS_TO_DATABASE: Record<SkillStatus, string> = {
  draft: "DRAFT",
  pending_review: "PENDING_REVIEW",
  published: "PUBLISHED",
  deprecated: "DEPRECATED",
  archived: "ARCHIVED",
};

const SKILL_VISIBILITY_TO_DATABASE: Record<SkillVisibility, string> = {
  personal: "PERSONAL",
  public: "PUBLIC",
};

const AUDIT_ACTION_TO_DATABASE: Record<string, string> = {
  create_draft: "CREATE_DRAFT",
  import_git: "IMPORT_GIT",
  edit: "EDIT",
  submit_review: "SUBMIT_REVIEW",
  approve_review: "APPROVE_REVIEW",
  reject_review: "REJECT_REVIEW",
  publish: "PUBLISH",
  unpublish: "UNPUBLISH",
  archive: "ARCHIVE",
  change_category: "CHANGE_CATEGORY",
  track_version: "TRACK_VERSION",
};

const IMPORT_JOB_STATUS_TO_DATABASE: Record<GitImportJobStatus, string> = {
  queued: "QUEUED",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
};

export function skillStatusToDatabase(status: SkillStatus): string {
  return SKILL_STATUS_TO_DATABASE[status];
}

export function skillStatusFromDatabase(status: string): SkillStatus {
  const match = Object.entries(SKILL_STATUS_TO_DATABASE).find(
    ([, databaseStatus]) => databaseStatus === status,
  );

  return (match?.[0] ?? "draft") as SkillStatus;
}

export function skillVisibilityToDatabase(visibility: SkillVisibility): string {
  return SKILL_VISIBILITY_TO_DATABASE[visibility];
}

export function skillVisibilityFromDatabase(visibility: string): SkillVisibility {
  const match = Object.entries(SKILL_VISIBILITY_TO_DATABASE).find(
    ([, databaseVisibility]) => databaseVisibility === visibility,
  );

  return (match?.[0] ?? "public") as SkillVisibility;
}

export function auditActionToDatabase(action: string): string {
  return AUDIT_ACTION_TO_DATABASE[action] ?? "EDIT";
}

export function auditActionFromDatabase(action: string): string {
  const match = Object.entries(AUDIT_ACTION_TO_DATABASE).find(
    ([, databaseAction]) => databaseAction === action,
  );

  return match?.[0] ?? "edit";
}

export function importJobStatusToDatabase(status: GitImportJobStatus): string {
  return IMPORT_JOB_STATUS_TO_DATABASE[status];
}

export function importJobStatusFromDatabase(status: string): GitImportJobStatus {
  const match = Object.entries(IMPORT_JOB_STATUS_TO_DATABASE).find(
    ([, databaseStatus]) => databaseStatus === status,
  );

  return (match?.[0] ?? "failed") as GitImportJobStatus;
}
