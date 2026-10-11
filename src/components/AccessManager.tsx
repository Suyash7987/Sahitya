"use client";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field, TextInput } from "@/components/Field";
import { FormEvent, useEffect, useState } from "react";

type AccessUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
};

export function AccessManager({
  onUsersChange,
}: {
  onUsersChange?: (users: AccessUser[]) => void;
}) {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AccessUser | null>(null);

  async function load() {
    const response = await fetch("/api/access");
    if (!response.ok) return;
    const data = (await response.json()) as { users?: AccessUser[] };
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    onUsersChange?.(users);
  }, [users, onUsersChange]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; user?: AccessUser };
    if (!response.ok || !data.user) {
      setError(data.error ?? "Could not grant access.");
      setPending(false);
      return;
    }
    setUsers((current) => [...current, data.user!].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPending(false);
  }

  async function removeAccess() {
    if (!removeTarget) return;
    setPending(true);
    const response = await fetch(`/api/access/${removeTarget.id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not remove access.");
      setPending(false);
      return;
    }
    setUsers((current) => current.filter((user) => user.id !== removeTarget.id));
    setRemoveTarget(null);
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6">
        <Field label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="10-digit number"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </Field>
        <p className="text-sm text-muted">
          Enter an email, a phone number, or both. They sign in with that and this password, and can
          use the front desk only.
        </p>
        {error ? <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Grant access"}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-card sm:rounded-3xl">
        {users.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No front desk access yet.</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-3 border-b border-line px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted">
                    {[user.email, user.phone].filter(Boolean).join(" · ") || user.username}
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setRemoveTarget(user)}>
                  Remove access
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove front desk access?"
        message={
          removeTarget
            ? `${removeTarget.name} will no longer be able to sign in to the front desk.`
            : ""
        }
        confirmLabel="Remove"
        pending={pending}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={removeAccess}
      />
    </div>
  );
}
