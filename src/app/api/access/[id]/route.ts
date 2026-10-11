import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isValidId, jsonError, requireUser } from "@/lib/api";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/access/[id]">,
) {
  const { session, error } = await requireUser(["admin"]);
  if (error || !session) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("That person was not found.", 404);
  if (id === session.userId) return jsonError("You cannot remove your own access.");

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return jsonError("That person was not found.", 404);
  if (user.role !== "desk") return jsonError("Only front desk access can be removed.");

  await user.deleteOne();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/access/[id]">,
) {
  const { session, error } = await requireUser(["admin"]);
  if (error || !session) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("That account was not found.", 404);

  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "");
  if (password.length < 6) return jsonError("Password must be at least 6 characters.");

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return jsonError("That account was not found.", 404);

  const isSelf = user._id.toString() === session.userId;
  if (!isSelf && user.role !== "desk") {
    return jsonError("You can update a front desk password, or your own admin password.");
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  return NextResponse.json({ ok: true });
}
