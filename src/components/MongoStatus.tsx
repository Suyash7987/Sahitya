"use client";

import { Button } from "@/components/Button";

export function MongoStatus({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-clay/30 bg-clay/10 px-4 py-5 sm:rounded-3xl sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-clay">Database</p>
      <h2 className="mt-2 font-display text-2xl">Could not reach MongoDB</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{message}</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Confirm <code className="rounded bg-paper px-1.5 py-0.5">MONGODB_URI</code> in{" "}
        <code className="rounded bg-paper px-1.5 py-0.5">.env.local</code>, allow this
        computer&apos;s IP in Atlas Network Access, then retry.
      </p>
      <Button className="mt-5" onClick={() => window.location.reload()}>
        Retry connection
      </Button>
    </div>
  );
}
