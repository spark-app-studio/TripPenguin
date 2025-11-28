# TripPirate Trip Planning Application

## Overview

TripPirate is a trip planning application designed to help users plan overseas trips without going into debt. It guides users through a three-step process: Dream, Plan, and Do, focusing on budget planning, savings tracking, and organized booking management. The application aims to transform trip planning into an exciting and manageable experience. Key capabilities include AI-powered multi-city itinerary generation, budget guidance, and personalized booking recommendations. The project's ambition is to make international travel accessible by providing robust tools for financial planning and discovery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite.
**Routing**: wouter for client-side routing.
**UI Component Library**: shadcn/ui (New York style) with Radix UI primitives, styled with Tailwind CSS.
**Design Philosophy**: Inspired by Airbnb, Notion, and Mint, focusing on warmth, clarity, and precision. Uses Inter for UI and Lora for inspirational copy, with light/dark mode support.
**State Management**: React Query for server state, React hooks for local component state.
**Form Handling**: React Hook Form with Zod validation.
**Multi-Step Flow**: Wizard pattern for trip planning (Dream, Plan, Do, Summary).

### Backend Architecture

**Runtime**: Node.js with Express.
**API Design**: RESTful API with CRUD operations, following conventional patterns.
**Validation**: Zod schemas for runtime type checking and validation, derived from Drizzle ORM.
**Storage Layer**: Abstracted through an IStorage interface.

### Data Storage

**Database**: PostgreSQL via Neon serverless.
**ORM**: Drizzle ORM with neon-serverless dialect for type-safe queries.
**Schema Structure**: Core entities include `trips`, `destinations`, `budgetCategories`, and `bookings`, linked by `userId`.
**Migrations**: Drizzle Kit for schema migrations.
**ID Generation**: `gen_random_uuid()` for primary keys.

### Core Features and Technical Implementations

**User Authentication**: Complete session-based authentication with bcrypt hashing, PostgreSQL session storage, CSRF protection, and session fixation prevention. All trip routes require authentication and ownership verification. User profiles include location data (city, state, ZIP code) for AI recommendations.

**Onboarding Quiz & AI Itinerary Generation**:
- **"Find Your Adventure Type" Quiz**: A 12-question quiz covering personality, cultural interests, dream moments, and trip planning details.
- **Three Trip Types**: The quiz supports three distinct trip types with different recommendation logic:
  * **Staycation**: Local getaways within 2-3 hours driving distance. Uses dedicated `/api/ai/staycation-recommendations` endpoint. AI enforces strict driving distance constraints from user's specified city/state, no flights, single destination focus.
  * **Domestic (US Trips)**: Multi-city trips within the United States.
  * **International**: Multi-city international itineraries (2-4 cities each).
- **Multi-City Itinerary Recommendations**: Uses GPT-4o-mini to generate 3 complete multi-city itineraries via `POST /api/ai/destination-recommendations`. Itineraries include creative titles, activity suggestions, airport codes, total cost estimates, and a cost breakdown across six categories. Geography-aware for efficient routing and open-jaw tickets.
- **Staycation Recommendations** (Nov 28, 2025): Uses GPT-4o-mini via `POST /api/ai/staycation-recommendations` with quiz-driven personalization:
  * Strict driving distance enforcement (max 2-3 hours from user's departure location)
  * Quiz answers drive recommendations: goals (outdoor-adventure, relax-unwind, explore-new, quality-time, learn-discover, food-dining, entertainment, photography), family composition, kid activities, accessibility needs
  * Single destination per recommendation with detailed itinerary, packing list, and cost breakdown
  * Destinations must be real, verifiable places (state parks, beaches, museums, towns)
- **Remix Feature**: Allows regeneration of itineraries from the same quiz responses.
- **Interactive Refinement Page**: Users can adjust trip duration (1-30 nights) with AI regeneration via `POST /api/ai/adjust-itinerary-duration`. Supports city deletion and AI-generated "Add-On Extensions" via `POST /api/ai/itinerary-addons`. State is managed client-side, with final refined itineraries saved to `sessionStorage` for pre-population in the trip planner.
- **Streamlined Quiz-to-Plan Flow** (Nov 12, 2025): Users who finalize refined itineraries skip the Dream step entirely and go directly to the Plan step (Step 2) with all itinerary data preserved:
  * Quiz finalization sets `tripSource="quiz"` flag in sessionStorage
  * Trip planner detects quiz origin, initializes at "plan" step instead of "dream"
  * Auto-creates trip and destinations in database before rendering Plan step
  * Pre-populated budget data (from AI cost breakdown) preserved via `step2Submitted` flag
  * Hydration guard prevents overwriting quiz budgets until user saves their first edit
  * Back navigation from Plan step returns to trips list for quiz flows (no Dream step to return to)

**Trip Management**:
- **Full Database Persistence**: All trip data (destinations, budget categories, bookings) persists to PostgreSQL with full CRUD.
- **Trip List Management**: `/trips` page displays all user trips with view, edit, and delete functionality.

**AI Integrations**:
- **AI Booking Integration**: Live OpenAI-powered booking recommendations (GPT-4o-mini) in Step 3. Provides 3 personalized recommendations per booking item, including pricing, providers, pros/cons, and booking tips via `POST /api/ai/booking-recommendations`.
- **Per-Category AI Budget Guidance**: In Step 2, each budget category card has an "AI Guide" button. GPT-4o-mini provides personalized recommendations, estimated price ranges, detailed explanations, and money-saving tips specific to that category.

## External Dependencies

**AI/ML Services**:
- OpenAI API (gpt-4o-mini) for itinerary generation, booking recommendations, and budget guidance.
- Zod for AI request sanitization and input validation to prevent prompt injection.

**Database & ORM**:
- Neon serverless PostgreSQL.
- Drizzle ORM and Drizzle Kit.
- connect-pg-simple for session storage.

**UI Component Libraries**:
- Radix UI primitives.
- shadcn/ui.
- embla-carousel-react.
- cmdk.
- lucide-react.

**Styling**:
- Tailwind CSS.
- class-variance-authority.
- Google Fonts (Inter, Lora).

**Utilities**:
- date-fns for date manipulation.
- nanoid for ID generation.
- clsx and tailwind-merge for className handling.

**Development Tools**:
- tsx, esbuild, Vite.