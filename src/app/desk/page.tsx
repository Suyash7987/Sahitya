import { MongoStatus } from "@/components/MongoStatus";
import { PosTerminal } from "@/components/PosTerminal";
import { listBooks } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  try {
    const books = await listBooks();

    return (
      <div className="flex flex-col lg:h-[calc(100dvh-3rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="mb-5 shrink-0 lg:mb-4">
          <p className="font-hindi text-2xl font-semibold text-gold sm:text-3xl">साहित्य</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Customer billing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Find a book or accessory, add it to the current bill, then complete payment. Every sale is
            saved under History, where you can generate the bill PDF anytime.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <PosTerminal books={books} />
        </div>
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load items from MongoDB.";
    return (
      <div>
        <div className="mb-8">
          <p className="font-hindi text-2xl font-semibold text-gold sm:text-3xl">साहित्य</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Customer billing</h1>
        </div>
        <MongoStatus message={message} />
      </div>
    );
  }
}
