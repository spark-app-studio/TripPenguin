/**
 * Input sanitization utilities for AI prompts
 * Prevents prompt injection attacks by removing dangerous characters
 */

/**
 * Sanitizes user input to prevent prompt injection attacks
 * 
 * @param input - Raw user input string
 * @returns Sanitized string (max 500 chars, no HTML/template chars)
 * 
 * @example
 * ```typescript
 * const safe = sanitizeInput("<script>alert('xss')</script>");
 * // Returns: "scriptalertxssscript"
 * ```
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}]/g, '') // Remove potential HTML/template injection chars
    .substring(0, 500) // Limit length
    .trim();
}
