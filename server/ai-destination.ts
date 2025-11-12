import OpenAI from "openai";
import { quizResponseSchema, type QuizResponse, type DestinationRecommendation } from "@shared/schema";

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

export async function getDestinationRecommendations(
  quiz: QuizResponse
): Promise<DestinationRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const sanitizedDreamMoment = sanitizeInput(quiz.dreamMoment);
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);

  const systemPrompt = `You are an expert travel advisor who helps people discover their perfect destinations. Based on someone's personality, preferences, cultural interests (movies, books), and dream moments, you recommend destinations that will create unforgettable experiences. Pay special attention to their favorite books and movies - these often reveal deep travel desires. For example, if they love "Lord of the Rings," they might dream of visiting Hobbiton in New Zealand. If they love "Eat Pray Love," they might want to explore Bali or Italy.`;

  const userPrompt = `Based on this traveler profile, recommend 3 destinations:

Traveler Personality: ${personalityProfile}

${culturalInsights ? `Cultural Interests: ${culturalInsights}\nIMPORTANT: Consider how their favorite movie/book might influence destination recommendations. Look for real filming locations, settings from books, or places that match the themes and atmospheres of their favorites.\n` : ""}
Dream Moment: "${sanitizedDreamMoment}"

Trip Planning Details:
- Number of travelers: ${quiz.numberOfTravelers}
- Trip length preference: ${quiz.tripLengthPreference}

Please provide exactly 3 destination recommendations:
- Recommendations 1 & 2: Should perfectly match their personality, preferences, and cultural interests (especially their favorite movie/book if relevant)
- Recommendation 3: Should be a "curveball surprise" - something unexpected, completely different from what they'd normally choose, but still amazing

For each destination, provide:
1. cityName: The city name
2. countryName: The country name
3. description: A brief, inspiring 2-sentence description (max 150 chars)
4. whyMatch: Why this destination matches them (or why it's a fun curveball) (max 200 chars)
5. estimatedDailyBudget: Realistic daily budget in USD per person (food, local transport, activities)
6. bestTimeToVisit: Best season/months to visit
7. imageQuery: A search query for finding beautiful images of this destination (e.g., "Santorini Greece sunset caldera")
8. isCurveball: true only for recommendation 3, false for 1 and 2

Format your response as a JSON object with this structure:
{
  "recommendations": [
    {
      "cityName": "string",
      "countryName": "string",
      "description": "string",
      "whyMatch": "string",
      "estimatedDailyBudget": number,
      "bestTimeToVisit": "string",
      "imageQuery": "string",
      "isCurveball": false
    },
    {
      "cityName": "string",
      "countryName": "string",
      "description": "string",
      "whyMatch": "string",
      "estimatedDailyBudget": number,
      "bestTimeToVisit": "string",
      "imageQuery": "string",
      "isCurveball": false
    },
    {
      "cityName": "string",
      "countryName": "string",
      "description": "string",
      "whyMatch": "string",
      "estimatedDailyBudget": number,
      "bestTimeToVisit": "string",
      "imageQuery": "string",
      "isCurveball": true
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
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const recommendations: DestinationRecommendation[] = parsed.recommendations || [];

    if (recommendations.length !== 3) {
      throw new Error("Expected exactly 3 destination recommendations");
    }

    return recommendations;
  } catch (error) {
    console.error("Error getting destination recommendations:", error);
    throw new Error("Failed to get AI destination recommendations");
  }
}
