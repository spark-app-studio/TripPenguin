/**
 * Duration calculation utilities for trip planning
 */

import type { ExtendedQuizResponse } from "@shared/schema";

/**
 * Duration mapping from trip length preferences to number of days
 */
const DURATION_MAP: Record<string, number> = {
  "1-3 days": 3,
  "4-7 days": 7,
  "1-2 weeks": 10,
  "2-3 weeks": 17,
  "3+ weeks": 21,
  "flexible": 10,
} as const;

/**
 * Converts trip length preference from quiz response to number of days
 * 
 * @param quiz - Extended quiz response with tripLength field
 * @returns Number of days (default: 10 if not found)
 * 
 * @example
 * ```typescript
 * const days = getTripLengthDays({ tripLength: "4-7 days" });
 * // Returns: 7
 * ```
 */
export function getTripLengthDays(quiz: ExtendedQuizResponse): number {
  const tripLength = quiz.tripLength || "4-7 days";
  return DURATION_MAP[tripLength] ?? 10;
}

/**
 * Converts trip length string to number of days
 * 
 * @param tripLength - Trip length preference string
 * @returns Number of days (default: 10 if not found)
 * 
 * @example
 * ```typescript
 * const days = getTripDurationDays("1-2 weeks");
 * // Returns: 10
 * ```
 */
export function getTripDurationDays(tripLength: string): number {
  return DURATION_MAP[tripLength] ?? 10;
}
