#!/usr/bin/env tsx
/**
 * Database State Verification Script
 * 
 * Checks the current state of users and sessions tables
 */

import { db } from "../server/db";
import { users, sessions } from "../shared/schema";
import { sql } from "drizzle-orm";

async function verifyDatabaseState(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("  🔍 DATABASE STATE VERIFICATION");
  console.log("=".repeat(60));

  try {
    // Check users table
    console.log("\n📊 Checking users table...");
    const allUsers = await db.select().from(users);
    console.log(`   Found: ${allUsers.length} user(s)`);
    
    if (allUsers.length > 0) {
      console.log("\n   User Details:");
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Created: ${user.createdAt?.toISOString() || "N/A"}`);
      });
    }

    // Check sessions table
    console.log("\n📊 Checking sessions table...");
    const sessionCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM sessions`);
    const sessionCount = Number(sessionCountResult.rows[0]?.count) || 0;
    console.log(`   Found: ${sessionCount} session(s)`);

    // Check for any email verification tokens
    console.log("\n📊 Checking email_verification_tokens table...");
    const tokenCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_verification_tokens`);
    const tokenCount = Number(tokenCountResult.rows[0]?.count) || 0;
    console.log(`   Found: ${tokenCount} token(s)`);

    // Check for password reset tokens
    console.log("\n📊 Checking password_reset_tokens table...");
    const resetTokenCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens`);
    const resetTokenCount = Number(resetTokenCountResult.rows[0]?.count) || 0;
    console.log(`   Found: ${resetTokenCount} token(s)`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("  📋 SUMMARY");
    console.log("=".repeat(60));
    console.log(`  Users:                    ${allUsers.length}`);
    console.log(`  Sessions:                 ${sessionCount}`);
    console.log(`  Email Tokens:             ${tokenCount}`);
    console.log(`  Password Reset Tokens:    ${resetTokenCount}`);
    console.log("=".repeat(60) + "\n");

    if (allUsers.length === 0 && sessionCount === 0 && tokenCount === 0 && resetTokenCount === 0) {
      console.log("✅ Database is completely clean!\n");
    } else {
      console.log("⚠️  Database still has data - may need cleanup\n");
    }

  } catch (error) {
    console.error("\n❌ Error checking database state:");
    console.error(error);
    process.exit(1);
  }
}

verifyDatabaseState().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});


