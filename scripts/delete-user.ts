#!/usr/bin/env tsx
/**
 * Delete User Utility Script
 * 
 * Usage:
 *   npm run delete-user <email>
 *   or
 *   tsx scripts/delete-user.ts <email>
 * 
 * Example:
 *   npm run delete-user user@example.com
 * 
 * This script will:
 * - Find the user by email
 * - Delete the user and all associated data (trips, destinations, budgets, bookings, tokens)
 * - Cascade deletion is handled by database foreign key constraints
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function deleteUser(email: string): Promise<void> {
  console.log(`\n🔍 Searching for user: ${email}`);

  // Find the user
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    console.error(`\n❌ User not found: ${email}`);
    console.error("No action taken.\n");
    process.exit(1);
  }

  // Display user info
  console.log("\n📋 User found:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.firstName || "N/A"} ${user.lastName || "N/A"}`);
  console.log(`   Created: ${user.createdAt?.toISOString() || "N/A"}`);
  console.log(`   Email Verified: ${user.emailVerified ? "Yes" : "No"}`);

  // Confirm deletion
  console.log("\n⚠️  WARNING: This will permanently delete:");
  console.log("   - User account");
  console.log("   - All trips");
  console.log("   - All destinations");
  console.log("   - All budget categories");
  console.log("   - All bookings");
  console.log("   - All email verification tokens");
  console.log("   - All password reset tokens");
  console.log("   - All sessions");

  console.log("\n🗑️  Deleting user...");

  try {
    // Delete the user (cascade will handle related data)
    await db.delete(users).where(eq(users.id, user.id));

    console.log("\n✅ User deleted successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${user.id}\n`);
  } catch (error) {
    console.error("\n❌ Error deleting user:");
    console.error(error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("\n❌ Error: Email address is required\n");
    console.log("Usage:");
    console.log("  npm run delete-user <email>");
    console.log("  or");
    console.log("  tsx scripts/delete-user.ts <email>\n");
    console.log("Example:");
    console.log("  npm run delete-user user@example.com\n");
    process.exit(1);
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`\n❌ Error: Invalid email format: ${email}\n`);
    process.exit(1);
  }

  try {
    await deleteUser(email);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Unexpected error:");
    console.error(error);
    process.exit(1);
  }
}

main();

