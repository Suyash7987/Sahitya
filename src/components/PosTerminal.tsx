"use client";

import { Button } from "@/components/Button";
import { DiscountDialog } from "@/components/DiscountDialog";
import { Field, TextInput } from "@/components/Field";
import { PaymentMethodIcon } from "@/components/PaymentMethodIcons";
import { LOW_STOCK_THRESHOLD, PAYMENT_METHODS, paymentMethodLabel } from "@/lib/constants";
import {
  rebuildCartFromHeld,
  type HeldOrder,
} from "@/lib/heldOrders";
import { downloadBillPdf } from "@/lib/pdf";
import { priceBill, priceLine, type DiscountMode } from "@/lib/pricing";
import { cn, formatINR, isEmail, itemDetailLine } from "@/lib/utils";
import type { BillRecord, BookRecord } from "@/types";
import { ArrowLeft, Minus, Pause, Play, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CartLine = {
  book: BookRecord;
  quantity: number;
  discountMode: DiscountMode;
  discountValue: number;
};

type Step = "cart" | "payment" | "done";

type Completion = { kind: "bill"; bill: BillRecord };

export function PosTerminal({ books }: { books: BookRecord[] }) {
  const [catalog, setCatalog] = useState(books);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [generateBill, setGenerateBill] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billDiscountMode, setBillDiscountMode] = useState<DiscountMode>("");
  const [billDiscountValue, setBillDiscountValue] = useState(0);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [step, setStep] = useState<Step>("cart");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [holdPending, setHoldPending] = useState(false);
  const [completed, setCompleted] = useState<Completion | null>(null);
  const [mobileBillOpen, setMobileBillOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  const cartLocked = step !== "cart";
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter(
      (book) =>
        book.title.toLowerCase().includes(needle) ||
        book.language.toLowerCase().includes(needle) ||
        book.code.toLowerCase().includes(needle),
    );
  }, [catalog, query]);

  const quote = useMemo(() => {
    const priced = cart.map((line) =>
      priceLine(line.book.price, line.quantity, line.discountMode, line.discountValue),
    );
    const bill = priceBill(
      priced.map((line) => line.lineTotal),
      billDiscountMode,
      billDiscountValue,
    );
    const lineDiscount = priced.reduce((sum, line) => sum + line.discountAmount, 0);
    return { lineDiscount, priced, ...bill };
  }, [cart, billDiscountMode, billDiscountValue]);
  const total = quote.total;

  async function refreshHeldOrders() {
    const response = await fetch("/api/holds");
    if (!response.ok) return;
    const data = (await response.json()) as { holds?: HeldOrder[] };
    setHeldOrders(data.holds ?? []);
  }

  async function refreshShelf() {
    const response = await fetch("/api/books");
    if (!response.ok) return;
    const data = (await response.json()) as { books?: BookRecord[] };
    const nextBooks = data.books ?? [];
    setCatalog(nextBooks);
    setCart((current) =>
      current.map((line) => {
        const fresh = nextBooks.find((book) => book._id === line.book._id);
        return fresh ? { ...line, book: fresh } : line;
      }),
    );
  }

  useEffect(() => {
    void refreshHeldOrders();
    void refreshShelf();
    const timer = window.setInterval(() => {
      void refreshHeldOrders();
      void refreshShelf();
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCatalog(books);
  }, [books]);

  useEffect(() => {
    if (step !== "cart") setMobileBillOpen(true);
  }, [step]);

  function clearCurrentBill() {
    setCart([]);
    setGenerateBill(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setBillDiscountMode("");
    setBillDiscountValue(0);
    setEmailNotice("");
    setPaymentMethod("");
    setError("");
    setStep("cart");
  }

  async function postHoldOrder(source: {
    cart: CartLine[];
    generateBill: boolean;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    discountMode: DiscountMode;
    discountValue: number;
  }) {
    const response = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generateBill: source.generateBill,
        customerName: source.customerName,
        customerPhone: source.customerPhone,
        customerEmail: source.customerEmail,
        discountMode: source.discountMode,
        discountValue: source.discountValue,
        items: source.cart.map((line) => ({
          bookId: line.book._id,
          quantity: line.quantity,
          discountMode: line.discountMode,
          discountValue: line.discountValue,
        })),
      }),
    });
    const text = await response.text();
    let data: { error?: string; hold?: HeldOrder } = {};
    try {
      data = text ? (JSON.parse(text) as typeof data) : {};
    } catch {
      throw new Error("Could not hold this order. Please try again.");
    }
    if (!response.ok || !data.hold) {
      throw new Error(data.error ?? "Could not hold this order.");
    }
    return data.hold;
  }

  async function holdOrder() {
    if (cartLocked || holdPending) return;
    if (cart.length === 0) {
      setError("Add at least one item before holding an order.");
      return;
    }
    if (generateBill && !customerName.trim()) {
      setError("Enter the customer name before holding this order.");
      return;
    }
    if (generateBill && !isEmail(customerEmail)) {
      setError("Enter a valid customer email before holding this order.");
      return;
    }

    setHoldPending(true);
    setError("");
    try {
      const hold = await postHoldOrder({
        cart,
        generateBill,
        customerName,
        customerPhone,
        customerEmail,
        discountMode: billDiscountMode,
        discountValue: billDiscountValue,
      });
      setHeldOrders((current) => [hold, ...current.filter((item) => item.id !== hold.id)]);
      clearCurrentBill();
      setCompleted(null);
      setMobileBillOpen(true);
    } catch (holdError) {
      setError(holdError instanceof Error ? holdError.message : "Could not hold this order.");
    } finally {
      setHoldPending(false);
    }
  }

  async function resumeHeldOrder(orderId: string) {
    if (cartLocked || holdPending) return;
    const order = heldOrders.find((item) => item.id === orderId);
    if (!order) return;

    setHoldPending(true);
    setError("");
    try {
      // Park the open bill first so nothing is lost.
      if (cart.length > 0) {
        const parked = await postHoldOrder({
          cart,
          generateBill,
          customerName,
          customerPhone,
          customerEmail,
          discountMode: billDiscountMode,
          discountValue: billDiscountValue,
        });
        setHeldOrders((current) => [parked, ...current.filter((item) => item.id !== parked.id)]);
      }

      const deleteResponse = await fetch(`/api/holds/${orderId}`, { method: "DELETE" });
      if (!deleteResponse.ok) {
        const data = (await deleteResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not resume this held order.");
      }

      const { cart: restored, missing } = rebuildCartFromHeld(order, catalog);
      setHeldOrders((current) => current.filter((item) => item.id !== orderId));

      if (restored.length === 0) {
        setError("Could not resume this hold. Items may be out of stock or removed.");
        clearCurrentBill();
        return;
      }

      setCart(restored);
      setGenerateBill(order.generateBill);
      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone);
      setCustomerEmail(order.customerEmail);
      setBillDiscountMode(order.discountMode);
      setBillDiscountValue(order.discountValue);
      setPaymentMethod("");
      setCompleted(null);
      setStep("cart");
      setError(
        missing.length > 0
          ? "Some held items were skipped because stock changed."
          : "",
      );
      setMobileBillOpen(true);
    } catch (resumeError) {
      setError(
        resumeError instanceof Error ? resumeError.message : "Could not resume this held order.",
      );
      await refreshHeldOrders();
    } finally {
      setHoldPending(false);
    }
  }

  async function discardHeldOrder(orderId: string) {
    if (holdPending) return;
    setHoldPending(true);
    setError("");
    try {
      const response = await fetch(`/api/holds/${orderId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not discard this held order.");
      }
      setHeldOrders((current) => current.filter((item) => item.id !== orderId));
    } catch (discardError) {
      setError(
        discardError instanceof Error
          ? discardError.message
          : "Could not discard this held order.",
      );
    } finally {
      setHoldPending(false);
    }
  }

  function addToCart(book: BookRecord) {
    if (cartLocked) return;
    setError("");
    setCart((current) => {
      const existing = current.find((line) => line.book._id === book._id);
      const nextQty = (existing?.quantity ?? 0) + 1;
      if (nextQty > book.stock) {
        setError(`Only ${book.stock} copies of "${book.title || book.code}" are in stock.`);
        return current;
      }
      if (existing) {
        return current.map((line) =>
          line.book._id === book._id ? { ...line, quantity: nextQty } : line,
        );
      }
      return [...current, { book, quantity: 1, discountMode: "", discountValue: 0 }];
    });
  }

  function changeQty(bookId: string, delta: number) {
    if (cartLocked) return;
    setCart((current) => {
      const line = current.find((item) => item.book._id === bookId);
      if (!line) return current;
      return applyQuantity(current, bookId, line.quantity + delta);
    });
  }

  function setQuantity(bookId: string, quantity: number) {
    if (cartLocked) return;
    setCart((current) => applyQuantity(current, bookId, quantity));
  }

  function applyQuantity(current: CartLine[], bookId: string, quantity: number) {
    setError("");
    return current.flatMap((line) => {
      if (line.book._id !== bookId) return [line];
      if (!Number.isInteger(quantity) || quantity < 1) return [line];
      if (quantity > line.book.stock) {
        setError(`Only ${line.book.stock} copies of "${line.book.title || line.book.code}" are in stock.`);
        return [{ ...line, quantity: line.book.stock }];
      }
      return [{ ...line, quantity }];
    });
  }

  function goToPayment() {
    setError("");
    if (cart.length === 0) {
      setError("Add at least one item before completing payment.");
      return;
    }
    if (generateBill && !customerName.trim()) {
      setError("Enter the customer name to generate a bill.");
      return;
    }
    if (generateBill && !isEmail(customerEmail)) {
      setError("Enter a valid customer email to generate a bill.");
      return;
    }
    setStep("payment");
    setMobileBillOpen(true);
  }

  function goBack() {
    setError("");
    setStep("cart");
  }

  function startNewSale() {
    clearCurrentBill();
    setCompleted(null);
    setMobileBillOpen(false);
  }

  async function completePayment() {
    if (!paymentMethod) {
      setError("Select a payment method.");
      return;
    }
    setPending(true);
    setError("");

    const response = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generateBill,
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod,
        discountMode: billDiscountMode,
        discountValue: billDiscountValue,
        items: cart.map((line) => ({
          bookId: line.book._id,
          quantity: line.quantity,
          discountMode: line.discountMode,
          discountValue: line.discountValue,
        })),
      }),
    });

    const text = await response.text();
    let data: {
      error?: string;
      bill?: BillRecord;
      emailSent?: boolean;
      emailError?: string;
    } = {};
    try {
      data = text ? (JSON.parse(text) as typeof data) : {};
    } catch {
      setError("Could not complete payment. Please try again.");
      setPending(false);
      return;
    }

    if (!response.ok) {
      setError(data.error ?? "Could not complete payment.");
      setPending(false);
      return;
    }

    void refreshShelf();

    if (!data.bill) {
      setError("Payment saved, but the sale record was missing. Check History.");
      setPending(false);
      return;
    }

    setEmailNotice(
      generateBill
        ? data.emailSent
          ? `Bill emailed to ${customerEmail.trim()}.`
          : data.emailError || "The sale was saved, but the bill email could not be sent."
        : "",
    );
    setCompleted({ kind: "bill", bill: data.bill });
    setCart([]);
    setPending(false);
    setStep("done");
    setMobileBillOpen(true);
  }

  const billPanel = (
    <BillPanel
      step={step}
      cart={cart}
      generateBill={generateBill}
      customerName={customerName}
      customerPhone={customerPhone}
      customerEmail={customerEmail}
      quote={quote}
      emailNotice={emailNotice}
      onCustomerEmail={setCustomerEmail}
      onOpenDiscount={() => setDiscountOpen(true)}
      paymentMethod={paymentMethod}
      total={total}
      error={error}
      pending={pending}
      holdPending={holdPending}
      completed={completed}
      heldOrders={heldOrders}
      onGenerateBill={setGenerateBill}
      onCustomerName={setCustomerName}
      onCustomerPhone={setCustomerPhone}
      onPaymentMethod={(value) => {
        setPaymentMethod(value);
        setError("");
      }}
      onRemove={(bookId) =>
        setCart((current) => current.filter((item) => item.book._id !== bookId))
      }
      onChangeQty={changeQty}
      onSetQty={setQuantity}
      onGoToPayment={goToPayment}
      onGoBack={goBack}
      onCompletePayment={completePayment}
      onNewSale={startNewSale}
      onHoldOrder={holdOrder}
      onResumeHeld={resumeHeldOrder}
      onDiscardHeld={discardHeldOrder}
    />
  );

  return (
    <>
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,26rem)]">
      <section className="min-h-0 min-w-0 overflow-y-auto pb-24 lg:h-full lg:pb-0">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-muted" />
          <TextInput
            className="pl-10"
            placeholder="Find a book or accessory"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {error && !mobileBillOpen ? (
          <p className="mb-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay lg:hidden">{error}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((book) => (
            <article
              key={book._id}
              className="rounded-2xl border border-line bg-card p-4 sm:rounded-3xl"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                {book.kind === "accessory" ? "Accessories" : book.language}
              </p>
              <h3 className="mt-1 font-display text-lg leading-tight sm:text-xl">
                {book.title || book.code}
              </h3>
              {book.kind === "book" && book.code ? (
                <p className="text-sm text-muted">{book.code}</p>
              ) : null}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{formatINR(book.price)}</p>
                  <p
                    className={cn(
                      "text-xs",
                      book.stock === 0
                        ? "text-clay"
                        : book.stock <= LOW_STOCK_THRESHOLD
                          ? "text-gold"
                          : "text-sage",
                    )}
                  >
                    {book.stock === 0 ? "Out of stock" : `${book.stock} in stock`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => addToCart(book)}
                  disabled={book.stock === 0 || cartLocked}
                >
                  Add
                </Button>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted">
              No items match that search.
            </p>
          ) : null}
        </div>
      </section>

      <aside className="hidden h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-card p-5 lg:flex">
        {billPanel}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">
              {cart.length} item{cart.length === 1 ? "" : "s"}
              {heldOrders.length > 0 ? ` · ${heldOrders.length} held` : ""}
            </p>
            <p className="truncate font-display text-2xl leading-none">{formatINR(total)}</p>
          </div>
          <Button onClick={() => setMobileBillOpen(true)}>
            {step === "cart" ? "Current bill" : step === "payment" ? "Payment" : "Receipt"}
          </Button>
        </div>
      </div>

      {mobileBillOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close current bill"
            onClick={() => setMobileBillOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
                aria-label="Close current bill"
                onClick={() => setMobileBillOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {billPanel}
          </div>
        </div>
      ) : null}
    </div>
    <DiscountDialog
      open={discountOpen}
      lines={cart.map((line) => ({
        id: line.book._id,
        title: line.book.title || line.book.code,
        unitPrice: line.book.price,
        quantity: line.quantity,
        discountMode: line.discountMode,
        discountValue: line.discountValue,
      }))}
      billMode={billDiscountMode}
      billValue={billDiscountValue}
      onClose={() => setDiscountOpen(false)}
      onApply={(next) => {
        setCart((current) =>
          current.map((line) => {
            const match = next.lines.find((item) => item.id === line.book._id);
            return match
              ? {
                  ...line,
                  discountMode: match.discountMode,
                  discountValue: match.discountValue,
                }
              : line;
          }),
        );
        setBillDiscountMode(next.billMode);
        setBillDiscountValue(next.billValue);
        setDiscountOpen(false);
      }}
    />
    </>
  );
}

function BillPanel({
  step,
  cart,
  generateBill,
  customerName,
  customerPhone,
  customerEmail,
  quote,
  emailNotice,
  paymentMethod,
  total,
  error,
  pending,
  holdPending,
  completed,
  heldOrders,
  onGenerateBill,
  onCustomerName,
  onCustomerPhone,
  onCustomerEmail,
  onOpenDiscount,
  onPaymentMethod,
  onRemove,
  onChangeQty,
  onSetQty,
  onGoToPayment,
  onGoBack,
  onCompletePayment,
  onNewSale,
  onHoldOrder,
  onResumeHeld,
  onDiscardHeld,
}: {
  step: Step;
  cart: CartLine[];
  generateBill: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  quote: {
    subtotal: number;
    lineDiscount: number;
    discountAmount: number;
    total: number;
  };
  emailNotice: string;
  paymentMethod: string;
  total: number;
  error: string;
  pending: boolean;
  holdPending: boolean;
  completed: Completion | null;
  heldOrders: HeldOrder[];
  onGenerateBill: (value: boolean) => void;
  onCustomerName: (value: string) => void;
  onCustomerPhone: (value: string) => void;
  onCustomerEmail: (value: string) => void;
  onOpenDiscount: () => void;
  onPaymentMethod: (value: string) => void;
  onRemove: (bookId: string) => void;
  onChangeQty: (bookId: string, delta: number) => void;
  onSetQty: (bookId: string, quantity: number) => void;
  onGoToPayment: () => void;
  onGoBack: () => void;
  onCompletePayment: () => void;
  onNewSale: () => void;
  onHoldOrder: () => void;
  onResumeHeld: (orderId: string) => void;
  onDiscardHeld: (orderId: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-col lg:h-full">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <h2 className="font-display text-xl sm:text-2xl">Current bill</h2>
        {step === "payment" ? (
          <Button variant="secondary" size="sm" onClick={onGoBack} disabled={pending}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        ) : null}
      </div>

      {step === "done" && completed ? (
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Payment complete</p>
          <h3 className="font-display text-2xl sm:text-3xl">{completed.bill.billNumber}</h3>
          <p className="text-sm text-muted">
            {completed.bill.customerName} · {formatINR(completed.bill.total)}
          </p>
          <p className="text-sm text-muted">
            Paid by {paymentMethodLabel(completed.bill.paymentMethod)}. Saved in History.
          </p>
          {emailNotice ? <p className="text-sm text-muted">{emailNotice}</p> : null}
          <Button className="w-full" onClick={() => downloadBillPdf(completed.bill)}>
            Generate bill
          </Button>
          <Button variant="secondary" className="w-full" onClick={onNewSale}>
            New sale
          </Button>
        </div>
      ) : null}

      {step === "payment" ? (
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          <p className="text-sm text-muted">
            Choose how the customer is paying. Use Back if you still need to add or remove items.
          </p>
          <div className="space-y-2 rounded-2xl bg-paper px-3 py-3">
            {cart.map((line) => (
              <div key={line.book._id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 break-words">
                  {line.book.title || line.book.code} × {line.quantity}
                </span>
                <span className="shrink-0 font-medium">
                  {formatINR(
                    priceLine(line.book.price, line.quantity, line.discountMode, line.discountValue)
                      .lineTotal,
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1" role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onPaymentMethod(method.id)}
                  className={cn(
                    "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                    selected
                      ? "border-forest bg-forest/10 text-forest shadow-[inset_0_0_0_1px_rgba(47,74,60,0.25)]"
                      : "border-line bg-card text-ink hover:border-forest/40 hover:bg-paper",
                  )}
                >
                  <PaymentMethodIcon method={method.id} className="h-10 w-10 shrink-0" />
                  <span className="font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-xs uppercase tracking-[0.16em] text-muted sm:text-sm">Total</span>
            <span className="font-display text-2xl sm:text-3xl">{formatINR(total)}</span>
          </div>
          {error ? (
            <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
          ) : null}
          <Button className="w-full" onClick={onCompletePayment} disabled={pending || !paymentMethod}>
            {pending ? "Saving..." : "Done payment"}
          </Button>
        </div>
      ) : null}

      {step === "cart" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="bill-scroll mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {heldOrders.length > 0 ? (
              <div className="space-y-2 rounded-2xl border border-line bg-paper/70 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Held orders · {heldOrders.length}
                </p>
                {heldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{order.label}</p>
                      <p className="text-xs text-muted">
                        {order.items.reduce((sum, line) => sum + line.quantity, 0)} item
                        {order.items.reduce((sum, line) => sum + line.quantity, 0) === 1 ? "" : "s"} ·{" "}
                        {formatINR(order.total)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={holdPending}
                        onClick={() => onResumeHeld(order.id)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={holdPending}
                        aria-label={`Discard held order ${order.label}`}
                        onClick={() => onDiscardHeld(order.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-paper px-4 py-3">
              <input
                type="checkbox"
                checked={generateBill}
                onChange={(event) => onGenerateBill(event.target.checked)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-forest peer-focus-visible:ring-offset-2",
                  generateBill ? "border-forest bg-forest" : "border-muted bg-card",
                )}
                aria-hidden="true"
              >
                {generateBill ? <span className="h-2 w-2 rounded-[1px] bg-card" /> : null}
              </span>
              <span>
                <span className="block font-medium">Add customer details</span>
                <span className="text-sm text-muted">
                  Tick this for a named customer on the bill. Name and email are required, and the
                  bill is emailed after payment. Every sale is saved in History either way.
                </span>
              </span>
            </label>

            {generateBill ? (
              <div className="space-y-3">
                <Field label="Customer name (required)">
                  <TextInput
                    value={customerName}
                    onChange={(event) => onCustomerName(event.target.value)}
                    placeholder="Enter customer name"
                    required
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email (required)">
                  <TextInput
                    type="email"
                    value={customerEmail}
                    onChange={(event) => onCustomerEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Phone (optional)">
                  <TextInput
                    value={customerPhone}
                    onChange={(event) => onCustomerPhone(event.target.value)}
                    placeholder="10-digit number"
                  />
                </Field>
              </div>
            ) : null}

            <div className="space-y-3">
              {cart.length === 0 ? (
                <p className="rounded-2xl bg-paper px-4 py-6 text-sm text-muted">
                  Add items from the shelf to start.
                </p>
              ) : (
                cart.map((line) => (
                  <div key={line.book._id} className="rounded-2xl bg-paper px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{line.book.title || line.book.code}</p>
                        <p className="text-sm text-muted">
                          {itemDetailLine(line.book)} · {formatINR(line.book.price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 p-1 text-muted hover:text-clay"
                        onClick={() => onRemove(line.book._id)}
                        aria-label={`Remove ${line.book.title || line.book.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onChangeQty(line.book._id, -1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <QtyField
                          quantity={line.quantity}
                          max={line.book.stock}
                          label={line.book.title || line.book.code}
                          onCommit={(quantity) => onSetQty(line.book._id, quantity)}
                        />
                        <Button variant="secondary" size="sm" onClick={() => onChangeQty(line.book._id, 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="font-semibold">
                        {formatINR(
                          priceLine(
                            line.book.price,
                            line.quantity,
                            line.discountMode,
                            line.discountValue,
                          ).lineTotal,
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
          ) : null}

          <div className="mt-4 shrink-0 space-y-1 border-t border-line pt-4 text-sm">
            {quote.lineDiscount > 0 || quote.discountAmount > 0 ? (
              <>
                <div className="flex items-center justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatINR(quote.subtotal + quote.lineDiscount)}</span>
                </div>
                {quote.lineDiscount > 0 ? (
                  <div className="flex items-center justify-between text-muted">
                    <span>Item discount</span>
                    <span>-{formatINR(quote.lineDiscount)}</span>
                  </div>
                ) : null}
                {quote.discountAmount > 0 ? (
                  <div className="flex items-center justify-between text-muted">
                    <span>Bill discount</span>
                    <span>-{formatINR(quote.discountAmount)}</span>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-muted sm:text-sm">Total</span>
              <span className="font-display text-2xl sm:text-3xl">{formatINR(total)}</span>
            </div>
          </div>
          <div className="mt-3 shrink-0 space-y-2.5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={onOpenDiscount}
              disabled={cart.length === 0}
            >
              Discount
            </Button>
            <Button
              className="w-full min-h-12 text-base"
              onClick={onGoToPayment}
              disabled={
                cart.length === 0 ||
                holdPending ||
                (generateBill && (!customerName.trim() || !isEmail(customerEmail)))
              }
            >
              Complete payment
            </Button>
            <Button
              variant="secondary"
              className="w-full min-h-11 border-forest/30 bg-forest/5 text-forest hover:border-forest hover:bg-forest/10"
              onClick={onHoldOrder}
              disabled={
                cart.length === 0 ||
                holdPending ||
                (generateBill && (!customerName.trim() || !isEmail(customerEmail)))
              }
            >
              <Pause className="h-4 w-4" />
              {holdPending ? "Holding..." : "Hold order"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QtyField({
  quantity,
  max,
  label,
  onCommit,
}: {
  quantity: number;
  max: number;
  label: string;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  function commit(raw: string) {
    const next = Number.parseInt(raw, 10);
    if (!Number.isInteger(next) || next < 1) {
      setDraft(String(quantity));
      return;
    }
    const capped = Math.min(next, Math.max(max, 1));
    onCommit(capped);
    setDraft(String(capped));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={`Quantity for ${label}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
      onBlur={() => commit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="h-10 w-14 rounded-full border border-line bg-card text-center text-sm font-semibold text-ink outline-none transition focus:border-forest"
    />
  );
}
