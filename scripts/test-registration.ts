#!/usr/bin/env tsx
/**
 * Test Registration API
 * 
 * Tests the registration endpoint directly to see if it works
 */

import { db } from "../server/db";
import { users } from "../shared/schema";

async function testRegistration(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("  🧪 REGISTRATION API TEST");
  console.log("=".repeat(60));

  const testEmail = `test-${Date.now()}@example.com`;
  const apiUrl = process.env.BASE_URL || "http://localhost:5000";
  
  console.log(`\nTest Email: ${testEmail}`);
  console.log(`API URL: ${apiUrl}`);

  try {
    console.log("\n1️⃣  Attempting registration via API...");
    
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // CSRF protection
      },
      body: JSON.stringify({
        email: testEmail,
        password: "Test123!@#",
        confirmPassword: "Test123!@#",
        firstName: "Test",
        lastName: "User",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        acceptedTerms: true,
      }),
    });

    console.log(`\n   Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Response Body:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ Registration SUCCESSFUL!");
      console.log(`   User ID: ${data.id}`);
      console.log(`   Email: ${data.email}`);
      
      // Verify in database
      const dbUsers = await db.select().from(users);
      console.log(`\n   Database verification: ${dbUsers.length} user(s) found`);
    } else {
      console.log("\n❌ Registration FAILED!");
      console.log(`   Error: ${data.error || "Unknown error"}`);
      
      if (data.error === "Email already registered") {
        console.log("\n🔍 Investigating 'Email already registered' error...");
        
        // Check if user actually exists in DB
        const dbUsers = await db.select().from(users);
        console.log(`   Users in database: ${dbUsers.length}`);
        
        if (dbUsers.length === 0) {
          console.log("\n❗ CRITICAL: Error says 'Email already registered' but database has NO users!");
          console.log("   This suggests a caching or connection issue.");
        }
      }
    }

  } catch (error) {
    console.error("\n❌ Error during test:");
    console.error(error);
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

testRegistration().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});

