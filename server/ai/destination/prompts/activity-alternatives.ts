/**
 * Prompt builder for activity alternatives
 */

import { buildPreferencesContext, type QuizPreferences } from "../utils/preferences-context";

export interface ActivityAlternativesPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

export interface ActivityAlternativesRequest {
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
  quizPreferences?: QuizPreferences;
}

/**
 * Builds prompts for activity alternatives
 * 
 * @param request - Activity alternatives request
 * @returns Object containing system and user prompts
 */
export function buildActivityAlternativesPrompt(
  request: ActivityAlternativesRequest
): ActivityAlternativesPromptParams {
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

  return { systemPrompt, userPrompt };
}
