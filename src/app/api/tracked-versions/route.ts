import { NextResponse } from "next/server";

import { errorResponse, getActorFromRequest } from "@/lib/http";
import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TrackBody {
  skillId: string;
  versionId: string;
}

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const body = (await request.json()) as TrackBody;

    const snapshot = await updateStore((current) => ({
      ...current,
      trackedVersions: [
        ...current.trackedVersions.filter(
          (item) => item.userId !== actor.id || item.skillId !== body.skillId,
        ),
        {
          userId: actor.id,
          skillId: body.skillId,
          versionId: body.versionId,
        },
      ],
    }));

    return NextResponse.json(snapshot);
  } catch (error) {
    return errorResponse(error);
  }
}
