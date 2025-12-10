import mongoose from "mongoose";

export async function connectDb(uri) {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}


