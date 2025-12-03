# AI Destination Service Refactoring Plan

## Current State Analysis

**File**: `server/ai-destination.ts` (1,945 lines)

### Issues Identified

1. **Monolithic file** - Too large to maintain effectively
2. **Mixed concerns** - Utilities, prompts, API calls, validation all intertwined
3. **Duplicate logic** - `getTripLengthDays` and `getTripDurationDays` are identical
4. **Long functions** - `getItineraryRecommendations` is 300+ lines with complex branching
5. **Embedded prompts** - Hard to test, maintain, or version
6. **No separation** - Prompt building, API calls, validation all mixed together

---

## Proposed Architecture

### Directory Structure

```
server/
├── ai/
│   ├── destination/
│   │   ├── index.ts                    # Public API exports
│   │   ├── client.ts                   # OpenAI client initialization
│   │   ├── utils/
│   │   │   ├── sanitization.ts         # Input sanitization
│   │   │   ├── quiz-mapper.ts          # Quiz → personality mapping
│   │   │   ├── duration.ts             # Duration calculations
│   │   │   └── region-mapper.ts       # Region descriptions
│   │   ├── prompts/
│   │   │   ├── itinerary-recommendations.ts
│   │   │   ├── staycation-recommendations.ts
│   │   │   ├── day-planner.ts
│   │   │   ├── itinerary-assistant.ts
│   │   │   └── activity-suggestions.ts
│   │   ├── services/
│   │   │   ├── itinerary-recommendations.ts
│   │   │   ├── staycation-recommendations.ts
│   │   │   ├── itinerary-adjustment.ts
│   │   │   ├── day-planner.ts
│   │   │   ├── full-itinerary-plan.ts
│   │   │   ├── itinerary-assistant.ts
│   │   │   └── activity-alternatives.ts
│   │   └── validators/
│   │       └── itinerary-validator.ts
│   ├── ai-booking.ts                  # Keep as-is (smaller, focused)
│   └── ai-budget.ts                    # Keep as-is (smaller, focused)
```

---

## Module Breakdown

### 1. **Core Infrastructure**

#### `ai/destination/client.ts`
- OpenAI client initialization
- Shared client configuration
- API key validation

#### `ai/destination/utils/sanitization.ts`
- `sanitizeInput()` function
- Input validation helpers

#### `ai/destination/utils/quiz-mapper.ts`
- `mapQuizToPersonality()` - Convert quiz to personality profile
- `buildCulturalInsightsText()` - Build cultural context

#### `ai/destination/utils/duration.ts`
- `getTripLengthDays()` - Single unified function (remove duplicate)
- `getTripDurationDays()` - Alias or remove

#### `ai/destination/utils/region-mapper.ts`
- `getUSRegionDescription()` - US region mapping
- Future: International region mappers

---

### 2. **Prompt Builders** (Separate concerns)

#### `ai/destination/prompts/itinerary-recommendations.ts`
```typescript
export function buildItineraryRecommendationPrompt(
  quiz: ExtendedQuizResponse,
  isDomestic: boolean
): { systemPrompt: string; userPrompt: string }
```

#### `ai/destination/prompts/staycation-recommendations.ts`
```typescript
export function buildStaycationPrompt(
  quiz: ExtendedQuizResponse
): { systemPrompt: string; userPrompt: string }
```

#### `ai/destination/prompts/day-planner.ts`
```typescript
export function buildDayPlannerPrompt(
  request: DayPlannerRequest
): { systemPrompt: string; userPrompt: string }
```

#### `ai/destination/prompts/itinerary-assistant.ts`
```typescript
export function buildItineraryAssistantPrompt(
  request: ItineraryAssistantRequest
): string
```

#### `ai/destination/prompts/activity-suggestions.ts`
```typescript
export function buildActivitySuggestionPrompt(
  request: ActivitySuggestionRequest
): { systemPrompt: string; userPrompt: string }
```

**Benefits:**
- Prompts can be tested independently
- Easier to version/A/B test prompts
- Clear separation of prompt logic from API calls

---

### 3. **Service Layer** (Business Logic)

#### `ai/destination/services/itinerary-recommendations.ts`
- `getItineraryRecommendations()` - Main function
- Calls prompt builder
- Handles API call
- Validates response
- Post-processing (e.g., domestic trip validation)

#### `ai/destination/services/staycation-recommendations.ts`
- `getStaycationRecommendations()` - Staycation-specific logic

#### `ai/destination/services/itinerary-adjustment.ts`
- `adjustItineraryDuration()`
- `generateItineraryAddons()`
- `applyAddon()`

#### `ai/destination/services/day-planner.ts`
- `planDayWithAI()`
- `getActivitySuggestions()`
- `buildPreferencesContext()` helper

#### `ai/destination/services/full-itinerary-plan.ts`
- `generateFullItineraryPlan()`
- Complex day-by-day planning logic

#### `ai/destination/services/itinerary-assistant.ts`
- `chatWithItineraryAssistant()`
- Conversational AI logic

#### `ai/destination/services/activity-alternatives.ts`
- `generateActivityAlternatives()`

---

### 4. **Validation Layer**

#### `ai/destination/validators/itinerary-validator.ts`
- `validateItineraryStructure()` - Moved from main file
- Validation helpers
- Cost validation logic

---

### 5. **Public API** (`ai/destination/index.ts`)

```typescript
// Re-export all public functions
export {
  getItineraryRecommendations,
  getStaycationRecommendations,
  adjustItineraryDuration,
  generateItineraryAddons,
  applyAddon,
  planDayWithAI,
  getActivitySuggestions,
  generateFullItineraryPlan,
  chatWithItineraryAssistant,
  generateActivityAlternatives,
} from './services/...';

// Re-export types
export type {
  ActivitySuggestionRequest,
  DayPlannerRequest,
  FullItineraryPlanRequest,
  ItineraryAssistantRequest,
  GenerateAlternativeRequest,
  // ... etc
} from './services/...';
```

---

## Migration Strategy

### Phase 1: Extract Utilities (Low Risk)
1. Create `utils/` directory
2. Move utility functions
3. Update imports
4. Test

### Phase 2: Extract Prompts (Medium Risk)
1. Create `prompts/` directory
2. Extract prompt building logic
3. Update service functions to use prompt builders
4. Test each prompt independently

### Phase 3: Extract Services (Medium Risk)
1. Create `services/` directory
2. Move service functions
3. Update imports in routes
4. Test

### Phase 4: Extract Validators (Low Risk)
1. Create `validators/` directory
2. Move validation logic
3. Update imports
4. Test

### Phase 5: Create Public API (Low Risk)
1. Create `index.ts` with re-exports
2. Update `routes.ts` to import from new location
3. Remove old file
4. Test

---

## Benefits

### Maintainability
- ✅ Each file < 300 lines
- ✅ Single responsibility per module
- ✅ Easy to locate specific functionality

### Testability
- ✅ Prompts can be unit tested independently
- ✅ Services can be mocked easily
- ✅ Utilities are pure functions

### Scalability
- ✅ Easy to add new prompt types
- ✅ Easy to add new services
- ✅ Clear extension points

### Developer Experience
- ✅ Better IDE navigation
- ✅ Clearer code organization
- ✅ Easier onboarding

---

## Industry Standards Applied

1. **Separation of Concerns** - Prompts, services, utilities separated
2. **Single Responsibility Principle** - Each module has one job
3. **DRY** - Removed duplicate duration functions
4. **Dependency Injection Ready** - Client can be injected for testing
5. **Clear Public API** - `index.ts` defines contract
6. **Type Safety** - All types exported and shared

---

## File Size Targets

| Module | Target Lines | Current |
|--------|--------------|---------|
| Utils (combined) | < 200 | ~150 |
| Prompts (each) | < 300 | ~200-400 |
| Services (each) | < 250 | ~200-500 |
| Validators | < 150 | ~60 |
| Index | < 50 | N/A |

---

## Next Steps

1. **Review this plan** with team
2. **Start with Phase 1** (utilities) - lowest risk
3. **Add tests** as we extract modules
4. **Update documentation** as we go
5. **Monitor** for any breaking changes
