/**
 * Migration: fix legacy state names in all collections.
 *   - "Federal Capital Territory" / "FEDERAL CAPITAL TERRITORY" → "FCT"
 *   - "Nassarawa" / "NASSARAWA" → "NASARAWA"
 *
 * Covers:
 *   coordinators, deskofficers, mentors  → states[]
 *   alerts, monthlyreports              → state
 *   weeklyrollups                       → topStates[].name
 *
 * Run once:
 *   node tools/migrate-state-names.cjs
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

const RENAMES = [
  { old: /^federal capital territory$/i, replacement: "FCT" },
  { old: /^nassarawa$/i, replacement: "NASARAWA" },
];

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✅  Connected to MongoDB\n");

  const db = client.db();

  // ── 1. Collections with `states: [String]` ──────────────────
  for (const colName of ["coordinators", "deskofficers", "mentors"]) {
    const col = db.collection(colName);
    let modified = 0;

    for (const rule of RENAMES) {
      const res = await col.updateMany(
        { states: rule.old },
        { $set: { "states.$[el]": rule.replacement } },
        { arrayFilters: [{ el: rule.old }] }
      );
      modified += res.modifiedCount;
    }

    console.log(`${colName}: ${modified} document(s) updated`);
  }

  // ── 2. Collections with `state: String` ─────────────────────
  for (const colName of ["alerts", "monthlyreports"]) {
    const col = db.collection(colName);
    let modified = 0;

    for (const rule of RENAMES) {
      const res = await col.updateMany(
        { state: rule.old },
        { $set: { state: rule.replacement } }
      );
      modified += res.modifiedCount;
    }

    console.log(`${colName}: ${modified} document(s) updated`);
  }

  // ── 3. WeeklyRollups: topStates[].name ──────────────────────
  {
    const col = db.collection("weeklyrollups");
    let modified = 0;

    for (const rule of RENAMES) {
      const res = await col.updateMany(
        { "topStates.name": rule.old },
        { $set: { "topStates.$[el].name": rule.replacement } },
        { arrayFilters: [{ "el.name": rule.old }] }
      );
      modified += res.modifiedCount;
    }

    console.log(`weeklyrollups: ${modified} document(s) updated`);
  }

  await client.close();
  console.log("\n✅  Migration complete. Connection closed.");
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
