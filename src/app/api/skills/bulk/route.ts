import { NextResponse } from "next/server";

import { errorResponse, getActorFromRequest } from "@/lib/http";
import { updateStore } from "@/lib/store";
import { applyBulkAction, type BulkAction } from "@/lib/skill-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const action = (await request.json()) as BulkAction;
    const now = new Date().toISOString();

    const snapshot = await updateStore((current) => {
      const result = applyBulkAction(current.skills, action, actor, now);

      return {
        ...current,
        skills: result.skills,
        auditLogs: [...result.auditLogs, ...current.auditLogs],
      };
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    return errorResponse(error);
  }
}
