import { normalizeDiscountMode } from "@/lib/pricing";
import type { BillRecord, ItemKind } from "@/types";

type BillLike = {
  _id: { toString(): string };
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod?: string;
  items: Array<{
    bookId: { toString(): string };
    title: string;
    kind?: string;
    language?: string;
    code?: string;
    author?: string;
    isbn?: string;
    quantity: number;
    price: number;
    gross?: number;
    discountMode?: string;
    discountValue?: number;
    discountAmount?: number;
    lineTotal: number;
  }>;
  subtotal?: number;
  discountMode?: string;
  discountValue?: number;
  discountAmount?: number;
  total: number;
  createdByName: string;
  createdAt: Date | string;
};

export function mapBill(bill: BillLike): BillRecord {
  return {
    _id: bill._id.toString(),
    billNumber: bill.billNumber,
    customerName: bill.customerName,
    customerPhone: bill.customerPhone,
    customerEmail: bill.customerEmail ?? "",
    paymentMethod: bill.paymentMethod ?? "",
    items: bill.items.map((item) => ({
      bookId: item.bookId.toString(),
      title: item.title,
      kind: (item.kind === "accessory" ? "accessory" : "book") as ItemKind,
      language: item.language || item.author || "",
      code: item.code || item.isbn || "",
      quantity: item.quantity,
      price: item.price,
      gross: item.gross ?? item.lineTotal,
      discountMode: normalizeDiscountMode(item.discountMode),
      discountValue: item.discountValue ?? 0,
      discountAmount: item.discountAmount ?? 0,
      lineTotal: item.lineTotal,
    })),
    subtotal: bill.subtotal ?? bill.total,
    discountMode: normalizeDiscountMode(bill.discountMode),
    discountValue: bill.discountValue ?? 0,
    discountAmount: bill.discountAmount ?? 0,
    total: bill.total,
    createdByName: bill.createdByName,
    createdAt:
      bill.createdAt instanceof Date ? bill.createdAt.toISOString() : bill.createdAt,
  };
}
