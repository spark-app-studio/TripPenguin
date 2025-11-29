#!/usr/bin/env tsx
/**
 * Delete All Sessions Utility Script
 * 
 * Usage:
 *   npm run delete-all-sessions -- --confirm
 *   
 * This script clears all session data from the sessions table.
 * Run this after deleting users to ensure complete cleanup.
 */

import { db } from "../server/db";
import { sessions } from "../shared/schema";
import { sql } from "drizzle-orm";

async function deleteAllSessions(): Promise<void> {
  console.log("\n🔍 Fetching all sessions from database...");

  // Get count of sessions
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM sessions`);
  const count = Number(result.rows[0]?.count) || 0;

  if (count === 0) {
    console.log("\n✨ Sessions table is already empty.\n");
    process.exit(0);
  }

  console.log(`\n📊 Found ${count} session(s) in the database`);
  console.log("─".repeat(60));

  console.log("\n⚠️  This will permanently delete:");
  console.log(`   - ${count} session record(s)`);
  console.log("   - All logged-in user sessions will be invalidated");

  console.log("\n🗑️  Deleting all sessions...");

  try {
    // Delete all sessions
    await db.delete(sessions);

    console.log("\n✅ All sessions deleted successfully!");
    console.log(`   Total deleted: ${count} session(s)\n`);
  } catch (error) {
    console.error("\n❌ Error deleting sessions:");
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const hasConfirmFlag = args.includes("--confirm");

  console.log("\n" + "=".repeat(60));
  console.log("  🧹 DELETE ALL SESSIONS UTILITY");
  console.log("=".repeat(60));

  if (!hasConfirmFlag) {
    console.error("\n❌ Error: Missing --confirm flag\n");
    console.log("This script deletes ALL sessions from the database!");
    console.log("This will log out all users.\n");
    console.log("Usage:");
    console.log("  npm run delete-all-sessions -- --confirm");
    console.log("  (note the extra -- before --confirm when using npm)\n");
    console.log("  or directly:");
    console.log("  tsx scripts/delete-all-sessions.ts --confirm\n");
    process.exit(1);
  }

  const nodeEnv = process.env.NODE_ENV;
  console.log(`\n📝 Environment: ${nodeEnv || "development"}\n`);

  try {
    await deleteAllSessions();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Unexpected error:");
    console.error(error);
    process.exit(1);
  }
}

main();

