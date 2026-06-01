import type { Actor, ActorRole } from "./domain";

export interface InternalAuthUser extends Actor {
  email: string;
}

export const INTERNAL_AUTH_USERS: InternalAuthUser[] = [
  {
    id: "admin-1",
    name: "Mira Admin",
    email: "admin@skills.local",
    role: "admin",
  },
  {
    id: "employee-1",
    name: "Eli Employee",
    email: "employee@skills.local",
    role: "employee",
  },
];

export function getInternalUserByEmail(email: string): InternalAuthUser | null {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    INTERNAL_AUTH_USERS.find((user) => user.email === normalizedEmail) ?? null
  );
}

export function toActor(user: InternalAuthUser): Actor {
  return {
    id: user.id,
    name: user.name,
    role: user.role as ActorRole,
  };
}
