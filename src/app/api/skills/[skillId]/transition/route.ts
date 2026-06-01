import { NextResponse } from "next/server";

import { notFoundError } from "@/lib/api-errors";
import type { SkillStatus } from "@/lib/domain";
import { errorResponse, getActorFromSession } from "@/lib/http";
import { buildSkillsReadModel } from "@/lib/read-model";
import { updateSkillsSnapshot } from "@/lib/skill-repository";
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
  rejectionReason?: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await getActorFromSession();
    const { skillId } = await params;
    const body = (await request.json()) as TransitionBody;
    const now = new Date().toISOString();

    const snapshot = await updateSkillsSnapshot((current) => {
      const target = current.skills.find((skill) => skill.id === skillId);

      if (!target) {
        throw notFoundError("Skill");
      }

      const result = transitionSkill(target, body.status, actor, {
        versionId: body.versionId,
        now,
        rejectionReason: body.rejectionReason,
      });

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
