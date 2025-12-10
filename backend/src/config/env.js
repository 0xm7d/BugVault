import dotenv from "dotenv";

dotenv.config();

const required = (value, key) => {
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  MONGO_URI: required(process.env.MONGO_URI, "MONGO_URI"),
  JWT_SECRET: required(process.env.JWT_SECRET, "JWT_SECRET"),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "*",
};


