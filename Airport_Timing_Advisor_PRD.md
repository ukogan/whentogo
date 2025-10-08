# 🧭 Product Requirements Document
**Product Name:** Airport Timing Advisor (working title)  
**Version:** v1.0 MVP  
**Owner:** Uri Kogan  
**Goal:** Help travelers decide *when to leave for the airport* by expressing the probabilistic trade-off between being too early and too late through intuitive, emotional cues instead of numbers or probabilities.

---

## 1. 🧩 Problem Statement
Travelers habitually guess when to leave for the airport, often over- or under-estimating because they can’t reason about uncertainty.  
Current “TSA wait time” or “traffic” tools are deterministic and ignore personal tolerance for risk and time.  
This app reframes the decision as a **personal trade-off**: “time lost waiting” vs. “pain of missing your flight.”

---

## 2. 🎯 Goals
- Provide travelers with a **visceral, intuitive visualization** of the risk–time trade-off.  
- Replace probability and statistics with relatable language about *how bad* missing the flight is and *how valuable* their time is.  
- Build a probabilistic foundation (critical-fractile model) that can scale to live data later.

---

## 3. 🔢 Core Logic

### 3.1 Model
L* = F_X⁻¹(C_under / (C_under + C_over))

where  
- X = random total time from leaving to boarding gate,  
- C_under = cost of missing flight,  
- C_over = cost of waiting early.

The app recommends or visualizes leave-by options around L*.

### 3.2 Components of X
- **Travel time:** user-entered min–max (lognormal fit).  
- **Parking / rideshare buffer:** added per mode selection.  
- **Security time:** default priors by airport type + PreCheck flag.  
- **Boarding cutoff:** flight time – fixed airline/flight buffer.

---

## 4. 🧭 User Flow

### Step 1 – Trip Context
**Inputs**
- Airport  
- Flight departure time  
- Domestic / International  
- Checked bag?  
- TSA PreCheck / CLEAR?

→ Sets boarding cutoff and priors.

### Step 2 – Travel Estimate (with Mode Selector)
**Prompt**
> “About how long does it usually take you to get to the airport?”

**Inputs**
- **Mode:**  
  - 🚗 Driving + parking  
  - 🚕 Rideshare / Taxi  
  - 🚆 Public Transit / Shuttle  
- **Range:** “From __ min to __ min.”
- **If parking:**  
  > “How long from parking to the terminal?” → adds fixed minutes.

No lookup calls in v1; this becomes part of the sampled distribution.

### Step 3 – Costs (Two Dials)

#### Dial 1 – Cost of Missing the Flight (C_under)
Prompt:  
> “If you missed this flight, how bad would that be?”

Positions (low → high cost):
1. “No big deal — I’d just catch another.”  
2. “It would throw off my day.”  
3. “It would cause serious stress.”  
4. “It would cost real money or create trouble.”  
5. “It would ruin my plans — I cannot miss it.”

#### Dial 2 – Cost of Waiting / Time Value (C_over)
Prompt:  
> “If you got there too early, how much would that bother you?”

Positions (low → high cost):
1. “I don’t mind waiting — I’ll grab coffee.”  
2. “It’s mildly annoying.”  
3. “I’d rather not waste time.”  
4. “It feels wasteful.”  
5. “I really hate sitting around.”

Each dial maps linearly (1–5) to cost coefficients; together they compute the quantile target α*.

### Step 4 – Visual Trade-off (“Option B”)

**Display:** two dynamic dials or gauges side-by-side.

| Left Dial | Right Dial |
|------------|-------------|
| **Missing the Flight** | **Wasting Time** |

- Each dial has 3 positions visible at once; the user’s chosen combination defines a *curve* between “safe but early” and “efficient but risky.”  
- The app animates **two bars or icons**:  
  - Left: 0–10 airplane icons (more solid = safer).  
  - Right: clock icons or coffee cups (more filled = longer waiting).  
- As either dial moves, the visualization updates the **trade-off curve** (risk vs. waiting time).  
- Instead of outputting “Leave by 6:42 am,” show a **highlighted zone** on a small timeline:  
  > “If you leave between 6:35 – 6:50, you’ll likely make it without too much waiting.”  
  > “Earlier = more peace of mind. Later = more time at home.”

---

## 5. ⚙️ Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Front-end | React + Next.js, Tailwind | PWA-ready, mobile-first |
| Backend | Node/Firebase Function | Runs Monte Carlo sampling |
| Data | JSON priors | Security/traffic priors |
| Visualization | D3.js or Recharts | For trade-off dials + icons |

---

## 6. 📅 Roadmap

| Phase | Focus | Key Additions |
|-------|--------|---------------|
| v1 (MVP, 4–6 weeks) | Manual inputs, 2 cost dials, trade-off visualization | No APIs |
| v1.1 | Live data integration | Google Maps, MyTSA |
| v1.2 | Traveler profiles | Remember mode + cost preferences |
| v2 | Predictive | Learning from outcomes / anonymized telemetry |

---

## 7. 🧪 Success Metrics
- ≥ 70 % of users report “the visual made sense instantly.”  
- Median session < 60 s to get recommendation.  
- 2+ repeat uses per traveler in 3 months (stickiness).
