import mongoose, { type Model } from "mongoose";
import type { ItemKind } from "@/lib/constants";

export type BookDocument = {
  _id: mongoose.Types.ObjectId;
  kind: ItemKind;
  title: string;
  language: string;
  code: string;
  price: number;
  stock: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

const BookSchema = new mongoose.Schema<BookDocument>(
  {
    kind: { type: String, enum: ["book", "accessory"], default: "book", required: true },
    title: { type: String, required: true, trim: true },
    language: { type: String, default: "", trim: true },
    code: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true, strict: false },
);

if (mongoose.models.Book) {
  delete mongoose.models.Book;
}

export const Book: Model<BookDocument> = mongoose.model<BookDocument>("Book", BookSchema);

export async function dropLegacyBookTextIndexes() {
  const collection = mongoose.connection.collection("books");
  const indexes = await collection.indexes();
  for (const index of indexes) {
    const isText =
      Boolean(index.textIndexVersion) ||
      Object.values(index.key ?? {}).includes("text");
    const isIsbnUnique = index.name === "isbn_1" || Boolean(index.unique && index.key?.isbn);
    if (index.name && index.name !== "_id_" && (isText || isIsbnUnique)) {
      await collection.dropIndex(index.name);
    }
  }
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
