# TripPenguin Trip Planning Application

## Overview
TripPenguin is a trip planning application designed to facilitate debt-free overseas travel. It guides users through a structured planning process (Dream, Save & Book, Go) with a focus on budget management, savings tracking, and organized booking. The application provides AI-powered multi-city itinerary generation, personalized budget guidance, and booking recommendations to make international travel accessible and manageable.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript and Vite.
- **Routing**: wouter for client-side navigation.
- **UI/UX**: shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS. Design principles are inspired by Airbnb, Notion, and Mint, emphasizing warmth, clarity, and precision. Supports light/dark mode and uses Inter for UI and Lora for inspirational text.
- **State Management**: React Query for server state, React hooks for local component state.
- **Form Handling**: React Hook Form with Zod validation.
- **Workflow**: Multi-step wizard pattern for trip planning (Dream, Save & Book, Go, Summary).
- **Branding**: Features "Pebbles the Penguin" mascot using a custom `PenguinLogo` component for consistent branding across the application.

### Backend
- **Runtime**: Node.js with Express.
- **API Design**: RESTful API supporting CRUD operations.
- **Validation**: Zod schemas for runtime type checking and validation.

### Data Storage
- **Database**: PostgreSQL via Neon serverless.
- **ORM**: Drizzle ORM with neon-serverless dialect for type-safe queries.
- **Schema**: Key entities include `trips`, `destinations`, `budgetCategories`, and `bookings`, linked by `userId`.
- **Migrations**: Drizzle Kit for schema management.

### Core Features
- **User Authentication**: Session-based authentication with bcrypt hashing, PostgreSQL session storage, CSRF protection, and session fixation prevention. All trip data access requires authentication and ownership verification.
- **AI-Powered Trip Planning**:
    - **Quiz-based Personalization**: A 12-question quiz determines trip type (Staycation, Domestic, International) and personal preferences.
    - **Multi-City Itinerary Generation**: GPT-4o-mini generates 3 complete, geography-aware multi-city itineraries with activity suggestions, cost estimates, and breakdowns. Includes specific guardrails for Domestic US and Staycation trips.
    - **Itinerary Refinement**: Users can adjust trip duration, delete cities, and add "Add-On Extensions" with AI regeneration.
    - **AI Booking & Budget Guidance**: GPT-4o-mini provides personalized booking recommendations, per-category budget guidance, and monthly savings recommendations.
    - **Itinerary-Wide AI Assistant**: Auto-generates daily activities based on quiz responses, adapts to family considerations (e.g., kids' ages), balances rest times, and suggests accessible activities. Features a conversational interface for itinerary Q&A and refinements, asking clarifying questions when necessary.
    - **Trip Personality Controls**: Interactive sliders (e.g., Pace: Slow, Moderate, Fast) allow users to customize AI-generated itineraries, triggering debounced AI regeneration.
- **Trip Management**: Full CRUD operations for all trip data, including destinations, budget categories, and bookings. Users can view, edit, and delete trips.
- **Save & Book Workflow**: A three-sub-step process for managing finances:
    1. **Savings Connection**: Stub for Plaid integration or manual savings entry.
    2. **Trip Overview**: Summary of trip details and current savings.
    3. **Budget Details**: Sequential savings allocation across detailed budget categories (Flights, Accommodation, Transportation, Fun & Activities, Food, Trip Preparation).
- **Budgeting Tools**: Comprehensive sections for tracking and managing costs across various categories with estimated expenses, savings allocation, savings gaps, and calculated earliest booking dates.
- **Trip Preparation**: Smart suggestions for gear and essentials based on destination, season, and travel style, with cost aggregation for "Need to Buy" items.
- **Inspiration & Learning**: Region-based book and movie recommendations categorized by age-appropriateness, providing pre-trip inspiration and cultural context.

## External Dependencies

### AI/ML Services
- OpenAI API (gpt-4o-mini).
- Zod for AI request sanitization and validation.

### Database & ORM
- Neon serverless PostgreSQL.
- Drizzle ORM and Drizzle Kit.
- connect-pg-simple for session storage.

### UI Component Libraries
- Radix UI primitives.
- shadcn/ui.
- embla-carousel-react.
- cmdk.
- lucide-react.

### Styling
- Tailwind CSS.
- class-variance-authority.
- Google Fonts (Inter, Lora).

### Utilities
- date-fns for date manipulation.
- nanoid for ID generation.
- clsx and tailwind-merge for className handling.