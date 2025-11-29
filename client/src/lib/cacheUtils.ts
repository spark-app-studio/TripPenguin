/**
 * Cookie and Cache Management Utilities
 * 
 * Helps prevent stale session issues by providing utilities
 * to clear cookies and cache programmatically.
 */

import { queryClient } from "./queryClient";

/**
 * Clear all authentication-related client state
 * Use this when you detect stale sessions or want a fresh start
 */
export function clearAuthState() {
  console.log("🧹 Clearing authentication state...");
  
  // Clear React Query cache
  queryClient.clear();
  
  // Clear sessionStorage items related to auth
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("redirectAfterAuth");
    sessionStorage.removeItem("lastAuthCheck");
    sessionStorage.removeItem("quizData");
    sessionStorage.removeItem("gettingStartedData");
    sessionStorage.removeItem("selectedItinerary");
    sessionStorage.removeItem("selectedStaycation");
    sessionStorage.removeItem("tripSource");
  }
  
  console.log("✅ Authentication state cleared");
}

/**
 * Force a hard refresh of authentication status
 * Useful after logout or when you suspect stale data
 */
export async function refreshAuthStatus() {
  console.log("🔄 Refreshing authentication status...");
  
  // Invalidate and refetch user data
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
  
  console.log("✅ Authentication status refreshed");
}

/**
 * Check if we might have stale session data
 * Returns true if state might be stale
 */
export function detectStaleness(): boolean {
  if (typeof window === "undefined") return false;
  
  const lastCheck = sessionStorage.getItem("lastAuthCheck");
  if (!lastCheck) return false;
  
  const now = Date.now();
  const timeSinceCheck = now - parseInt(lastCheck);
  
  // Consider stale if more than 1 hour
  return timeSinceCheck > 60 * 60 * 1000;
}

/**
 * Clear all cookies (client-side accessible ones)
 * Note: HttpOnly cookies can only be cleared by the server
 */
export function clearClientCookies() {
  if (typeof document === "undefined") return;
  
  console.log("🍪 Clearing client-side cookies...");
  
  // Get all cookies
  const cookies = document.cookie.split(";");
  
  // Clear each cookie
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Clear with different path combinations
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
  
  console.log("✅ Client-side cookies cleared");
}

/**
 * Perform a complete client-side cleanup
 * Use this for the nuclear option when nothing else works
 */
export function performCompleteCleanup() {
  console.log("🚨 Performing complete client-side cleanup...");
  
  clearAuthState();
  clearClientCookies();
  
  // Clear localStorage (if you use it for anything)
  if (typeof window !== "undefined") {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
  }
  
  console.log("✅ Complete cleanup finished - consider doing a hard refresh (Ctrl+Shift+R)");
}

/**
 * Add cleanup handler for registration errors
 * Call this when registration fails with "Email already registered"
 */
export async function handleRegistrationError() {
  console.warn("⚠️  Registration error detected - clearing stale state");
  
  // Clear auth state
  clearAuthState();
  
  // Try to logout (to clear server-side session)
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
    });
  } catch (e) {
    console.warn("Could not logout:", e);
  }
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log("✅ State cleared - try registering again");
}

/**
 * Setup automatic stale session detection
 * Call this once in your app initialization
 */
export function setupStaleSessionDetection() {
  if (typeof window === "undefined") return;
  
  // Check for staleness on page visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && detectStaleness()) {
      console.warn("⚠️  Detected potentially stale session");
      refreshAuthStatus();
    }
  });
  
  // Check for staleness on focus
  window.addEventListener("focus", () => {
    if (detectStaleness()) {
      console.warn("⚠️  Detected potentially stale session");
      refreshAuthStatus();
    }
  });
  
  console.log("✅ Stale session detection enabled");
}

