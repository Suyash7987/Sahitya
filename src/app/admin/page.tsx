import { InventoryManager } from "@/components/InventoryManager";
import { MongoStatus } from "@/components/MongoStatus";
import { listBooks } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  try {
    const books = await listBooks();

    return (
      <div>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Stock room</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Inventory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Add books and accessories, update details, and keep stock on the shelf.
          </p>
        </div>
        <InventoryManager books={books} />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load inventory from MongoDB.";
    return (
      <div>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Stock room</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Inventory</h1>
        </div>
        <MongoStatus message={message} />
      </div>
    );
  }
}
