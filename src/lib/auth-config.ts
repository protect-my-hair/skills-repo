interface AuthEnv {
  [key: string]: string | undefined;
  SKILLS_REPO_ENABLE_INTERNAL_AUTH?: string;
}

export function isInternalAuthEnabled(
  env: AuthEnv = process.env,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  const value = env.SKILLS_REPO_ENABLE_INTERNAL_AUTH?.trim().toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return nodeEnv !== "production";
}
