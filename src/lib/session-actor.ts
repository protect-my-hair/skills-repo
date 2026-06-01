import type { Actor, ActorRole } from "./domain";

interface SessionUserLike {
  id?: unknown;
  name?: unknown;
  role?: unknown;
}

const ACTOR_ROLES = new Set<ActorRole>(["employee", "admin"]);

export function actorFromSessionUser(user: SessionUserLike | null): Actor | null {
  if (
    !user ||
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.role !== "string" ||
    !ACTOR_ROLES.has(user.role as ActorRole)
  ) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role as ActorRole,
  };
}
