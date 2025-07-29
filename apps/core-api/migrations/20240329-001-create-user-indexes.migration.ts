import type { MigrationContext } from "../scripts/migrations/migrator";

export async function up({ db }: MigrationContext): Promise<void> {
  console.log("Creating indexes for users collection...");

  const usersCollection = db.collection("users");

  // Create unique index on email
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  console.log("  ✅ Created unique index on users.email");

  // Create index on supabaseUserId for fast lookups
  await usersCollection.createIndex({ supabaseUserId: 1 });
  console.log("  ✅ Created index on users.supabaseUserId");

  // Create compound index for status queries (excluding deleted users)
  await usersCollection.createIndex({ status: 1, createdAt: -1 });
  console.log("  ✅ Created compound index on users.status and createdAt");
}

export async function down({ db }: MigrationContext): Promise<void> {
  console.log("Dropping indexes from users collection...");

  const usersCollection = db.collection("users");

  try {
    await usersCollection.dropIndex("email_1");
    console.log("  ✅ Dropped index on users.email");
  } catch (_error) {
    console.log("  ⚠️  Index on users.email not found");
  }

  try {
    await usersCollection.dropIndex("supabaseUserId_1");
    console.log("  ✅ Dropped index on users.supabaseUserId");
  } catch (_error) {
    console.log("  ⚠️  Index on users.supabaseUserId not found");
  }

  try {
    await usersCollection.dropIndex("status_1_createdAt_-1");
    console.log("  ✅ Dropped compound index on users.status and createdAt");
  } catch (_error) {
    console.log("  ⚠️  Compound index on users.status and createdAt not found");
  }
}
