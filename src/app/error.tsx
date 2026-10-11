"use client";

import { Button } from "@/components/Button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="paper-grid flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Something went wrong</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">The counter needs a moment</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{error.message}</p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
