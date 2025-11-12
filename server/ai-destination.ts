import OpenAI from "openai";
import { quizResponseSchema, type QuizResponse, type ItineraryRecommendation, itineraryRecommendationsResponseSchema } from "@shared/schema";

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
