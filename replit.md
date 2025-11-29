# TripPenguin Trip Planning Application

## Overview

TripPenguin is a trip planning application designed to empower users to plan international trips without accumulating debt. It guides them through a structured three-step process: Dream, Save & Book, and Go. The application focuses on robust budget planning, savings tracking, and organized booking management, leveraging AI for multi-city itinerary generation, personalized budget guidance, and booking recommendations. The core ambition is to make international travel accessible by providing comprehensive financial planning and discovery tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **Routing**: wouter.
- **UI/UX**: shadcn/ui (New York style), Radix UI primitives, Tailwind CSS. Design inspired by Airbnb, Notion, and Mint; uses Inter and Lora fonts; supports light/dark mode.
- **State Management**: React Query for server state, React hooks for local state.
- **Form Handling**: React Hook Form with Zod validation.
- **Design Philosophy**: Warmth, clarity, precision.
- **Branding**: Pebbles the Penguin mascot (`PenguinLogo.tsx`) for all branding, with a dedicated backstory page (`/meet-pebbles`).

### Backend
- **Runtime**: Node.js with Express.
- **API Design**: RESTful API.
- **Validation**: Zod schemas.

### Data Storage
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM with neon-serverless dialect.
- **Schema**: `trips`, `destinations`, `budgetCategories`, `bookings`, `trip_memories` linked by `userId`.
- **Migrations**: Drizzle Kit.

### Core Features
- **User Authentication**: Session-based, bcrypt hashing, PostgreSQL session storage, CSRF protection.
- **AI-Powered Planning**:
    - **Onboarding Quiz**: "Find Your Adventure Type" quiz (12 questions) personalizes trip recommendations.
    - **Itinerary Generation**: GPT-4o-mini generates 3 multi-city itineraries (Staycation, Domestic, International) with titles, activities, airport codes, and cost estimates, enforcing geography-aware routing. Includes remix functionality.
    - **Interactive Refinement**: Users can adjust duration, delete cities, and add extensions with AI regeneration.
    - **Budget Guidance**: GPT-4o-mini provides personalized recommendations, price ranges, and money-saving tips per budget category.
    - **Booking Recommendations**: Live OpenAI-powered booking recommendations (GPT-4o-mini) with pricing, pros/cons, and tips.
    - **Monthly Savings**: AI-recommended monthly savings with adaptive payoff timeframes (6-15 months).
- **Trip Management**: Full CRUD operations for trips, destinations, budget categories, and bookings.
- **Save & Book Workflow**: Multi-step process (Savings Connection, Trip Overview, Budget Details) with sub-steps for:
    - **Savings Connection**: Plaid stub/manual entry.
    - **Budgeting**: Sequential savings allocation across categories.
    - **Booking Status Tracking**: Tracks `booked`, `bookedDate`, `optionId` for flights, accommodations (per city), and major transportation (per segment).
    - **Financial Summary**: Tracks total estimated cost, current savings, AI monthly savings, and earliest travel/booking dates.
    - **Flight Costs**: Dedicated section with estimated costs, savings allocation, points integration, and "Book Flights" button (disabled until funded).
    - **Accommodations**: Individual city booking, affordability checks, booking tips, and status badges.
    - **Major Transportation**: Focus on car rentals, trains, buses, regional flights, and ferries (excluding local transport).
    - **Fun & Activities**: Daily activity suggestions by city and date, booking urgency alerts, individual booking, and add-on options.
    - **Dinner Reservations**: Simplified section with 1-2 restaurant recommendations per city, direct booking links, and dining tips.
    - **Trip Insurance**: Recommendations for comprehensive and medical-only coverage, comparison links, and tips.
    - **Trip Preparation Purchases**: Smart shopping guidance, categorized items (Essential, Recommended, Optional), "Own/Need" toggle, and cost aggregation.
- **Go Stage (Post-Booking)**: Countdown timer, quick links (itinerary, PDF, share), "While You Wait" content (books, movies, kids activities), trip tips, and photo sharing gallery.
- **Itinerary Management**: `useItinerary` hook for shared state, dedicated `/itinerary` page, state persistence in sessionStorage.

## External Dependencies

### AI/ML Services
- OpenAI API (gpt-4o-mini)

### Database & ORM
- Neon serverless PostgreSQL
- Drizzle ORM
- Drizzle Kit
- connect-pg-simple (for session storage)

### UI Component Libraries
- Radix UI
- shadcn/ui
- embla-carousel-react
- cmdk
- lucide-react

### Styling
- Tailwind CSS
- class-variance-authority
- Google Fonts (Inter, Lora)

### Utilities
- date-fns
- nanoid
- clsx
- tailwind-merge