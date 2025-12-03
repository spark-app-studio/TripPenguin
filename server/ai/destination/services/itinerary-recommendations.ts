/**
 * Service for generating itinerary recommendations
 * Handles both international/domestic and staycation recommendations
 */

import type { ExtendedQuizResponse, ItineraryRecommendation, StaycationRecommendation } from "@shared/schema";
import { itineraryRecommendationsResponseSchema, staycationRecommendationsResponseSchema } from "@shared/schema";
import { openai, requireApiKey } from "../client";
import { buildItineraryRecommendationPrompt } from "../prompts/itinerary-recommendations";
import { buildStaycationPrompt } from "../prompts/staycation-recommendations";
import { validateDomesticTripRecommendations } from "../validators/recommendation-validator";

/**
 * Get AI-generated itinerary recommendations based on quiz responses
 * 
 * @param quiz - Extended quiz response with user preferences
 * @returns Array of itinerary recommendations
 * @throws Error if API key is missing or request fails
 */
export async function getItineraryRecommendations(
  quiz: ExtendedQuizResponse
): Promise<ItineraryRecommendation[]> {
  requireApiKey();

  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildItineraryRecommendationPrompt(quiz);
  const isDomesticTrip = quiz.tripType === "domestic";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    
    // Validate with Zod schema
    const validated = itineraryRecommendationsResponseSchema.parse(parsed);
    
    // Validate domestic trip constraints (extracted to validator)
    const correctedRecommendations = validateDomesticTripRecommendations(
      validated.recommendations,
      isDomesticTrip
    );
    
    return correctedRecommendations;
  } catch (error) {
    console.error("Error getting itinerary recommendations:", error);
    throw new Error("Failed to get AI itinerary recommendations");
  }
}

/**
 * Get staycation recommendations based on extended quiz data
 * Staycations are local getaways within driving distance (max 2-3 hours)
 * 
 * @param quiz - Extended quiz response with user preferences
 * @returns Array of staycation recommendations
 * @throws Error if API key is missing or request fails
 */
export async function getStaycationRecommendations(
  quiz: ExtendedQuizResponse
): Promise<StaycationRecommendation[]> {
  requireApiKey();

  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildStaycationPrompt(quiz);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const validated = staycationRecommendationsResponseSchema.parse(parsed);
    
    return validated.recommendations;
  } catch (error) {
    console.error("Error getting staycation recommendations:", error);
    throw new Error("Failed to get AI staycation recommendations");
  }
}
