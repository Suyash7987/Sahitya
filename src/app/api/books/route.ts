import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { isItemKind, isLanguage } from "@/lib/constants";
import { dbConnect } from "@/lib/mongodb";
import { findDuplicateItem, toItemRecord } from "@/lib/items";
import { Book } from "@/models/Book";

export async function GET() {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  await dbConnect();
  const books = await Book.find().sort({ kind: 1, title: 1 });
  return NextResponse.json({ books: books.map(toItemRecord) });
}

export async function POST(request: Request) {
  const { error } = await requireUser(["admin"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const kind = String(body?.kind ?? "book").trim();
  const title = String(body?.title ?? "").trim();
  const language = String(body?.language ?? "").trim();
  const code = String(body?.code ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const price = Number(body?.price);
  const stock = Number(body?.stock);

  if (!isItemKind(kind)) {
    return jsonError("Choose Book or Accessories.");
  }
  if (kind === "accessory" && !title) {
    return jsonError("Accessory name is required.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return jsonError("Stock must be a whole number of zero or more.");
  }

  if (!Number.isFinite(price) || price < 0) {
    return jsonError("Price must be zero or more.");
  }
  if (kind === "book") {
    if (!isLanguage(language)) return jsonError("Choose a language.");
    if (!code) return jsonError("Code is required.");
  }

  try {
    await dbConnect();
    const duplicate = await findDuplicateItem({ kind, title, code });
    if (duplicate) return jsonError(duplicate);

    const book = await Book.create({
      kind,
      title,
      language: kind === "book" ? language : "",
      code: kind === "book" ? code : "",
      description: kind === "book" ? description : "",
      price,
      stock,
    });
    return NextResponse.json({ book: toItemRecord(book) }, { status: 201 });
  } catch (error) {
    console.error("Create item failed:", error);
    return jsonError("Could not save this item. Please check the details and try again.", 400);
  }
}
