import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { mapBill } from "@/lib/billMap";
import { isPaymentMethod } from "@/lib/constants";
import { sendBillEmail } from "@/lib/mail";
import { dbConnect } from "@/lib/mongodb";
import { normalizeDiscountMode } from "@/lib/pricing";
import { buildSaleLines, type SaleRequestLine } from "@/lib/saleLines";
import { isEmail } from "@/lib/utils";
import { Bill } from "@/models/Bill";
import { Book } from "@/models/Book";

async function nextBillNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `SAH-${stamp}-`;
  const count = await Bill.countDocuments({ billNumber: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && (error as { code?: number }).code === 11000) return true;
  if ("cause" in error) return isDuplicateKey((error as { cause?: unknown }).cause);
  return false;
}

async function takeStock(
  lines: Array<{ bookId: mongoose.Types.ObjectId; quantity: number; title: string }>,
) {
  const taken: Array<{ bookId: mongoose.Types.ObjectId; quantity: number }> = [];
  const ordered = [...lines].sort((a, b) => String(a.bookId).localeCompare(String(b.bookId)));

  for (const line of ordered) {
    const updated = await Book.findOneAndUpdate(
      { _id: line.bookId, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } },
      { new: true },
    );
    if (!updated) {
      await restoreStock(taken);
      const current = await Book.findById(line.bookId);
      return {
        ok: false as const,
        error: `Not enough stock for "${line.title}". Available: ${current?.stock ?? 0}.`,
      };
    }
    taken.push({ bookId: line.bookId, quantity: line.quantity });
  }

  return { ok: true as const };
}

async function restoreStock(lines: Array<{ bookId: mongoose.Types.ObjectId; quantity: number }>) {
  await Promise.all(
    lines.map((line) => Book.findByIdAndUpdate(line.bookId, { $inc: { stock: line.quantity } })),
  );
}

export async function GET() {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  await dbConnect();
  const bills = await Bill.find().sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ bills: bills.map(mapBill) });
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
    const paymentMethod = String(body?.paymentMethod ?? "").trim();
    const rawItems = Array.isArray(body?.items) ? (body.items as SaleRequestLine[]) : [];
    const discountMode = normalizeDiscountMode(body?.discountMode);
    const discountValue = Number(body?.discountValue ?? 0);

    if (!isPaymentMethod(paymentMethod)) {
      return jsonError("Choose a payment method: UPI, Cash, Card, or Net Banking.");
    }
    if (generateBill && !customerName) {
      return jsonError("Customer name is required when customer details are added.");
    }
    if (generateBill && !isEmail(customerEmail)) {
      return jsonError("A valid customer email is required when customer details are added.");
    }
    if (rawItems.length === 0) {
      return jsonError("Add at least one item before completing payment.");
    }

    await dbConnect();

    const ids = rawItems.map((item) => String(item.bookId ?? ""));
    const books = await Book.find({ _id: { $in: ids } });
    const bookMap = new Map(books.map((book) => [book._id.toString(), book]));
    const priced = buildSaleLines(rawItems, bookMap, discountMode, discountValue);
    if (!priced.ok) return jsonError(priced.error);

    const stock = await takeStock(priced.items);
    if (!stock.ok) return jsonError(stock.error);

    let bill = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        bill = await Bill.create({
          billNumber: await nextBillNumber(),
          customerName: generateBill ? customerName : "Walk-in",
          customerPhone: generateBill ? customerPhone : "",
          customerEmail: generateBill ? customerEmail : "",
          paymentMethod,
          items: priced.items,
          subtotal: priced.subtotal,
          discountMode: priced.discountMode,
          discountValue: priced.discountValue,
          discountAmount: priced.discountAmount,
          total: priced.total,
          createdBy: new mongoose.Types.ObjectId(session.userId),
          createdByName: session.name,
        });
        break;
      } catch (error) {
        if (isDuplicateKey(error) && attempt < 4) continue;
        await restoreStock(priced.items);
        throw error;
      }
    }

    if (!bill) {
      await restoreStock(priced.items);
      return jsonError("Could not complete payment. Please try again.", 500);
    }

    const mapped = mapBill(bill);
    const email = generateBill ? await sendBillEmail(mapped) : { sent: false, error: "" };

    return NextResponse.json(
      {
        inventoryUpdated: true,
        bill: mapped,
        emailSent: email.sent,
        emailError: email.sent ? "" : email.error,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Checkout failed:", error);
    return jsonError("Could not complete payment. Please try again.", 500);
  }
}
