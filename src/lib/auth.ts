import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSessionToken } from "@/lib/jwt";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { SessionUser } from "@/types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session) return null;

  await dbConnect();
  const user = await User.findById(session.userId).select("sessionVersion");
  if (!user) return null;
  if ((user.sessionVersion ?? 0) !== session.sessionVersion) return null;
  return session;
}
