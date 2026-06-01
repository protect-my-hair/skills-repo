import type { Actor, AuditLog, Skill, TrackedVersion } from "./domain";
import { getSkillSummary, type SkillSummary } from "./domain";
import type { SkillStoreSnapshot } from "./seed-data";

export interface SkillsReadModel {
  currentUser: Actor;
  capabilities: {
    canManageSkills: boolean;
    canCreateSkills: boolean;
    canReviewSkills: boolean;
  };
  skills: Skill[];
  mySkills: Skill[];
  reviewQueue: Skill[];
  trackedVersions: TrackedVersion[];
  auditLogs: AuditLog[];
  summary: SkillSummary;
}

const EMPLOYEE_VISIBLE_STATUSES = new Set(["published", "deprecated"]);

export function buildSkillsReadModel(
  snapshot: SkillStoreSnapshot,
  actor: Actor,
): SkillsReadModel {
  const canManageSkills = actor.role === "admin";
  const canReviewSkills = actor.role === "admin";
  const skills = canManageSkills
    ? snapshot.skills
    : snapshot.skills.filter((skill) => isPublicRepositorySkill(skill));
  const mySkills = canManageSkills
    ? []
    : snapshot.skills.filter((skill) => isOwnedByActor(actor, skill));
  const reviewQueue = canReviewSkills
    ? snapshot.skills.filter((skill) => isPendingPersonalReview(skill))
    : [];
  const trackedVersions = canManageSkills
    ? snapshot.trackedVersions
    : snapshot.trackedVersions.filter((item) => item.userId === actor.id);
  const auditLogs = canManageSkills ? snapshot.auditLogs : [];

  return {
    currentUser: actor,
    capabilities: {
      canManageSkills,
      canCreateSkills: true,
      canReviewSkills,
    },
    skills,
    mySkills,
    reviewQueue,
    trackedVersions,
    auditLogs,
    summary: getSkillSummary(skills),
  };
}

export function canReadSkill(actor: Actor, skill: Skill): boolean {
  return (
    actor.role === "admin" ||
    isOwnedByActor(actor, skill) ||
    isPublicRepositorySkill(skill)
  );
}

function isPublicRepositorySkill(skill: Skill): boolean {
  return (
    visibilityOf(skill) === "public" && EMPLOYEE_VISIBLE_STATUSES.has(skill.status)
  );
}

function isOwnedByActor(actor: Actor, skill: Skill): boolean {
  return skill.ownerId === actor.id;
}

function isPendingPersonalReview(skill: Skill): boolean {
  return skill.status === "pending_review" && visibilityOf(skill) === "personal";
}

function visibilityOf(skill: Skill): "personal" | "public" {
  return skill.visibility ?? "public";
}
