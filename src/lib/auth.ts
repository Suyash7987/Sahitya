import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSessionToken } from "@/lib/jwt";
import type { SessionUser } from "@/types";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}
