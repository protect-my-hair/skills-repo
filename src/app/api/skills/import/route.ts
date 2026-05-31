import { NextResponse } from "next/server";

import { errorResponse, getActorFromRequest } from "@/lib/http";
import { updateStore } from "@/lib/store";
import { importSkillFromGit, type GitImportInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const input = (await request.json()) as GitImportInput;
    const now = new Date().toISOString();
    let createdId = "";

    const snapshot = await updateStore((current) => {
      const result = importSkillFromGit(input, actor, now);
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
