import { Book, escapeRegex, type BookDocument } from "@/models/Book";
import type { ItemKind } from "@/lib/constants";
import type { BookRecord } from "@/types";

type ItemLike = {
  _id: { toString(): string };
  kind?: string;
  title: string;
  language?: string;
  code?: string;
  isbn?: string;
  price: number;
  stock: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toItemRecord(item: ItemLike): BookRecord {
  const kind: ItemKind = item.kind === "accessory" ? "accessory" : "book";
  return {
    _id: item._id.toString(),
    kind,
    title: item.title,
    language: item.language ?? "",
    code: item.code || item.isbn || "",
    price: item.price,
    stock: item.stock,
    description: item.description ?? "",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function findDuplicateItem({
  kind,
  title,
  code,
  excludeId,
}: {
  kind: ItemKind;
  title: string;
  code?: string;
  excludeId?: string;
}) {
  const titleClash = await Book.findOne({
    kind: kind === "accessory" ? "accessory" : { $ne: "accessory" as const },
    title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (titleClash) {
    return kind === "book"
      ? "A book with this title already exists."
      : "An accessory with this name already exists.";
  }

  if (kind === "book" && code) {
    const codeClash = await Book.findOne({
      kind: { $ne: "accessory" as const },
      $or: [
        { code: { $regex: `^${escapeRegex(code)}$`, $options: "i" } },
        { isbn: { $regex: `^${escapeRegex(code)}$`, $options: "i" } },
      ],
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (codeClash) {
      return "A book with this code already exists.";
    }
  }

  return null;
}

export function isBookDoc(item: BookDocument) {
  return item.kind !== "accessory";
}
