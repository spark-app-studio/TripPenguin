/**
 * Prompt builder for day planner (conversational day planning)
 */

import { sanitizeInput } from "../utils/sanitization";
import { buildPreferencesContext, type QuizPreferences } from "../utils/preferences-context";

export interface DayPlannerPromptParams {
  systemPrompt: string;
  initialUserMessage?: string;
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
  quizPreferences: QuizPreferences;
  currentPlan?: Array<{
    time: string;
    activity: string;
    duration: string;
  }>;
}

/**
 * Builds system prompt for day planner
 * 
 * @param request - Day planner request
 * @returns Object containing system prompt and optional initial user message
 */
export function buildDayPlannerPrompt(
  request: DayPlannerRequest
): DayPlannerPromptParams {
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

  const initialUserMessage = `Please help me plan Day ${request.dayNumber} in ${sanitizedCity}. I'm excited to explore!`;

  return { systemPrompt, initialUserMessage };
}
