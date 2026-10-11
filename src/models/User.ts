import mongoose, { type Model } from "mongoose";
import type { Role } from "@/types";

export type UserDocument = {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: Role;
};

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "desk"], required: true },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User: Model<UserDocument> = mongoose.model<UserDocument>("User", UserSchema);
