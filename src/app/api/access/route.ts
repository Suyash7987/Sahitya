import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { dbConnect } from "@/lib/mongodb";
import { isEmail } from "@/lib/utils";
import { DeskCredential } from "@/models/DeskCredential";
import { User } from "@/models/User";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function toAccessUser(user: {
  _id: { toString(): string };
  name: string;
  username: string;
  email?: string;
  phone?: string;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email ?? "",
    phone: user.phone ?? "",
  };
}

export async function GET() {
  const { session, error } = await requireUser(["admin"]);
  if (error || !session) return error;

  await dbConnect();
  const [users, self] = await Promise.all([
    User.find({ role: "desk" }).sort({ name: 1 }),
    User.findById(session.userId),
  ]);
  return NextResponse.json({
    users: users.map(toAccessUser),
    self: self ? toAccessUser(self) : null,
  });
}

export async function POST(request: Request) {
  const { error } = await requireUser(["admin"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = digits(String(body?.phone ?? ""));

  if (!name) return jsonError("Name is required.");
  if (!email && !phone) return jsonError("Enter an email or a phone number.");
  if (email && !isEmail(email)) return jsonError("Enter a valid email address.");
  if (phone && phone.length < 10) return jsonError("Enter a valid phone number.");

  const username = email || phone;

  try {
    await dbConnect();
    const existing = await User.findOne({
      $or: [
        { username },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });
    if (existing) {
      return jsonError("That email or phone already has access.");
    }

    const credential = await DeskCredential.findOne({ key: "desk" });
    if (!credential) {
      return jsonError("Set the front desk password first.");
    }

    const user = await User.create({
      name,
      username,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      passwordHash: credential.passwordHash,
      role: "desk",
    });

    return NextResponse.json({ user: toAccessUser(user) }, { status: 201 });
  } catch (error) {
    console.error("Grant desk access failed:", error);
    return jsonError("Could not grant access. Please try again.", 500);
  }
}
