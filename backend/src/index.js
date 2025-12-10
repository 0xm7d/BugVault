import http from "http";
import app from "./app.js";
import { connectDb } from "./lib/db.js";
import { env } from "./config/env.js";

const PORT = env.PORT || 4000;

async function start() {
  await connectDb(env.MONGO_URI);

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`BugVault API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});


