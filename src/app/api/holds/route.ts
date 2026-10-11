import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { makeHeldOrderLabel, mapHoldOrder } from "@/lib/heldOrders";
import { dbConnect } from "@/lib/mongodb";
import { normalizeDiscountMode } from "@/lib/pricing";
import { buildSaleLines, type SaleRequestLine } from "@/lib/saleLines";
import { isEmail } from "@/lib/utils";
import { Book } from "@/models/Book";
import { HoldOrder } from "@/models/HoldOrder";

export async function GET() {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  await dbConnect();
  const holds = await HoldOrder.find().sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ holds: holds.map(mapHoldOrder) });
}

export async function POST(request: Request) {
  const { session, error } = await requireUser(["admin", "desk"]);
  if (error || !session) return error;

  try {
    const body = await request.json().catch(() => null);
    const generateBill = Boolean(body?.generateBill);
    const customerName = String(body?.customerName ?? "").trim();
    const customerPhone = String(body?.customerPhone ?? "").trim();
    const customerEmail = String(body?.customerEmail ?? "").trim().toLowerCase();
    const rawItems = Array.isArray(body?.items) ? (body.items as SaleRequestLine[]) : [];
    const discountMode = normalizeDiscountMode(body?.discountMode);
    const discountValue = Number(body?.discountValue ?? 0);

    if (generateBill && !customerName) {
      return jsonError("Customer name is required when customer details are added.");
    }
    if (generateBill && !isEmail(customerEmail)) {
      return jsonError("A valid customer email is required when customer details are added.");
    }
    if (rawItems.length === 0) {
      return jsonError("Add at least one item before holding an order.");
    }

    await dbConnect();

    const ids = rawItems.map((item) => String(item.bookId ?? ""));
    const books = await Book.find({ _id: { $in: ids } });
    const bookMap = new Map(books.map((book) => [book._id.toString(), book]));
    const priced = buildSaleLines(rawItems, bookMap, discountMode, discountValue);
    if (!priced.ok) return jsonError(priced.error);

    const itemCount = priced.items.reduce((sum, item) => sum + item.quantity, 0);

    const hold = await HoldOrder.create({
      label: makeHeldOrderLabel(customerName, itemCount),
      generateBill,
      customerName: generateBill ? customerName : "",
      customerPhone: generateBill ? customerPhone : "",
      customerEmail: generateBill ? customerEmail : "",
      items: priced.items,
      subtotal: priced.subtotal,
      discountMode: priced.discountMode,
      discountValue: priced.discountValue,
      discountAmount: priced.discountAmount,
      total: priced.total,
      createdBy: new mongoose.Types.ObjectId(session.userId),
      createdByName: session.name,
    });

    return NextResponse.json({ hold: mapHoldOrder(hold) }, { status: 201 });
  } catch (error) {
    console.error("Hold order failed:", error);
    return jsonError("Could not hold this order. Please try again.", 500);
  }
}
