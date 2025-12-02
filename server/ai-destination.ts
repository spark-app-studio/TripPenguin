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

function mapQuizToPersonality(quiz: ExtendedQuizResponse): string {
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

function buildCulturalInsightsText(quiz: ExtendedQuizResponse): string {
  const insights: string[] = [];
  
  // Extended schema uses favoriteMedia instead of separate movie/book
  if (quiz.favoriteMedia) {
    insights.push(`Favorite Media/Entertainment: "${sanitizeInput(quiz.favoriteMedia)}"`);
  }
  
  return insights.length > 0 ? insights.join(", ") : "";
}

function getTripLengthDays(quiz: ExtendedQuizResponse): number {
  // Extended schema uses tripLength instead of tripLengthPreference
  const tripLength = quiz.tripLength || "4-7 days";
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

function getUSRegionDescription(usRegion?: string): string {
  const regionMap: Record<string, string> = {
    "new-england": "New England (Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, Connecticut) - coastal towns, fall foliage, colonial history, lighthouses, lobster shacks",
    "mid-atlantic": "Mid-Atlantic (New York, New Jersey, Pennsylvania, Delaware, Maryland, Washington D.C.) - world-class museums, historic sites, iconic cities, diverse neighborhoods",
    "southeast": "Southeast (Virginia, North Carolina, South Carolina, Georgia, Florida, Alabama, Mississippi, Louisiana, Tennessee, Kentucky) - beaches, Southern hospitality, music cities, warm weather",
    "midwest": "Midwest (Ohio, Michigan, Indiana, Illinois, Wisconsin, Minnesota, Iowa, Missouri, Kansas, Nebraska, North Dakota, South Dakota) - Great Lakes, friendly towns, American heartland",
    "mountains-west": "Mountain West (Colorado, Wyoming, Montana, Idaho, Utah) - Rocky Mountains, ski towns, national parks, wilderness adventures, alpine scenery",
    "southwest": "Southwest (Arizona, New Mexico, Nevada, Texas) - desert landscapes, canyonlands, stargazing, Native American heritage, vibrant culture",
    "pacific-coast": "Pacific Coast (California, Oregon, Washington, Alaska, Hawaii) - ocean cliffs, redwood forests, coastal drives, diverse landscapes",
    "surprise": "anywhere in the United States that best matches their preferences",
  };
  return regionMap[usRegion || "surprise"] || "anywhere in the United States";
}

export async function getItineraryRecommendations(
  quiz: ExtendedQuizResponse
): Promise<ItineraryRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  // Extended schema uses postcardImage instead of dreamMoment
  const sanitizedDreamMoment = sanitizeInput(quiz.postcardImage || "");
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);
  // Extended schema uses tripLength instead of tripLengthPreference
  const tripDurationDays = getTripLengthDays(quiz);
  const tripLengthLabel = quiz.tripLength || "4-7 days";
  const numberOfTravelers = quiz.numberOfTravelers;
  
  // Check if this is a domestic US trip
  const isDomesticTrip = quiz.tripType === "domestic";
  const usRegionDescription = isDomesticTrip ? getUSRegionDescription(quiz.usRegion) : "";

  // Different prompts based on trip type
  let systemPrompt: string;
  let userPrompt: string;

  if (isDomesticTrip) {
    // DOMESTIC US TRIP - Enforce USA-only destinations
    systemPrompt = `You are an expert travel advisor specializing in creating multi-city itineraries WITHIN THE UNITED STATES. You help Americans discover amazing domestic travel routes that efficiently combine multiple US destinations into unforgettable journeys. You consider geography, flight logistics, and open-jaw routing (flying into one city and out of another) to create efficient, exciting itineraries.

CRITICAL CONSTRAINT: ALL destinations MUST be within the UNITED STATES. This is a DOMESTIC trip - NO international destinations allowed. Every city must be in a US state.

You pay special attention to cultural interests like favorite movies and books to create themed experiences using US filming locations (e.g., "Yellowstone" fans → Montana ranch experience, "Breaking Bad" fans → Albuquerque tour).`;

    userPrompt = `Create 3 multi-city DOMESTIC US itineraries for this traveler:

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
  } else {
    // INTERNATIONAL TRIP - Original prompt
    systemPrompt = `You are an expert travel advisor specializing in creating multi-city itineraries. You help people discover perfect travel routes that efficiently combine multiple destinations into unforgettable journeys. You consider geography, flight logistics, and open-jaw routing (flying into one city and out of another) to create efficient, exciting itineraries. You pay special attention to cultural interests like favorite movies and books to create themed experiences (e.g., "Lord of the Rings" fans → Hobbiton tour in New Zealand).`;

    userPrompt = `Create 3 multi-city itineraries for this traveler:

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
  }

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
    
    // For domestic trips, verify all cities are in the United States
    if (isDomesticTrip) {
      for (const itinerary of validated.recommendations) {
        for (const city of itinerary.cities) {
          if (city.countryName !== "United States") {
            console.warn(`Domestic trip returned non-US city: ${city.cityName}, ${city.countryName}. Overriding to United States.`);
            city.countryName = "United States";
          }
        }
      }
    }
    
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

export interface TripPersonality {
  pace: "slow" | "moderate" | "fast";
  expenseLevel?: "budget" | "balanced" | "premium";
  energyTone?: "calm" | "playful" | "adventurous";
}

export interface FullItineraryPlanRequest {
  itinerary: ItineraryRecommendation;
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
  tripPersonality?: TripPersonality;
  departureLocation?: string;
  quizPreferences: {
    tripGoal?: string;
    placeType?: string;
    dayPace?: string;
    spendingPriority?: string;
    travelersType?: string;
    kidsAges?: string[];
    accommodationType?: string;
    mustHave?: string;
  };
}

export interface DayActivities {
  dayNumber: number;
  cityName: string;
  countryName: string;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  activities: string[];
}

export interface FullItineraryPlanResponse {
  dayPlans: DayActivities[];
}

export interface ItineraryAssistantMessage {
  role: "assistant" | "user";
  content: string;
}

export interface ItineraryAssistantRequest {
  itinerary: ItineraryRecommendation;
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
  quizPreferences: {
    tripGoal?: string;
    placeType?: string;
    dayPace?: string;
    spendingPriority?: string;
    travelersType?: string;
    kidsAges?: string[];
    accommodationType?: string;
    mustHave?: string;
  };
  conversationHistory: ItineraryAssistantMessage[];
  userMessage: string;
  currentDayPlans?: DayActivities[];
}

export interface ItineraryAssistantResponse {
  message: string;
  updatedDayPlans?: DayActivities[];
  suggestedChanges?: {
    dayNumber: number;
    action: "add" | "remove" | "replace";
    activities: string[];
  }[];
}

export interface ActivitySuggestion {
  activity: string;
  category: "must-see" | "hidden-gem" | "food" | "outdoor" | "cultural" | "relaxation";
  reason: string;
}

export interface DayPlannerMessage {
  role: "assistant" | "user";
  content: string;
}

export interface PlannedActivity {
  id: string;
  time: string;
  activity: string;
  duration: string;
  category: "must-see" | "hidden-gem" | "food" | "outdoor" | "cultural" | "relaxation" | "transport";
  notes?: string;
}

export interface DayPlannerRequest {
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
  quizPreferences: {
    tripGoal?: string;
    placeType?: string;
    dayPace?: string;
    spendingPriority?: string;
    travelersType?: string;
    kidsAges?: string[];
    accommodationType?: string;
    mustHave?: string;
  };
  conversationHistory: DayPlannerMessage[];
  userMessage?: string;
  currentPlan?: PlannedActivity[];
}

export interface DayPlannerResponse {
  message: string;
  suggestedPlan?: PlannedActivity[];
  needsMoreInfo: boolean;
  followUpQuestion?: string;
  isComplete: boolean;
}

export async function planDayWithAI(request: DayPlannerRequest): Promise<DayPlannerResponse> {
  const sanitizedCity = sanitizeInput(request.cityName);
  const sanitizedCountry = sanitizeInput(request.countryName);

  const dayContext = request.isArrivalDay 
    ? "This is an ARRIVAL day - the traveler will be arriving and may have jet lag or travel fatigue. Plan accordingly with lighter afternoon/evening activities."
    : request.isDepartureDay 
    ? "This is a DEPARTURE day - the traveler needs to leave for the airport/station. Plan morning activities only and ensure time for checkout and travel."
    : `This is a full day (day ${request.dayInCity} of ${request.totalDaysInCity}) in the city with no travel constraints.`;

  const preferencesContext = buildPreferencesContext(request.quizPreferences);
  
  const existingList = request.existingActivities.length > 0 
    ? `Already planned activities for this day: ${request.existingActivities.join(", ")}`
    : "No activities planned yet for this day.";

  const currentPlanContext = request.currentPlan && request.currentPlan.length > 0
    ? `Current day plan being built:\n${request.currentPlan.map(a => `- ${a.time}: ${a.activity} (${a.duration})`).join("\n")}`
    : "No activities added to the plan yet.";

  const systemPrompt = `You are Pebbles, a friendly and knowledgeable travel planning assistant helping families plan memorable, debt-free trips. You're helping plan Day ${request.dayNumber} in ${sanitizedCity}, ${sanitizedCountry}.

CONTEXT:
- ${request.numberOfTravelers} traveler(s)
- Trip type: ${request.tripType}
- ${dayContext}
- ${preferencesContext}
- ${existingList}
- ${currentPlanContext}

CRITICAL RULES:
- NEVER use emojis in any response. Use descriptive words instead.
- You MUST incorporate ALL traveler preferences listed above into your suggestions.
- Every activity suggestion must align with the traveler's stated trip goal, pace preference, and spending priorities.

YOUR ROLE:
1. Help create a complete, realistic day itinerary with specific times, activities, and durations
2. Ask clarifying questions when needed (max 1-2 questions at a time) to personalize the plan
3. Consider logistics like travel time between locations, meal times, and energy levels
4. Be warm, encouraging, and family-friendly in tone
5. Focus on creating memorable experiences within budget
6. ALWAYS reference and use the traveler preferences when making suggestions

GOOD QUESTIONS TO ASK (if not already answered):
- What time do they typically wake up / want to start the day?
- Are there any must-see attractions for this day?
- Do they prefer sit-down restaurants or quick bites?
- Any dietary restrictions or food preferences?
- How much walking/physical activity is comfortable?
- Any specific interests (art, history, nature, food, shopping)?

RESPONSE FORMAT:
Return JSON with this structure:
{
  "message": "Your friendly response to the user (NO emojis allowed)",
  "suggestedPlan": [
    {
      "id": "unique-id",
      "time": "9:00 AM",
      "activity": "Activity name and brief description",
      "duration": "2 hours",
      "category": "must-see|hidden-gem|food|outdoor|cultural|relaxation|transport",
      "notes": "Optional tips or details"
    }
  ],
  "needsMoreInfo": true/false,
  "followUpQuestion": "Optional question if you need more information",
  "isComplete": true/false (true when the day plan is finalized)
}

GUIDELINES:
- If this is the first message, introduce yourself briefly and ask 1-2 key questions to personalize the plan
- After gathering enough info, suggest a complete day plan with 4-8 activities
- Include meal times (breakfast, lunch, dinner if applicable)
- Add realistic time buffers for transport between locations
- The plan should flow logically geographically to minimize travel
- For arrival days: start activities in late afternoon
- For departure days: morning activities only, end by checkout time
- Reference specific traveler preferences (trip goal, pace, spending priorities) when explaining activity choices`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of request.conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current user message if provided
  if (request.userMessage) {
    messages.push({ role: "user", content: request.userMessage });
  } else if (request.conversationHistory.length === 0) {
    messages.push({ role: "user", content: `Please help me plan Day ${request.dayNumber} in ${sanitizedCity}. I'm excited to explore!` });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "I'm here to help you plan your day!",
      suggestedPlan: parsed.suggestedPlan || [],
      needsMoreInfo: parsed.needsMoreInfo ?? false,
      followUpQuestion: parsed.followUpQuestion,
      isComplete: parsed.isComplete ?? false,
    };
  } catch (error) {
    console.error("Error in day planner:", error);
    throw new Error("Failed to get day planning assistance");
  }
}

function buildPreferencesContext(prefs: DayPlannerRequest["quizPreferences"]): string {
  const parts: string[] = [];
  
  if (prefs.tripGoal) {
    const goalMap: Record<string, string> = {
      rest: "seeking relaxation and peaceful experiences - prioritize spas, scenic viewpoints, leisurely strolls, and peaceful cafes",
      culture: "interested in culture, history, and learning - include museums, historical sites, local traditions, and cultural experiences",
      thrill: "looking for adventure and excitement - suggest active experiences, unique adventures, and energetic activities",
      magic: "wanting magical, once-in-a-lifetime moments - focus on iconic experiences, bucket-list items, and unforgettable moments",
    };
    parts.push(`Trip goal: ${goalMap[prefs.tripGoal] || prefs.tripGoal}`);
  }
  
  if (prefs.placeType) {
    const placeMap: Record<string, string> = {
      ocean: "loves beaches and ocean views - include waterfront activities, coastal walks, and ocean-related experiences",
      mountains: "drawn to mountains and nature - prioritize hiking, scenic overlooks, and outdoor activities",
      ancientCities: "fascinated by historic places - focus on old town areas, historical landmarks, and heritage sites",
      modernSkyline: "enjoys modern urban environments - include observation decks, contemporary architecture, and city experiences",
    };
    parts.push(`Environment preference: ${placeMap[prefs.placeType] || prefs.placeType}`);
  }
  
  if (prefs.dayPace) {
    const paceMap: Record<string, string> = {
      relaxed: "prefers a RELAXED pace - plan only 3-4 activities with long breaks, late starts, and extended meal times",
      balanced: "likes a BALANCED mix - plan 5-6 activities with reasonable breaks between each",
      packed: "wants a PACKED schedule - plan 7-8 activities to maximize the day, shorter breaks",
    };
    parts.push(`Day pace: ${paceMap[prefs.dayPace] || prefs.dayPace}`);
  }
  
  if (prefs.spendingPriority) {
    const spendMap: Record<string, string> = {
      food: "prioritizes food experiences - include excellent restaurants, food tours, local specialties, and culinary highlights",
      experiences: "values unique experiences - focus on tours, activities, and memorable excursions over dining",
      comfort: "values comfort - suggest quality venues, comfortable transport options, and premium experiences",
      souvenirs: "enjoys shopping and souvenirs - include markets, artisan shops, and local shopping areas",
    };
    parts.push(`Spending priority: ${spendMap[prefs.spendingPriority] || prefs.spendingPriority}`);
  }
  
  if (prefs.travelersType) {
    const travelersMap: Record<string, string> = {
      solo: "traveling solo - suggest safe, social-friendly activities",
      couple: "traveling as a couple - include romantic spots and couple-friendly experiences",
      "family-young": "traveling with young kids - ALL activities must be kid-friendly with age-appropriate options",
      "family-teens": "traveling with teenagers - include activities that appeal to teens",
      friends: "traveling with friends - suggest group-friendly and social activities",
      multigenerational: "multigenerational family trip - balance activities for all age groups",
    };
    parts.push(`Traveler type: ${travelersMap[prefs.travelersType] || prefs.travelersType}`);
  }
  
  if (prefs.kidsAges && prefs.kidsAges.length > 0) {
    const ageGroups = prefs.kidsAges.map(age => {
      if (age === "0-2") return "infant/toddler (0-2 years) - need stroller-friendly venues, nap time consideration";
      if (age === "3-5") return "preschooler (3-5 years) - short attention spans, need playgrounds and interactive activities";
      if (age === "6-9") return "elementary age (6-9 years) - can handle longer activities, enjoy hands-on experiences";
      if (age === "10-12") return "preteen (10-12 years) - interested in more complex activities and some independence";
      if (age === "13-17") return "teenager (13-17 years) - want cool experiences, may prefer more freedom";
      return age;
    });
    parts.push(`Children traveling: ${ageGroups.join("; ")} - CRITICAL: Every activity must accommodate these age groups`);
  }
  
  if (prefs.mustHave) {
    parts.push(`MUST-HAVE experience (prioritize this): ${prefs.mustHave}`);
  }
  
  if (prefs.accommodationType) {
    parts.push(`Accommodation preference: ${prefs.accommodationType}`);
  }
  
  return parts.length > 0 ? `TRAVELER PREFERENCES (you MUST incorporate ALL of these into your plan):\n- ${parts.join("\n- ")}` : "No specific preferences provided.";
}

export async function getActivitySuggestions(request: ActivitySuggestionRequest): Promise<ActivitySuggestion[]> {
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
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error getting activity suggestions:", error);
    throw new Error("Failed to generate activity suggestions");
  }
}

export async function generateFullItineraryPlan(request: FullItineraryPlanRequest): Promise<FullItineraryPlanResponse> {
  const preferencesContext = buildPreferencesContext(request.quizPreferences);
  
  // Build pace-specific instructions
  const pace = request.tripPersonality?.pace || "moderate";
  let paceInstructions = "";
  
  switch (pace) {
    case "slow":
      paceInstructions = `
PACE SETTING: SLOW (Relaxed & Leisurely)
- Maximum 2-3 activities per day (not counting meals)
- Activity durations: 2-3 hours each (spend quality time at each place)
- Travel buffer between activities: 45-60 minutes (never rush)
- Include extended rest periods (2+ hours in afternoon)
- Day typically starts at 9:30-10:00 AM, ends by 8:00 PM
- Schedule plenty of "free time to explore at your own pace"
- Focus on depth over breadth - spend more time at fewer places
- Include spa visits, park relaxation, cafe time, or scenic strolls`;
      break;
    case "fast":
      paceInstructions = `
PACE SETTING: FAST (Energetic & Packed)
- Plan 5-6 activities per day (not counting meals)
- Activity durations: 45 min - 1.5 hours (efficient but meaningful)
- Travel buffer between activities: 15-30 minutes (quick transitions)
- Day starts early at 7:30-8:00 AM, can extend to 10:00 PM
- Brief rest breaks only (30-45 min max)
- Minimize downtime - keep the momentum going
- Include iconic highlights AND hidden gems
- Walking tours, multiple neighborhoods, and back-to-back experiences`;
      break;
    case "moderate":
    default:
      paceInstructions = `
PACE SETTING: MODERATE (Balanced)
- Plan 3-4 activities per day (not counting meals)
- Activity durations: 1.5-2 hours each (comfortable exploration)
- Travel buffer between activities: 30-45 minutes (reasonable transitions)
- Day starts at 9:00 AM, ends around 9:00 PM
- Include 1-2 hour rest/downtime periods
- Balance must-see attractions with relaxation
- Morning energy, afternoon ease, evening enjoyment`;
      break;
  }
  
  const citiesOverview = request.itinerary.cities.map(city => 
    `${city.cityName}, ${city.countryName} (${city.stayLengthNights} nights)`
  ).join(" -> ");
  
  // Build origin travel context for Day 1
  const departureLocation = request.departureLocation || "";
  const firstCity = request.itinerary.cities[0];
  const originTravelContext = departureLocation && firstCity 
    ? `\nINITIAL TRAVEL: Day 1 starts with travel from ${departureLocation} to ${firstCity.cityName}, ${firstCity.countryName}. Include a "Travel: Depart from ${departureLocation}" activity with appropriate travel mode (flight for international/long distances, drive for nearby destinations).`
    : "";

  let currentDay = 1;
  const dayStructure: { dayNumber: number; city: typeof request.itinerary.cities[0]; dayInCity: number; totalDaysInCity: number; isArrival: boolean; isDeparture: boolean }[] = [];
  
  for (let i = 0; i < request.itinerary.cities.length; i++) {
    const city = request.itinerary.cities[i];
    for (let d = 0; d < city.stayLengthNights; d++) {
      dayStructure.push({
        dayNumber: currentDay,
        city,
        dayInCity: d + 1,
        totalDaysInCity: city.stayLengthNights,
        isArrival: d === 0,
        isDeparture: d === city.stayLengthNights - 1 && i < request.itinerary.cities.length - 1,
      });
      currentDay++;
    }
  }

  // Build accessibility and family context
  const kidsAges = request.quizPreferences?.kidsAges || [];
  const hasYoungKids = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 5;
  });
  const hasToddlers = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 3;
  });
  const hasTweens = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 8 && ageNum <= 12;
  });
  
  let familyContext = "";
  if (kidsAges.length > 0) {
    familyContext = `\nFAMILY CONSIDERATIONS:
- Traveling with children ages: ${kidsAges.join(", ")}`;
    if (hasToddlers) {
      familyContext += `
- TODDLERS PRESENT: Schedule nap times (early afternoon), include stroller-friendly routes, plan for shorter activity windows (1-2 hours max), include playground/park breaks`;
    }
    if (hasYoungKids) {
      familyContext += `
- YOUNG KIDS PRESENT: Include kid-friendly attractions, plan for snack/bathroom breaks every 2 hours, avoid long walking distances, include interactive/hands-on activities`;
    }
    if (hasTweens) {
      familyContext += `
- TWEENS PRESENT: Include age-appropriate attractions, consider their interests (technology, adventure, etc.), balance educational and fun activities`;
    }
  }

  const systemPrompt = `Travel planner creating day-by-day itinerary. Route: ${citiesOverview}. ${request.numberOfTravelers} travelers. ${preferencesContext}${familyContext}
${paceInstructions}${originTravelContext}

RULES:
- No emojis. Follow pace setting above.
- Times: "9:00 AM - 11:00 AM" format. No overlapping times.
- Include travel between locations (walk/taxi/bus/train/flight).
- Day 1 MUST start with travel from origin (if provided) - include flight/drive time.
- ARRIVAL days: "Arrival: Check into hotel" then light evening activities.
- DEPARTURE days: Morning only, then "Travel: Depart to [city] via [mode]".

Return JSON:
{"dayPlans":[{"dayNumber":1,"dayTitle":"Short Theme","cityName":"City","countryName":"Country","isArrivalDay":false,"isDepartureDay":false,"dailyCostEstimate":100,"structuredActivities":[{"id":"day1-act1","startTime":"9:00 AM","endTime":"11:00 AM","title":"Activity Name","description":"Brief description","location":"Area","costEstimate":25,"externalLink":"https://...","isTravel":false,"alternates":[{"id":"day1-alt1","title":"Alternative","description":"Brief","costEstimate":20}]},{"id":"day1-travel1","startTime":"11:00 AM","endTime":"11:30 AM","title":"Travel to Next","isTravel":true,"travelMode":"walk","costEstimate":0}],"activities":["9:00 AM - 11:00 AM: Activity Name"]}]}

FIELDS: id (dayX-actY), startTime/endTime (H:MM AM/PM), title, description (1 sentence), location, costEstimate (USD), externalLink (official URL if known), isTravel, travelMode (walk/taxi/bus/train/ferry), alternates (1 nearby option for main activities only).`;

  const daysDescription = dayStructure.map((d, idx) => {
    let dayDesc = `Day ${d.dayNumber}: ${d.city.cityName}, ${d.city.countryName} (Day ${d.dayInCity}/${d.totalDaysInCity}`;
    if (d.isArrival) dayDesc += ", ARRIVAL";
    if (d.isDeparture) {
      const nextCity = dayStructure[idx + 1]?.city;
      if (nextCity) {
        dayDesc += `, TRAVEL DAY - departing to ${nextCity.cityName}, ${nextCity.countryName}`;
      } else {
        dayDesc += ", DEPARTURE";
      }
    }
    dayDesc += ")";
    return dayDesc;
  }).join("\n");

  const userPrompt = `Plan ${request.itinerary.totalNights}-night trip:\n${daysDescription}\nInclude times, travel, meals. Be concise.`;

  try {
    // Calculate max_tokens based on trip length - longer trips need more tokens
    // Each day needs ~800-1200 tokens for structured activities with alternates
    // Use confirmed day count from dayStructure (unique dayNumbers), validated against totalNights
    const uniqueDayNumbers = new Set(dayStructure.map(d => d.dayNumber));
    const confirmedDays = uniqueDayNumbers.size;
    const totalNights = request.itinerary.totalNights;
    const expectedDays = (typeof totalNights === 'number' && totalNights > 0) 
      ? totalNights + 1  // N nights means N+1 days
      : 8;
    // Use the larger of confirmed or expected to ensure coverage
    const numberOfDays = Math.max(confirmedDays, expectedDays, 1);
    const estimatedTokensPerDay = 1200;
    const baseTokens = 2000; // For response structure overhead
    const calculatedTokens = baseTokens + (numberOfDays * estimatedTokensPerDay);
    // Ensure we never pass NaN to the API
    const maxTokens = Number.isFinite(calculatedTokens) 
      ? Math.min(16000, Math.max(8000, calculatedTokens)) 
      : 10000; // Safe default
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return { dayPlans: parsed.dayPlans || [] };
  } catch (error) {
    console.error("Error generating full itinerary plan:", error);
    throw new Error("Failed to generate itinerary plan");
  }
}

export async function chatWithItineraryAssistant(request: ItineraryAssistantRequest): Promise<ItineraryAssistantResponse> {
  const preferencesContext = buildPreferencesContext(request.quizPreferences);
  
  const citiesOverview = request.itinerary.cities.map(city => 
    `${city.cityName}, ${city.countryName} (${city.stayLengthNights} nights)`
  ).join(" -> ");

  const currentPlanSummary = request.currentDayPlans && request.currentDayPlans.length > 0
    ? request.currentDayPlans.map(day => 
        `Day ${day.dayNumber} (${day.cityName}): ${day.activities.join("; ")}`
      ).join("\n")
    : "No activities planned yet.";

  // Build family and accessibility context
  const kidsAges = request.quizPreferences?.kidsAges || [];
  const hasYoungKids = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 5;
  });
  const hasToddlers = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 3;
  });
  
  let familyContext = "";
  if (kidsAges.length > 0) {
    familyContext = `
FAMILY CONTEXT:
- Traveling with children ages: ${kidsAges.join(", ")}`;
    if (hasToddlers) {
      familyContext += `
- Has toddlers: Consider nap times, stroller accessibility, shorter activities`;
    }
    if (hasYoungKids) {
      familyContext += `
- Has young children: Consider bathroom breaks, snack needs, kid-friendly options`;
    }
  }

  const systemPrompt = `You are Pebbles, a friendly and knowledgeable travel planning assistant for TripPenguin. You're helping a family refine their ${request.tripType} trip itinerary.

TRIP DETAILS:
- Title: ${request.itinerary.title}
- Route: ${citiesOverview}
- Total nights: ${request.itinerary.totalNights}
- ${request.numberOfTravelers} traveler(s)
- ${preferencesContext}
${familyContext}

CURRENT ITINERARY:
${currentPlanSummary}

YOUR ROLE:
1. Answer questions about the itinerary, destinations, activities, or travel logistics
2. Suggest improvements or alternatives based on their preferences
3. Help them refine specific days or activities
4. Provide practical tips about the destinations
5. Be warm, encouraging, and family-friendly

CLARIFICATION REQUIREMENTS (VERY IMPORTANT):
When the user asks to modify, change, update, or remove an activity but is VAGUE, you MUST ask clarifying questions:

1. IF the user doesn't specify WHICH DAY:
   Ask: "Which day would you like me to modify? Here are your current days: [list day numbers and cities]"

2. IF the user doesn't specify WHICH ACTIVITY on a day with multiple activities:
   Ask: "Which activity on Day X would you like to change? Your current activities are: [list activities]"

3. IF the user wants to add something but doesn't specify WHERE:
   Ask: "Which day should I add this activity to? Would you prefer morning, afternoon, or evening?"

4. IF the modification is unclear:
   Ask clarifying questions like: "Would you like me to replace this activity completely, or add something alongside it?"

DO NOT make assumptions about which day or activity they mean. Always ask first if unclear.

REST AND PACING CONSIDERATIONS:
- When adding activities, consider if the day already has enough activities
- Suggest rest breaks if a day seems too packed
- For families with young children: remind about nap times, snack breaks
- Balance high-energy and low-energy activities
- Suggest "Hotel rest time" or "Downtime at the park" when appropriate
- For longer trips, suggest lighter "recovery days" after intensive sightseeing days

ACCESSIBILITY REMINDERS:
- When suggesting activities, mention if they're stroller-friendly for families with young kids
- Consider walking distances and physical demands
- Suggest rest stops along intensive walking routes
- Recommend accessible alternatives when relevant

CRITICAL RULES:
- NEVER use emojis in any response
- Stay focused ONLY on this specific itinerary and its destinations
- Reference their actual preferences when making suggestions
- Be concise but helpful
- When suggesting changes, be VERY specific about which day and what to change
- ASK CLARIFYING QUESTIONS if the user's request is ambiguous

When suggesting activity changes, include them in the suggestedChanges array. Otherwise, just provide a helpful message.

IMPORTANT FOR REMOVE ACTIONS:
When using "remove" action, you MUST copy the EXACT activity text from the current itinerary.
For example, if the current itinerary has "Visit the Louvre Museum" and you want to remove it,
use exactly "Visit the Louvre Museum" in the activities array, not a paraphrase like "Louvre visit".

Return JSON in this format:
{
  "message": "Your helpful response to the user (include clarifying questions here if needed)",
  "suggestedChanges": [
    {
      "dayNumber": 1,
      "action": "add" | "remove" | "replace",
      "activities": ["Exact activity text from itinerary for remove, or new text for add/replace"]
    }
  ]
}

IMPORTANT: Only include suggestedChanges if you have CLEAR, SPECIFIC changes to make. 
If you're asking clarifying questions, do NOT include suggestedChanges - just ask the questions in the message.
For general questions or info, just provide the message without suggestedChanges.`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of request.conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: request.userMessage });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "I'm sorry, I couldn't process that request.",
      suggestedChanges: parsed.suggestedChanges,
    };
  } catch (error) {
    console.error("Error chatting with itinerary assistant:", error);
    throw new Error("Failed to get assistant response");
  }
}

export interface GenerateAlternativeRequest {
  cityName: string;
  countryName: string;
  currentActivity: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  };
  existingAlternates?: { title: string }[];
  tripType: string;
  quizPreferences?: {
    tripGoal?: string;
    dayPace?: string;
    spendingPriority?: string;
    travelersType?: string;
    kidsAges?: string[];
  };
}

export interface GenerateAlternativeResponse {
  alternates: {
    id: string;
    title: string;
    description: string;
    costEstimate?: number;
    externalLink?: string;
  }[];
}

export async function generateActivityAlternatives(request: GenerateAlternativeRequest): Promise<GenerateAlternativeResponse> {
  const preferencesContext = buildPreferencesContext(request.quizPreferences || {});
  
  const existingList = request.existingAlternates && request.existingAlternates.length > 0
    ? `Avoid suggesting: ${request.existingAlternates.map(a => a.title).join(", ")}`
    : "";
  
  const kidsAges = request.quizPreferences?.kidsAges || [];
  let familyContext = "";
  if (kidsAges.length > 0) {
    familyContext = `Traveling with children ages: ${kidsAges.join(", ")}. Suggest family-friendly alternatives.`;
  }

  const systemPrompt = `You are Pebbles, a travel planning assistant. Generate 3 alternative activities for the given activity in ${request.cityName}, ${request.countryName}.

CONTEXT:
- Trip type: ${request.tripType}
- Current activity: ${request.currentActivity.title}
- Time slot: ${request.currentActivity.startTime} - ${request.currentActivity.endTime}
- ${preferencesContext}
${familyContext ? `- ${familyContext}` : ""}
${existingList ? `- ${existingList}` : ""}

RULES:
- No emojis
- Generate exactly 3 alternatives
- Alternatives should be similar in duration but offer different experiences
- Include realistic cost estimates in USD (0 if free)
- Include external links if known (official websites, TripAdvisor, etc.)
- Make alternatives diverse (one might be cheaper, one more upscale, one unique/local)

Return JSON:
{
  "alternates": [
    {
      "id": "alt-1",
      "title": "Activity Name",
      "description": "Brief 1-sentence description",
      "costEstimate": 25,
      "externalLink": "https://..."
    }
  ]
}`;

  const userPrompt = `Generate 3 alternative activities for "${request.currentActivity.title}" (${request.currentActivity.startTime} - ${request.currentActivity.endTime}) in ${request.cityName}, ${request.countryName}. Make them diverse options.`;

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
    return { alternates: parsed.alternates || [] };
  } catch (error) {
    console.error("Error generating activity alternatives:", error);
    throw new Error("Failed to generate alternatives");
  }
}
