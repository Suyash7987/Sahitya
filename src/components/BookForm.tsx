"use client";

import { Button } from "@/components/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/Field";
import { ITEM_KINDS, LANGUAGES, type ItemKind } from "@/lib/constants";
import type { BookRecord } from "@/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function BookForm({ book }: { book?: BookRecord }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState<ItemKind>(book?.kind ?? "book");
  const [form, setForm] = useState({
    title: book?.title ?? "",
    language: book?.language || "English",
    code: book?.code ?? "",
    price: book ? String(book.price) : "",
    stock: book ? String(book.stock) : "",
    description: book?.description ?? "",
  });

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const payload =
      kind === "book"
        ? {
            kind,
            title: form.title,
            language: form.language,
            code: form.code,
            price: Number(form.price),
            stock: Number(form.stock),
            description: form.description,
          }
        : {
            kind,
            title: form.title,
            price: Number(form.price),
            stock: Number(form.stock),
          };

    const response = await fetch(book ? `/api/books/${book._id}` : "/api/books", {
      method: book ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let data: { error?: string } = {};
    try {
      data = text ? (JSON.parse(text) as { error?: string }) : {};
    } catch {
      setError("Could not save this item. Please try again.");
      setPending(false);
      return;
    }

    if (!response.ok) {
      setError(data.error ?? "Could not save this item.");
      setPending(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Item type">
        <SelectInput
          value={kind}
          onChange={(e) => setKind(e.target.value as ItemKind)}
        >
          {ITEM_KINDS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      {kind === "book" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <TextInput value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </Field>
            <Field label="Language">
              <SelectInput value={form.language} onChange={(e) => update("language", e.target.value)}>
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Price (INR)">
              <TextInput
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                required
              />
            </Field>
            <Field label="Stock">
              <TextInput
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
                required
              />
            </Field>
            <Field label="Code">
              <TextInput value={form.code} onChange={(e) => update("code", e.target.value)} required />
            </Field>
          </div>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional note for the shelf."
            />
          </Field>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Accessories name">
            <TextInput value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </Field>
          <Field label="Price (INR)">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              required
            />
          </Field>
          <Field label="Stock">
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              required
            />
          </Field>
        </div>
      )}

      {error ? (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Saving..." : book ? "Update item" : "Add Item"}
        </Button>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push("/admin")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
