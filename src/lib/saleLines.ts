import mongoose from "mongoose";
import { money, normalizeDiscountMode, priceBill, priceLine, type DiscountMode } from "@/lib/pricing";

type StockedItem = {
  _id: mongoose.Types.ObjectId;
  title: string;
  kind?: string;
  language?: string;
  code?: string;
  price: number;
  stock: number;
};

export type SaleRequestLine = {
  bookId?: string;
  quantity?: number;
  discountMode?: unknown;
  discountValue?: unknown;
};

export function buildSaleLines(
  rawItems: SaleRequestLine[],
  bookMap: Map<string, StockedItem>,
  billDiscountMode: DiscountMode,
  billDiscountValue: number,
) {
  const items = [];
  for (const line of rawItems) {
    const bookId = String(line.bookId ?? "");
    const quantity = Number(line.quantity);
    if (!bookId || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false as const, error: "Each item needs a product and a quantity of 1 or more." };
    }
    const book = bookMap.get(bookId);
    if (!book) {
      return { ok: false as const, error: "One of the selected items is no longer in inventory." };
    }
    if (book.stock < quantity) {
      return {
        ok: false as const,
        error: `Not enough stock for "${book.title}". Available: ${book.stock}.`,
      };
    }
    const priced = priceLine(
      book.price,
      quantity,
      normalizeDiscountMode(line.discountMode),
      Number(line.discountValue ?? 0),
    );
    items.push({
      bookId: book._id,
      title: book.title,
      kind: book.kind === "accessory" ? "accessory" : "book",
      language: book.language || "",
      code: book.code || "",
      quantity,
      price: book.price,
      gross: priced.gross,
      discountMode: normalizeDiscountMode(line.discountMode),
      discountValue: money(Math.max(0, Number(line.discountValue ?? 0) || 0)),
      discountAmount: priced.discountAmount,
      lineTotal: priced.lineTotal,
    });
  }

  const bill = priceBill(
    items.map((item) => item.lineTotal),
    billDiscountMode,
    billDiscountValue,
  );

  return {
    ok: true as const,
    items,
    subtotal: bill.subtotal,
    discountMode: billDiscountMode,
    discountValue: money(Math.max(0, billDiscountValue || 0)),
    discountAmount: bill.discountAmount,
    total: bill.total,
  };
}
