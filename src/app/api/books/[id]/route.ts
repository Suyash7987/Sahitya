import { NextResponse } from "next/server";
import { jsonError, requireUser, isValidId } from "@/lib/api";
import { isItemKind, isLanguage } from "@/lib/constants";
import { dbConnect } from "@/lib/mongodb";
import { findDuplicateItem, toItemRecord } from "@/lib/items";
import { Book } from "@/models/Book";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/books/[id]">,
) {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Item not found.", 404);
  await dbConnect();
  const book = await Book.findById(id);
  if (!book) return jsonError("Item not found.", 404);
  return NextResponse.json({ book: toItemRecord(book) });
}

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/books/[id]">,
) {
  const { error } = await requireUser(["admin"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Item not found.", 404);

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
  if (!title) {
    return jsonError(kind === "book" ? "Title is required." : "Accessory name is required.");
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
    const duplicate = await findDuplicateItem({ kind, title, code, excludeId: id });
    if (duplicate) return jsonError(duplicate);

    const book = await Book.findByIdAndUpdate(
      id,
      {
        kind,
        title,
        language: kind === "book" ? language : "",
        code: kind === "book" ? code : "",
        description: kind === "book" ? description : "",
        price,
        stock,
      },
      { new: true, runValidators: true },
    );

    if (!book) return jsonError("Item not found.", 404);
    return NextResponse.json({ book: toItemRecord(book) });
  } catch (error) {
    console.error("Update item failed:", error);
    return jsonError("Could not update this item. Please check the details and try again.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/books/[id]">,
) {
  const { error } = await requireUser(["admin"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Item not found.", 404);
  await dbConnect();
  const book = await Book.findByIdAndDelete(id);
  if (!book) return jsonError("Item not found.", 404);
  return NextResponse.json({ ok: true });
}
