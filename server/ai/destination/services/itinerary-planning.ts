/**
 * Service for full itinerary planning and assistant
 * Handles day-by-day itinerary generation and conversational refinement
 */

import type { ItineraryRecommendation } from "@shared/schema";
import { openai } from "../client";
import { buildFullItineraryPlanPrompt } from "../prompts/full-itinerary-plan";
import { buildItineraryAssistantPrompt } from "../prompts/itinerary-assistant";
import { buildActivityAlternativesPrompt } from "../prompts/activity-alternatives";

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

/**
 * Generate full day-by-day itinerary plan
 * 
 * @param request - Full itinerary plan request
 * @returns Day-by-day itinerary plan
 * @throws Error if request fails
 */
export async function generateFullItineraryPlan(request: FullItineraryPlanRequest): Promise<FullItineraryPlanResponse> {
  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt, maxTokens } = buildFullItineraryPlanPrompt(request);

  try {
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

/**
 * Chat with itinerary assistant for conversational refinement
 * 
 * @param request - Itinerary assistant request with conversation history
 * @returns Assistant response with suggested changes
 * @throws Error if request fails
 */
export async function chatWithItineraryAssistant(request: ItineraryAssistantRequest): Promise<ItineraryAssistantResponse> {
  // Build prompts using extracted prompt builder
  const { systemPrompt } = buildItineraryAssistantPrompt({
    itinerary: request.itinerary,
    numberOfTravelers: request.numberOfTravelers,
    tripType: request.tripType,
    quizPreferences: request.quizPreferences,
    currentDayPlans: request.currentDayPlans,
  });

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

/**
 * Generate alternative activities for a given activity
 * 
 * @param request - Activity alternatives request
 * @returns Alternative activities
 * @throws Error if request fails
 */
export async function generateActivityAlternatives(request: GenerateAlternativeRequest): Promise<GenerateAlternativeResponse> {
  // Build prompts using extracted prompt builder
  const { systemPrompt, userPrompt } = buildActivityAlternativesPrompt({
    cityName: request.cityName,
    countryName: request.countryName,
    currentActivity: request.currentActivity,
    existingAlternates: request.existingAlternates,
    tripType: request.tripType,
    quizPreferences: request.quizPreferences,
  });

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
