import { normalizeDiscountMode, type DiscountMode } from "@/lib/pricing";
import type { HoldOrderDocument } from "@/models/HoldOrder";
import type { BookRecord } from "@/types";

export type HeldCartLine = {
  bookId: string;
  title: string;
  kind: string;
  language: string;
  code: string;
  quantity: number;
  price: number;
  gross: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  lineTotal: number;
};

export type HeldOrder = {
  id: string;
  label: string;
  generateBill: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: HeldCartLine[];
  subtotal: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  total: number;
  createdByName: string;
  heldAt: string;
};

export function mapHoldOrder(order: HoldOrderDocument): HeldOrder {
  return {
    id: order._id.toString(),
    label: order.label,
    generateBill: order.generateBill,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? "",
    items: order.items.map((item) => ({
      bookId: item.bookId.toString(),
      title: item.title,
      kind: item.kind,
      language: item.language,
      code: item.code,
      quantity: item.quantity,
      price: item.price,
      gross: item.gross ?? item.lineTotal,
      discountMode: normalizeDiscountMode(item.discountMode),
      discountValue: item.discountValue ?? 0,
      discountAmount: item.discountAmount ?? 0,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal ?? order.total,
    discountMode: normalizeDiscountMode(order.discountMode),
    discountValue: order.discountValue ?? 0,
    discountAmount: order.discountAmount ?? 0,
    total: order.total,
    createdByName: order.createdByName,
    heldAt: order.createdAt.toISOString(),
  };
}

export function makeHeldOrderLabel(customerName: string, itemCount: number) {
  const name = customerName.trim();
  if (name) return name;
  return `Hold · ${itemCount} item${itemCount === 1 ? "" : "s"}`;
}

export function rebuildCartFromHeld(
  held: HeldOrder,
  catalog: BookRecord[],
): {
  cart: Array<{
    book: BookRecord;
    quantity: number;
    discountMode: DiscountMode;
    discountValue: number;
  }>;
  missing: string[];
} {
  const missing: string[] = [];
  const cart: Array<{
    book: BookRecord;
    quantity: number;
    discountMode: DiscountMode;
    discountValue: number;
  }> = [];

  for (const line of held.items) {
    const book = catalog.find((item) => item._id === line.bookId);
    if (!book) {
      missing.push(line.title || line.bookId);
      continue;
    }
    const quantity = Math.min(line.quantity, Math.max(book.stock, 0));
    if (quantity < 1) {
      missing.push(book.title);
      continue;
    }
    cart.push({
      book,
      quantity,
      discountMode: line.discountMode,
      discountValue: line.discountValue,
    });
  }

  return { cart, missing };
}
