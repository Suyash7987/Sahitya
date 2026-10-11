export type Role = "admin" | "desk";
export type ItemKind = "book" | "accessory";

export type SessionUser = {
  userId: string;
  username: string;
  name: string;
  role: Role;
  sessionVersion: number;
};

export type BookRecord = {
  _id: string;
  kind: ItemKind;
  title: string;
  language: string;
  code: string;
  price: number;
  stock: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type DiscountMode = "" | "amount" | "percent";

export type BillItem = {
  bookId: string;
  title: string;
  kind: ItemKind | string;
  language: string;
  code: string;
  quantity: number;
  price: number;
  gross: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  lineTotal: number;
};

export type BillRecord = {
  _id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: string;
  items: BillItem[];
  subtotal: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  total: number;
  createdByName: string;
  createdAt: string;
};
