# 🐧 TripPenguin

> **Plan amazing trips without going into debt**

TripPenguin is an AI-powered trip planning application designed to help families discover, plan, and book memorable vacations that fit their budget. Meet **Pebbles**, your friendly AI travel assistant who guides you through every step of your journey.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node](https://img.shields.io/badge/Node-20-green)

---

## ✨ Features

### 🎯 Personalized Trip Discovery
- **12-question personality quiz** to understand your travel style
- **Three trip types**: International adventures, domestic getaways, or local staycations
- **AI-generated itineraries**: Get 3 personalized multi-city recommendations tailored to your preferences

### 🤖 Meet Pebbles - Your AI Travel Assistant
Pebbles is your conversational travel companion who:
- 💬 Chats about your itinerary and answers travel questions
- ✨ Suggests activity changes and improvements
- 👨‍👩‍👧‍👦 Provides family-friendly recommendations
- 🎨 Helps refine your trip with interactive conversations

### 📅 Smart Day Planning
- **Activity suggestions**: Get 5 curated activity ideas for any day
- **Interactive day planner**: Build your perfect day with AI guidance
- **Full itinerary generation**: Complete day-by-day plans with activities, meals, and timing
- **Activity alternatives**: Generate 3 alternatives for any activity

### 💰 Budget-Conscious Planning
- **Step 1: Dream** - Discover destinations that match your style
- **Step 2: Plan** - Get AI-powered budget guidance across categories
- **Step 3: Book** - Track bookings with AI recommendations

### 🔒 Secure & Private
- Session-based authentication with email verification
- Account lockout protection and rate limiting
- Secure password hashing and CSRF protection

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon serverless recommended)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/spark-app-studio/TripPenguin.git
cd TripPenguin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file with the following:

```bash
# Required
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection string
SESSION_SECRET=your-secret-key-here    # Random secret for session encryption
OPENAI_API_KEY=sk-...                  # OpenAI API key

# Optional
NODE_ENV=development                   # development | production
PORT=5000                              # Server port
BASE_URL=http://localhost:5000        # Base URL for emails
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5000
```

### Database Setup

```bash
# Push schema changes to database
npm run db:push
```

### Build for Production

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Routing** | wouter |
| **UI Components** | shadcn/ui + Radix UI + Tailwind CSS |
| **State Management** | React Query + React Hooks |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (Neon) + Drizzle ORM |
| **AI** | OpenAI GPT-4o-mini |
| **Authentication** | Passport.js + bcrypt + express-session |
| **Validation** | Zod |

---

## 📁 Project Structure

```
TripPenguin/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── ItineraryAssistant.tsx
│   │   │   ├── AIDayPlanner.tsx
│   │   │   └── ...
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # Utilities
│   │   └── App.tsx         # Router & layout
│   └── index.html
├── server/                 # Express backend
│   ├── ai-destination.ts   # AI itinerary functions
│   ├── ai-booking.ts       # AI booking recommendations
│   ├── ai-budget.ts        # AI budget advice
│   ├── routes.ts           # API endpoints
│   ├── auth.ts             # Authentication logic
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry point
├── shared/                 # Shared code
│   └── schema.ts           # Database schemas & Zod validators
├── scripts/                # Utility scripts
├── docs/                   # Documentation
└── package.json
```

---

## 🔌 API Overview

### AI Endpoints

- `POST /api/ai/destination-recommendations` - Generate itineraries from quiz
- `POST /api/ai/staycation-recommendations` - Generate staycation options
- `POST /api/ai/activity-suggestions` - Get activity ideas for a day
- `POST /api/ai/day-planner` - Interactive day planning
- `POST /api/ai/itinerary-plan` - Generate full itinerary
- `POST /api/ai/itinerary-assistant` - Chat with Pebbles
- `POST /api/ai/generate-alternative` - Generate activity alternatives
- `POST /api/ai/adjust-itinerary-duration` - Adjust trip length
- `POST /api/ai/itinerary-addons` - Get add-on suggestions
- `POST /api/ai/apply-addon` - Apply an add-on to itinerary
- `POST /api/ai/booking-recommendations` - AI booking suggestions
- `POST /api/ai/budget-recommendations` - AI budget advice

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Trip Management

- `GET /api/trips` - List user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get trip details
- `PATCH /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

See [docs/CODEBASE_OVERVIEW.md](docs/CODEBASE_OVERVIEW.md) for complete API documentation.

---

## 🎨 Design Philosophy

TripPenguin combines:
- **Airbnb's warmth** - Inviting, personal, inspiring
- **Notion's clarity** - Clean, organized, easy to navigate
- **Mint's precision** - Financial awareness, budget tracking

**Typography**: Inter (UI) + Lora (inspirational copy)  
**Component Library**: shadcn/ui (New York style)  
**Theme**: Light/dark mode support

---

## 🛠️ Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run check            # Run TypeScript type checking
npm run db:push          # Push database schema changes
npm run delete-user      # Delete a user by email (utility)
```

---

## 📚 Documentation

- **[Codebase Overview](docs/CODEBASE_OVERVIEW.md)** - Comprehensive technical documentation
- **[Scripts README](scripts/README.md)** - Utility scripts documentation

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session-based authentication
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Account lockout (5 attempts, 15 min)
- ✅ Email verification
- ✅ Password reset with expiring tokens
- ✅ Helmet security headers
- ✅ Input sanitization and validation

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [OpenAI](https://openai.com/) GPT-4o-mini
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Neon](https://neon.tech/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for families who want to travel smart**

