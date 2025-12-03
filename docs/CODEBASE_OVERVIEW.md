# TripPenguin Codebase Overview

A comprehensive **AI-powered trip planning application** that helps families plan trips without going into debt. Features an AI assistant named "**Pebbles**" that provides personalized itinerary recommendations and conversational trip refinement.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript + Vite |
| **Routing** | wouter |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS |
| **State** | React Query + React hooks |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (Neon serverless) + Drizzle ORM |
| **AI** | OpenAI GPT-4o-mini |
| **Auth** | Passport.js + bcrypt + sessions |

---

## Core Features

### 1. Quiz & Itinerary Generation
- 12-question personality quiz
- Three trip types: **International**, **Domestic**, **Staycation**
- AI generates 3 multi-city itinerary recommendations
- Interactive refinement (adjust duration, add cities, add-ons)

### 2. "Pebbles" AI Assistant
The app has a conversational AI assistant that:
- Chats about the itinerary
- Suggests activity changes
- Answers travel questions
- Provides family-friendly recommendations
- Handles clarifying questions before making changes

### 3. AI-Powered Day Planning
- `getActivitySuggestions()` - Get 5 activity ideas for a specific day
- `planDayWithAI()` - Interactive day planner with conversation
- `generateFullItineraryPlan()` - Complete day-by-day itinerary generation
- `chatWithItineraryAssistant()` - Pebbles chat interface
- `generateActivityAlternatives()` - Generate 3 alternatives for any activity

### 4. Trip Planning Flow
```
Getting Started → Quiz → Results → Refine → Itinerary Page → Trip Planner
```

### 5. Budget & Booking Management
- Step 1: **Dream** - Destination selection
- Step 2: **Plan** - Budget categories with AI guidance
- Step 3: **Book** - Booking checklist with AI recommendations

---

## Project Structure

```
workspace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── AIDayPlanner.tsx
│   │   │   ├── ItineraryAssistant.tsx
│   │   │   ├── NavBar.tsx
│   │   │   ├── PenguinLogo.tsx
│   │   │   └── ...
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useItinerary.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utilities
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/          # Route pages
│   │   │   ├── getting-started.tsx
│   │   │   ├── quiz.tsx
│   │   │   ├── quiz-results.tsx
│   │   │   ├── quiz-refine.tsx
│   │   │   ├── itinerary.tsx
│   │   │   ├── trip-planner.tsx
│   │   │   ├── meet-pebbles.tsx
│   │   │   └── ...
│   │   ├── App.tsx         # Router & layout
│   │   └── main.tsx        # Entry point
│   └── index.html
├── server/                 # Express backend
│   ├── ai-destination.ts   # All AI functions (1945 lines)
│   ├── ai-booking.ts       # AI booking recommendations
│   ├── ai-budget.ts        # AI budget advice
│   ├── routes.ts           # API endpoints
│   ├── auth.ts             # Authentication
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   ├── email.ts            # Email service
│   └── index.ts            # Server entry
├── shared/                 # Shared code
│   └── schema.ts           # Data models & Zod schemas
├── scripts/                # Utility scripts
│   ├── delete-user.ts
│   └── README.md
├── docs/                   # Documentation
│   └── CODEBASE_OVERVIEW.md (this file)
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── vite.config.ts
```

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `server/ai-destination.ts` | All AI functions | ~1945 |
| `server/routes.ts` | API endpoints | ~800 |
| `server/auth.ts` | Authentication | ~200 |
| `server/storage.ts` | Database operations | ~430 |
| `shared/schema.ts` | Data models & Zod schemas | ~500 |
| `client/src/App.tsx` | Router & layout | ~105 |
| `client/src/components/ItineraryAssistant.tsx` | Pebbles chat UI | ~300 |
| `client/src/hooks/useItinerary.ts` | Itinerary state management | ~285 |
| `client/src/pages/itinerary.tsx` | Itinerary editor page | ~510 |
| `client/src/pages/getting-started.tsx` | Quiz flow | ~1600 |

---

## API Endpoints

### AI Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai/destination-recommendations` | Generate itineraries from quiz |
| `POST /api/ai/staycation-recommendations` | Generate staycations |
| `POST /api/ai/activity-suggestions` | Get activity ideas |
| `POST /api/ai/day-planner` | Interactive day planning |
| `POST /api/ai/itinerary-plan` | Full itinerary generation |
| `POST /api/ai/itinerary-assistant` | Chat with Pebbles |
| `POST /api/ai/generate-alternative` | Activity alternatives |
| `POST /api/ai/adjust-itinerary-duration` | Adjust trip length |
| `POST /api/ai/itinerary-addons` | Get add-on suggestions |
| `POST /api/ai/apply-addon` | Apply an add-on |
| `POST /api/ai/booking-recommendations` | AI booking suggestions |
| `POST /api/ai/budget-recommendations` | AI budget advice |

### Auth Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login |
| `POST /api/auth/logout` | Logout |
| `GET /api/auth/user` | Get current user |
| `POST /api/auth/verify-email` | Verify email |
| `POST /api/auth/forgot-password` | Request reset |
| `POST /api/auth/reset-password` | Reset password |
| `POST /api/auth/resend-verification` | Resend verification email |

### CRUD Endpoints

| Resource | Endpoints |
|----------|-----------|
| **Trips** | `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/:id` |
| **Destinations** | `POST /api/destinations`, `GET /api/destinations/trip/:tripId`, `PATCH/DELETE /api/destinations/:id` |
| **Budget Categories** | `POST /api/budget-categories`, `GET /api/budget-categories/trip/:tripId`, `PATCH/DELETE /api/budget-categories/:id` |
| **Bookings** | `POST /api/bookings`, `GET /api/bookings/trip/:tripId`, `PATCH/DELETE /api/bookings/:id` |

---

## Data Models

### Database Schema

```
users
├── id (PK)
├── email (unique)
├── password (bcrypt hashed)
├── firstName, lastName
├── city, state, zipCode
├── emailVerified
├── failedLoginAttempts, lockedUntil
└── createdAt, updatedAt

sessions
├── sid (PK)
├── sess (JSONB)
└── expire

trips
├── id (PK)
├── userId (FK → users)
├── status ("draft" | "active")
├── title
├── travelers, numberOfTravelers
├── travelSeason, tripDuration
├── startDate, endDate
├── departureCity, departureCountry, departureAirport
├── savingsAccountLinked, savingsAccountId
├── monthlySavingsAmount, currentSavings, creditCardPoints
├── draftItineraryData (JSONB)
├── draftQuizData (JSONB)
└── createdAt, updatedAt

destinations
├── id (PK)
├── tripId (FK → trips, CASCADE)
├── cityName, countryName
├── numberOfNights
├── order
├── arrivalDate, departureDate
├── arrivalAirport, departureAirport
├── activities (JSONB - string[])
├── transportToNext (JSONB)
└── imageUrl

budgetCategories
├── id (PK)
├── tripId (FK → trips, CASCADE)
├── category ("flights" | "housing" | "food" | "transportation" | "fun" | "preparation")
├── estimatedCost, actualCost
├── notes
└── usePoints

bookings
├── id (PK)
├── tripId (FK → trips, CASCADE)
├── category, itemName
├── status ("not_started" | "in_progress" | "booked")
├── estimatedCost, actualCost
├── bookingDetails
├── bookedAt
└── order

emailVerificationTokens
├── id (PK)
├── userId (FK → users, CASCADE)
├── token (unique)
├── expiresAt
└── createdAt

passwordResetTokens
├── id (PK)
├── userId (FK → users, CASCADE)
├── token (unique)
├── expiresAt
└── createdAt
```

### Key TypeScript Types

```typescript
// Itinerary recommendation from AI
interface ItineraryRecommendation {
  id: string;
  title: string;
  vibeTagline: string;
  isCurveball: boolean;
  totalCost: { min: number; max: number; currency: string };
  costBreakdown: CostBreakdown;
  cities: ItineraryCitySegment[];
  bestTimeToVisit: string;
  totalNights: number;
}

// City segment in an itinerary
interface ItineraryCitySegment {
  order: number;
  cityName: string;
  countryName: string;
  arrivalAirport?: string;
  departureAirport?: string;
  stayLengthNights: number;
  activities: string[];
  imageQuery: string;
}

// Transport between destinations
interface TransportSegment {
  mode: string; // "flight", "train", "bus", "car", "ferry"
  durationMinutes?: number;
  estimatedCost?: number;
  notes?: string;
}

// Quiz preferences for personalization
interface QuizPreferences {
  tripGoal?: string;
  placeType?: string;
  dayPace?: string;
  spendingPriority?: string;
  travelersType?: string;
  kidsAges?: string[];
  accommodationType?: string;
  mustHave?: string;
}
```

---

## AI Functions (server/ai-destination.ts)

### Itinerary Generation

| Function | Description |
|----------|-------------|
| `getItineraryRecommendations()` | Generate 3 multi-city itineraries from quiz |
| `getStaycationRecommendations()` | Generate 3 local staycation options |
| `adjustItineraryDuration()` | Resize itinerary to new duration |
| `generateItineraryAddons()` | Suggest trip extensions |
| `applyAddon()` | Apply an add-on to itinerary |

### Day Planning

| Function | Description |
|----------|-------------|
| `getActivitySuggestions()` | Get 5 activity ideas for a day |
| `planDayWithAI()` | Interactive day planner with chat |
| `generateFullItineraryPlan()` | Generate complete day-by-day plan |

### Conversational AI

| Function | Description |
|----------|-------------|
| `chatWithItineraryAssistant()` | Chat with Pebbles about itinerary |
| `generateActivityAlternatives()` | Generate 3 alternatives for an activity |

### Helper Functions

| Function | Description |
|----------|-------------|
| `sanitizeInput()` | Prevent prompt injection |
| `mapQuizToPersonality()` | Convert quiz to personality description |
| `buildCulturalInsightsText()` | Build cultural context string |
| `buildPreferencesContext()` | Build preferences for AI context |
| `validateItineraryStructure()` | Validate AI-generated itinerary |

---

## Authentication Flow

### Registration
```
1. User submits form → POST /api/auth/register
2. Validate with Zod schema
3. Check if email exists
4. Hash password with bcrypt
5. Create user in database
6. Generate email verification token
7. Send verification email
8. Create session, login user
9. Return public user data
```

### Login
```
1. User submits credentials → POST /api/auth/login
2. Passport LocalStrategy authenticates
3. Check if account is locked
4. Verify password with bcrypt
5. Reset failed attempts on success
6. Regenerate session (security)
7. Return public user data
```

### Security Features
- Password hashing (bcrypt, 10 rounds)
- Session-based auth (connect-pg-simple)
- CSRF protection (X-Requested-With header)
- Rate limiting (express-rate-limit)
- Account lockout (5 attempts, 15 min)
- Email verification
- Password reset with expiring tokens
- Helmet security headers

---

## Client-Side State Management

### React Query
- Server state management
- Caching and invalidation
- Optimistic updates

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth()` | Authentication state |
| `useItinerary()` | Itinerary CRUD operations |
| `useToast()` | Toast notifications |

### Session Storage Keys
- `trippenguin_itinerary` - Current itinerary data
- `quizData` - Quiz responses
- `gettingStartedData` - Getting started flow data
- `selectedItinerary` - Selected recommendation
- `tripSource` - Origin of trip (quiz vs manual)
- `redirectAfterAuth` - Post-auth redirect URL

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 5000)

# Build
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes

# Type checking
npm run check            # Run TypeScript check

# Utility scripts
npm run delete-user <email>  # Delete a user by email
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=            # Neon PostgreSQL connection string
SESSION_SECRET=          # Session encryption secret
OPENAI_API_KEY=          # OpenAI API key

# Optional
NODE_ENV=                # "development" | "production"
PORT=                    # Server port (default: 5000)
BASE_URL=                # Base URL for emails
```

---

## Design Guidelines

- **Typography**: Inter (UI) + Lora (inspirational copy)
- **Colors**: Light/dark mode support via Tailwind
- **Inspiration**: Airbnb (warmth), Notion (clarity), Mint (precision)
- **Component Library**: shadcn/ui (New York style)

---

## Recent Updates (Nov 2025)

1. **Pebbles AI Assistant** - Conversational itinerary refinement
2. **Day Planning** - AI-powered activity scheduling
3. **Activity Alternatives** - Generate alternatives for any activity
4. **Transport Segments** - Track travel between destinations
5. **Draft Trip Support** - Save & resume itineraries
6. **Family-Aware Planning** - Kids' ages, nap times, accessibility
7. **NavBar Component** - Consistent navigation
8. **Itinerary Page** - Full itinerary editor
9. **Meet Pebbles Page** - AI assistant introduction

---

## File Ownership

| Area | Primary Files |
|------|---------------|
| AI Logic | `server/ai-destination.ts`, `server/ai-booking.ts`, `server/ai-budget.ts` |
| Auth | `server/auth.ts`, `client/src/hooks/useAuth.ts` |
| Database | `server/storage.ts`, `server/db.ts`, `shared/schema.ts` |
| Routing | `server/routes.ts`, `client/src/App.tsx` |
| Itinerary | `client/src/hooks/useItinerary.ts`, `client/src/pages/itinerary.tsx` |
| Quiz Flow | `client/src/pages/getting-started.tsx`, `client/src/pages/quiz-*.tsx` |
| Trip Planning | `client/src/pages/trip-planner.tsx`, `client/src/pages/step*.tsx` |

---

*Last Updated: November 2025*

