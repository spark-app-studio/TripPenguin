import OpenAI from "openai";
import { z } from "zod";

// Zod schema for budget request validation
export const budgetAdviceParamsSchema = z.object({
  destinations: z.array(z.string().max(100)).min(1).max(10),
  travelers: z.number().int().min(1).max(50),
  tripDuration: z.number().int().min(1).max(365),
  travelSeason: z.string().max(50),
});

export type BudgetAdviceParams = z.infer<typeof budgetAdviceParamsSchema>;

export interface CategoryBudget {
  category: "flights" | "housing" | "food" | "transportation" | "fun" | "preparation";
  categoryLabel: string;
  estimatedRange: string;
  explanation: string;
  tips: string[];
}

export interface BudgetAdviceResponse {
  totalEstimatedRange: string;
  categories: CategoryBudget[];
  generalTips: string[];
}

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("WARNING: OPENAI_API_KEY is not set. AI budget advice will not work.");
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 500) // Limit length
    .replace(/[<>{}]/g, "") // Remove potential template/HTML injection chars
    .replace(/system|prompt|instruction/gi, ""); // Remove potential prompt injection keywords
}

export async function getBudgetAdvice(params: BudgetAdviceParams): Promise<BudgetAdviceResponse> {
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  // Validate input
  const validated = budgetAdviceParamsSchema.parse(params);

  // Sanitize inputs
  const sanitizedDestinations = validated.destinations.map(sanitizeInput);
  const sanitizedSeason = sanitizeInput(validated.travelSeason);

  // Build the prompt
  const prompt = `You are a travel budget advisor. Provide realistic budget estimates for a trip with these details:

Destinations: ${sanitizedDestinations.join(", ")}
Number of travelers: ${validated.travelers}
Trip duration: ${validated.tripDuration} days
Travel season: ${sanitizedSeason}

Provide budget estimates in USD for these 6 categories:
1. Flights - Round-trip airfare for all travelers
2. Housing - Accommodation for the entire stay
3. Food - Meals and dining for all travelers
4. Transportation - Local transport (taxis, trains, car rentals, etc.)
5. Fun - Activities, tours, entertainment, attractions
6. Preparation - Visas, travel insurance, vaccinations, gear

For each category, provide:
- A realistic price range (e.g., "$800-$1,200")
- A brief explanation of what's included
- 2-3 practical tips for saving money or getting the best value

Also provide:
- Total estimated budget range for the entire trip
- 3-4 general money-saving tips for this trip

Return your response as a JSON object with this exact structure:
{
  "totalEstimatedRange": "string with total range",
  "categories": [
    {
      "category": "flights|housing|food|transportation|fun|preparation",
      "categoryLabel": "Flights|Housing|Food|Transportation|Fun|Preparation",
      "estimatedRange": "price range string",
      "explanation": "what's included",
      "tips": ["tip1", "tip2", "tip3"]
    }
  ],
  "generalTips": ["tip1", "tip2", "tip3", "tip4"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful travel budget advisor. Provide realistic, practical budget estimates based on current travel costs. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const response = JSON.parse(content) as BudgetAdviceResponse;
    return response;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get budget advice from AI");
  }
}
