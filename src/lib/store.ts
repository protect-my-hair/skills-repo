import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { seededStore, type SkillStoreSnapshot } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "skills-store.json");

export async function readStore(): Promise<SkillStoreSnapshot> {
  await ensureStore();
  const raw = await readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<SkillStoreSnapshot>;

  if (
    !Array.isArray(parsed.skills) ||
    !Array.isArray(parsed.trackedVersions) ||
    !Array.isArray(parsed.auditLogs)
  ) {
    throw new Error("Skill store is corrupted");
  }

  return {
    skills: parsed.skills,
    trackedVersions: parsed.trackedVersions,
    auditLogs: parsed.auditLogs,
  };
}

export async function writeStore(snapshot: SkillStoreSnapshot): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function updateStore(
  updater: (snapshot: SkillStoreSnapshot) => SkillStoreSnapshot,
): Promise<SkillStoreSnapshot> {
  const snapshot = await readStore();
  const nextSnapshot = updater(snapshot);
  await writeStore(nextSnapshot);
  return nextSnapshot;
}

async function ensureStore(): Promise<void> {
  try {
    await readFile(STORE_PATH, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      await writeStore(seededStore);
      return;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
