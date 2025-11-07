import OpenAI from "openai";
import { z } from "zod";

// Validate OPENAI_API_KEY exists
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

export const bookingSearchParamsSchema = z.object({
  itemName: z.string().min(1).max(200),
  category: z.enum(["flights", "housing", "food", "transportation", "fun", "preparation"]),
  budget: z.number().min(0).max(1000000),
  destinations: z.array(z.string().max(100)).max(10).optional(),
  travelers: z.number().int().min(1).max(50).optional(),
  tripDuration: z.number().int().min(1).max(365).optional(),
  travelSeason: z.string().max(50).optional(),
});

export type BookingSearchParams = z.infer<typeof bookingSearchParamsSchema>;

export interface BookingRecommendation {
  title: string;
  description: string;
  estimatedPrice: number;
  provider: string;
  pros: string[];
  cons: string[];
  bookingTips: string;
}

// Sanitize string input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}]/g, '') // Remove potential HTML/template injection chars
    .substring(0, 500) // Limit length
    .trim();
}

export async function getBookingRecommendations(
  params: BookingSearchParams
): Promise<BookingRecommendation[]> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const {
    itemName,
    category,
    budget,
    destinations = [],
    travelers = 1,
    tripDuration = 7,
    travelSeason = "summer",
  } = params;

  // Sanitize inputs
  const sanitizedItemName = sanitizeInput(itemName);
  const sanitizedDestinations = destinations.map(d => sanitizeInput(d));
  const sanitizedSeason = sanitizeInput(travelSeason);

  const destinationsText = sanitizedDestinations.length > 0 
    ? sanitizedDestinations.join(", ") 
    : "various destinations";

  const systemPrompt = `You are a travel booking expert assistant. Provide realistic, helpful booking recommendations based on the user's trip details and budget. Always give 3 specific, practical recommendations with real-world pricing estimates.`;

  const userPrompt = `I need help booking: ${sanitizedItemName} (${category})

Trip Details:
- Destinations: ${destinationsText}
- Travelers: ${travelers}
- Duration: ${tripDuration} days
- Season: ${sanitizedSeason}
- Budget for this item: $${budget}

Please provide 3 specific booking recommendations with:
1. Title (name of service/provider/option)
2. Brief description
3. Estimated price in USD
4. Provider/booking site
5. 3 pros
6. 2 cons
7. Booking tips

Format your response as a JSON array of 3 recommendations. Each recommendation should have this structure:
{
  "title": "string",
  "description": "string",
  "estimatedPrice": number,
  "provider": "string",
  "pros": ["string", "string", "string"],
  "cons": ["string", "string"],
  "bookingTips": "string"
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
    
    // Handle both array and object with recommendations array
    const recommendations = Array.isArray(parsed) 
      ? parsed 
      : parsed.recommendations || [];

    return recommendations.slice(0, 3);
  } catch (error) {
    console.error("Error getting booking recommendations:", error);
    throw new Error("Failed to get AI booking recommendations");
  }
}
