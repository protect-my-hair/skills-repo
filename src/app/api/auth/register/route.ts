import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { registerUserAccount } from "@/lib/user-accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await registerUserAccount(await request.json());

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
