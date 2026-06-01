import { NextResponse } from "next/server";

import { errorResponse, getActorFromSession } from "@/lib/http";
import { buildSkillsReadModel } from "@/lib/read-model";
import { updateSkillsSnapshot } from "@/lib/skill-repository";
import { applyBulkAction, type BulkAction } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await getActorFromSession();
    const action = (await request.json()) as BulkAction;
    const now = new Date().toISOString();

    const snapshot = await updateSkillsSnapshot((current) => {
      const result = applyBulkAction(current.skills, action, actor, now);

      return {
        ...current,
        skills: result.skills,
        auditLogs: [...result.auditLogs, ...current.auditLogs],
      };
    });

    return NextResponse.json(buildSkillsReadModel(snapshot, actor));
  } catch (error) {
    return errorResponse(error);
  }
}
