# TripPenguin Trip Planning Application

## Overview

TripPenguin is a trip planning application designed to help users plan overseas trips without going into debt. It guides users through a three-step process: Dream, Save & Book, and Go, focusing on budget planning, savings tracking, and organized booking management. The application aims to transform trip planning into an exciting and manageable experience by providing AI-powered multi-city itinerary generation, budget guidance, and personalized booking recommendations. The project's ambition is to make international travel accessible by providing robust tools for financial planning and discovery.

## User Preferences

Preferred communication style: Simple, everyday language.

## Branding

**Mascot**: Pebbles the Penguin - a cute, adventurous penguin mascot who helps families plan debt-free adventures.
- Custom penguin logo component: `client/src/components/PenguinLogo.tsx`
- Logo image: `@assets/generated_images/cute_penguin_travel_mascot_logo.png`
- Backstory page: `/meet-pebbles` - charming origin story page featuring Pebbles' Antarctic origins, family values, and promise to help families travel debt-free
- Design choice: Use PenguinLogo for all branding (headers, footers, loading states); keep Plane icon only for flight-specific features

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite.
**Routing**: wouter for client-side routing.
**UI Component Library**: shadcn/ui (New York style) with Radix UI primitives, styled with Tailwind CSS.
**Design Philosophy**: Inspired by Airbnb, Notion, and Mint, focusing on warmth, clarity, and precision. Uses Inter for UI and Lora for inspirational copy, with light/dark mode support.
**State Management**: React Query for server state, React hooks for local component state.
**Form Handling**: React Hook Form with Zod validation.
**Multi-Step Flow**: Wizard pattern for trip planning (Dream, Save & Book, Go, Summary).

### Backend Architecture

**Runtime**: Node.js with Express.
**API Design**: RESTful API with CRUD operations.
**Validation**: Zod schemas for runtime type checking and validation.

### Data Storage

**Database**: PostgreSQL via Neon serverless.
**ORM**: Drizzle ORM with neon-serverless dialect for type-safe queries.
**Schema Structure**: Core entities include `trips`, `destinations`, `budgetCategories`, and `bookings`, linked by `userId`.
**Migrations**: Drizzle Kit for schema migrations.

### Core Features and Technical Implementations

**User Authentication**: Complete session-based authentication with bcrypt hashing, PostgreSQL session storage, CSRF protection, and session fixation prevention. All trip routes require authentication and ownership verification.

**Onboarding Quiz & AI Itinerary Generation**:
- **"Find Your Adventure Type" Quiz**: A 12-question quiz personalizing trip recommendations.
- **Three Trip Types**: Staycation (local, driving distance), Domestic (multi-city US), International (multi-city global).
- **Multi-City Itinerary Recommendations**: Uses GPT-4o-mini to generate 3 complete multi-city itineraries, including titles, activity suggestions, airport codes, total cost estimates, and a cost breakdown. Geography-aware for efficient routing.
- **Domestic US Trip Guardrails**: When tripType is "domestic", the AI prompt enforces US-only destinations with strict guardrails - all cities must have countryName="United States", uses US airport codes, focuses on selected US region (New England, Mid-Atlantic, Southeast, Midwest, Mountains West, Southwest, Pacific Coast), and provides domestic-appropriate cost estimates.
- **Staycation Recommendations**: Strict driving distance enforcement and quiz-driven personalization for single destination itineraries with detailed plans.
- **Remix Feature**: Allows regeneration of itineraries from the same quiz responses.
- **Interactive Refinement Page**: Users can adjust trip duration, delete cities, and add "Add-On Extensions" with AI regeneration. State is managed client-side for pre-population in the trip planner.
- **Streamlined Quiz-to-Save & Book Flow**: Users who finalize refined itineraries skip the Dream step and go directly to the Save & Book step with data preserved, auto-creating trip and destinations in the database.

**Trip Management**:
- **Full Database Persistence**: All trip data (destinations, budget categories, bookings) persists to PostgreSQL with full CRUD.
- **Trip List Management**: Displays all user trips with view, edit, and delete functionality.

**AI Integrations**:
- **AI Booking Integration**: Live OpenAI-powered booking recommendations (GPT-4o-mini) in Step 3, providing personalized options with pricing, pros/cons, and tips.
- **Per-Category AI Budget Guidance**: In Step 2, GPT-4o-mini provides personalized recommendations, estimated price ranges, and money-saving tips for each budget category.
- **AI-Recommended Monthly Savings**: Calculates recommended monthly savings based on trip cost with adaptive payoff timeframes (6-15 months).

**Itinerary Management**:
- **Shared Itinerary State**: `useItinerary` hook provides reactive shared state across components via sessionStorage.
- **Dedicated Itinerary Page**: `/itinerary` route for viewing/editing detailed trip itinerary with city management and date calculations.
- **State Persistence**: Trip planner step and data persisted to sessionStorage for seamless navigation.

**Save & Book Sub-Step Flow**:
The Save & Book phase (Step 2) now has three sub-steps for a streamlined user experience:
1. **Savings Connection (subStep="savings")**: Users connect their savings account via Plaid stub or enter savings manually. Features include bank connection simulation and manual entry with alerts about requirements.
2. **Trip Overview (subStep="overview")**: Displays trip summary including title, destinations, dates, traveler count, and current savings. Provides quick navigation to detailed itinerary.
3. **Budget Details (subStep="budget")**: Full budget management with sequential savings allocation across all categories.

Sub-step state is hydrated from existing trip data, so returning users skip completed steps. Savings linkage state (savingsAccountLinked, savingsAmountManual) is persisted to the database and propagated between Step2Plan and TripPlanner components.

**Trip Financing Summary**:
- **Total Estimated Trip Cost**: Auto-updates based on budget categories.
- **Current Savings**: Manual entry or mocked "Connect Savings Account".
- **AI Monthly Savings Recommendation**: Calculated based on trip cost for debt-free travel.
- **Earliest Travel Date**: Calculated based on savings progress.

**Flight Costs Section**:
- Dedicated section for flight cost tracking.
- **Estimated Flight Cost**: Placeholder estimation based on destinations.
- **Savings Allocation**: Current savings applied to flights first.
- **Flight Savings Gap**: Difference between estimated cost and allocated savings.
- **Earliest Flight Booking Date**: Calculated based on savings progress.
- **Book Flights Button**: Disabled until flight savings gap is zero or earliest booking date is reached.
- **Flight Points Subsection**: Toggle to use credit card points, manual input for points, and simulated card account connection for points balance. Points conversion reduces flight cost. Advisory on responsible credit card usage and mock credit card offers.

**Booking Status Tracking System**:
- All bookings tracked in BudgetData state with `booked`, `bookedDate`, and `optionId` fields.
- Flights: Single booking with status badge, "Mark Flights as Booked" button when funded.
- Accommodations: Individual booking per city - each stay booked separately when savings cover its cost.
- Transportation: Individual booking per segment - each major transport option booked separately.
- Visual feedback: Green badges and cards for booked items, navigation prompts between sections.
- Progressive flow: Flights → Accommodations (per city) → Transportation → Continue to next phase.

**Save and Book Accommodations Section**:
- Renamed from "Accommodation Costs Section" with purple border accent.
- **Savings Reminder Banner**: Prominent reminder to only book when savings cover the cost.
- **Exact Date Display**: Shows check-in and check-out dates from itinerary for each city.
- **Individual City Booking**: Each city's accommodation booked separately via "Book This Stay" button.
- **Booking Affordability Check**: Button disabled with "Need $X more" when savings insufficient.
- **Booking Status Badges**: Green "Booked" badge with booked date for completed bookings.
- **Booking Tips**: 4 practical tips for finding refundable options, reading reviews, location, and amenities.
- **Navigation Prompt**: "Continue to Book Major Transportation" appears after all accommodations booked.

**Save and Book Major Transportation Section**:
- Renamed from "Transportation Costs Section" with blue border accent.
- **Major Transport Only**: Excludes taxis, rideshares, and metro - focuses on car rentals, trains, buses, regional flights, and ferries.
- **Transport Types Available**: Rental car, train, bus, shuttle/flight, ferry.
- **Transport Icons**: Visual icons for each transport type (Train, Bus, Car, Ship, Plane).
- **Savings Allocation**: Savings flow to transportation after flights and accommodations are covered.
- **Segment Types**: Airport arrival/departure, within-city, and city-to-city transfers.

**Save and Book Fun & Activities Section**:
- Dedicated section for activities tracking with actual trip dates displayed.
- **Activity Pace**: Based on quiz results (relaxed, balanced, packed).
- **Activities by City and Day**: Daily activity suggestions categorized (Must See, Hidden Gem, Food & Drink, Outdoor, Cultural, Relaxation) with actual dates (e.g., "Monday, Dec 15, 2025").
- **Booking Urgency Alerts**: Warning badges for activities that need advance booking (e.g., "Book 2-4 weeks ahead").
- **Individual Activity Booking**: Each activity can be individually marked as booked with booking date tracking.
- **Add-on Activities**: Button per day to browse additional activity options.
- **Booking Tips**: 4 practical tips for booking popular attractions, flexible policies, local guides, and timing.
- **Section Navigation**: After transportation is booked, users see quick-jump buttons to Activities, Dinner Reservations, Trip Insurance, and Trip Preparation sections.
- **Flexible Booking Order**: Activities, Dining, Insurance, and Trip Prep can be booked in any order once transportation is funded.

**Dinner Reservations Section**:
- Simplified dining section focused on special dinner experiences only.
- **1-2 Restaurant Recommendations**: Top restaurant picks per city with cuisine type, price range, and estimated cost.
- **Direct Booking Links**: "Book / View Menu" button opens restaurant website or reservation platform.
- **Dining Tips**: Practical tips for advance reservations, prix fixe menus, and concierge recommendations.
- **No Complex Selection**: Removed daily budget slider and detailed food tracking - most meals don't need reservations.

**Trip Insurance Section**:
- New dedicated section for travel insurance recommendations.
- **Two Coverage Options**: Comprehensive coverage (5-8% of trip cost) and Medical-only coverage (2-4% of trip cost).
- **Coverage Details**: Trip cancellation, emergency medical, lost baggage, and 24/7 assistance features listed.
- **Comparison Links**: Direct links to Squaremouth and World Nomads for comparing plans.
- **Insurance Tips**: Credit card coverage checks, pre-existing condition windows, and price comparison advice.

**Trip Preparation Purchases Section**:
- Renamed from "Trip Preparation" with updated smart shopping guidance.
- **Smart Shopping Tips Banner**: Emphasizes buying only what's needed, checking thrift stores/Facebook Marketplace/Buy Nothing groups, borrowing from friends/family, and waiting until savings are ready.
- **Item Categories**: Luggage, Clothing & Apparel, Electronics (adapters, converters, power banks), Toiletries, Travel Gear (packing cubes, money belt, locks), Documents & Insurance.
- **Priority Levels**: Essential, Recommended, Optional - each with color-coded badges.
- **Own/Need Toggle**: Each item has "Already Own" and "Need to Buy" buttons to track what needs purchasing.
- **Cost Aggregation**: Total estimated prep cost calculated from items marked "Need to Buy", broken down by priority level.
- **Mock Product Links**: Each item includes an example product URL.

**Books & Movies** (Moved to Go Page):
- Books & Movies recommendations will appear on the Go page for pre-trip inspiration.
- Removed from Save & Book phase to streamline the booking flow.

## External Dependencies

**AI/ML Services**:
- OpenAI API (gpt-4o-mini).
- Zod for AI request sanitization and input validation.

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