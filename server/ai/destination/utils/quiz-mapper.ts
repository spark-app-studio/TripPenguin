/**
 * Quiz response mapping utilities
 * Converts quiz responses into personality profiles and cultural insights
 */

import type { ExtendedQuizResponse } from "@shared/schema";
import { sanitizeInput } from "./sanitization";

/**
 * Maps quiz responses to a personality profile string
 * Used to build AI prompts that understand traveler preferences
 * 
 * @param quiz - Extended quiz response
 * @returns Personality profile string describing traveler preferences
 * 
 * @example
 * ```typescript
 * const profile = mapQuizToPersonality({
 *   tripGoal: "culture",
 *   placeType: "ancientCities",
 *   dayPace: "balanced"
 * });
 * // Returns: "passionate about culture, history, and learning; 
 * //           fascinated by ancient cities and old streets; 
 * //           seeks a balanced mix of relaxation and activities."
 * ```
 */
export function mapQuizToPersonality(quiz: ExtendedQuizResponse): string {
  const traits: string[] = [];

  if (quiz.tripGoal === "rest") {
    traits.push("seeking relaxation and slow mornings");
  } else if (quiz.tripGoal === "culture") {
    traits.push("passionate about culture, history, and learning");
  } else if (quiz.tripGoal === "thrill") {
    traits.push("craving adventure and physical activity");
  } else if (quiz.tripGoal === "magic") {
    traits.push("looking for once-in-a-lifetime magical moments");
  }

  if (quiz.placeType === "ocean") {
    traits.push("drawn to turquoise oceans and beaches");
  } else if (quiz.placeType === "mountains") {
    traits.push("inspired by dramatic mountain landscapes");
  } else if (quiz.placeType === "ancientCities") {
    traits.push("fascinated by ancient cities and old streets");
  } else if (quiz.placeType === "modernSkyline") {
    traits.push("energized by modern skylines and urban nightlife");
  }

  if (quiz.dayPace === "relaxed") {
    traits.push("wants mostly chill days with minimal planning");
  } else if (quiz.dayPace === "balanced") {
    traits.push("seeks a balanced mix of relaxation and activities");
  } else if (quiz.dayPace === "packed") {
    traits.push("loves packed itineraries with lots to do");
  }

  if (quiz.spendingPriority === "food") {
    traits.push("values amazing food, cafés, and culinary experiences");
  } else if (quiz.spendingPriority === "experiences") {
    traits.push("prioritizes unique experiences and excursions");
  } else if (quiz.spendingPriority === "comfort") {
    traits.push("values comfort, great views, and nice accommodations");
  } else if (quiz.spendingPriority === "souvenirs") {
    traits.push("loves collecting meaningful souvenirs and memory items");
  }

  // For international trips, include region preference
  let regionPreference = "";
  if (quiz.tripType === "international" && quiz.internationalRegion && quiz.internationalRegion !== "surprise") {
    const regionMap: Record<string, string> = {
      europe: "Europe",
      asia: "Asia",
      southAmerica: "South America",
      tropicalIslands: "Tropical Islands",
    };
    regionPreference = regionMap[quiz.internationalRegion] || "";
  }

  return `${traits.join("; ")}${regionPreference ? `. Interested in ${regionPreference}` : ""}.`;
}

/**
 * Builds cultural insights text from quiz responses
 * Extracts media preferences and other cultural indicators
 * 
 * @param quiz - Extended quiz response
 * @returns Formatted cultural insights string
 * 
 * @example
 * ```typescript
 * const insights = buildCulturalInsightsText({
 *   favoriteMedia: "Lord of the Rings"
 * });
 * // Returns: 'Favorite Media/Entertainment: "Lord of the Rings"'
 * ```
 */
export function buildCulturalInsightsText(quiz: ExtendedQuizResponse): string {
  const insights: string[] = [];
  
  // Extended schema uses favoriteMedia instead of separate movie/book
  if (quiz.favoriteMedia) {
    insights.push(`Favorite Media/Entertainment: "${sanitizeInput(quiz.favoriteMedia)}"`);
  }
  
  return insights.length > 0 ? insights.join(", ") : "";
}
