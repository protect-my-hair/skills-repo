import { NextResponse } from "next/server";

import { errorResponse, getActorFromSession } from "@/lib/http";
import { buildSkillsReadModel } from "@/lib/read-model";
import { updateSkillsSnapshot } from "@/lib/skill-repository";
import { importSkillFromGit, type GitImportInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await getActorFromSession();
    const input = (await request.json()) as GitImportInput;
    const now = new Date().toISOString();
    let createdId = "";

    const snapshot = await updateSkillsSnapshot((current) => {
      const result = importSkillFromGit(input, actor, now);
      createdId = result.skill.id;

      return {
        ...current,
        skills: [result.skill, ...current.skills],
        auditLogs: [result.auditLog, ...current.auditLogs],
        gitImportSources: upsertImportSource(
          current.gitImportSources,
          result.importSource,
        ),
        gitImportJobs: [result.importJob, ...current.gitImportJobs],
      };
    });

    return NextResponse.json({
      ...buildSkillsReadModel(snapshot, actor),
      selectedSkillId: createdId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function upsertImportSource<T extends { id: string }>(
  sources: T[],
  source: T,
): T[] {
  if (!sources.some((item) => item.id === source.id)) {
    return [source, ...sources];
  }

  return sources.map((item) => (item.id === source.id ? source : item));
}
