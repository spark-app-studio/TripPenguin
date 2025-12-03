# Refactoring Examples - Code Samples

## Example 1: Utility Extraction

### Before (Current)
```typescript
// In ai-destination.ts (lines 26-124)
function sanitizeInput(input: string): string {
  return input.replace(/[<>{}]/g, '').substring(0, 500).trim();
}

function getTripLengthDays(quiz: ExtendedQuizResponse): number {
  const tripLength = quiz.tripLength || "4-7 days";
  const durationMap: Record<string, number> = {
    "1-3 days": 3,
    "4-7 days": 7,
    // ...
  };
  return durationMap[tripLength] || 10;
}

function getTripDurationDays(tripLength: string): number {
  // DUPLICATE of getTripLengthDays!
  const durationMap: Record<string, number> = {
    "1-3 days": 3,
    // ...
  };
  return durationMap[tripLength] || 10;
}
```

### After (Refactored)

#### `ai/destination/utils/sanitization.ts`
```typescript
/**
 * Sanitizes user input to prevent prompt injection attacks
 * @param input - Raw user input string
 * @returns Sanitized string (max 500 chars, no HTML/template chars)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}]/g, '')
    .substring(0, 500)
    .trim();
}
```

#### `ai/destination/utils/duration.ts`
```typescript
import type { ExtendedQuizResponse } from "@shared/schema";

const DURATION_MAP: Record<string, number> = {
  "1-3 days": 3,
  "4-7 days": 7,
  "1-2 weeks": 10,
  "2-3 weeks": 17,
  "3+ weeks": 21,
  "flexible": 10,
} as const;

/**
 * Converts trip length preference to number of days
 * @param quiz - Extended quiz response with tripLength field
 * @returns Number of days (default: 10)
 */
export function getTripLengthDays(quiz: ExtendedQuizResponse): number {
  const tripLength = quiz.tripLength || "4-7 days";
  return DURATION_MAP[tripLength] ?? 10;
}

/**
 * Converts trip length string to number of days
 * @param tripLength - Trip length preference string
 * @returns Number of days (default: 10)
 */
export function getTripDurationDays(tripLength: string): number {
  return DURATION_MAP[tripLength] ?? 10;
}
```

**Benefits:**
- ✅ Removed duplication
- ✅ Constants extracted
- ✅ Better documentation
- ✅ Testable independently

---

## Example 2: Prompt Extraction

### Before (Current)
```typescript
// In getItineraryRecommendations() - 300+ lines
export async function getItineraryRecommendations(
  quiz: ExtendedQuizResponse
): Promise<ItineraryRecommendation[]> {
  // ... 50 lines of prompt building ...
  const systemPrompt = `You are an expert travel advisor...`;
  const userPrompt = `Create 3 multi-city itineraries...`;
  
  // ... API call ...
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // ...
  });
  
  // ... validation ...
}
```

### After (Refactored)

#### `ai/destination/prompts/itinerary-recommendations.ts`
```typescript
import type { ExtendedQuizResponse } from "@shared/schema";
import { sanitizeInput } from "../utils/sanitization";
import { mapQuizToPersonality } from "../utils/quiz-mapper";
import { buildCulturalInsightsText } from "../utils/quiz-mapper";
import { getTripLengthDays } from "../utils/duration";
import { getUSRegionDescription } from "../utils/region-mapper";

export interface ItineraryPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds prompts for itinerary recommendations based on trip type
 */
export function buildItineraryRecommendationPrompt(
  quiz: ExtendedQuizResponse
): ItineraryPromptParams {
  const isDomesticTrip = quiz.tripType === "domestic";
  const sanitizedDreamMoment = sanitizeInput(quiz.postcardImage || "");
  const personalityProfile = mapQuizToPersonality(quiz);
  const culturalInsights = buildCulturalInsightsText(quiz);
  const tripDurationDays = getTripLengthDays(quiz);
  const tripLengthLabel = quiz.tripLength || "4-7 days";
  const numberOfTravelers = quiz.numberOfTravelers;
  const usRegionDescription = isDomesticTrip 
    ? getUSRegionDescription(quiz.usRegion) 
    : "";

  if (isDomesticTrip) {
    return buildDomesticPrompt({
      personalityProfile,
      culturalInsights,
      sanitizedDreamMoment,
      tripDurationDays,
      tripLengthLabel,
      numberOfTravelers,
      usRegionDescription,
    });
  } else {
    return buildInternationalPrompt({
      personalityProfile,
      culturalInsights,
      sanitizedDreamMoment,
      tripDurationDays,
      tripLengthLabel,
      numberOfTravelers,
    });
  }
}

function buildDomesticPrompt(params: {
  personalityProfile: string;
  culturalInsights: string;
  sanitizedDreamMoment: string;
  tripDurationDays: number;
  tripLengthLabel: string;
  numberOfTravelers: number;
  usRegionDescription: string;
}): ItineraryPromptParams {
  return {
    systemPrompt: `You are an expert travel advisor specializing in creating multi-city itineraries WITHIN THE UNITED STATES...`,
    userPrompt: `Create 3 multi-city DOMESTIC US itineraries...`,
  };
}

function buildInternationalPrompt(params: {
  personalityProfile: string;
  culturalInsights: string;
  sanitizedDreamMoment: string;
  tripDurationDays: number;
  tripLengthLabel: string;
  numberOfTravelers: number;
}): ItineraryPromptParams {
  return {
    systemPrompt: `You are an expert travel advisor specializing in creating multi-city itineraries...`,
    userPrompt: `Create 3 multi-city itineraries...`,
  };
}
```

#### `ai/destination/services/itinerary-recommendations.ts`
```typescript
import { openai } from "../client";
import { buildItineraryRecommendationPrompt } from "../prompts/itinerary-recommendations";
import { validateItineraryResponse } from "../validators/itinerary-validator";
import type { ExtendedQuizResponse, ItineraryRecommendation } from "@shared/schema";
import { itineraryRecommendationsResponseSchema } from "@shared/schema";

/**
 * Get AI-generated itinerary recommendations based on quiz responses
 */
export async function getItineraryRecommendations(
  quiz: ExtendedQuizResponse
): Promise<ItineraryRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }

  const { systemPrompt, userPrompt } = buildItineraryRecommendationPrompt(quiz);
  const isDomesticTrip = quiz.tripType === "domestic";

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
    const validated = itineraryRecommendationsResponseSchema.parse(parsed);
    
    // Post-processing for domestic trips
    if (isDomesticTrip) {
      validateDomesticTrip(validated.recommendations);
    }
    
    return validated.recommendations;
  } catch (error) {
    console.error("Error getting itinerary recommendations:", error);
    throw new Error("Failed to get AI itinerary recommendations");
  }
}

function validateDomesticTrip(recommendations: ItineraryRecommendation[]): void {
  for (const itinerary of recommendations) {
    for (const city of itinerary.cities) {
      if (city.countryName !== "United States") {
        console.warn(
          `Domestic trip returned non-US city: ${city.cityName}, ${city.countryName}. Overriding to United States.`
        );
        city.countryName = "United States";
      }
    }
  }
}
```

**Benefits:**
- ✅ Prompts testable independently
- ✅ Service function is now ~50 lines (was 300+)
- ✅ Clear separation of concerns
- ✅ Easy to A/B test different prompts

---

## Example 3: Client Extraction

### Before (Current)
```typescript
// In ai-destination.ts (lines 18-24)
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});
```

### After (Refactored)

#### `ai/destination/client.ts`
```typescript
import OpenAI from "openai";

/**
 * Validates that OpenAI API key is configured
 */
function validateApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set");
  }
}

/**
 * Shared OpenAI client instance
 * All destination AI services use this client
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

// Validate on module load
validateApiKey();
```

**Benefits:**
- ✅ Single source of truth for client
- ✅ Can be mocked for testing
- ✅ Centralized configuration

---

## Example 4: Validator Extraction

### Before (Current)
```typescript
// In ai-destination.ts (lines 702-758)
function validateItineraryStructure(
  itinerary: ItineraryRecommendation,
  expectedNights: number,
  // ... many parameters
): void {
  // ... 50+ lines of validation logic
}
```

### After (Refactored)

#### `ai/destination/validators/itinerary-validator.ts`
```typescript
import type { ItineraryRecommendation } from "@shared/schema";

export interface ValidationOptions {
  expectedNights: number;
  originalCityNames?: string[];
  allowCityRemoval?: boolean;
  maxCities?: number;
}

export class ItineraryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ItineraryValidationError";
  }
}

/**
 * Validates itinerary structure matches constraints
 * @throws ItineraryValidationError if validation fails
 */
export function validateItineraryStructure(
  itinerary: ItineraryRecommendation,
  options: ValidationOptions
): void {
  const { expectedNights, originalCityNames, allowCityRemoval, maxCities } = options;

  // Validate total nights matches sum of city nights
  const summedNights = itinerary.cities.reduce(
    (sum, city) => sum + city.stayLengthNights,
    0
  );
  
  if (summedNights !== itinerary.totalNights) {
    throw new ItineraryValidationError(
      `Sum of city nights (${summedNights}) doesn't match totalNights (${itinerary.totalNights})`
    );
  }

  if (itinerary.totalNights !== expectedNights) {
    throw new ItineraryValidationError(
      `Expected ${expectedNights} nights but got ${itinerary.totalNights}`
    );
  }

  // ... rest of validation logic
}

/**
 * Validates cost breakdown is consistent
 */
export function validateCostBreakdown(itinerary: ItineraryRecommendation): void {
  const breakdownSum = Object.values(itinerary.costBreakdown).reduce(
    (sum, val) => sum + val,
    0
  );
  
  if (
    breakdownSum < itinerary.totalCost.min * 0.8 ||
    breakdownSum > itinerary.totalCost.max * 1.2
  ) {
    throw new ItineraryValidationError(
      `Cost breakdown sum (${breakdownSum}) is inconsistent with total cost range`
    );
  }
}
```

**Benefits:**
- ✅ Custom error types
- ✅ Better error messages
- ✅ Reusable validation functions
- ✅ Testable independently

---

## Example 5: Public API

### Before (Current)
```typescript
// routes.ts imports directly from ai-destination.ts
import { 
  getItineraryRecommendations,
  getStaycationRecommendations,
  // ... many imports
} from "./ai-destination";
```

### After (Refactored)

#### `ai/destination/index.ts`
```typescript
/**
 * Public API for AI Destination services
 * 
 * This module provides AI-powered destination and itinerary planning services.
 * All functions are async and return validated, typed responses.
 */

// Service exports
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
} from "./services/day-planner";

export {
  generateFullItineraryPlan,
} from "./services/full-itinerary-plan";

export {
  chatWithItineraryAssistant,
} from "./services/itinerary-assistant";

export {
  generateActivityAlternatives,
} from "./services/activity-alternatives";

// Type exports
export type {
  ActivitySuggestionRequest,
  ActivitySuggestion,
  DayPlannerRequest,
  DayPlannerResponse,
  DayPlannerMessage,
  PlannedActivity,
  FullItineraryPlanRequest,
  FullItineraryPlanResponse,
  ItineraryAssistantRequest,
  ItineraryAssistantResponse,
  ItineraryAssistantMessage,
  GenerateAlternativeRequest,
  GenerateAlternativeResponse,
  TripPersonality,
  DayActivities,
} from "./services/types";
```

#### `routes.ts` (Updated)
```typescript
// Clean, single import
import {
  getItineraryRecommendations,
  getStaycationRecommendations,
  adjustItineraryDuration,
  generateItineraryAddons,
  applyAddon,
  getActivitySuggestions,
  planDayWithAI,
  generateFullItineraryPlan,
  chatWithItineraryAssistant,
  generateActivityAlternatives,
  type ActivitySuggestionRequest,
  type DayPlannerRequest,
  type FullItineraryPlanRequest,
  type ItineraryAssistantRequest,
  type GenerateAlternativeRequest,
} from "./ai/destination";
```

**Benefits:**
- ✅ Single import point
- ✅ Clear public API contract
- ✅ Internal refactoring doesn't affect routes
- ✅ Better documentation

---

## Testing Examples

### Testing Prompts Independently

```typescript
// __tests__/prompts/itinerary-recommendations.test.ts
import { buildItineraryRecommendationPrompt } from "../../ai/destination/prompts/itinerary-recommendations";
import type { ExtendedQuizResponse } from "@shared/schema";

describe("buildItineraryRecommendationPrompt", () => {
  it("builds domestic prompt for US trips", () => {
    const quiz: ExtendedQuizResponse = {
      tripType: "domestic",
      usRegion: "pacific-coast",
      numberOfTravelers: 2,
      // ...
    };

    const { systemPrompt, userPrompt } = buildItineraryRecommendationPrompt(quiz);

    expect(systemPrompt).toContain("UNITED STATES");
    expect(userPrompt).toContain("DOMESTIC US");
  });

  it("builds international prompt for international trips", () => {
    const quiz: ExtendedQuizResponse = {
      tripType: "international",
      // ...
    };

    const { systemPrompt } = buildItineraryRecommendationPrompt(quiz);

    expect(systemPrompt).not.toContain("UNITED STATES");
  });
});
```

### Testing Utilities

```typescript
// __tests__/utils/duration.test.ts
import { getTripLengthDays } from "../../ai/destination/utils/duration";

describe("getTripLengthDays", () => {
  it("converts trip length strings to days", () => {
    expect(getTripLengthDays({ tripLength: "1-3 days" })).toBe(3);
    expect(getTripLengthDays({ tripLength: "4-7 days" })).toBe(7);
  });

  it("defaults to 10 days for unknown values", () => {
    expect(getTripLengthDays({ tripLength: "unknown" })).toBe(10);
  });
});
```

---

## Migration Checklist

- [ ] Create directory structure
- [ ] Extract utilities (Phase 1)
- [ ] Extract prompts (Phase 2)
- [ ] Extract services (Phase 3)
- [ ] Extract validators (Phase 4)
- [ ] Create public API (Phase 5)
- [ ] Update routes.ts imports
- [ ] Add unit tests
- [ ] Update documentation
- [ ] Remove old file
- [ ] Verify no breaking changes
