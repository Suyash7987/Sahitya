export const ITEM_KINDS = [
  { id: "book", label: "Book" },
  { id: "accessory", label: "Accessories" },
] as const;

export type ItemKind = (typeof ITEM_KINDS)[number]["id"];

export function isItemKind(value: string): value is ItemKind {
  return ITEM_KINDS.some((kind) => kind.id === value);
}

export const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu"] as const;

export function isLanguage(value: string): value is (typeof LANGUAGES)[number] {
  return LANGUAGES.includes(value as (typeof LANGUAGES)[number]);
}

export const SESSION_COOKIE = "sahitya_session";

export const LOW_STOCK_THRESHOLD = 5;

export const ORG = {
  name: "All World Gayatri Pariwar Bengaluru",
  shortName: "Sahitya",
  addressLines: [
    "37, Lakshmi Layout Main Rd, Chikka Begur,",
    "Garden Layout, Industrial Layout, Begur,",
    "Bengaluru, Karnataka 560114",
  ],
  phone: "+91 92437 55613",
} as const;

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Credit/Debit Card" },
  { id: "netbanking", label: "Net Banking" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function isPaymentMethod(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((method) => method.id === value);
}

export function paymentMethodLabel(id: string) {
  return PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
}
