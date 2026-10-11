"use client";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SelectInput, TextInput } from "@/components/Field";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import type { BookRecord } from "@/types";
import { Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 25;

export function InventoryManager({ books }: { books: BookRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(books);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookRecord | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKind = kind === "all" || item.kind === kind;
      const matchesQuery =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.language.toLowerCase().includes(needle);
      return matchesKind && matchesQuery;
    });
  }, [items, query, kind]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, kind]);

  const copies = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStock = items.filter((item) => item.stock <= LOW_STOCK_THRESHOLD).length;

  async function removeItem() {
    if (!deleteTarget) return;
    setPendingId(deleteTarget._id);
    const response = await fetch(`/api/books/${deleteTarget._id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      router.refresh();
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Items on shelf" value={String(items.length)} />
        <Stat label="Copies in stock" value={String(copies)} />
        <Stat label="Low stock items" value={String(lowStock)} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-muted" />
          <TextInput
            className="pl-10"
            placeholder="Search name, code, or language"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <SelectInput className="lg:w-48" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All items</option>
          <option value="book">Books</option>
          <option value="accessory">Accessories</option>
        </SelectInput>
        <Link href="/admin/books/new" className="lg:shrink-0">
          <Button className="w-full lg:w-auto">Add Items</Button>
        </Link>
      </div>

      <p className="text-xs text-muted">
        Showing {filtered.length === 0 ? 0 : pageStart + 1}–
        {Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} item
        {filtered.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-3 md:hidden">
        {pageItems.map((item) => (
          <article key={item._id} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
              {item.kind === "accessory" ? "Accessories" : item.language || "Book"}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight">{item.title}</h3>
            {item.code ? <p className="mt-1 font-mono text-xs break-all text-muted">{item.code}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-semibold">{formatINR(item.price)}</span>
              <span
                className={
                  item.stock === 0
                    ? "text-clay"
                    : item.stock <= LOW_STOCK_THRESHOLD
                      ? "text-gold"
                      : "text-sage"
                }
              >
                {item.stock} in stock
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/admin/books/${item._id}`}>
                <Button variant="secondary" size="sm" className="w-full">
                  <Pencil className="h-3.5 w-3.5" />
                  Update
                </Button>
              </Link>
              <Button variant="danger" size="sm" className="w-full" onClick={() => setDeleteTarget(item)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted">
            No items match this search.
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-line bg-card md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Language / Code</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted">
                    {item.kind === "accessory" ? "Accessories" : "Book"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.kind === "book"
                      ? `${item.language}${item.code ? ` · ${item.code}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{formatINR(item.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.stock === 0
                          ? "text-clay"
                          : item.stock <= LOW_STOCK_THRESHOLD
                            ? "text-gold"
                            : "text-sage"
                      }
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/books/${item._id}`}>
                        <Button variant="secondary" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                          Update
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    No items match this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && totalPages > 1 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove this item?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" will be deleted from inventory. This cannot be undone.`
            : ""
        }
        pending={Boolean(pendingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeItem}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4 sm:rounded-3xl sm:px-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl sm:text-3xl">{value}</p>
    </div>
  );
}
