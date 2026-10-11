import { BillHistory } from "@/components/BillHistory";
import { listBills } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const bills = await listBills();

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="mb-5 shrink-0 lg:mb-4">
        <p className="font-hindi text-2xl font-semibold text-gold sm:text-3xl">साहित्य</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Sales history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Review everything sold at the counter. Open a sale for details, or generate the bill PDF
          again anytime.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <BillHistory bills={bills} basePath="/desk/history" />
      </div>
    </div>
  );
}
