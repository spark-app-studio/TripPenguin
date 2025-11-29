#!/usr/bin/env tsx
/**
 * Delete All Users Utility Script
 * 
 * ⚠️  DANGER: This script deletes ALL users and ALL data from the database!
 * 
 * Usage:
 *   npm run delete-all-users -- --confirm
 *   (note the extra -- before --confirm when using npm)
 *   
 *   or directly:
 *   tsx scripts/delete-all-users.ts --confirm
 * 
 * Safety:
 *   - Requires --confirm flag to execute
 *   - Shows count of users before deletion
 *   - Useful for development/testing environments
 *   - DO NOT run in production without backups!
 * 
 * This script will delete:
 * - All user accounts
 * - All trips (cascade)
 * - All destinations (cascade)
 * - All budget categories (cascade)
 * - All bookings (cascade)
 * - All email verification tokens (cascade)
 * - All password reset tokens (cascade)
 * - All sessions (cascade)
 */

import { db } from "../server/db";
import { users } from "../shared/schema";

async function deleteAllUsers(): Promise<void> {
  console.log("\n🔍 Fetching all users from database...");

  // Get all users
  const allUsers = await db.select().from(users);

  if (allUsers.length === 0) {
    console.log("\n✨ Database is already empty (no users found).\n");
    process.exit(0);
  }

  console.log(`\n📊 Found ${allUsers.length} user(s) in the database:`);
  console.log("─".repeat(60));
  
  // Display all users
  allUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName || "N/A"} ${user.lastName || "N/A"}`);
    console.log(`   Created: ${user.createdAt?.toISOString() || "N/A"}`);
    if (index < allUsers.length - 1) {
      console.log();
    }
  });
  console.log("─".repeat(60));

  console.log("\n⚠️  DANGER: This will permanently delete:");
  console.log(`   - ${allUsers.length} user account(s)`);
  console.log("   - ALL trips");
  console.log("   - ALL destinations");
  console.log("   - ALL budget categories");
  console.log("   - ALL bookings");
  console.log("   - ALL email verification tokens");
  console.log("   - ALL password reset tokens");
  console.log("   - ALL sessions");

  console.log("\n🗑️  Deleting all users...");

  try {
    // Delete all users (cascade will handle all related data)
    const result = await db.delete(users);

    console.log("\n✅ All users deleted successfully!");
    console.log(`   Total deleted: ${allUsers.length} user(s)`);
    console.log("   All associated data removed via cascade deletion.\n");
  } catch (error) {
    console.error("\n❌ Error deleting users:");
    console.error(error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const hasConfirmFlag = args.includes("--confirm");

  console.log("\n" + "=".repeat(60));
  console.log("  ⚠️  DELETE ALL USERS UTILITY");
  console.log("=".repeat(60));

  if (!hasConfirmFlag) {
    console.error("\n❌ Error: Missing --confirm flag\n");
    console.log("This script deletes ALL users and ALL data from the database!");
    console.log("This is a DESTRUCTIVE operation that cannot be undone.\n");
    console.log("Usage:");
    console.log("  npm run delete-all-users -- --confirm");
    console.log("  (note the extra -- before --confirm when using npm)\n");
    console.log("  or directly:");
    console.log("  tsx scripts/delete-all-users.ts --confirm\n");
    console.log("⚠️  DO NOT run this in production without a backup!\n");
    process.exit(1);
  }

  // Environment check
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === "production") {
    console.log("\n⚠️  WARNING: Running in PRODUCTION environment!");
    console.log("   NODE_ENV: production");
    console.log("   Make sure you have a backup before proceeding.\n");
  } else {
    console.log(`\n📝 Environment: ${nodeEnv || "development"}\n`);
  }

  try {
    await deleteAllUsers();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Unexpected error:");
    console.error(error);
    process.exit(1);
  }
}

main();

