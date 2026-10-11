"use client";

import { Button } from "@/components/Button";
import { Field, TextInput } from "@/components/Field";
import { downloadBillPdf } from "@/lib/pdf";
import { paymentMethodLabel } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import type { BillRecord } from "@/types";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 25;

function soldSummary(bill: BillRecord) {
  const titles = bill.items.map((item) => `${item.title} × ${item.quantity}`);
  if (titles.length <= 2) return titles.join(", ");
  return `${titles.slice(0, 2).join(", ")} +${titles.length - 2} more`;
}

function startOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function endOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999`);
}

export function BillHistory({
  bills,
  basePath = "/desk/history",
}: {
  bills: BillRecord[];
  basePath?: string;
}) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const from = fromDate ? startOfDay(fromDate) : null;
    const to = toDate ? endOfDay(toDate) : null;

    return bills.filter((bill) => {
      const matchesQuery =
        !needle ||
        bill.billNumber.toLowerCase().includes(needle) ||
        bill.customerName.toLowerCase().includes(needle);

      if (!matchesQuery) return false;

      const created = new Date(bill.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [bills, query, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageBills = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const hasFilters = Boolean(query.trim() || fromDate || toDate);

  useEffect(() => {
    setPage(1);
  }, [query, fromDate, toDate]);

  function clearFilters() {
    setQuery("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  if (bills.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-12 text-center text-muted sm:rounded-3xl sm:px-6 sm:py-16">
        No sales yet. Complete a payment at the counter to see history here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-5">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-muted" />
          <TextInput
            className="pl-10"
            placeholder="Search by customer name or sale number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search sales"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <Field label="From date">
            <TextInput
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </Field>
          <Field label="To date">
            <TextInput
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="w-full lg:w-auto"
              disabled={!hasFilters}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}–
          {Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} sale
          {filtered.length === 1 ? "" : "s"}
          {hasFilters ? " (filtered)" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-12 text-center text-muted sm:rounded-3xl sm:px-6 sm:py-16">
          No sales match your search or date range.
          {hasFilters ? (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {pageBills.map((bill) => (
              <article key={bill._id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{bill.billNumber}</p>
                    <p className="mt-1 text-sm">{bill.customerName}</p>
                  </div>
                  <p className="shrink-0 font-display text-xl">{formatINR(bill.total)}</p>
                </div>
                <p className="mt-2 text-sm text-muted">{soldSummary(bill)}</p>
                <p className="mt-1 text-xs text-muted">
                  {bill.paymentMethod ? paymentMethodLabel(bill.paymentMethod) : "No method"} ·{" "}
                  {formatDate(bill.createdAt)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`${basePath}/${bill._id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Button size="sm" className="w-full" onClick={() => downloadBillPdf(bill)}>
                    Generate bill
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-card md:flex">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-line bg-paper text-xs uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="w-[15%] px-3 py-3 font-semibold">Sale</th>
                    <th className="w-[12%] px-3 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Sold items</th>
                    <th className="w-[9%] px-3 py-3 font-semibold">Total</th>
                    <th className="w-[8%] px-3 py-3 font-semibold">Payment</th>
                    <th className="w-[16%] px-3 py-3 font-semibold">Date</th>
                    <th className="w-[18%] px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageBills.map((bill) => (
                    <tr key={bill._id} className="border-b border-line last:border-0">
                      <td className="overflow-hidden px-3 py-3 font-medium">
                        <p className="truncate">{bill.billNumber}</p>
                      </td>
                      <td className="overflow-hidden px-3 py-3">
                        <div className="truncate">{bill.customerName}</div>
                        {bill.customerPhone ? (
                          <div className="truncate text-xs text-muted">{bill.customerPhone}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        <p className="truncate">{soldSummary(bill)}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{formatINR(bill.total)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">
                        {bill.paymentMethod ? paymentMethodLabel(bill.paymentMethod) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">{formatDate(bill.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-nowrap items-center gap-2">
                          <Link href={`${basePath}/${bill._id}`}>
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button size="sm" onClick={() => downloadBillPdf(bill)}>
                            Generate bill
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-between gap-3 sm:flex-row">
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
        </>
      )}
    </div>
  );
}
