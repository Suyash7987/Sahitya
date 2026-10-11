import { BookForm } from "@/components/BookForm";

export default function NewItemPage() {
  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">New item</p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">Add Items</h1>
      <p className="mt-2 text-sm text-muted">
        Choose Book or Accessories. Duplicate names or book codes will not be saved.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-card p-4 sm:mt-8 sm:rounded-3xl sm:p-6">
        <BookForm />
      </div>
    </div>
  );
}
