import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { toErrorPayload, unauthorizedError } from "./api-errors";
import type { Actor } from "./domain";
import { actorFromSessionUser } from "./session-actor";

export async function getActorFromSession(): Promise<Actor> {
  const session = await auth();
  const actor = actorFromSessionUser(session?.user ?? null);

  if (!actor) {
    throw unauthorizedError();
  }

  return actor;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function errorResponse(error: unknown): NextResponse {
  const payload = toErrorPayload(error);
  return NextResponse.json(payload.body, { status: payload.status });
}
