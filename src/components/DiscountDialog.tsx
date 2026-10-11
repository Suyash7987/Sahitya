"use client";

import { Button } from "@/components/Button";
import { SelectInput, TextInput } from "@/components/Field";
import { priceBill, priceLine, type DiscountMode } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export type DiscountDraftLine = {
  id: string;
  title: string;
  unitPrice: number;
  quantity: number;
  discountMode: DiscountMode;
  discountValue: number;
};

export function DiscountDialog({
  open,
  lines,
  billMode,
  billValue,
  onClose,
  onApply,
}: {
  open: boolean;
  lines: DiscountDraftLine[];
  billMode: DiscountMode;
  billValue: number;
  onClose: () => void;
  onApply: (next: {
    lines: DiscountDraftLine[];
    billMode: DiscountMode;
    billValue: number;
  }) => void;
}) {
  const [draftLines, setDraftLines] = useState(lines);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [draftBillMode, setDraftBillMode] = useState<DiscountMode>(billMode);
  const [draftBillValue, setDraftBillValue] = useState(String(billValue || ""));

  useEffect(() => {
    if (!open) return;
    setDraftLines(lines);
    setAmounts(
      Object.fromEntries(
        lines.map((line) => [line.id, line.discountValue ? String(line.discountValue) : ""]),
      ),
    );
    setDraftBillMode(billMode);
    setDraftBillValue(billValue ? String(billValue) : "");
    // Snapshot the cart only when the dialog opens. Later cart refreshes must not wipe what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const preview = useMemo(() => {
    const priced = draftLines.map((line) =>
      priceLine(line.unitPrice, line.quantity, line.discountMode, Number(draftValue(line.discountValue))),
    );
    const bill = priceBill(
      priced.map((line) => line.lineTotal),
      draftBillMode,
      Number(draftBillValue) || 0,
    );
    const lineDiscount = priced.reduce((sum, line) => sum + line.discountAmount, 0);
    return { lineDiscount, ...bill };
  }, [draftLines, draftBillMode, draftBillValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-card p-5 shadow-xl">
        <h2 className="font-display text-2xl">Discount</h2>
        <p className="mt-1 text-sm text-muted">
          Discount a single item, or the total after those item discounts.
        </p>

        <div className="mt-4 space-y-3">
          {draftLines.map((line) => (
            <div key={line.id} className="rounded-2xl bg-paper p-3">
              <p className="font-medium">{line.title}</p>
              <p className="text-xs text-muted">
                {line.quantity} × {formatINR(line.unitPrice)}
              </p>
              <div className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
                <SelectInput
                  value={line.discountMode}
                  onChange={(event) =>
                    updateLine(line.id, {
                      discountMode: event.target.value as DiscountMode,
                    })
                  }
                >
                  <option value="">No discount</option>
                  <option value="amount">Rupees</option>
                  <option value="percent">Percent</option>
                </SelectInput>
                <TextInput
                  inputMode="decimal"
                  disabled={!line.discountMode}
                  value={line.discountMode ? (amounts[line.id] ?? "") : ""}
                  placeholder={line.discountMode === "percent" ? "%" : "Rs"}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
                    setAmounts((current) => ({ ...current, [line.id]: raw }));
                    updateLine(line.id, { discountValue: Number(raw) || 0 });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-line p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">On total</p>
          <div className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
            <SelectInput
              value={draftBillMode}
              onChange={(event) => setDraftBillMode(event.target.value as DiscountMode)}
            >
              <option value="">No discount</option>
              <option value="amount">Rupees</option>
              <option value="percent">Percent</option>
            </SelectInput>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              disabled={!draftBillMode}
              value={draftBillMode ? draftBillValue : ""}
              placeholder={draftBillMode === "percent" ? "%" : "Rs"}
              onChange={(event) => setDraftBillValue(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <Row label="Item discounts" value={formatINR(preview.lineDiscount)} />
          <Row label="Subtotal" value={formatINR(preview.subtotal)} />
          <Row label="Bill discount" value={formatINR(preview.discountAmount)} />
          <div className="flex items-center justify-between pt-1 font-semibold">
            <span>Payable</span>
            <span>{formatINR(preview.total)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onApply({
                lines: draftLines,
                billMode: draftBillMode,
                billValue: Number(draftBillValue) || 0,
              })
            }
          >
            Apply discount
          </Button>
        </div>
      </div>
    </div>
  );

  function updateLine(id: string, patch: Partial<DiscountDraftLine>) {
    setDraftLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }
}

function draftValue(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
