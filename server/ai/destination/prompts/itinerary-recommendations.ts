/**
 * Prompt builders for itinerary recommendations
 * Handles both domestic US and international trip prompts
 */

import type { ExtendedQuizResponse } from "@shared/schema";
import { sanitizeInput } from "../utils/sanitization";
import { mapQuizToPersonality } from "../utils/quiz-mapper";
import { buildCulturalInsightsText } from "../utils/quiz-mapper";
import { getTripLengthDays } from "../utils/duration";
import { getUSRegionDescription } from "../utils/region-mapper";

export interface ItineraryPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds prompts for itinerary recommendations based on trip type
 * 
 * @param quiz - Extended quiz response with trip preferences
 * @returns Object containing system and user prompts
 */
export function buildItineraryRecommendationPrompt(
  quiz: ExtendedQuizResponse
): ItineraryPromptParams {
  const isDomesticTrip = quiz.tripType === "domestic";
  
  if (isDomesticTrip) {
    return buildDomesticPrompt(quiz);
  } else {
    return buildInternationalPrompt(quiz);
  }
}

/**
 * Builds prompts for domestic US trips
 */
function buildDomesticPrompt(quiz: ExtendedQuizResponse): ItineraryPromptParams {
  const sanitizedDreamMoment = sanitizeInput(quiz.postcardImage || "");
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);
  const tripDurationDays = getTripLengthDays(quiz);
  const tripLengthLabel = quiz.tripLength || "4-7 days";
  const numberOfTravelers = quiz.numberOfTravelers;
  const usRegionDescription = getUSRegionDescription(quiz.usRegion);

  const systemPrompt = `You are an expert travel advisor specializing in creating multi-city itineraries WITHIN THE UNITED STATES. You help Americans discover amazing domestic travel routes that efficiently combine multiple US destinations into unforgettable journeys. You consider geography, flight logistics, and open-jaw routing (flying into one city and out of another) to create efficient, exciting itineraries.

CRITICAL CONSTRAINT: ALL destinations MUST be within the UNITED STATES. This is a DOMESTIC trip - NO international destinations allowed. Every city must be in a US state.

You pay special attention to cultural interests like favorite movies and books to create themed experiences using US filming locations (e.g., "Yellowstone" fans → Montana ranch experience, "Breaking Bad" fans → Albuquerque tour).`;

  const userPrompt = `Create 3 multi-city DOMESTIC US itineraries for this traveler:

===== CRITICAL: US-ONLY DESTINATIONS =====
This is a DOMESTIC US trip. EVERY city MUST be in the United States.
- countryName MUST be "United States" for ALL cities
- ONLY include cities in US states
- NO international destinations whatsoever
- Focus on: ${usRegionDescription}

Traveler Personality: ${personalityProfile}

${culturalInsights ? `Cultural Interests: ${culturalInsights}\nIMPORTANT: Use their favorite movie/book to inspire themed itineraries. Include US filming locations, book settings, or destinations within America that match the themes and atmospheres of their favorites.\n` : ""}
Dream Moment: "${sanitizedDreamMoment}"

Trip Planning Details:
- Number of travelers: ${numberOfTravelers}
- Trip length preference: ${tripLengthLabel} (approximately ${tripDurationDays} days total)
- REGION FOCUS: ${usRegionDescription}

Create exactly 3 MULTI-CITY US itineraries:

ITINERARY REQUIREMENTS:
- Each itinerary must include 2-4 AMERICAN cities
- ALL cities MUST be in the United States (countryName = "United States")
- Cities should be geographically logical within the US (consider domestic flight routes, driving distances, regional clustering)
- Optimize for efficient routing: consider flying into one city and out of another (open-jaw tickets)
- Include specific US airport IATA codes (e.g., "LAX", "JFK", "ORD", "DEN", "ATL")
- Total nights across all cities should approximately match ${tripDurationDays} days
${quiz.usRegion && quiz.usRegion !== "surprise" ? `- PRIORITIZE destinations in the ${usRegionDescription} region` : "- Can include cities from any US region that matches their preferences"}

ITINERARY STRUCTURE:
- Itinerary 1: Perfect match for personality + cultural interests (US destinations only)
- Itinerary 2: Another great US route with different cities/theme
- Itinerary 3: "Hidden Gem USA" - lesser-known but amazing American destinations

For each itinerary, provide:
1. id: unique identifier (e.g., "itinerary-1", "itinerary-2", "itinerary-3")
2. title: Creative, fun name reflecting the American journey (e.g., "Pacific Coast Highway Dream", "Southern Charm Trail", "Rocky Mountain High")
3. vibeTagline: Short 1-sentence vibe description (max 100 chars)
4. isCurveball: true only for itinerary 3
5. totalCost: Estimated cost range for ALL ${numberOfTravelers} traveler(s) for the ENTIRE domestic trip
   - min: Conservative estimate (budget-conscious choices)
   - max: Higher-end estimate (comfortable choices)
   - currency: "USD"
6. costBreakdown: Average costs for the entire trip across all 6 categories (in USD for ALL ${numberOfTravelers} travelers):
   - flights: DOMESTIC flights within the US for all travelers
   - housing: Hotels/accommodations for all nights, all travelers
   - food: All meals and drinks for all days, all travelers
   - transportation: Local transport (rental cars, Ubers, public transit) for all travelers
   - fun: Activities, tours, attractions, entrance fees for all travelers
   - preparation: Travel insurance, gear, parking fees for all travelers (no visas needed for domestic)
7. cities: Array of 2-4 US city segments in travel order, each with:
   - order: 1, 2, 3, etc.
   - cityName: US city name (e.g., "San Francisco", "Nashville", "Denver")
   - countryName: MUST be "United States" for ALL cities
   - arrivalAirport: US airport IATA code (e.g., "SFO", "BNA", "DEN")
   - departureAirport: US airport IATA code - may differ from arrival for open-jaw routing
   - stayLengthNights: Number of nights in this city
   - activities: Array of 3-5 specific US activity suggestions
   - imageQuery: Search query for beautiful images (e.g., "San Francisco Golden Gate sunset")
8. bestTimeToVisit: Best season/months for this entire US itinerary
9. totalNights: Sum of all stayLengthNights across cities

COST CALCULATION GUIDANCE FOR DOMESTIC US TRIPS:
- Base estimates on ${numberOfTravelers} traveler(s)
- Domestic flights are typically $150-400 per person per segment
- Housing: ${tripDurationDays} nights × accommodation cost × ${numberOfTravelers} travelers
- Food: ${tripDurationDays} days × 3 meals × $40-80/person/day depending on city
- Rental cars are often essential in the US - factor in $50-100/day + gas
- No visa or international preparation costs needed
- Add 15-25% buffer between min and max estimates

EXAMPLE US CITIES BY REGION:
- Pacific Coast: San Francisco, Los Angeles, San Diego, Seattle, Portland
- Mountain West: Denver, Salt Lake City, Phoenix, Sedona, Jackson Hole, Aspen
- Southwest: Austin, Santa Fe, Albuquerque, Tucson, Las Vegas
- Southeast: Nashville, Charleston, Savannah, New Orleans, Miami, Atlanta
- Northeast: New York City, Boston, Philadelphia, Washington D.C., Portland ME
- Midwest: Chicago, Minneapolis, Detroit, Cleveland, Kansas City

Format response as valid JSON matching this structure:
{
  "recommendations": [
    {
      "id": "itinerary-1",
      "title": "Creative US Itinerary Name",
      "vibeTagline": "One-sentence vibe description",
      "isCurveball": false,
      "totalCost": {
        "min": 2500,
        "max": 4000,
        "currency": "USD"
      },
      "costBreakdown": {
        "flights": 800,
        "housing": 1200,
        "food": 600,
        "transportation": 400,
        "fun": 400,
        "preparation": 100
      },
      "cities": [
        {
          "order": 1,
          "cityName": "Nashville",
          "countryName": "United States",
          "arrivalAirport": "BNA",
          "departureAirport": "BNA",
          "stayLengthNights": 3,
          "activities": ["Visit the Country Music Hall of Fame", "Explore Broadway honky-tonks", "Tour the Ryman Auditorium", "Enjoy hot chicken at Prince's"],
          "imageQuery": "Nashville Tennessee Broadway night"
        },
        {
          "order": 2,
          "cityName": "New Orleans",
          "countryName": "United States",
          "arrivalAirport": "MSY",
          "departureAirport": "MSY",
          "stayLengthNights": 4,
          "activities": ["French Quarter walking tour", "Beignets at Cafe Du Monde", "Jazz clubs on Frenchmen Street", "Garden District mansions tour", "Swamp boat tour"],
          "imageQuery": "New Orleans French Quarter"
        }
      ],
      "bestTimeToVisit": "March-May or September-November",
      "totalNights": 7
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds prompts for international trips
 */
function buildInternationalPrompt(quiz: ExtendedQuizResponse): ItineraryPromptParams {
  const sanitizedDreamMoment = sanitizeInput(quiz.postcardImage || "");
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);
  const tripDurationDays = getTripLengthDays(quiz);
  const tripLengthLabel = quiz.tripLength || "4-7 days";
  const numberOfTravelers = quiz.numberOfTravelers;

  const systemPrompt = `You are an expert travel advisor specializing in creating multi-city itineraries. You help people discover perfect travel routes that efficiently combine multiple destinations into unforgettable journeys. You consider geography, flight logistics, and open-jaw routing (flying into one city and out of another) to create efficient, exciting itineraries. You pay special attention to cultural interests like favorite movies and books to create themed experiences (e.g., "Lord of the Rings" fans → Hobbiton tour in New Zealand).`;

  const userPrompt = `Create 3 multi-city itineraries for this traveler:

Traveler Personality: ${personalityProfile}

${culturalInsights ? `Cultural Interests: ${culturalInsights}\nIMPORTANT: Use their favorite movie/book to inspire themed itineraries. Include filming locations, book settings, or destinations that match the themes and atmospheres of their favorites.\n` : ""}
Dream Moment: "${sanitizedDreamMoment}"

Trip Planning Details:
- Number of travelers: ${numberOfTravelers}
- Trip length preference: ${tripLengthLabel} (approximately ${tripDurationDays} days total)

Create exactly 3 MULTI-CITY itineraries:

ITINERARY REQUIREMENTS:
- Each itinerary must include 2-4 cities
- Cities should be geographically logical (consider flight routes, distances, regional clustering)
- Optimize for efficient routing: consider flying into one city and out of another (open-jaw tickets)
- Include specific IATA airport codes when relevant for multi-city routing
- Total nights across all cities should approximately match ${tripDurationDays} days

ITINERARY STRUCTURE:
- Itinerary 1: Perfect match for personality + cultural interests
- Itinerary 2: Another perfect match with different cities/theme
- Itinerary 3: "Curveball surprise" - unexpected but amazing route

For each itinerary, provide:
1. id: unique identifier (e.g., "itinerary-1", "itinerary-2", "itinerary-3")
2. title: Creative, fun name (e.g., "The Mediterranean Dream", "Island Hopper's Paradise", "Samurai & Sushi Trail")
3. vibeTagline: Short 1-sentence vibe description (max 100 chars)
4. isCurveball: true only for itinerary 3
5. totalCost: Estimated cost range for ALL ${numberOfTravelers} traveler(s) for the ENTIRE trip
   - min: Conservative estimate (budget-conscious choices)
   - max: Higher-end estimate (comfortable choices)
   - currency: "USD"
6. costBreakdown: Average costs for the entire trip across all 6 categories (in USD for ALL ${numberOfTravelers} travelers):
   - flights: International + domestic flights for all travelers
   - housing: Hotels/accommodations for all nights, all travelers
   - food: All meals and drinks for all days, all travelers
   - transportation: Local transport (trains, buses, taxis) for all travelers
   - fun: Activities, tours, attractions, entrance fees for all travelers
   - preparation: Visas, travel insurance, vaccinations, gear for all travelers
7. cities: Array of 2-4 city segments in travel order, each with:
   - order: 1, 2, 3, etc.
   - cityName: City name
   - countryName: Country name
   - arrivalAirport: IATA code (e.g., "CDG" for Paris) - especially important for first/last cities
   - departureAirport: IATA code - may differ from arrival for open-jaw routing
   - stayLengthNights: Number of nights in this city
   - activities: Array of 3-5 specific activity suggestions
   - imageQuery: Search query for beautiful images (e.g., "Paris Eiffel Tower sunset")
8. bestTimeToVisit: Best season/months for this entire itinerary
9. totalNights: Sum of all stayLengthNights across cities

COST CALCULATION GUIDANCE:
- Base estimates on ${numberOfTravelers} traveler(s)
- Be realistic with flight costs (international + connections)
- Housing: ${tripDurationDays} nights × accommodation cost × ${numberOfTravelers} travelers (consider shared rooms for families)
- Food: ${tripDurationDays} days × 3 meals × per-meal cost × ${numberOfTravelers} travelers
- Account for destination cost of living (Tokyo vs Bangkok, Paris vs Prague)
- Add 15-25% buffer between min and max estimates

Format response as valid JSON matching this structure:
{
  "recommendations": [
    {
      "id": "itinerary-1",
      "title": "Creative Itinerary Name",
      "vibeTagline": "One-sentence vibe description",
      "isCurveball": false,
      "totalCost": {
        "min": 5000,
        "max": 7000,
        "currency": "USD"
      },
      "costBreakdown": {
        "flights": 2000,
        "housing": 1800,
        "food": 1200,
        "transportation": 400,
        "fun": 800,
        "preparation": 300
      },
      "cities": [
        {
          "order": 1,
          "cityName": "Paris",
          "countryName": "France",
          "arrivalAirport": "CDG",
          "departureAirport": "CDG",
          "stayLengthNights": 4,
          "activities": ["Visit the Eiffel Tower at sunset", "Explore the Louvre Museum", "Stroll through Montmartre", "Seine River dinner cruise"],
          "imageQuery": "Paris Eiffel Tower sunset"
        },
        {
          "order": 2,
          "cityName": "Barcelona",
          "countryName": "Spain",
          "arrivalAirport": "BCN",
          "departureAirport": "BCN",
          "stayLengthNights": 6,
          "activities": ["Sagrada Familia tour", "Beach day at Barceloneta", "Gothic Quarter walking tour", "Tapas and wine tasting", "Park Güell visit"],
          "imageQuery": "Barcelona Sagrada Familia"
        }
      ],
      "bestTimeToVisit": "April-June or September-October",
      "totalNights": 10
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}
