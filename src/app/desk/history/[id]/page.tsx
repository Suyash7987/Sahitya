import { PdfButton } from "@/components/PdfButton";
import { paymentMethodLabel } from "@/lib/constants";
import { getBill } from "@/lib/data";
import { formatDate, formatINR, itemDetailLine } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
}: PageProps<"/desk/history/[id]">) {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/desk/history" className="text-sm text-muted hover:text-ink">
        Back to history
      </Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Sale</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">{bill.billNumber}</h1>
          <p className="mt-2 text-sm break-words text-muted">
            {bill.customerName}
            {bill.customerPhone ? ` · ${bill.customerPhone}` : ""}
            {bill.customerEmail ? ` · ${bill.customerEmail}` : ""} · {formatDate(bill.createdAt)}
            {bill.paymentMethod ? ` · ${paymentMethodLabel(bill.paymentMethod)}` : ""}
          </p>
        </div>
        <PdfButton bill={bill} />
      </div>

      <div className="mt-6 space-y-3 sm:hidden">
        {bill.items.map((item) => (
          <div key={`${item.bookId}-${item.code}-${item.title}`} className="rounded-2xl border border-line bg-card p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted">{itemDetailLine(item)}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span>
                {item.quantity} × {formatINR(item.price)}
              </span>
              <span className="font-semibold">{formatINR(item.lineTotal)}</span>
            </div>
            {item.discountAmount > 0 ? (
              <p className="mt-1 text-xs text-muted">Discount {formatINR(item.discountAmount)}</p>
            ) : null}
            {bill.paymentMethod ? (
              <p className="mt-2 text-xs text-muted">
                Payment · {paymentMethodLabel(bill.paymentMethod)}
              </p>
            ) : null}
          </div>
        ))}
        <div className="space-y-2 rounded-2xl border border-line bg-card px-4 py-4">
          {bill.discountAmount > 0 || bill.items.some((item) => item.discountAmount > 0) ? (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatINR(bill.subtotal)}</span>
            </div>
          ) : null}
          {bill.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Bill discount</span>
              <span>-{formatINR(bill.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">Total</span>
            <span className="font-display text-2xl">{formatINR(bill.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 hidden overflow-hidden rounded-3xl border border-line bg-card sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={`${item.bookId}-${item.code}-${item.title}`} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted">{itemDetailLine(item)}</div>
                  </td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatINR(item.price)}</td>
                  <td className="px-4 py-3">
                    {formatINR(item.lineTotal)}
                    {item.discountAmount > 0 ? (
                      <div className="text-xs text-muted">-{formatINR(item.discountAmount)}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {bill.paymentMethod ? paymentMethodLabel(bill.paymentMethod) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 border-t border-line px-4 py-4">
          {bill.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Bill discount</span>
              <span>-{formatINR(bill.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">Total</span>
            <span className="font-display text-3xl">{formatINR(bill.total)}</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">Issued by {bill.createdByName}</p>
    </div>
  );
}
