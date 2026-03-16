/**
 * Migration: rename `profession` → `qualification` on Fellow documents
 * and on embedded `fellows[].profession` inside WeeklyReport documents.
 *
 * Run once against your MongoDB database:
 *   node tools/migrate-profession-to-qualification.cjs
 *
 * Requires MONGODB_URI in your .env (or set it in the environment).
 */

"use strict";

const { MongoClient } = require("mongodb");
const path = require("path");

// Load .env if present
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
} catch {
  // dotenv may not be installed; try manual parse
  try {
    const fs = require("fs");
    const envPath = path.resolve(__dirname, "../.env");
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // no .env file, rely on process.env
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Aborting.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✅  Connected to MongoDB");

  const db = client.db(); // uses the database encoded in the URI

  // ── 1. Fellows collection ────────────────────────────────────
  const fellowsCol = db.collection("fellows");

  const fellowResult = await fellowsCol.updateMany(
    { profession: { $exists: true } },
    [
      { $set: { qualification: "$profession" } },
      { $unset: "profession" },
    ]
  );

  console.log(
    `fellows: ${fellowResult.modifiedCount} document(s) updated (profession → qualification)`
  );

  // ── 2. WeeklyReports – embedded fellows array ────────────────
  // MongoDB doesn't support renaming fields inside arrays with a
  // single updateMany using $rename, so we use an aggregation pipeline.
  const reportsCol = db.collection("weeklyreports");

  const reportResult = await reportsCol.updateMany(
    { "fellows.profession": { $exists: true } },
    [
      {
        $set: {
          fellows: {
            $map: {
              input: "$fellows",
              as: "f",
              in: {
                $mergeObjects: [
                  "$$f",
                  { qualification: "$$f.profession" },
                  { profession: "$$REMOVE" },
                ],
              },
            },
          },
        },
      },
    ]
  );

  console.log(
    `weeklyreports: ${reportResult.modifiedCount} document(s) updated (fellows[].profession → fellows[].qualification)`
  );

  await client.close();
  console.log("✅  Migration complete. Connection closed.");
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
