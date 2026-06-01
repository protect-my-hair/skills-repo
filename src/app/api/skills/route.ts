import { NextResponse } from "next/server";

import { errorResponse, getActorFromSession } from "@/lib/http";
import { buildSkillsReadModel } from "@/lib/read-model";
import { readSkillsSnapshot, updateSkillsSnapshot } from "@/lib/skill-repository";
import { createSkillDraft, type SkillDraftInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await getActorFromSession();
    return NextResponse.json(
      buildSkillsReadModel(await readSkillsSnapshot(), actor),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActorFromSession();
    const input = (await request.json()) as SkillDraftInput;
    const now = new Date().toISOString();
    let createdId = "";

    const snapshot = await updateSkillsSnapshot((current) => {
      const result = createSkillDraft(input, actor, now);
      createdId = result.skill.id;

      return {
        ...current,
        skills: [result.skill, ...current.skills],
        auditLogs: [result.auditLog, ...current.auditLogs],
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
