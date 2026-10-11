import mongoose, { type Model } from "mongoose";

export type BillItemDocument = {
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

export type BillDocument = {
  _id: mongoose.Types.ObjectId;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: string;
  items: BillItemDocument[];
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

const BillItemSchema = new mongoose.Schema<BillItemDocument>(
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
  { _id: false, strict: false },
);

const BillSchema = new mongoose.Schema<BillDocument>(
  {
    billNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: "", trim: true },
    customerEmail: { type: String, default: "", trim: true, lowercase: true },
    paymentMethod: { type: String, default: "", trim: true },
    items: { type: [BillItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountMode: { type: String, enum: ["", "amount", "percent"], default: "" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true },
);

if (mongoose.models.Bill) {
  delete mongoose.models.Bill;
}

export const Bill: Model<BillDocument> = mongoose.model<BillDocument>("Bill", BillSchema);
