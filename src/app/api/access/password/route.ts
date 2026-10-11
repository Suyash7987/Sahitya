import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { createSessionToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import { DeskCredential } from "@/models/DeskCredential";
import { User } from "@/models/User";

export async function PATCH(request: Request) {
  const { session, error } = await requireUser(["admin"]);
  if (error || !session) return error;

  const body = await request.json().catch(() => null);
  const role = body?.role === "desk" ? "desk" : body?.role === "admin" ? "admin" : "";
  const password = String(body?.password ?? "");

  if (!role) return jsonError("Choose Admin or Front desk.");
  if (password.length < 6) return jsonError("Password must be at least 6 characters.");

  await dbConnect();
  const passwordHash = await bcrypt.hash(password, 10);

  if (role === "admin") {
    const updated = await User.findOneAndUpdate(
      { _id: session.userId, role: "admin" },
      { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
      { new: true },
    );
    if (!updated) return jsonError("Your admin account was not found.", 404);
    const token = await createSessionToken({
      userId: String(updated._id),
      username: updated.username,
      name: updated.name,
      role: "admin",
      sessionVersion: updated.sessionVersion ?? 0,
    });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, role: "admin" });
  }

  await DeskCredential.findOneAndUpdate(
    { key: "desk" },
    { passwordHash },
    { upsert: true, new: true },
  );
  const updated = await User.updateMany(
    { role: "desk" },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
  );

  return NextResponse.json({ ok: true, role: "desk", accounts: updated.modifiedCount });
}
