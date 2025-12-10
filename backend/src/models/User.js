import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "admin", "analyst", "dev"], default: "dev", required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);


