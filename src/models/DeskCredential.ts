import mongoose, { type Model } from "mongoose";

export type DeskCredentialDocument = {
  key: "desk";
  passwordHash: string;
};

const DeskCredentialSchema = new mongoose.Schema<DeskCredentialDocument>(
  {
    key: { type: String, required: true, unique: true, default: "desk" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

if (mongoose.models.DeskCredential) {
  delete mongoose.models.DeskCredential;
}

export const DeskCredential: Model<DeskCredentialDocument> = mongoose.model<DeskCredentialDocument>(
  "DeskCredential",
  DeskCredentialSchema,
);
