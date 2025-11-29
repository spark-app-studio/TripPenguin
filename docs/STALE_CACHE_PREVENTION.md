# Stale Cookie & Cache Prevention System

## Overview

A comprehensive solution to prevent and automatically handle stale browser cookies and cached sessions that can cause "Email already registered" and other authentication errors.

## 🎯 Problem Solved

**Before:** Users would see "Email already registered" errors even when the database was empty, caused by:
- Stale browser cookies from old sessions
- Cached React Query data
- Server sessions persisting after user deletion
- Browser cache holding old authentication state

**After:** Automatic detection and cleanup of stale state at multiple levels.

---

## 🛠️ Implementation

### 1. **Server-Side Improvements**

#### Cache Control Headers (server/index.ts)
Prevents browser from caching API responses:

```typescript
app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  next();
});
```

**Effect:** Browser will never cache API responses

#### Enhanced Cookie Clearing (server/routes.ts)

**On Logout:**
```typescript
res.clearCookie('connect.sid', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
});
```

**On Registration Error:**
- Automatically clears session cookies when "Email already registered" occurs
- Prevents stale session from interfering with new registration

**On Auth Check:**
- `/api/auth/user` endpoint now returns `staleSession: true` flag
- Triggers automatic client-side cleanup

---

### 2. **Client-Side Utilities (client/src/lib/cacheUtils.ts)**

New utility module with comprehensive cache management:

#### `clearAuthState()`
Clears all authentication-related client state:
- React Query cache
- SessionStorage items (quiz data, redirects, etc.)

```typescript
import { clearAuthState } from "@/lib/cacheUtils";
clearAuthState(); // Nuclear option
```

#### `refreshAuthStatus()`
Forces fresh authentication check:
```typescript
import { refreshAuthStatus } from "@/lib/cacheUtils";
await refreshAuthStatus();
```

#### `detectStaleness()`
Checks if session might be stale:
```typescript
import { detectStaleness } from "@/lib/cacheUtils";
if (detectStaleness()) {
  // Take action
}
```

#### `handleRegistrationError()`
Automatic cleanup on registration errors:
- Clears auth state
- Attempts logout
- Prepares for fresh registration

```typescript
import { handleRegistrationError } from "@/lib/cacheUtils";
await handleRegistrationError();
```

#### `setupStaleSessionDetection()`
Automatic monitoring (runs on app init):
- Detects stale sessions on page visibility change
- Detects stale sessions on window focus
- Auto-refreshes auth status when needed

---

### 3. **Automatic Detection System**

#### useAuth Hook Enhancement (client/src/hooks/useAuth.ts)
- Tracks last auth check timestamp
- Auto-revalidates after 10 minutes of inactivity
- Prevents stale auth data

```typescript
// Automatically checks staleness
useEffect(() => {
  if (user) {
    const lastCheck = sessionStorage.getItem("lastAuthCheck");
    if (!lastCheck || isOld(lastCheck)) {
      refreshAuthStatus();
    }
  }
}, [user]);
```

#### Query Client Enhancement (client/src/lib/queryClient.ts)
- Detects `staleSession` flag from server
- Automatically clears cache on 401 with stale flag
- Prevents propagation of stale data

---

### 4. **Integration Points**

#### Main App Init (client/src/main.tsx)
```typescript
import { setupStaleSessionDetection } from "./lib/cacheUtils";
setupStaleSessionDetection(); // Runs once on app start
```

#### Registration Page (client/src/pages/register.tsx)
```typescript
import { handleRegistrationError } from "@/lib/cacheUtils";

onError: (error) => {
  if (error.message.includes("Email already registered")) {
    handleRegistrationError(); // Auto-cleanup
  }
}
```

---

## 🔄 How It Works

### Flow Diagram

```
User Action
    ↓
Browser Check (Automatic)
    ├─ Page Visibility Change → detectStaleness()
    ├─ Window Focus → detectStaleness()
    └─ User Auth Check (10min) → refreshAuthStatus()
    ↓
Server Check
    ├─ GET /api/auth/user
    │   └─ If stale → 401 + staleSession: true
    ├─ POST /api/auth/register
    │   └─ If error → clearCookie()
    └─ POST /api/auth/logout
        └─ Always → clearCookie()
    ↓
Client Cleanup
    ├─ clearAuthState()
    ├─ clearClientCookies()
    └─ queryClient.clear()
    ↓
Fresh State ✅
```

---

## 📋 Features

### Automatic Features (No User Action Required)

✅ **Stale Detection on Page Visibility**
- When user returns to tab
- Checks if session is > 1 hour old
- Auto-refreshes if needed

✅ **Stale Detection on Window Focus**
- When user clicks into window
- Validates current auth state

✅ **Periodic Revalidation**
- Every 10 minutes of use
- Background refresh of auth status

✅ **Error-Triggered Cleanup**
- Registration errors → auto-cleanup
- 401 responses → auto-cleanup
- Logout → thorough cleanup

### Manual Utilities (For Advanced Use)

```typescript
import {
  clearAuthState,
  refreshAuthStatus,
  detectStaleness,
  handleRegistrationError,
  performCompleteCleanup,
  clearClientCookies
} from "@/lib/cacheUtils";

// Basic cleanup
clearAuthState();

// Force refresh
await refreshAuthStatus();

// Check staleness
if (detectStaleness()) { /* ... */ }

// Handle registration error
await handleRegistrationError();

// Nuclear option (clears everything)
performCompleteCleanup();

// Clear cookies
clearClientCookies();
```

---

## 🧪 Testing

### Test Stale Session Handling

```bash
# 1. Create a user
npm run test-registration

# 2. Delete all users (but session remains)
npm run delete-all-users -- --confirm

# 3. Try to register with same email in browser
# Expected: Auto-cleanup, no error

# 4. Verify with
npm run verify-db
```

### Test Browser Cache

```bash
# Open DevTools Console
clearAuthState()           # Clear state
refreshAuthStatus()         # Force refresh
detectStaleness()          # Check staleness
performCompleteCleanup()   # Nuclear option
```

---

## 🎯 Benefits

| Before | After |
|--------|-------|
| ❌ Manual cache clearing required | ✅ Automatic detection and cleanup |
| ❌ "Email already registered" with empty DB | ✅ Auto-handles stale sessions |
| ❌ Users must refresh manually | ✅ Auto-refreshes on focus/visibility |
| ❌ Stale sessions persist | ✅ Auto-cleared after 10 minutes |
| ❌ Cookie cleanup on logout incomplete | ✅ Thorough cookie clearing |
| ❌ No API response caching control | ✅ Strict no-cache headers |

---

## 📊 HTTP Headers Added

### Response Headers (All /api/* routes)
```
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```

### Cookie Clearing (Enhanced)
```
Set-Cookie: connect.sid=; 
            Path=/;
            HttpOnly;
            Secure (production);
            SameSite=Strict (production)/Lax (dev);
            Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

---

## 🔍 Debugging

### Check if automatic detection is working:
```javascript
// In browser console
window.addEventListener('visibilitychange', () => {
  console.log('Visibility changed!');
});
```

### Check session staleness:
```javascript
const lastCheck = sessionStorage.getItem('lastAuthCheck');
console.log('Last check:', new Date(parseInt(lastCheck)));
console.log('Age:', (Date.now() - parseInt(lastCheck)) / 1000 / 60, 'minutes');
```

### Monitor cache clears:
Watch browser console for:
- `🧹 Clearing authentication state...`
- `⚠️  Registration error detected - clearing stale state`
- `⚠️  Detected potentially stale session`

---

## 🚀 Best Practices

### For Users
1. No action needed - system handles automatically
2. If issues persist, use `Ctrl+Shift+R` (hard refresh)
3. Incognito mode for testing

### For Developers
1. Use `npm run verify-db` to check database state
2. Use `npm run test-registration` to test API directly
3. Check DevTools console for automatic cleanup logs
4. Use `clearAuthState()` in console for manual reset

---

## 📝 Summary

**Prevention Strategy:**
1. ✅ Server clears cookies properly
2. ✅ API responses never cached
3. ✅ Client detects staleness automatically
4. ✅ Errors trigger cleanup
5. ✅ Background revalidation every 10min
6. ✅ Focus/visibility triggers checks

**Result:** Users will rarely if ever encounter stale session issues!

---

**Implementation Date:** November 29, 2025  
**Status:** ✅ COMPLETE  
**Files Modified:** 7 (server: 2, client: 5)  
**New Features:** 10+ utility functions  
**Automatic Detection:** Enabled globally


