# TripPirate Trip Planning Application

## Overview

TripPirate is a trip planning application designed to help users plan overseas trips without going into debt. It guides users through a three-step process: Dream, Save & Book, and Go, focusing on budget planning, savings tracking, and organized booking management. The application aims to transform trip planning into an exciting and manageable experience by providing AI-powered multi-city itinerary generation, budget guidance, and personalized booking recommendations. The project's ambition is to make international travel accessible by providing robust tools for financial planning and discovery.

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
- **Streamlined Quiz-to-Plan Flow**: Users who finalize refined itineraries skip the Dream step and go directly to the Plan step with data preserved, auto-creating trip and destinations in the database.

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

**Accommodation Costs Section**:
- Dedicated section for accommodation tracking.
- **Simplified Itinerary List**: Shows destinations with nights.
- **Mock Accommodation Options**: 3 generated options per destination (hotel, Airbnb, additional) with details.
- **Selection Mechanism**: Users select one option per location; estimated costs update accordingly.
- **Savings Allocation**: Savings flow to accommodations after flights are covered.
- **Accommodation Savings Gap**: Difference between final cost and allocated savings.
- **Book Stays Button**: Disabled until savings gap is zero or earliest booking date is reached.

**Transportation Costs Section**:
- Dedicated section for transportation tracking.
- **Transport Segments**: Generated based on itinerary (airport, within-city, city-to-city).
- **Segment Types**: Options for shuttle, rideshare, metro, train, regional flights.
- **Selection Mechanism**: Users select one option per segment; estimated costs update accordingly.
- **Savings Allocation**: Savings flow to transportation after flights and accommodations are covered.
- **Transport Savings Gap**: Difference between final cost and allocated savings.
- **Book Transportation Button**: Disabled until savings gap is zero or earliest booking date is reached.

**Fun & Activities Section**:
- Dedicated section for activities tracking.
- **Activity Pace**: Based on quiz results (relaxed, balanced, packed).
- **Activities by City and Day**: Daily activity suggestions categorized (Must See, Hidden Gem, Food & Drink, Outdoor, Cultural, Relaxation).
- **Selection Mechanism**: Click to toggle activity selection; costs update.
- **Savings Allocation**: Savings flow to activities after flights, stays, and transport are covered.
- **Activity Savings Gap**: Difference between final cost and allocated savings.
- **Book Activities Button**: Disabled until savings gap is zero or earliest booking date is reached.

**Food Costs Section**:
- Dedicated section for dining budget tracking.
- **Two Budget Modes**: "Pick Restaurants" (select specific venues) or "Daily Budget" (slider $25-$200/day/person).
- **Restaurant Options**: Mock restaurants organized by city and day with cuisine type, price range, description, and reservation recommendations.
- **Food Experiences**: Food tours, cooking classes, tastings, market tours, and street food adventures.
- **Selection Mechanism**: Click to toggle food selection; costs update.
- **Savings Allocation**: Savings flow to food after flights, stays, transport, and activities are covered.
- **Food Savings Gap**: Difference between final cost and allocated savings.
- **Plan Dining Button**: Disabled until savings gap is zero or earliest planning date is reached.

**Trip Preparation Section**:
- Dedicated section for gear, supplies, and travel essentials.
- **Smart Suggestions**: Items generated based on destinations (international vs. domestic), travel season (warm vs. cold weather gear), trip duration (carry-on vs. checked luggage), and travel style from quiz (minimalist vs. heavy packer).
- **Item Categories**: Luggage, Clothing & Apparel, Electronics (adapters, converters, power banks), Toiletries, Travel Gear (packing cubes, money belt, locks), Documents & Insurance.
- **Priority Levels**: Essential, Recommended, Optional - each with color-coded badges.
- **Own/Need Toggle**: Each item has "Already Own" and "Need to Buy" buttons to track what needs purchasing.
- **Cost Aggregation**: Total estimated prep cost calculated from items marked "Need to Buy", broken down by priority level.
- **Mock Product Links**: Each item includes an example product URL.
- **Warning Banner**: Prominent reminder to wait until savings are sufficient before purchasing gear to avoid debt.

**Books & Movies Section**:
- Dedicated section for pre-trip inspiration and learning.
- **Region-Based Recommendations**: Books and movies generated based on destination countries/regions (Europe, Asia, Latin America, Africa, Oceania, North America).
- **Media Types**: Books, Movies, Documentaries, TV Series, and Travel Guides.
- **Age-Appropriate Grouping**: Recommendations organized by audience (For Kids, For Teens, For Adults, All Ages).
- **Relevance Descriptions**: Each item explains why it's relevant to the trip destinations.
- **Mock Links**: Buy/Watch links for books (Amazon-style) and films (streaming-style).
- **Summary Box**: Encourages using local libraries and existing streaming services to save money.

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