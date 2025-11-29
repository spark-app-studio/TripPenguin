# Quick Reference: Cache Management

## 🚀 For Users

### If You See "Email Already Registered" Error

The app now **automatically handles this**! But if you still have issues:

1. **Hard Refresh:** Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Open DevTools Console** and run:
   ```javascript
   clearAuthState()
   ```
3. **Use Incognito Mode** for testing

### What Happens Automatically

✅ Stale sessions detected when you return to the tab  
✅ Auth refreshed every 10 minutes  
✅ Cookies cleared on logout  
✅ Cache cleared on registration errors  
✅ Background validation on window focus  

---

## 🛠️ For Developers

### Utility Functions

```typescript
import {
  clearAuthState,         // Clear all auth data
  refreshAuthStatus,      // Force auth refresh
  detectStaleness,        // Check if stale
  handleRegistrationError, // Handle reg error
  performCompleteCleanup, // Nuclear option
} from "@/lib/cacheUtils";
```

### NPM Commands

```bash
# Check database state
npm run verify-db

# Test registration API
npm run test-registration

# Clear everything
npm run delete-all-users -- --confirm
```

### Browser Console Commands

```javascript
// Clear auth state
clearAuthState()

// Check staleness
detectStaleness()

// Complete cleanup
performCompleteCleanup()

// Force refresh
refreshAuthStatus()
```

---

## 🔧 What Was Implemented

### Server-Side
- ✅ No-cache headers on all `/api/*` routes
- ✅ Enhanced cookie clearing (with all options)
- ✅ Stale session detection in `/api/auth/user`
- ✅ Auto-clear cookies on registration errors

### Client-Side
- ✅ Automatic stale detection (visibility, focus)
- ✅ Periodic revalidation (every 10 min)
- ✅ Comprehensive cache utilities
- ✅ Auto-cleanup on errors
- ✅ Background validation

---

## 📝 Files Modified

**Server (2 files):**
- `server/index.ts` - Cache control headers
- `server/routes.ts` - Enhanced cookie clearing

**Client (5 files):**
- `client/src/lib/cacheUtils.ts` - NEW utility module
- `client/src/lib/queryClient.ts` - Stale session handling
- `client/src/hooks/useAuth.ts` - Periodic validation
- `client/src/main.tsx` - Automatic detection setup
- `client/src/pages/register.tsx` - Error handling

**Documentation (2 files):**
- `docs/STALE_CACHE_PREVENTION.md` - Full documentation
- `docs/CACHE_QUICK_REFERENCE.md` - THIS FILE

---

## 🎯 Result

**Stale cache issues are now automatically prevented and handled!**

Users should rarely encounter the "Email already registered" error, and when they do, the system automatically cleans up stale state.

For full details, see: `docs/STALE_CACHE_PREVENTION.md`


