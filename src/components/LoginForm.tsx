"use client";

import { Button } from "@/components/Button";
import { Field, TextInput } from "@/components/Field";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    let data: { error?: string; user?: { role: string } } = {};
    try {
      data = text ? (JSON.parse(text) as { error?: string; user?: { role: string } }) : {};
    } catch {
      setError("Sign-in failed. Please try again.");
      setPending(false);
      return;
    }

    if (!response.ok || !data.user) {
      setError(data.error ?? "Could not sign in.");
      setPending(false);
      return;
    }

    router.push(data.user.role === "admin" ? "/admin" : "/desk");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Email, phone, or username">
        <TextInput
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="Email, phone, or username"
          required
        />
      </Field>
      <Field label="Password">
        <TextInput
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      {error ? (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Enter Sahitya"}
      </Button>
    </form>
  );
}
