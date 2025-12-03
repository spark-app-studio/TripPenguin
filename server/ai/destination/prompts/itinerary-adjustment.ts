/**
 * Prompt builders for itinerary adjustments
 * Handles duration changes, add-ons, and applying add-ons
 */

import type { ItineraryRecommendation, ItineraryAddon } from "@shared/schema";

export interface ItineraryAdjustmentPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds prompts for adjusting itinerary duration
 */
export function buildAdjustDurationPrompt(
  itinerary: ItineraryRecommendation,
  currentNights: number,
  newTotalNights: number,
  numberOfTravelers: number,
  allowCityRemoval?: boolean,
  maxCities?: number
): ItineraryAdjustmentPromptParams {
  const changeDirection = newTotalNights > currentNights ? "increase" : "decrease";
  const nightsDelta = Math.abs(newTotalNights - currentNights);

  const systemPrompt = `You are a travel planning AI that helps users adjust their multi-city itineraries.
Your task is to regenerate an itinerary to match a new trip duration while maintaining the spirit and flow of the original plan.

Rules:
- If increasing duration: Add nights to existing cities OR add new cities if it makes sense
- If decreasing duration: Remove nights from cities OR remove entire cities if needed (and allowed)
- Maintain logical travel order and efficient routing
- Keep the same itinerary vibe and overall theme
- Update cost estimates proportionally based on the duration change
- Ensure all city orders are sequential (1, 2, 3...)
- Each city must have at least 1 night

Respond ONLY with valid JSON.`;

  const userPrompt = `Original Itinerary: "${itinerary.title}"
Current Duration: ${currentNights} nights across ${itinerary.cities.length} cities
New Duration: ${newTotalNights} nights
Travelers: ${numberOfTravelers}
${!allowCityRemoval ? "IMPORTANT: Cannot remove cities - only adjust nights per city" : ""}
${maxCities ? `Maximum ${maxCities} cities allowed` : ""}

Current Cities:
${itinerary.cities.map((c, i) => `${i + 1}. ${c.cityName}, ${c.countryName} (${c.stayLengthNights} nights)`).join("\n")}

Original Total Cost: $${itinerary.totalCost.min} - $${itinerary.totalCost.max}
Original Cost Breakdown: ${JSON.stringify(itinerary.costBreakdown)}

Task: ${changeDirection === "increase" ? `Add ${nightsDelta} nights` : `Reduce by ${nightsDelta} nights`}

Generate the updated itinerary following this JSON structure:
{
  "id": "${itinerary.id}",
  "title": "${itinerary.title}",
  "vibeTagline": "${itinerary.vibeTagline}",
  "isCurveball": ${itinerary.isCurveball},
  "totalCost": {
    "min": number,
    "max": number,
    "currency": "USD"
  },
  "costBreakdown": {
    "flights": number,
    "housing": number,
    "food": number,
    "transportation": number,
    "fun": number,
    "preparation": number
  },
  "cities": [
    {
      "order": 1,
      "cityName": "string",
      "countryName": "string",
      "arrivalAirport": "IATA",
      "departureAirport": "IATA",
      "stayLengthNights": number,
      "activities": ["activity1", "activity2", "..."],
      "imageQuery": "search query"
    }
  ],
  "bestTimeToVisit": "${itinerary.bestTimeToVisit}",
  "totalNights": ${newTotalNights}
}`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompts for generating itinerary add-ons
 */
export function buildGenerateAddonsPrompt(
  itinerary: ItineraryRecommendation,
  numberOfTravelers: number
): ItineraryAdjustmentPromptParams {
  const systemPrompt = `You are a travel planning AI that suggests add-on extensions to multi-city itineraries.
Your task is to generate 2-3 attractive add-on options that users can apply to extend their trip.

Guidelines:
- Suggest realistic extensions (2-5 additional days each)
- Add-ons should enhance the existing itinerary (nearby cities, deeper exploration, etc.)
- Calculate realistic cost increases based on the existing itinerary's cost structure
- Make each add-on distinct and appealing
- Consider the existing itinerary's theme and vibe

Respond ONLY with valid JSON.`;

  const userPrompt = `Itinerary: "${itinerary.title}"
Vibe: ${itinerary.vibeTagline}
Current Duration: ${itinerary.totalNights} nights
Cities: ${itinerary.cities.map(c => `${c.cityName}, ${c.countryName}`).join(" → ")}
Current Total Cost: $${itinerary.totalCost.min} - $${itinerary.totalCost.max} for ${numberOfTravelers} traveler(s)
Best Time: ${itinerary.bestTimeToVisit}

Generate 2-3 add-on options following this JSON structure:
{
  "addons": [
    {
      "id": "addon-1",
      "title": "Add 2 More Days",
      "description": "Brief description of what the extension includes",
      "deltaNights": 2,
      "deltaCost": {
        "min": number,
        "max": number,
        "currency": "USD"
      },
      "suggestedAddition": "What cities/activities would be added (e.g., 'Add 2 days in Rome to visit the Vatican')"
    }
  ]
}

Make the add-ons progressively larger (e.g., +2 days, +4 days, +7 days).`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompts for applying an add-on to an itinerary
 */
export function buildApplyAddonPrompt(
  itinerary: ItineraryRecommendation,
  addon: ItineraryAddon,
  numberOfTravelers: number
): ItineraryAdjustmentPromptParams {
  const systemPrompt = `You are a travel planning AI that applies add-on extensions to multi-city itineraries.
Your task is to seamlessly integrate the selected add-on into the existing itinerary.

Guidelines:
- Add the extension in a logical way (append cities, extend existing cities, or insert mid-trip)
- Maintain the itinerary's original vibe and flow
- Update all cost breakdowns to reflect the addition
- Ensure city orders remain sequential
- Keep the same itinerary ID, title, and vibe

Respond ONLY with valid JSON.`;

  const userPrompt = `Original Itinerary: "${itinerary.title}"
Current Duration: ${itinerary.totalNights} nights
Cities: ${itinerary.cities.map(c => `${c.cityName} (${c.stayLengthNights}n)`).join(" → ")}
Current Cost: $${itinerary.totalCost.min} - $${itinerary.totalCost.max}

Selected Add-on: "${addon.title}"
Description: ${addon.description}
Additional Nights: ${addon.deltaNights}
Additional Cost: $${addon.deltaCost.min} - $${addon.deltaCost.max}
Suggested Addition: ${addon.suggestedAddition}

Travelers: ${numberOfTravelers}

Generate the updated itinerary with the add-on applied. Follow this JSON structure:
{
  "id": "${itinerary.id}",
  "title": "${itinerary.title}",
  "vibeTagline": "${itinerary.vibeTagline}",
  "isCurveball": ${itinerary.isCurveball},
  "totalCost": {
    "min": ${itinerary.totalCost.min + addon.deltaCost.min},
    "max": ${itinerary.totalCost.max + addon.deltaCost.max},
    "currency": "USD"
  },
  "costBreakdown": {
    "flights": number (updated),
    "housing": number (updated),
    "food": number (updated),
    "transportation": number (updated),
    "fun": number (updated),
    "preparation": number (updated)
  },
  "cities": [
    {
      "order": sequential starting from 1,
      "cityName": "string",
      "countryName": "string",
      "arrivalAirport": "IATA",
      "departureAirport": "IATA",
      "stayLengthNights": number,
      "activities": ["array of activities"],
      "imageQuery": "search query"
    }
  ],
  "bestTimeToVisit": "${itinerary.bestTimeToVisit}",
  "totalNights": ${itinerary.totalNights + addon.deltaNights}
}`;

  return { systemPrompt, userPrompt };
}
