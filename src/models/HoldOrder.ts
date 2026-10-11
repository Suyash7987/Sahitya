import mongoose, { type Model } from "mongoose";

export type HoldOrderItemDocument = {
  bookId: mongoose.Types.ObjectId;
  title: string;
  kind: string;
  language: string;
  code: string;
  quantity: number;
  price: number;
  gross: number;
  discountMode: "" | "amount" | "percent";
  discountValue: number;
  discountAmount: number;
  lineTotal: number;
};

export type HoldOrderDocument = {
  _id: mongoose.Types.ObjectId;
  label: string;
  generateBill: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: HoldOrderItemDocument[];
  subtotal: number;
  discountMode: "" | "amount" | "percent";
  discountValue: number;
  discountAmount: number;
  total: number;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
};

const HoldOrderItemSchema = new mongoose.Schema<HoldOrderItemDocument>(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true },
    kind: { type: String, default: "book" },
    language: { type: String, default: "" },
    code: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gross: { type: Number, required: true, min: 0, default: 0 },
    discountMode: { type: String, enum: ["", "amount", "percent"], default: "" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const HoldOrderSchema = new mongoose.Schema<HoldOrderDocument>(
  {
    label: { type: String, required: true, trim: true },
    generateBill: { type: Boolean, default: false },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    customerEmail: { type: String, default: "", trim: true, lowercase: true },
    items: { type: [HoldOrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountMode: { type: String, enum: ["", "amount", "percent"], default: "" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true, collection: "hold_orders" },
);

if (mongoose.models.HoldOrder) {
  delete mongoose.models.HoldOrder;
}

export const HoldOrder: Model<HoldOrderDocument> = mongoose.model<HoldOrderDocument>(
  "HoldOrder",
  HoldOrderSchema,
);
