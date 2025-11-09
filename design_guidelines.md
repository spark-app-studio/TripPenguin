# TripPirate Trip Planning App - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Airbnb's warmth and visual appeal, Notion's organizational clarity, and Mint's budget tracking precision. This creates an experience that makes financial planning feel aspirational rather than restrictive.

**Core Principle**: Transform budget planning from a chore into an exciting journey toward a dream trip.

---

## Typography System

**Font Families** (Google Fonts):
- **Primary**: Inter (headings, UI elements) - weights 400, 600, 700
- **Secondary**: Lora (subheadings, inspirational copy) - weights 400, 600

**Hierarchy**:
- Page titles: Inter 700, 3xl (mobile) / 5xl (desktop)
- Section headers: Lora 600, 2xl / 3xl
- Step titles: Inter 600, xl / 2xl
- Body text: Inter 400, base / lg
- Form labels: Inter 600, sm
- Helper text: Inter 400, sm
- Budget numbers: Inter 700, 2xl / 3xl (make money prominent)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 24** consistently
- Tight spacing: p-2, gap-4
- Standard spacing: p-6, gap-8
- Section spacing: py-12, py-16, py-24

**Container Strategy**:
- Main content: max-w-7xl mx-auto
- Form sections: max-w-4xl
- Budget summaries: max-w-6xl

**Grid Patterns**:
- Destination cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Budget breakdown: grid-cols-1 lg:grid-cols-2
- Step indicators: flex with responsive wrapping

---

## Component Library

### Navigation
- **Sticky header** with logo, progress indicator, and save status
- **Floating progress stepper** (Dream → Plan → Do) always visible
- Step completion badges with checkmarks

### Forms & Inputs
- **Large, friendly form fields** with generous padding (p-4)
- Floating labels that animate on focus
- Inline validation with helpful guidance
- Clear CTAs: "Continue to Planning" not just "Next"

### Budget Components
- **Real-time cost calculator cards** with breakdown visibility
- Warning badges when over budget (prominent but not alarming)
- Savings progress bars with milestone markers
- Cost comparison tables (Estimated vs Actual)

### Trip Planning Cards
- **Destination selection cards** with inspiring imagery
- Duration sliders with visual calendar representation
- "Who's Going" avatar group selector
- Date picker with seasonal recommendations

### Booking Checklist
- **Status-based item cards**: Not Started / In Progress / Booked
- Cost comparison badges (Budget vs Actual)
- AI booking stub buttons with "Coming Soon" badges
- Expandable detail sections per booking category

### Data Visualization
- **Simple progress rings** for budget allocation
- Timeline view for savings schedule
- Bar charts for cost breakdown by category
- "Earliest Travel Date" countdown widget

---

## Page Structures

### Landing/Welcome
- Hero section with inspiring travel imagery (80vh)
- Three-column feature showcase of the 3 steps
- Social proof: "Join thousands planning debt-free travel"
- CTA: "Start Planning Your Trip"

### Step 1: Dream
- Large inspirational header
- Sequential reveal of form sections (Who, When, How Long, Where)
- Destination card grid with search/filter
- Sticky summary sidebar showing selections

### Step 2: Plan (Budget Calculator)
- Budget overview dashboard at top
- Accordion-style category sections (Flights, Housing, Food, etc.)
- Each category: Input fields + automatic calculations + tips
- Persistent budget alert banner if over budget
- Savings calculator with monthly breakdown

### Step 3: Do (Booking)
- Kanban-style layout: To Book / In Progress / Completed
- Filter by category
- Each item: checkbox, name, estimated cost, actual cost, AI stub button
- Final summary card with total comparison

### Trip Summary Dashboard
- Hero recap: destination images + key details
- Budget health score with visual indicator
- Complete itinerary timeline
- Shareable trip overview

---

## Interaction Patterns

**Progressive Disclosure**: Reveal complexity gradually
- Start simple (Who/When/Where)
- Expand into detailed budgeting
- Finish with specific booking tasks

**Budget Alerts**: 
- Yellow warning at 90% budget
- Red alert when over budget with specific recommendations
- Green confirmation when on track

**Auto-Save**: 
- Save progress every 30 seconds
- Visual "Saved" indicator in header
- "All changes saved" toast on completion

**AI Booking Stubs**:
- Clearly marked "Powered by AI (Coming Soon)"
- Mock conversation interface showing future capability
- Collect waitlist signups for beta

---

## Icons & Assets

**Icon Library**: Heroicons (via CDN)
- Outline style for secondary actions
- Solid style for completed states and CTAs

**Key Icons**:
- Calendar, Globe, Users (Step 1)
- CreditCard, Calculator, TrendingUp (Step 2)
- CheckCircle, Clock, Airplane (Step 3)

---

## Images

### Hero Section
**Large inspirational travel image** spanning full viewport width (80vh):
- Authentic travel moment (family/friends exploring beautiful destination)
- Natural lighting, aspirational but relatable
- Subtle overlay for text readability
- CTA button with blurred background

### Destination Cards
- Each destination option: High-quality city/landmark photo
- 16:9 aspect ratio
- Consistent treatment across all cards

### Step Illustrations
- Custom illustrations for each major step (Dream/Plan/Do)
- Friendly, modern illustration style
- Positioned as section dividers

---

## Accessibility & Polish

- High contrast for all budget numbers and alerts
- Clear focus states on all interactive elements
- Logical tab order through multi-step forms
- Loading states for calculations
- Empty states with helpful guidance
- Responsive breakpoints: 640px, 1024px, 1280px

---

## Animation Guidelines

**Use Sparingly**:
- Smooth transitions between steps (0.3s ease)
- Budget calculation number count-up effect
- Progress bar fills
- Card hover lifts (subtle, 2-4px)
- NO scroll animations or parallax

**Priority**: Performance and clarity over decorative motion