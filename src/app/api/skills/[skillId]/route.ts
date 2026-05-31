import { NextResponse } from "next/server";

import { errorResponse, getActorFromRequest } from "@/lib/http";
import { updateStore } from "@/lib/store";
import { updateSkillContent, type UpdateSkillInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    skillId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = getActorFromRequest(request);
    const { skillId } = await params;
    const input = (await request.json()) as UpdateSkillInput;
    const now = new Date().toISOString();

    const snapshot = await updateStore((current) => {
      const target = current.skills.find((skill) => skill.id === skillId);

      if (!target) {
        throw new Error("Skill not found");
      }

      const result = updateSkillContent(target, input, actor, now);

      return {
        ...current,
        skills: current.skills.map((skill) =>
          skill.id === skillId ? result.skill : skill,
        ),
        auditLogs: [result.auditLog, ...current.auditLogs],
      };
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    return errorResponse(error);
  }
}
