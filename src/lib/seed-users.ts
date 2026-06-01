export interface SeedInternalUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
}

export interface SeedVersionActor {
  author: string;
  publisher?: string | null;
}

export interface DatabaseUserSeed {
  id: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "EMPLOYEE";
}

export function collectSeedUsers(input: {
  internalUsers: SeedInternalUser[];
  versionActors: SeedVersionActor[];
}): DatabaseUserSeed[] {
  const users = new Map<string, DatabaseUserSeed>();

  for (const user of input.internalUsers) {
    users.set(user.id, toDatabaseUserSeed(user));
  }

  for (const actor of input.versionActors) {
    const authorSeed = userSeedForName(actor.author, input.internalUsers);
    users.set(authorSeed.id, authorSeed);

    if (actor.publisher) {
      const publisherSeed = userSeedForName(actor.publisher, input.internalUsers);
      users.set(publisherSeed.id, publisherSeed);
    }
  }

  return [...users.values()];
}

export function seedUserIdForName(
  name: string,
  internalUsers: SeedInternalUser[],
): string {
  const internalUser = internalUsers.find((user) => user.name === name);

  if (internalUser) {
    return internalUser.id;
  }

  return `user-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function userSeedForName(
  name: string,
  internalUsers: SeedInternalUser[],
): DatabaseUserSeed {
  const internalUser = internalUsers.find((user) => user.name === name);

  if (internalUser) {
    return toDatabaseUserSeed(internalUser);
  }

  return {
    id: seedUserIdForName(name, internalUsers),
    name,
    email: null,
    role: "EMPLOYEE",
  };
}

function toDatabaseUserSeed(user: SeedInternalUser): DatabaseUserSeed {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "ADMIN" : "EMPLOYEE",
  };
}
