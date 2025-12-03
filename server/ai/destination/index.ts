/**
 * Public API for destination AI services
 * Re-exports all service functions and types for external use
 */

// Services
export {
  getItineraryRecommendations,
  getStaycationRecommendations,
} from "./services/itinerary-recommendations";

export {
  adjustItineraryDuration,
  generateItineraryAddons,
  applyAddon,
} from "./services/itinerary-adjustment";

export {
  planDayWithAI,
  getActivitySuggestions,
  type DayPlannerRequest,
  type DayPlannerResponse,
  type DayPlannerMessage,
  type PlannedActivity,
  type ActivitySuggestionRequest,
  type ActivitySuggestion,
} from "./services/day-planner";

export {
  generateFullItineraryPlan,
  chatWithItineraryAssistant,
  generateActivityAlternatives,
  type FullItineraryPlanRequest,
  type FullItineraryPlanResponse,
  type TripPersonality,
  type DayActivities,
  type ItineraryAssistantRequest,
  type ItineraryAssistantResponse,
  type ItineraryAssistantMessage,
  type GenerateAlternativeRequest,
  type GenerateAlternativeResponse,
} from "./services/itinerary-planning";

// Client (for testing/mocking)
export { openai, requireApiKey } from "./client";
