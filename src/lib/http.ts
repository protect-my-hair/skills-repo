import { NextResponse } from "next/server";

import type { Actor } from "./domain";

const ADMIN_ACTOR: Actor = {
  id: "admin-1",
  name: "Mira Admin",
  role: "admin",
};

const EMPLOYEE_ACTOR: Actor = {
  id: "employee-1",
  name: "Eli Employee",
  role: "employee",
};

export function getActorFromRequest(request: Request): Actor {
  return request.headers.get("x-demo-role") === "admin"
    ? ADMIN_ACTOR
    : EMPLOYEE_ACTOR;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Request failed";
  const status = message === "Admin role required" ? 403 : 400;
  return jsonError(message, status);
}
