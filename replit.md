# Guide2Go Trip Planning Application

## Overview

Guide2Go is a trip planning application designed to help users plan overseas trips without going into debt. The application guides users through a three-step process: Dream (defining trip basics), Plan (budgeting and saving), and Do (booking). The app emphasizes budget planning, savings tracking, and organized booking management to transform trip planning from a stressful chore into an exciting journey.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: wouter for client-side routing with a simple declarative approach. Routes include a landing page, trip planner, and 404 handler.

**UI Component Library**: shadcn/ui (New York style) with Radix UI primitives for accessible, composable components. The design system uses Tailwind CSS with custom configuration for theming and responsive design.

**Design Philosophy**: Reference-based approach inspired by Airbnb's warmth, Notion's organizational clarity, and Mint's budget tracking precision. Typography uses Inter for UI elements and Lora for inspirational copy. The color system supports light/dark modes with CSS custom properties.

**State Management**: React Query (@tanstack/react-query) for server state management with configured query client that handles API requests, caching, and error handling. Local component state managed with React hooks.

**Form Handling**: React Hook Form with Zod validation through @hookform/resolvers for type-safe form validation.

**Multi-Step Flow**: Trip planner implements a wizard pattern with three sequential steps (Dream, Plan, Do) plus a summary view. State is accumulated in the parent component and passed down to child step components.

### Backend Architecture

**Runtime**: Node.js with Express framework for HTTP server and API routes.

**API Design**: RESTful API with route handlers for CRUD operations on trips, destinations, budget categories, and bookings. Endpoints follow conventional patterns (GET, POST, PATCH, DELETE) with proper error handling and validation.

**Validation**: Zod schemas defined in shared directory for runtime type checking and validation of incoming requests. Schemas are derived from Drizzle ORM table definitions using drizzle-zod.

**Storage Layer**: Abstracted through an IStorage interface with DatabaseStorage implementation. This enables potential future replacement of the storage backend without changing business logic.

**Development Server**: Vite middleware mode integration for hot module replacement during development. Production builds serve static assets from Express.

### Data Storage

**Database**: PostgreSQL via Neon serverless (indicated by @neondatabase/serverless package and WebSocket configuration).

**ORM**: Drizzle ORM with neon-serverless dialect for type-safe database queries and schema management.

**Schema Structure**:
- **trips**: Core entity storing traveler information, trip duration, season, and savings data
- **destinations**: Multiple cities per trip with ordering, nights allocation, and images
- **budgetCategories**: Six categories (flights, housing, food, transportation, fun, preparation) with estimated/actual costs and notes
- **bookings**: Individual booking items with status tracking (not_started, in_progress, booked)

**Migrations**: Drizzle Kit configured for schema migrations with PostgreSQL dialect. Schema definitions live in shared directory for use across client and server.

**ID Generation**: Uses PostgreSQL's `gen_random_uuid()` for primary keys, providing globally unique identifiers without application-level coordination.

### External Dependencies

**UI Component Libraries**:
- Radix UI primitives for accessible headless components (accordion, dialog, dropdown, select, tabs, toast, etc.)
- embla-carousel-react for image carousels
- cmdk for command palette interfaces
- lucide-react for iconography

**Styling**:
- Tailwind CSS with PostCSS for utility-first styling
- class-variance-authority for component variant management
- Google Fonts (Inter, Lora) loaded via CDN

**Database & ORM**:
- Neon serverless PostgreSQL
- Drizzle ORM and Drizzle Kit for migrations
- connect-pg-simple for potential session storage

**Development Tools**:
- tsx for TypeScript execution in development
- esbuild for production server bundling
- Vite for frontend bundling and dev server
- Replit-specific plugins for development experience

**Utilities**:
- date-fns for date manipulation
- nanoid for ID generation
- clsx and tailwind-merge for className handling

**Type System**: Shared TypeScript types between client and server through path aliases (@shared) ensuring type safety across the full stack.