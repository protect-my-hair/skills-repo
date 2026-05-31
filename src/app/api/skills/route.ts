import { NextResponse } from "next/server";

import { errorResponse, getActorFromRequest } from "@/lib/http";
import { readStore, updateStore } from "@/lib/store";
import { createSkillDraft, type SkillDraftInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await readStore());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const input = (await request.json()) as SkillDraftInput;
    const now = new Date().toISOString();
    let createdId = "";

    const snapshot = await updateStore((current) => {
      const result = createSkillDraft(input, actor, now);
      createdId = result.skill.id;

      return {
        ...current,
        skills: [result.skill, ...current.skills],
        auditLogs: [result.auditLog, ...current.auditLogs],
      };
    });

    return NextResponse.json({ ...snapshot, selectedSkillId: createdId });
  } catch (error) {
    return errorResponse(error);
  }
}
