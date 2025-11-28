import OpenAI from "openai";
import { 
  quizResponseSchema, 
  type QuizResponse, 
  type ItineraryRecommendation, 
  itineraryRecommendationsResponseSchema,
  type AdjustItineraryDurationRequest,
  type ItineraryAddon,
  itineraryAddonSchema,
  itineraryAddonsResponseSchema,
  type ApplyAddonRequest,
  itineraryRecommendationSchema,
  type ExtendedQuizResponse,
  type StaycationRecommendation,
  staycationRecommendationsResponseSchema,
} from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}]/g, '')
    .substring(0, 500)
    .trim();
}

function mapQuizToPersonality(quiz: QuizResponse): string {
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

  if (quiz.temperature === "warm") {
    traits.push("prefers warm, sunny weather");
  } else if (quiz.temperature === "cool") {
    traits.push("enjoys cool, crisp climates");
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

  if (quiz.desiredEmotion === "wonder") {
    traits.push("wants to feel wonder");
  } else if (quiz.desiredEmotion === "freedom") {
    traits.push("wants to feel freedom");
  } else if (quiz.desiredEmotion === "connection") {
    traits.push("wants to feel connection");
  } else if (quiz.desiredEmotion === "awe") {
    traits.push("wants to feel awe");
  }

  let regionPreference = "";
  if (quiz.region !== "surprise") {
    const regionMap: Record<string, string> = {
      europe: "Europe",
      asia: "Asia",
      southAmerica: "South America",
      tropicalIslands: "Tropical Islands",
    };
    regionPreference = regionMap[quiz.region] || "";
  }

  return `${traits.join("; ")}${regionPreference ? `. Interested in ${regionPreference}` : ""}.`;
}

function buildCulturalInsightsText(quiz: QuizResponse): string {
  const insights: string[] = [];
  
  if (quiz.favoriteMovie) {
    insights.push(`Favorite Movie: "${sanitizeInput(quiz.favoriteMovie)}"`);
  }
  
  if (quiz.favoriteBook) {
    insights.push(`Favorite Book: "${sanitizeInput(quiz.favoriteBook)}"`);
  }
  
  return insights.length > 0 ? insights.join(", ") : "";
}

function getTripDurationDays(tripLength: string): number {
  const durationMap: Record<string, number> = {
    "1-3 days": 3,
    "4-7 days": 7,
    "1-2 weeks": 10,
    "2-3 weeks": 17,
    "3+ weeks": 21,
    "flexible": 10,
  };
  return durationMap[tripLength] || 10;
}

export async function getItineraryRecommendations(
  quiz: QuizResponse
): Promise<ItineraryRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const sanitizedDreamMoment = sanitizeInput(quiz.dreamMoment);
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);
  const tripDurationDays = getTripDurationDays(quiz.tripLengthPreference);
  const numberOfTravelers = quiz.numberOfTravelers;

  const systemPrompt = `You are an expert travel advisor specializing in creating multi-city itineraries. You help people discover perfect travel routes that efficiently combine multiple destinations into unforgettable journeys. You consider geography, flight logistics, and open-jaw routing (flying into one city and out of another) to create efficient, exciting itineraries. You pay special attention to cultural interests like favorite movies and books to create themed experiences (e.g., "Lord of the Rings" fans → Hobbiton tour in New Zealand).`;

  const userPrompt = `Create 3 multi-city itineraries for this traveler:

Traveler Personality: ${personalityProfile}

${culturalInsights ? `Cultural Interests: ${culturalInsights}\nIMPORTANT: Use their favorite movie/book to inspire themed itineraries. Include filming locations, book settings, or destinations that match the themes and atmospheres of their favorites.\n` : ""}
Dream Moment: "${sanitizedDreamMoment}"

Trip Planning Details:
- Number of travelers: ${numberOfTravelers}
- Trip length preference: ${quiz.tripLengthPreference} (approximately ${tripDurationDays} days total)

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
    
    return validated.recommendations;
  } catch (error) {
    console.error("Error getting itinerary recommendations:", error);
    throw new Error("Failed to get AI itinerary recommendations");
  }
}

/**
 * Get staycation recommendations based on extended quiz data
 * Staycations are local getaways within driving distance (max 2-3 hours)
 */
export async function getStaycationRecommendations(
  quiz: ExtendedQuizResponse
): Promise<StaycationRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const departureLocation = sanitizeInput(quiz.departureLocation || "");
  if (!departureLocation) {
    throw new Error("Departure location is required for staycation recommendations");
  }
  
  const numberOfTravelers = quiz.numberOfTravelers;
  const adults = quiz.adults || 2;
  const kids = quiz.kids || 0;
  const childAges = quiz.childAges || [];
  
  // Map time available to duration description
  const durationMap: Record<string, string> = {
    "afternoon": "a few hours (3-5 hours)",
    "full-day": "a full day trip (8-10 hours)",
    "weekend": "a weekend getaway (1-2 nights)",
  };
  const tripDuration = quiz.timeAvailable || "full-day";
  const durationDescription = durationMap[tripDuration] || "a full day trip";
  
  // Map travel distance to max drive time - enforce maximum of 3 hours
  const distanceMap: Record<string, number> = {
    "home": 60, // Staying in general area = ~1 hour max
    "2-3hrs": 180, // Within 2-3 hours
  };
  // Cap at 180 minutes (3 hours) maximum
  const maxDriveMinutes = Math.min(distanceMap[quiz.travelDistance || "2-3hrs"] || 120, 180);
  const maxDriveHours = Math.round(maxDriveMinutes / 60 * 10) / 10;
  
  // Map budget preference
  const budgetMap: Record<string, string> = {
    "0-100": "very low cost ($0-100 total for the whole group)",
    "150-300": "moderate spending ($150-300 total for the whole group)",
    "400-700": "comfortable budget ($400-700 total for the whole group)",
    "700+": "treat yourself, premium experiences ($700+ for the whole group)",
  };
  const budgetDescription = budgetMap[quiz.staycationBudget || "150-300"] || "moderate spending";
  
  // Build detailed goals description from quiz answers
  const goals = quiz.staycationGoal || [];
  const goalDescriptions: Record<string, string> = {
    "outdoor-adventure": "outdoor activities, hiking, nature exploration, and physical adventures",
    "relax-unwind": "relaxation, unwinding, spa experiences, and peaceful settings",
    "explore-new": "exploring new places, discovering local gems, and unique experiences",
    "quality-time": "quality family time, bonding activities, and shared experiences",
    "learn-discover": "educational experiences, museums, historical sites, and learning opportunities",
    "food-dining": "culinary experiences, local restaurants, food tours, and dining adventures",
    "entertainment": "entertainment, shows, events, amusement parks, and fun activities",
    "photography": "scenic views, photography opportunities, and picture-perfect locations",
  };
  const detailedGoals = goals.map(g => goalDescriptions[g] || g).join("; ");
  const goalsDescription = detailedGoals || "relaxation and quality time";

  // Build family context with kid-specific activities if applicable
  let familyContext = `${adults} adult(s)`;
  const kidActivities = quiz.kidActivities || [];
  if (kids > 0) {
    familyContext += ` and ${kids} kid(s)`;
    if (childAges.length > 0) {
      familyContext += ` (ages: ${childAges.join(", ")})`;
    }
    if (kidActivities.length > 0) {
      familyContext += `. Kids are interested in: ${kidActivities.join(", ")}`;
    }
  }

  // Accessibility needs - detailed requirements
  const accessibilityNeeds = quiz.accessibilityNeeds || [];
  const accessibilityDescriptions: Record<string, string> = {
    "wheelchair": "wheelchair accessible paths and facilities",
    "stroller": "stroller-friendly terrain and amenities",
    "limited-mobility": "limited walking distances and easy access",
    "sensory": "sensory-friendly environments (quiet spaces, reduced stimulation)",
    "none": "",
  };
  const accessibilityText = accessibilityNeeds.length > 0 && !accessibilityNeeds.includes("none")
    ? `IMPORTANT ACCESSIBILITY REQUIREMENTS: ${accessibilityNeeds.map(n => accessibilityDescriptions[n] || n).join("; ")}. All recommended destinations must accommodate these needs.`
    : "";

  const systemPrompt = `You are a local travel expert specializing in staycations, day trips, and weekend getaways near ${departureLocation}. You have deep knowledge of the area within a 2-3 hour driving radius and help families discover amazing destinations. You focus on practical, real destinations that exist and can be visited.

ABSOLUTE REQUIREMENTS - MUST BE FOLLOWED:
1. ALL destinations MUST be within ${maxDriveMinutes} minutes (${maxDriveHours} hours) ACTUAL driving time from ${departureLocation}
2. You must know the real driving distance from ${departureLocation} to each destination you recommend
3. Destinations must be REAL, SPECIFIC places that actually exist (parks, towns, beaches, museums, state parks, etc.)
4. NO FLIGHTS - these are driving trips only
5. The driveTime field must be the ACCURATE driving time in minutes from ${departureLocation}
6. Distance field must include the ACTUAL city/town and driving time (e.g., "1 hour 15 minutes from ${departureLocation}")

If you're not certain a destination is within the driving distance, DO NOT recommend it.`;

  const userPrompt = `Create 3 staycation recommendations specifically tailored to this family's quiz answers:

===== DEPARTURE LOCATION =====
${departureLocation}
(All destinations MUST be within ${maxDriveMinutes} minutes / ${maxDriveHours} hours driving from here)

===== TRIP DETAILS =====
MAX DRIVE TIME: ${maxDriveMinutes} minutes (${maxDriveHours} hours) - DO NOT EXCEED THIS
TRIP DURATION: ${durationDescription}
BUDGET: ${budgetDescription}

===== TRAVELERS =====
${familyContext}

===== WHAT THEY'RE LOOKING FOR (from quiz) =====
${goalsDescription}

${accessibilityText}

Create exactly 3 staycation recommendations:

===== CRITICAL DISTANCE VALIDATION =====
Before including ANY destination, verify:
1. Is this destination ACTUALLY within ${maxDriveMinutes} minutes (${maxDriveHours} hours) driving from ${departureLocation}?
2. Do you know the REAL driving time from ${departureLocation} to this destination?
3. If uncertain about the distance, DO NOT include this destination.

===== RECOMMENDATION REQUIREMENTS =====
Each recommendation MUST directly address the quiz answers above:
- Recommendation 1: Perfect match for their stated goals (${goalsDescription}) and family composition (${familyContext})
- Recommendation 2: Another great option with a different vibe, still matching their preferences
- Recommendation 3: "Hidden gem" - a lesser-known local discovery that still fits their criteria

For each recommendation, provide:
1. id: unique identifier (e.g., "staycation-1")
2. title: Creative, fun name reflecting their goals (e.g., "Coastal Escape", "Mountain Day Trip")
3. vibeTagline: Short 1-sentence description (max 100 chars) that speaks to what they're looking for
4. isCurveball: true only for recommendation 3
5. tripDuration: MUST match "${tripDuration}" unless they said flexible
6. totalCost: Estimated cost range for ALL ${numberOfTravelers} traveler(s), respecting their ${budgetDescription} budget
   - min: Budget-conscious estimate
   - max: More comfortable estimate
   - currency: "USD"
7. costBreakdown: Costs for the entire trip (in USD for ALL travelers):
   - gas: Fuel for round trip based on ACTUAL distance from ${departureLocation}
   - food: Meals and snacks
   - activities: Entry fees, rentals, tours
   - parking: Parking fees
   - misc: Tips, souvenirs
8. destination: Object with:
   - name: REAL, specific place name that EXISTS (state parks, beaches, towns, museums, etc.)
   - type: Category matching their interests (e.g., "nature", "beach", "museum", "town", "park")
   - distance: "X hours Y minutes from ${departureLocation}" - MUST BE ACCURATE
   - driveTime: ACCURATE number of minutes to drive from ${departureLocation} - MUST NOT EXCEED ${maxDriveMinutes}
   - address: Actual location or address
   - description: 2-3 sentence description explaining why this matches their quiz answers
   - activities: Array of 3-5 specific things to do that match their stated goals
   - bestFor: Array reflecting their family composition (include "families with kids" if they have kids)
   - imageQuery: Search query for destination images
9. suggestedItinerary: Array of time-blocked activities matching the ${tripDuration} duration:
   - time: Start time (e.g., "9:00 AM")
   - activity: Specific activity matching their interests
   - duration: How long
   - tips: Helpful tip, especially for families with kids if applicable
10. packingList: Array of 5-8 items appropriate for this destination and their activities
11. bestTimeToVisit: Best season/time for this destination
12. familyFriendlyRating: 1-5 rating (if they have kids, recommend destinations with rating 4-5)

Format response as valid JSON:
{
  "recommendations": [
    {
      "id": "staycation-1",
      "title": "Coastal Escape",
      "vibeTagline": "Stunning cliffs, tide pools, and fresh sea air",
      "isCurveball": false,
      "tripDuration": "full-day",
      "totalCost": {
        "min": 80,
        "max": 150,
        "currency": "USD"
      },
      "costBreakdown": {
        "gas": 25,
        "food": 60,
        "activities": 40,
        "parking": 15,
        "misc": 10
      },
      "destination": {
        "name": "Point Reyes National Seashore",
        "type": "nature",
        "distance": "1 hour 15 minutes from San Francisco, CA",
        "driveTime": 75,
        "address": "Point Reyes Station, CA",
        "description": "Dramatic coastal cliffs, lighthouse, and incredible wildlife viewing. Perfect for nature lovers seeking outdoor adventure.",
        "activities": ["Visit Point Reyes Lighthouse", "Explore tide pools at Sculptured Beach", "Hike Bear Valley Trail", "Spot elephant seals at Chimney Rock"],
        "bestFor": ["nature lovers", "families with kids", "photographers"],
        "imageQuery": "Point Reyes lighthouse California coast"
      },
      "suggestedItinerary": [
        {
          "time": "9:00 AM",
          "activity": "Drive to Point Reyes and stop at Bear Valley Visitor Center",
          "duration": "1.5 hours",
          "tips": "Pick up a trail map and check tide schedules for tide pooling"
        }
      ],
      "packingList": ["Sunscreen", "Layers for wind", "Binoculars", "Snacks", "Water", "Camera"],
      "bestTimeToVisit": "Spring and Fall for best weather and wildlife viewing",
      "familyFriendlyRating": 4
    }
  ]
}`;

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
    const validated = staycationRecommendationsResponseSchema.parse(parsed);
    
    return validated.recommendations;
  } catch (error) {
    console.error("Error getting staycation recommendations:", error);
    throw new Error("Failed to get AI staycation recommendations");
  }
}

/**
 * Validate that itinerary structure matches constraints
 */
function validateItineraryStructure(
  itinerary: ItineraryRecommendation,
  expectedNights: number,
  originalCityNames?: string[],
  allowCityRemoval?: boolean,
  maxCities?: number
): void {
  // Validate total nights matches sum of city nights
  const summedNights = itinerary.cities.reduce((sum, city) => sum + city.stayLengthNights, 0);
  if (summedNights !== itinerary.totalNights) {
    throw new Error(`Sum of city nights (${summedNights}) doesn't match totalNights (${itinerary.totalNights})`);
  }
  
  if (itinerary.totalNights !== expectedNights) {
    throw new Error(`Expected ${expectedNights} nights but got ${itinerary.totalNights}`);
  }
  
  // Validate city orders are sequential
  const orders = itinerary.cities.map(c => c.order);
  const expectedOrders = Array.from({ length: itinerary.cities.length }, (_, i) => i + 1);
  if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
    throw new Error(`City orders are not sequential: ${orders.join(', ')}`);
  }
  
  // Validate each city has at least 1 night
  const invalidCity = itinerary.cities.find(c => c.stayLengthNights < 1);
  if (invalidCity) {
    throw new Error(`City ${invalidCity.cityName} has ${invalidCity.stayLengthNights} nights (minimum is 1)`);
  }
  
  // Validate city count constraints
  if (maxCities && itinerary.cities.length > maxCities) {
    throw new Error(`Itinerary has ${itinerary.cities.length} cities but max allowed is ${maxCities}`);
  }
  
  // Validate city removal constraint
  if (originalCityNames && allowCityRemoval === false) {
    const currentCityNames = itinerary.cities.map(c => c.cityName);
    const removedCities = originalCityNames.filter(name => !currentCityNames.includes(name));
    if (removedCities.length > 0) {
      throw new Error(`Cities were removed (${removedCities.join(', ')}) but allowCityRemoval is false`);
    }
  }
  
  // Validate cost breakdown sums to reasonable total
  const breakdownSum = Object.values(itinerary.costBreakdown).reduce((sum, val) => sum + val, 0);
  if (breakdownSum < itinerary.totalCost.min * 0.8 || breakdownSum > itinerary.totalCost.max * 1.2) {
    throw new Error(`Cost breakdown sum (${breakdownSum}) is inconsistent with total cost range`);
  }
  
  // Validate all costs are non-negative
  Object.entries(itinerary.costBreakdown).forEach(([category, amount]) => {
    if (amount < 0) {
      throw new Error(`Negative cost for ${category}: ${amount}`);
    }
  });
}

/**
 * Adjust itinerary duration - AI regenerates itinerary for new trip length
 */
export async function adjustItineraryDuration(
  request: AdjustItineraryDurationRequest
): Promise<ItineraryRecommendation> {
  const { itinerary, newTotalNights, numberOfTravelers, allowCityRemoval, maxCities } = request;
  
  const currentNights = itinerary.totalNights;
  const changeDirection = newTotalNights > currentNights ? "increase" : "decrease";
  const nightsDelta = Math.abs(newTotalNights - currentNights);
  
  // Save original city names for validation if removal is not allowed
  const originalCityNames = allowCityRemoval === false ? itinerary.cities.map(c => c.cityName) : undefined;

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
    validateItineraryStructure(
      validated,
      newTotalNights,
      originalCityNames,
      allowCityRemoval,
      maxCities
    );
    
    return validated;
  } catch (error) {
    console.error("Error adjusting itinerary duration:", error);
    throw new Error("Failed to adjust itinerary duration");
  }
}

/**
 * Generate add-on recommendations for a confirmed itinerary
 */
export async function generateItineraryAddons(
  itinerary: ItineraryRecommendation,
  numberOfTravelers: number
): Promise<ItineraryAddon[]> {
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
    
    // Validate add-on structure
    validated.addons.forEach((addon, index) => {
      if (addon.deltaNights < 1) {
        throw new Error(`Add-on ${index + 1} has invalid deltaNights: ${addon.deltaNights} (minimum is 1)`);
      }
      
      if (addon.deltaCost.min <= 0 || addon.deltaCost.max <= 0) {
        throw new Error(`Add-on ${index + 1} has non-positive costs: min=${addon.deltaCost.min}, max=${addon.deltaCost.max}`);
      }
      
      if (addon.deltaCost.min > addon.deltaCost.max) {
        throw new Error(`Add-on ${index + 1} has min cost greater than max: ${addon.deltaCost.min} > ${addon.deltaCost.max}`);
      }
    });
    
    // Validate add-ons are monotonically sized (first should be shortest)
    for (let i = 1; i < validated.addons.length; i++) {
      if (validated.addons[i].deltaNights <= validated.addons[i - 1].deltaNights) {
        throw new Error(`Add-ons are not progressively sized: addon ${i} has ${validated.addons[i].deltaNights} nights vs addon ${i - 1} has ${validated.addons[i - 1].deltaNights} nights`);
      }
    }
    
    // Validate unique IDs
    const ids = validated.addons.map(a => a.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      throw new Error(`Add-ons have duplicate IDs: ${ids.join(', ')}`);
    }
    
    return validated.addons;
  } catch (error) {
    console.error("Error generating itinerary add-ons:", error);
    throw new Error("Failed to generate itinerary add-ons");
  }
}

/**
 * Apply a selected add-on to an itinerary
 */
export async function applyAddon(
  request: ApplyAddonRequest
): Promise<ItineraryRecommendation> {
  const { itinerary, addon, numberOfTravelers } = request;

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
    validateItineraryStructure(validated, expectedNights);
    
    // Validate all original cities are preserved (add-ons should not remove cities)
    const originalCityNames = itinerary.cities.map(c => c.cityName);
    const updatedCityNames = validated.cities.map(c => c.cityName);
    const missingCities = originalCityNames.filter(name => !updatedCityNames.includes(name));
    if (missingCities.length > 0) {
      throw new Error(`Add-on removed original cities (${missingCities.join(', ')}), which is not allowed`);
    }
    
    // Validate cost increased reasonably (use proportional tolerance for small add-ons)
    const expectedMinCost = itinerary.totalCost.min + addon.deltaCost.min;
    const expectedMaxCost = itinerary.totalCost.max + addon.deltaCost.max;
    
    // For small add-ons (<$500), allow ±30% variance; for large add-ons, allow ±20%
    const minTolerance = addon.deltaCost.min < 500 ? 0.3 : 0.2;
    const maxTolerance = addon.deltaCost.max < 500 ? 0.3 : 0.2;
    
    if (validated.totalCost.min < expectedMinCost * (1 - minTolerance) || 
        validated.totalCost.min > expectedMinCost * (1 + minTolerance)) {
      throw new Error(`Cost increase doesn't match add-on (expected ~${expectedMinCost}, got ${validated.totalCost.min})`);
    }
    
    if (validated.totalCost.max < expectedMaxCost * (1 - maxTolerance) || 
        validated.totalCost.max > expectedMaxCost * (1 + maxTolerance)) {
      throw new Error(`Max cost increase doesn't match add-on (expected ~${expectedMaxCost}, got ${validated.totalCost.max})`);
    }
    
    return validated;
  } catch (error) {
    console.error("Error applying add-on:", error);
    throw new Error("Failed to apply add-on to itinerary");
  }
}
