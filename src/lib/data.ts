import mongoose from "mongoose";
import { withMongo } from "@/lib/mongodb";
import { Bill } from "@/models/Bill";
import { Book } from "@/models/Book";
import { mapBill } from "@/lib/billMap";
import { toItemRecord } from "@/lib/items";
import type { BillRecord, BookRecord } from "@/types";

export async function listBooks(): Promise<BookRecord[]> {
  return withMongo(async () => {
    const books = await Book.find().sort({ kind: 1, title: 1 });
    return books.map(toItemRecord);
  });
}

export async function getBook(id: string): Promise<BookRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return withMongo(async () => {
    const book = await Book.findById(id);
    return book ? toItemRecord(book) : null;
  });
}

export async function listBills(): Promise<BillRecord[]> {
  return withMongo(async () => {
    const bills = await Bill.find().sort({ createdAt: -1 });
    return bills.map(mapBill);
  });
}

export async function getBill(id: string): Promise<BillRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return withMongo(async () => {
    const bill = await Bill.findById(id);
    return bill ? mapBill(bill) : null;
  });
}
