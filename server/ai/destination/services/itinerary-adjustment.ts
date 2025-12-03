/**
 * Service for itinerary adjustments
 * Handles duration changes, add-on generation, and add-on application
 */

import type { ItineraryRecommendation, ItineraryAddon, AdjustItineraryDurationRequest, ApplyAddonRequest } from "@shared/schema";
import { itineraryRecommendationSchema, itineraryAddonsResponseSchema } from "@shared/schema";
import { openai } from "../client";
import { buildAdjustDurationPrompt, buildGenerateAddonsPrompt, buildApplyAddonPrompt } from "../prompts/itinerary-adjustment";
import { validateItineraryStructure } from "../validators/itinerary-validator";
import { validateAddons, validateCitiesPreserved, validateAddonCostIncrease } from "../validators/addon-validator";

/**
 * Adjust itinerary duration - AI regenerates itinerary for new trip length
 * 
 * @param request - Adjustment request with itinerary and new duration
 * @returns Updated itinerary with new duration
 * @throws Error if validation fails or request fails
 */
export async function adjustItineraryDuration(
  request: AdjustItineraryDurationRequest
): Promise<ItineraryRecommendation> {
  const { itinerary, newTotalNights, numberOfTravelers, allowCityRemoval, maxCities } = request;
  
  const currentNights = itinerary.totalNights;
  
  // Save original city names for validation if removal is not allowed
  const originalCityNames = allowCityRemoval === false ? itinerary.cities.map(c => c.cityName) : undefined;

  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildAdjustDurationPrompt(
    itinerary,
    currentNights,
    newTotalNights,
    numberOfTravelers,
    allowCityRemoval,
    maxCities
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const validated = itineraryRecommendationSchema.parse(parsed);
    
    // Validate itinerary structure and constraints
    validateItineraryStructure(validated, {
      expectedNights: newTotalNights,
      originalCityNames,
      allowCityRemoval,
      maxCities,
    });
    
    return validated;
  } catch (error) {
    console.error("Error adjusting itinerary duration:", error);
    throw new Error("Failed to adjust itinerary duration");
  }
}

/**
 * Generate add-on recommendations for a confirmed itinerary
 * 
 * @param itinerary - Base itinerary to generate add-ons for
 * @param numberOfTravelers - Number of travelers
 * @returns Array of add-on recommendations
 * @throws Error if validation fails or request fails
 */
export async function generateItineraryAddons(
  itinerary: ItineraryRecommendation,
  numberOfTravelers: number
): Promise<ItineraryAddon[]> {
  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildGenerateAddonsPrompt(itinerary, numberOfTravelers);

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
    const validated = itineraryAddonsResponseSchema.parse(parsed);
    
    // Validate add-on structure using extracted to validator
    validateAddons(validated.addons);
    
    return validated.addons;
  } catch (error) {
    console.error("Error generating itinerary add-ons:", error);
    throw new Error("Failed to generate itinerary add-ons");
  }
}

/**
 * Apply a selected add-on to an itinerary
 * 
 * @param request - Request with itinerary and add-on to apply
 * @returns Updated itinerary with add-on applied
 * @throws Error if validation fails or request fails
 */
export async function applyAddon(
  request: ApplyAddonRequest
): Promise<ItineraryRecommendation> {
  const { itinerary, addon, numberOfTravelers } = request;

  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildApplyAddonPrompt(itinerary, addon, numberOfTravelers);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const validated = itineraryRecommendationSchema.parse(parsed);
    
    // Validate total nights increased correctly
    const expectedNights = itinerary.totalNights + addon.deltaNights;
    validateItineraryStructure(validated, {
      expectedNights,
    });
    
    // Validate all original cities are preserved (extracted to validator)
    validateCitiesPreserved(itinerary, validated);
    
    // Validate cost increased reasonably (extracted to validator)
    validateAddonCostIncrease(itinerary, validated, addon);
    
    return validated;
  } catch (error) {
    console.error("Error applying add-on:", error);
    throw new Error("Failed to apply add-on to itinerary");
  }
}
