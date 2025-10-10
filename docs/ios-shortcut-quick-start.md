# iOS Shortcut Quick Start

## What You Built

You now have an API endpoint that accepts:
- Airport code from Calendar
- Flight time from Calendar
- Real-time travel time from Apple Maps

And returns:
- Exact time to leave home
- When you'll arrive at airport
- Complete time breakdown

## Deploy First

```bash
cd /Users/urikogan/code/whentogo
vercel --prod
```

Copy your deployment URL (e.g., `https://whentogo.vercel.app`)

## Build the Shortcut (5 min)

Open Shortcuts app on iPhone and follow the step-by-step guide in [FlightDepartureAlert.shortcut.md](FlightDepartureAlert.shortcut.md)

**TL;DR version:**
1. Find next calendar event with "Flight" in title
2. Extract airport code (3 letters)
3. Get current location
4. Get travel time to airport from Apple Maps
5. POST to your API:
   ```json
   {
     "airportCode": "SFO",
     "flightTime": "2025-10-15T14:30:00Z",
     "travelTimeMinutes": 45
   }
   ```
6. Show notification with leave time

## Calendar Event Format

Create flight events like this:

**Title:**
```
✈️ SFO Flight
```
or
```
Flight to SFO
```

**Time:** Your actual flight departure time

## Test It

1. Create test event: "Flight SFO" tomorrow at 2pm
2. Run shortcut manually
3. You should see: "Leave home at X:XX PM"

## Automate It

**Morning Check** (runs daily at 6 AM if you have a flight today):
- Automation → Time of Day → 6:00 AM
- Add condition: "If calendar has 'Flight' event today"
- Run "Flight Departure Alert"

## What Makes This Smart

Unlike static "arrive 2 hours early" advice, this uses:
- **Real traffic** from Apple Maps right now
- **Monte Carlo simulation** of security wait times
- **Rush hour correlation** (morning rush hits both traffic AND security)
- **Ex-Gaussian distribution** for TSA nightmare scenarios
- **Airport familiarity** bonus if you've flown from there before
- **Terminal train headways** at large airports

## API Endpoint

**URL:** `https://your-app.vercel.app/api/calculate`

**Method:** POST

**Required:**
- `airportCode`: 3-letter IATA code
- `flightTime`: ISO 8601 timestamp
- `travelTimeMinutes`: Number from Apple Maps

**Optional:**
- `hasPreCheck`: boolean (default false)
- `hasCheckedBag`: boolean (default false)
- `isFamiliarAirport`: boolean (default true)
- `isDomestic`: boolean (default true)

**Response:**
```json
{
  "leaveHomeTime": "12:15 PM",
  "arriveAirportTime": "1:00 PM",
  "totalBufferMinutes": 150,
  "breakdown": {
    "travelMinutes": 45,
    "securityMinutes": 32,
    "walkingMinutes": 15,
    "parkingMinutes": 10,
    "boardingMinutes": 30
  }
}
```

## Troubleshooting

**"Airport not found"**
- Supported airports: SFO, LAX, ORD, JFK, ATL, DFW, DEN, SEA, LAS, MCO, MIA, PHX, BOS, IAH, EWR, MSP, DTW, PHL, LGA, BWI, DCA, SAN, SLC, TPA, PDX, STL, BNA, AUS, SJC, OAK, SMF, RNO, BUR, ONT, SNA, MCI, CVG, PIT, CLE, IND, CMH, MDW, HOU
- Add more in [airports.ts](../app/lib/airports.ts)

**"No flight found"**
- Ensure event title contains "Flight" or "✈️"
- Event must be in future
- Check calendar permissions

**Travel time seems wrong**
- Apple Maps needs location permissions
- Ensure "Traffic" is enabled in Maps settings
- Try running shortcut from home (not airport)

## Next Steps

**Widget:** Add to home screen for quick glance at next flight

**Siri:** "Hey Siri, when should I leave for my flight?"

**Advanced:** See [full guide](ios-shortcut-guide.md) for:
- Multiple airports
- Checked bag detection
- Flight type auto-detection
- Reminder creation
