# Utility Scripts

This directory contains administrative and utility scripts for managing the TripPenguin application.

## Available Scripts

### Delete User

Delete a user and all associated data from the database.

**Usage:**
```bash
npm run delete-user <email>
```

**Example:**
```bash
npm run delete-user user@example.com
```

**What it deletes:**
- User account
- All trips created by the user
- All destinations for those trips
- All budget categories
- All bookings
- All email verification tokens
- All password reset tokens
- All sessions (via cascade)

**Notes:**
- The script uses database cascade deletion (configured in schema.ts)
- Deletion is permanent and cannot be undone
- The script validates email format before proceeding
- Returns exit code 0 on success, 1 on failure

**Direct execution (alternative):**
```bash
tsx scripts/delete-user.ts user@example.com
```

---

### Delete All Users

⚠️ **DANGER**: Delete ALL users and ALL data from the database.

**Usage:**
```bash
npm run delete-all-users -- --confirm
```

**Important:** Note the extra `--` before `--confirm` when using npm. This tells npm to pass the flag to the script.

**Safety Requirements:**
- Requires `--confirm` flag to execute
- Shows list of all users before deletion
- Warns if running in production environment
- Should only be used in development/testing

**What it deletes:**
- ALL user accounts
- ALL trips (cascade)
- ALL destinations (cascade)
- ALL budget categories (cascade)
- ALL bookings (cascade)
- ALL email verification tokens (cascade)
- ALL password reset tokens (cascade)
- ALL sessions (cascade)

**Example:**
```bash
# Development/testing cleanup (using npm)
npm run delete-all-users -- --confirm

# Direct execution (alternative, no extra -- needed)
tsx scripts/delete-all-users.ts --confirm
```

**⚠️ Important Warnings:**
- This is a DESTRUCTIVE operation
- Cannot be undone
- Resets the entire application database
- Always backup before running in production
- Best used for development/testing environment resets

---

### Delete All Sessions

🧹 Clear all session data from the database.

**Usage:**
```bash
npm run delete-all-sessions -- --confirm
```

**Important:** Note the extra `--` before `--confirm` when using npm.

**What it deletes:**
- ALL session records
- Logs out all currently authenticated users

**When to use:**
- Clean up stale sessions during development
- Clear sessions after deleting users
- Fix authentication-related issues
- Reset session state completely

**Example:**
```bash
# Clear all sessions (using npm)
npm run delete-all-sessions -- --confirm

# Direct execution (alternative, no extra -- needed)
tsx scripts/delete-all-sessions.ts --confirm
```

**Note:** The `delete-all-users` script now automatically clears sessions, so you typically won't need to run this separately. However, it's useful for clearing sessions without deleting users.

---

## Adding New Scripts

When adding new utility scripts:

1. Create the script in this directory
2. Use TypeScript with tsx for consistency
3. Add proper error handling and user feedback
4. Document the script in this README
5. Add an npm script alias in package.json if useful
6. Include usage examples and warnings

### Script Template

```typescript
#!/usr/bin/env tsx
import { db } from "../server/db";

async function main() {
  const args = process.argv.slice(2);
  
  // Your script logic here
  
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
```



