/**
 * Prompt builder for activity suggestions
 */

import { sanitizeInput } from "../utils/sanitization";

export interface ActivitySuggestionPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

export interface ActivitySuggestionRequest {
  cityName: string;
  countryName: string;
  dayNumber: number;
  dayInCity: number;
  totalDaysInCity: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  existingActivities: string[];
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
}

/**
 * Builds prompts for activity suggestions
 * 
 * @param request - Activity suggestion request
 * @returns Object containing system and user prompts
 */
export function buildActivitySuggestionPrompt(
  request: ActivitySuggestionRequest
): ActivitySuggestionPromptParams {
  const sanitizedCity = sanitizeInput(request.cityName);
  const sanitizedCountry = sanitizeInput(request.countryName);

  const dayContext = request.isArrivalDay 
    ? "This is an arrival day, so suggest lighter activities that account for travel fatigue."
    : request.isDepartureDay 
    ? "This is a departure day, so suggest activities that can be done before leaving."
    : `This is day ${request.dayInCity} of ${request.totalDaysInCity} in the city.`;

  const existingList = request.existingActivities.length > 0 
    ? `Already planned activities (DO NOT suggest these): ${request.existingActivities.join(", ")}`
    : "No activities planned yet for this day.";

  const systemPrompt = `You are a knowledgeable travel expert helping families plan memorable trips. Suggest engaging, family-appropriate activities for ${sanitizedCity}, ${sanitizedCountry}.

Consider:
- ${request.numberOfTravelers} traveler(s)
- Trip type: ${request.tripType}
- ${dayContext}
- ${existingList}

Generate 5 unique activity suggestions that:
1. Are different from any existing activities
2. Mix different categories (must-see attractions, hidden gems, food experiences, outdoor activities, cultural experiences, relaxation)
3. Are realistic and achievable in a few hours
4. Are family-friendly and accessible
5. Include specific venue or location names when possible

Return JSON in this exact format:
{
  "suggestions": [
    {
      "activity": "Short, specific activity description (max 60 chars)",
      "category": "must-see" | "hidden-gem" | "food" | "outdoor" | "cultural" | "relaxation",
      "reason": "Brief reason why this is recommended (max 80 chars)"
    }
  ]
}`;

  const userPrompt = `Suggest 5 unique activities for Day ${request.dayNumber} in ${sanitizedCity}, ${sanitizedCountry}. Make them specific and actionable.`;

  return { systemPrompt, userPrompt };
}
