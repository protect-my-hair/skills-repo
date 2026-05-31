import { NextResponse } from "next/server";

import type { SkillStatus } from "@/lib/domain";
import { errorResponse, getActorFromRequest } from "@/lib/http";
import { updateStore } from "@/lib/store";
import { transitionSkill } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    skillId: string;
  }>;
}

interface TransitionBody {
  status: SkillStatus;
  versionId?: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = getActorFromRequest(request);
    const { skillId } = await params;
    const body = (await request.json()) as TransitionBody;
    const now = new Date().toISOString();

    const snapshot = await updateStore((current) => {
      const target = current.skills.find((skill) => skill.id === skillId);

      if (!target) {
        throw new Error("Skill not found");
      }

      const result = transitionSkill(target, body.status, actor, {
        versionId: body.versionId,
        now,
      });

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
