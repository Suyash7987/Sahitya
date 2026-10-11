import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { createSessionToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import { mongoErrorMessage } from "@/lib/mongoUri";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const raw = String(body?.username ?? "").trim();
    const username = raw.toLowerCase();
    const phone = raw.replace(/\D/g, "");
    const password = String(body?.password ?? "");

    if (!username || !password) {
      return jsonError("Enter both username and password.");
    }

    await dbConnect();

    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        ...(phone.length >= 10 ? [{ phone }] : []),
      ],
    });
    if (!user) {
      return jsonError("Invalid username or password.", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return jsonError("Invalid username or password.", 401);
    }

    const token = await createSessionToken({
      userId: String(user._id),
      username: user.username,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion ?? 0,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        userId: String(user._id),
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    const message =
      error instanceof Error ? error.message : mongoErrorMessage(error);
    return jsonError(message, 503);
  }
}
