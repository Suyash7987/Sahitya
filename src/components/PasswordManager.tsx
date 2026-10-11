"use client";

import { Button } from "@/components/Button";
import { Field, SelectInput, TextInput } from "@/components/Field";
import { FormEvent, useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
};

export function PasswordManager({ deskUsers }: { deskUsers: Account[] }) {
  const [self, setSelf] = useState<Account | null>(null);
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/access");
      if (!response.ok) return;
      const data = (await response.json()) as { self?: Account | null };
      setSelf(data.self ?? null);
    }
    void load();
  }, []);

  useEffect(() => {
    const ids = new Set([...(self ? [self.id] : []), ...deskUsers.map((user) => user.id)]);
    setAccountId((current) => {
      if (current && ids.has(current)) return current;
      return self?.id ?? deskUsers[0]?.id ?? "";
    });
  }, [self, deskUsers]);

  function label(account: Account, kind: "admin" | "desk") {
    const detail = [account.email, account.phone].filter(Boolean).join(" · ") || account.username;
    if (kind === "admin") return `${account.name} (Admin) · ${detail}`;
    return `${account.name} (Front desk) · ${detail}`;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    if (!accountId) {
      setError("Choose an account.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setPending(true);
    const response = await fetch(`/api/access/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not update the password.");
      setPending(false);
      return;
    }
    setPassword("");
    setConfirm("");
    setSaved("Password updated.");
    setPending(false);
  }

  const hasAccounts = Boolean(self) || deskUsers.length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6">
      <Field label="Account">
        <SelectInput
          value={accountId}
          onChange={(event) => {
            setAccountId(event.target.value);
            setSaved("");
          }}
          required
          disabled={!hasAccounts}
        >
          {self ? (
            <option value={self.id}>{label(self, "admin")}</option>
          ) : null}
          {deskUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {label(user, "desk")}
            </option>
          ))}
        </SelectInput>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <p className="text-sm text-muted">
        This replaces the current password. Front desk staff sign in with their email, phone, or
        username and this new password. Your admin sign-in uses the same new password when you
        choose your own account.
      </p>
      {error ? <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p> : null}
      {saved ? <p className="rounded-xl bg-forest/10 px-3 py-2 text-sm text-forest">{saved}</p> : null}
      <Button type="submit" disabled={pending || !hasAccounts}>
        {pending ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}
