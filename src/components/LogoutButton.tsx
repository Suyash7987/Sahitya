"use client";

import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="danger" size="sm" className={className} onClick={logout} disabled={pending}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
