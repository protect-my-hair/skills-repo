import { NextResponse } from "next/server";

import { errorResponse, getActorFromSession } from "@/lib/http";
import { buildSkillsReadModel } from "@/lib/read-model";
import { updateSkillsSnapshot } from "@/lib/skill-repository";
import { trackSkillVersion, type TrackVersionInput } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = await getActorFromSession();
    const body = (await request.json()) as TrackVersionInput;
    const now = new Date().toISOString();

    const snapshot = await updateSkillsSnapshot((current) => {
      const result = trackSkillVersion(
        current.skills,
        current.trackedVersions,
        body,
        actor,
        now,
      );

      return {
        ...current,
        trackedVersions: result.trackedVersions,
        auditLogs: [result.auditLog, ...current.auditLogs],
      };
    });

    return NextResponse.json(buildSkillsReadModel(snapshot, actor));
  } catch (error) {
    return errorResponse(error);
  }
}
