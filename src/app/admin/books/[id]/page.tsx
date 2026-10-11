import { BookForm } from "@/components/BookForm";
import { getBook } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: PageProps<"/admin/books/[id]">) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const isAccessory = book.kind === "accessory";

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        {isAccessory ? "Update accessory" : "Update book"}
      </p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">{book.title}</h1>
      <p className="mt-2 text-sm text-muted">
        Change stock or other details. Duplicate names or book codes will not be saved.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-card p-4 sm:mt-8 sm:rounded-3xl sm:p-6">
        <BookForm book={book} />
      </div>
    </div>
  );
}
