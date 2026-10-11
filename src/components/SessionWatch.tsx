"use client";

import { sessionWatchGeneration } from "@/lib/sessionWatch";
import { useEffect } from "react";

export function SessionWatch() {
  useEffect(() => {
    let stopped = false;

    async function check() {
      const generation = sessionWatchGeneration();
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (stopped || generation !== sessionWatchGeneration()) return;
      if (response.status === 401) {
        window.location.assign("/login");
      }
    }

    const timer = window.setInterval(() => {
      void check();
    }, 3000);
    window.addEventListener("focus", check);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
