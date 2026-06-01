import { NextResponse } from "next/server";

import { errorResponse, getActorFromSession } from "@/lib/http";
import { notFoundError } from "@/lib/api-errors";
import { buildSkillsReadModel } from "@/lib/read-model";
import { updateSkillsSnapshot } from "@/lib/skill-repository";
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
    const actor = await getActorFromSession();
    const { skillId } = await params;
    const input = (await request.json()) as UpdateSkillInput;
    const now = new Date().toISOString();

    const snapshot = await updateSkillsSnapshot((current) => {
      const target = current.skills.find((skill) => skill.id === skillId);

      if (!target) {
        throw notFoundError("Skill");
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

    return NextResponse.json(buildSkillsReadModel(snapshot, actor));
  } catch (error) {
    return errorResponse(error);
  }
}
