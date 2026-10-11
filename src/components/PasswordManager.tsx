"use client";

import { Button } from "@/components/Button";
import { Field, TextInput } from "@/components/Field";
import { pauseSessionWatch } from "@/lib/sessionWatch";
import { FormEvent, useState } from "react";

function PasswordCard({
  title,
  hint,
  role,
  savedLabel,
}: {
  title: string;
  hint: string;
  role: "admin" | "desk";
  savedLabel: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setPending(true);
    pauseSessionWatch();
    const response = await fetch("/api/access/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not update the password.");
      setPending(false);
      return;
    }
    setPassword("");
    setConfirm("");
    setSaved(savedLabel);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6">
      <div>
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{hint}</p>
      </div>
      <Field label="New password">
        <TextInput
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
      </Field>
      <Field label="Confirm password">
        <TextInput
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
      </Field>
      {error ? <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p> : null}
      {saved ? <p className="rounded-xl bg-forest/10 px-3 py-2 text-sm text-forest">{saved}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}

export function PasswordManager() {
  return (
    <div className="grid gap-4">
      <PasswordCard
        title="Admin"
        role="admin"
        hint="This replaces the password for your admin sign-in."
        savedLabel="Admin password updated."
      />
      <PasswordCard
        title="Front desk"
        role="desk"
        hint="This becomes the password for every front desk sign-in. Each person still uses their own email, phone, or username."
        savedLabel="Front desk password updated. Every front desk sign-in now uses this password."
      />
    </div>
  );
}
