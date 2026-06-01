import type { Actor, AuditLog, Skill, TrackedVersion } from "./domain";
import { getSkillSummary, type SkillSummary } from "./domain";
import type { SkillStoreSnapshot } from "./seed-data";

export interface SkillsReadModel {
  currentUser: Actor;
  capabilities: {
    canManageSkills: boolean;
  };
  skills: Skill[];
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
  const skills = canManageSkills
    ? snapshot.skills
    : snapshot.skills.filter((skill) => canReadSkill(actor, skill));
  const trackedVersions = canManageSkills
    ? snapshot.trackedVersions
    : snapshot.trackedVersions.filter((item) => item.userId === actor.id);
  const auditLogs = canManageSkills ? snapshot.auditLogs : [];

  return {
    currentUser: actor,
    capabilities: {
      canManageSkills,
    },
    skills,
    trackedVersions,
    auditLogs,
    summary: getSkillSummary(skills),
  };
}

export function canReadSkill(actor: Actor, skill: Skill): boolean {
  return (
    actor.role === "admin" || EMPLOYEE_VISIBLE_STATUSES.has(skill.status)
  );
}
