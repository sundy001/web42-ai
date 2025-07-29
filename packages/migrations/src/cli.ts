#!/usr/bin/env bun
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import {
  createMigrator,
  rollbackMigration,
  runMigrations,
} from "./migrator.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "web42-ai";

async function main() {
  const command = process.argv[2];

  if (!command || !["up", "down", "status"].includes(command)) {
    console.log("Usage: bun run migrate [up|down|status]");
    console.log("  up     - Run pending migrations");
    console.log("  down   - Rollback last migration");
    console.log("  status - Show migration status");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    console.log(`📦 Connected to database: ${DATABASE_NAME}`);

    switch (command) {
      case "up":
        await runMigrations(db, client);
        break;

      case "down":
        await rollbackMigration(db, client);
        break;

      case "status": {
        const migrator = createMigrator(db, client);
        const pending = await migrator.pending();
        const executed = await migrator.executed();

        console.log("\n📊 Migration Status:");
        console.log(`✅ Executed migrations: ${executed.length}`);
        if (executed.length > 0) {
          executed.forEach((m: unknown) =>
            console.log(
              `   - ${typeof m === "string" ? m : (m as { name?: string }).name || m}`,
            ),
          );
        }

        console.log(`⏳ Pending migrations: ${pending.length}`);
        if (pending.length > 0) {
          pending.forEach((m: unknown) =>
            console.log(`   - ${(m as { name?: string }).name || m}`),
          );
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
