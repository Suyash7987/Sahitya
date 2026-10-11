import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import type { Role } from "@/types";

export async function requireUser(roles?: Role[]) {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Please sign in first." }, { status: 401 }),
    };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "You do not have access to this action." },
        { status: 403 },
      ),
    };
  }
  return { session, error: null };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}
