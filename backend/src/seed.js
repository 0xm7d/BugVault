import { connectDb } from "./lib/db.js";
import { UserModel } from "./models/User.js";
import { env } from "./config/env.js";
import bcrypt from "bcryptjs";

async function seed() {
  await connectDb(env.MONGO_URI);

  const adminEmail = "admin@bugvault.local";
  const existing = await UserModel.findOne({ email: adminEmail });

  if (existing) {
    console.log("Admin user already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await UserModel.create({
    name: "Admin User",
    email: adminEmail,
    passwordHash,
    role: "admin",
  });

  console.log("Admin user created:");
  console.log(`Email: ${admin.email}`);
  console.log(`Password: admin123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});


