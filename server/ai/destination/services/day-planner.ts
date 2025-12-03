/**
 * Service for day planning and activity suggestions
 * Handles conversational day planning and activity recommendations
 */

import { openai } from "../client";
import { buildDayPlannerPrompt } from "../prompts/day-planner";
import { buildActivitySuggestionPrompt } from "../prompts/activity-suggestions";

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

export interface ActivitySuggestion {
  activity: string;
  category: "must-see" | "hidden-gem" | "food" | "outdoor" | "cultural" | "relaxation";
  reason: string;
}

/**
 * Plan a day with AI assistance (conversational)
 * 
 * @param request - Day planner request with conversation history
 * @returns Day planner response with suggested plan
 * @throws Error if request fails
 */
export async function planDayWithAI(request: DayPlannerRequest): Promise<DayPlannerResponse> {
  // Build prompts using extracted prompt builder
  const { systemPrompt, initialUserMessage } = buildDayPlannerPrompt(request);

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
  } else if (request.conversationHistory.length === 0 && initialUserMessage) {
    messages.push({ role: "user", content: initialUserMessage });
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

/**
 * Get activity suggestions for a specific day
 * 
 * @param request - Activity suggestion request
 * @returns Array of activity suggestions
 * @throws Error if request fails
 */
export async function getActivitySuggestions(request: ActivitySuggestionRequest): Promise<ActivitySuggestion[]> {
  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildActivitySuggestionPrompt(request);

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
