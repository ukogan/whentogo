# Airport Timing Advisor - Architecture Document

**Version:** 1.0
**Last Updated:** 2025-10-07
**Change Counter:** 0

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Charts/Visualization:** Recharts (simpler than D3, consumer-friendly)
- **Animations:** Framer Motion (iOS-like smooth animations)
- **Icons:** Lucide React (clean, minimal)

### Backend/Compute
- **Runtime:** Client-side calculations (no backend API needed for MVP)
- **Monte Carlo:** In-browser JavaScript (fast enough for 10k samples)

### Data
- **Airport Priors:** Static JSON (top 50 US airports)
- **Security Priors:** Hardcoded constants by airport size/type
- **State Management:** React useState (stateless sessions, no persistence)

### Deployment
- **Platform:** Railway
- **Build:** Next.js static export or SSR (TBD based on Railway setup)

---

## Data Schema

### User Inputs
```typescript
interface TripContext {
  airport: Airport;              // Selected from autocomplete
  flightTime: Date;              // Departure time
  flightType: 'domestic' | 'international';
  hasCheckedBag: boolean;
  hasPreCheck: boolean;
  hasClear: boolean;
}

interface TravelEstimate {
  mode: 'driving' | 'rideshare' | 'transit';
  minMinutes: number;            // User-estimated min travel time
  maxMinutes: number;            // User-estimated max travel time
  parkingToTerminalMin?: number; // Only for driving mode (default: 15)
}

interface CostPreferences {
  costMissing: 1 | 2 | 3 | 4 | 5;     // Dial 1: Cost of missing flight
  costWaiting: 1 | 2 | 3 | 4 | 5;     // Dial 2: Cost of waiting
}
```

### Airport Data
```typescript
interface Airport {
  code: string;              // e.g., "SFO"
  name: string;              // e.g., "San Francisco International"
  size: 'small' | 'medium' | 'large';
  securityPriors: {
    noPreCheck: { mean: number; std: number };   // Minutes (lognormal params)
    withPreCheck: { mean: number; std: number };
    withClear: { mean: number; std: number };
  };
}
```

### Calculation Outputs
```typescript
interface Recommendation {
  optimalLeaveTime: Date;         // L* (critical fractile result)
  recommendedRange: {
    earliest: Date;               // Conservative option
    latest: Date;                 // Efficient option
  };
  tradeoffMetrics: {
    probMakeFlight: number;       // e.g., 0.95
    expectedWaitMinutes: number;  // e.g., 45
  };
}
```

---

## Probabilistic Model

### Critical-Fractile Formula
```
L* = F_X^(-1)(α*)
where α* = C_under / (C_under + C_over)
```

### Cost Coefficient Mapping
Exponential scaling (base 3) for emotional differentiation:
```
Dial Value → Cost Coefficient
1 → 1
2 → 3
3 → 9
4 → 27
5 → 81
```

### Distribution Components

**Total Time X = Travel + Parking + Security + Boarding Buffer**

1. **Travel Time:** Lognormal fitted from user's min-max estimate
   - Min/max → estimate μ and σ for lognormal

2. **Parking Buffer:** Fixed constant (0 for rideshare/transit, 15 min for driving)

3. **Security Time:** Lognormal from airport priors
   - Adjusted based on PreCheck/CLEAR flags

4. **Boarding Cutoff:** Fixed buffer before flight departure
   - Domestic: 15 minutes
   - International: 30 minutes

### Monte Carlo Simulation
- **Samples:** 10,000 iterations
- **Method:** Sample from lognormal distributions, compute quantiles
- **Output:** Inverse CDF at α* to get L*

---

## Security Time Priors (Default Values)

### Small Airports (e.g., BUR, OAK)
- No PreCheck: μ=20 min, σ=8 min
- PreCheck: μ=8 min, σ=4 min
- CLEAR: μ=5 min, σ=3 min

### Medium Airports (e.g., SAN, SEA)
- No PreCheck: μ=30 min, σ=12 min
- PreCheck: μ=12 min, σ=5 min
- CLEAR: μ=7 min, σ=4 min

### Large Airports (e.g., ATL, LAX, ORD)
- No PreCheck: μ=40 min, σ=15 min
- PreCheck: μ=15 min, σ=6 min
- CLEAR: μ=10 min, σ=5 min

*Note: These are reasonable defaults; will refine based on testing and user feedback.*

---

## User Flow Architecture

### Step 1: Trip Context
**Component:** `TripContextForm`
- Airport autocomplete (fuzzy search on 50 airports)
- Flight time picker (date + time)
- Radio buttons: Domestic/International
- Checkboxes: Checked bag, PreCheck, CLEAR

### Step 2: Travel Estimate
**Component:** `TravelEstimateForm`
- Mode selector (3 buttons with icons)
- Dual range input (min-max slider or separate inputs)
- Conditional: parking buffer input (only if mode=driving)

### Step 3: Cost Preferences
**Component:** `CostDialsForm`
- Two vertical dials with 5 positions each
- Emoji/icon + text labels for each position
- Real-time preview of α* calculation

### Step 4: Results
**Component:** `TradeoffVisualization`
- Timeline graphic showing recommended range
- Airplane icon animations (more solid = safer)
- Clock/coffee icons (more filled = longer wait)
- Text summary: "Leave between X-Y for balance of safety and efficiency"

---

## Design System (iOS 26 Inspired)

### Typography
- **Primary Font:** SF Pro Display (system font)
- **Sizes:**
  - Heading: 28px, weight 600
  - Body: 17px, weight 400
  - Caption: 13px, weight 500

### Colors
- **Background:** #FFFFFF (light mode), #000000 (dark mode)
- **Primary:** #007AFF (iOS blue)
- **Text:** #000000 (light), #FFFFFF (dark)
- **Secondary Text:** #8E8E93
- **Borders:** #C6C6C8
- **Success:** #34C759
- **Warning:** #FF9500
- **Error:** #FF3B30

### Spacing
- Base unit: 8px
- Card padding: 24px
- Section gaps: 32px

### Components
- Rounded corners: 16px (cards), 12px (buttons)
- Shadows: Subtle (0 2px 8px rgba(0,0,0,0.08))
- Buttons: Full-width, 50px height, haptic feedback
- Inputs: 48px height, subtle borders

### Animations
- Duration: 300ms (fast), 500ms (standard)
- Easing: cubic-bezier(0.4, 0.0, 0.2, 1) (iOS ease-out)
- Micro-interactions: Scale on tap (0.95), spring on dial change

---

## File Structure

```
whentogo/
├── architecture.md
├── README.md
├── RISKS.md
├── PRD.md (Airport_Timing_Advisor_PRD.md)
├── features/
│   ├── trip-context.md
│   ├── travel-estimate.md
│   ├── cost-dials.md
│   ├── visualization.md
│   └── calculation-engine.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── components/
│   │   ├── TripContextForm.tsx
│   │   ├── TravelEstimateForm.tsx
│   │   ├── CostDialsForm.tsx
│   │   ├── TradeoffVisualization.tsx
│   │   └── AirportAutocomplete.tsx
│   ├── lib/
│   │   ├── calculations.ts       # Monte Carlo, lognormal fitting
│   │   ├── distributions.ts      # Statistical utilities
│   │   └── airports.ts           # Airport data and priors
│   └── data/
│       └── airports.json         # Top 50 US airports
├── public/
├── package.json
├── tailwind.config.js
├── next.config.js
└── railway.json                  # Railway deployment config
```

---

## Features to Implement

1. **Trip Context Input** (features/trip-context.md)
2. **Travel Time Estimation** (features/travel-estimate.md)
3. **Cost Preference Dials** (features/cost-dials.md)
4. **Probabilistic Calculation Engine** (features/calculation-engine.md)
5. **Trade-off Visualization** (features/visualization.md)

---

## Risks & Assumptions

See [RISKS.md](RISKS.md) for detailed risk assessment.

---

## Non-Goals for v1 MVP

- ❌ Live API integration (Google Maps, MyTSA)
- ❌ User accounts or saved preferences
- ❌ Backend server (all calculations client-side)
- ❌ Analytics/telemetry
- ❌ Multi-language support
- ❌ Historical outcome tracking
