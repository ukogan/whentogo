# Airport Timing Advisor

Personalized recommendations for when to leave for your flight based on probabilistic modeling and your personal trade-offs.

## Overview

This app helps travelers decide **when to leave for the airport** by expressing the probabilistic trade-off between being too early (wasting time) and too late (missing the flight) through intuitive, emotional cues instead of numbers or probabilities.

## Features

- **Airport Search:** Autocomplete search for top 50 US airports
- **Trip Context:** Flight details, domestic/international, checked bags, PreCheck/CLEAR
- **Travel Mode:** Driving, rideshare, or public transit with customizable time ranges
- **Cost Preferences:** Two-dial interface to express tolerance for risk vs. time waste
- **Personalized Recommendations:** Time window based on critical-fractile newsvendor model
- **Visual Trade-offs:** See confidence level and expected wait time at a glance

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Calculations:** Client-side Monte Carlo simulation (10k samples)
- **Visualization:** Recharts, Framer Motion
- **Deployment:** Railway

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
whentogo/
├── app/
│   ├── components/          # React components
│   │   ├── AirportAutocomplete.tsx
│   │   ├── TripContextForm.tsx
│   │   ├── TravelEstimateForm.tsx
│   │   ├── CostDialsForm.tsx
│   │   └── TradeoffVisualization.tsx
│   ├── lib/                 # Core logic
│   │   ├── calculations.ts  # Monte Carlo simulation
│   │   ├── distributions.ts # Statistical utilities
│   │   ├── airports.ts      # Airport search
│   │   └── types.ts         # TypeScript types
│   ├── data/
│   │   └── airports.json    # Airport priors
│   ├── layout.tsx
│   ├── page.tsx             # Main app
│   └── globals.css
├── architecture.md          # Architecture documentation
├── Airport_Timing_Advisor_PRD.md
├── package.json
└── README.md
```

## How It Works

### Probabilistic Model

The app uses a **critical-fractile newsvendor model**:

```
L* = F_X⁻¹(α*)
where α* = C_under / (C_under + C_over)
```

- **L\*:** Optimal leave time
- **α\*:** Critical fractile ratio
- **C_under:** Cost of missing flight (dial 1)
- **C_over:** Cost of waiting early (dial 2)

### Cost Mapping

User dial positions (1-5) map to cost coefficients using exponential scaling (base 3):

```
1 → 1
2 → 3
3 → 9
4 → 27
5 → 81
```

### Monte Carlo Simulation

Total time distribution **X = Travel + Parking + Security + Boarding Buffer**

Each component is sampled from lognormal distributions fitted to:
- User-provided min-max travel time
- Airport security priors (adjusted for PreCheck/CLEAR)
- Fixed parking and boarding buffers

## Roadmap

- **v1.0 (Current):** Manual inputs, client-side calculations
- **v1.1:** Live API integration (Google Maps, MyTSA)
- **v1.2:** User profiles and saved preferences
- **v2.0:** Learning from outcomes and predictive improvements

## License

Private project by Uri Kogan

## Contributing

This is a personal project. Feedback welcome via issues.
