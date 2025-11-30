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


