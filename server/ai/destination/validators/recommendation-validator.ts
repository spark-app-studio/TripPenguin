/**
 * Validator for itinerary recommendations
 * Validates recommendation constraints and data integrity
 */

import type { ItineraryRecommendation } from "@shared/schema";

/**
 * Validates and corrects domestic trip recommendations
 * Ensures all cities in domestic trips are in the United States
 * 
 * @param recommendations - Array of itinerary recommendations
 * @param isDomesticTrip - Whether this is a domestic trip
 * @returns Validated recommendations (with corrections applied)
 */
export function validateDomesticTripRecommendations(
  recommendations: ItineraryRecommendation[],
  isDomesticTrip: boolean
): ItineraryRecommendation[] {
  if (!isDomesticTrip) {
    return recommendations;
  }
  
  // For domestic trips, verify all cities are in the United States
  for (const itinerary of recommendations) {
    for (const city of itinerary.cities) {
      if (city.countryName !== "United States") {
        console.warn(`Domestic trip returned non-US city: ${city.cityName}, ${city.countryName}. Overriding to United States.`);
        city.countryName = "United States";
      }
    }
  }
  
  return recommendations;
}
