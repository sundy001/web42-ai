import { Umzug } from "umzug";
import type { Db, MongoClient } from "mongodb";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoDBStorage } from "./mongoStorage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationContext {
  db: Db;
  client: MongoClient;
}

export function createMigrator(db: Db, client: MongoClient): Umzug<MigrationContext> {
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, "../../migrations/*.migration.{js,ts}"),
      resolve: ({ name, path: migrationPath }) => {
        if (!migrationPath) {
          throw new Error(`Migration ${name} has no path`);
        }
        
        return {
          name,
          up: async ({ context }) => {
            const migration = await import(migrationPath);
            await migration.up(context);
          },
          down: async ({ context }) => {
            const migration = await import(migrationPath);
            await migration.down(context);
          },
        };
      },
    },
    context: { db, client },
    storage: new MongoDBStorage(db),
    logger: console,
  });
}

export async function runMigrations(db: Db, client: MongoClient): Promise<void> {
  const migrator = createMigrator(db, client);
  
  console.log("📦 Running database migrations...");
  
  const migrations = await migrator.up();
  
  if (migrations.length === 0) {
    console.log("✅ No new migrations to run");
  } else {
    console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
    migrations.forEach((migration) => {
      console.log(`   - ${migration.name}`);
    });
  }
}

export async function rollbackMigration(db: Db, client: MongoClient): Promise<void> {
  const migrator = createMigrator(db, client);
  
  console.log("🔄 Rolling back last migration...");
  
  const migrations = await migrator.down();
  
  if (migrations.length === 0) {
    console.log("✅ No migrations to rollback");
  } else {
    console.log(`✅ Successfully rolled back ${migrations.length} migration(s):`);
    migrations.forEach((migration) => {
      console.log(`   - ${migration.name}`);
    });
  }
}