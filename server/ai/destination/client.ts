/**
 * OpenAI client configuration for destination AI services
 * Centralized client instance for all destination-related AI operations
 */

import OpenAI from "openai";

/**
 * Validates that OpenAI API key is configured
 * Logs a warning if the key is missing (does not throw to allow graceful degradation)
 */
function validateApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set");
  }
}

/**
 * Shared OpenAI client instance
 * All destination AI services use this client
 * 
 * @example
 * ```typescript
 * import { openai } from "./client";
 * const completion = await openai.chat.completions.create({ ... });
 * ```
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

/**
 * Validates API key configuration
 * Throws an error if the key is missing (for services that require it)
 */
export function requireApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }
}

// Validate on module load
validateApiKey();
