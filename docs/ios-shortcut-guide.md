# iOS Shortcut Integration Guide

This guide shows how to build an iOS Shortcut that automatically:
1. Finds your next flight in Calendar
2. Gets real-time travel time from Apple Maps
3. Calculates optimal departure time using the When To Go API
4. Sends you a notification with when to leave

## Prerequisites

- Your Next.js app must be deployed and accessible (Vercel, etc.)
- Flight events in your Calendar must include airport code (e.g., "Flight to SFO" or "SFO → JFK")
- Location Services enabled for Shortcuts

## iOS Shortcut Recipe

### Step 1: Create New Shortcut

Open Shortcuts app → Tap "+" → Name it "Flight Departure Alert"

### Step 2: Add Actions (in order)

**Action 1: Find Next Flight Event**
```
Find Calendar Events where:
  - Title contains "Flight" OR "✈️"
  - Starts after Current Date
  - Limit: 1
  - Sort: Start Date (Ascending)
```

**Action 2: Extract Airport Code**
```
Get Text from: Calendar Event.Title
Match Text using Regex: [A-Z]{3}
Get Text from: Matches (First Item)
Set Variable: "AirportCode"
```

**Action 3: Extract Flight Time**
```
Get Start Date from: Calendar Event
Set Variable: "FlightTime"
```

**Action 4: Get Current Location**
```
Get Current Location
Set Variable: "CurrentLocation"
```

**Action 5: Find Destination (Airport Address)**
```
Text: "{{AirportCode}} Airport"
Get Addresses from: Text
Get First Item from: Addresses
Set Variable: "AirportLocation"
```

**Action 6: Get Travel Time from Apple Maps**
```
Get Travel Time from:
  - Origin: CurrentLocation
  - Destination: AirportLocation
  - Travel Mode: Driving
Set Variable: "TravelTime"
```

**Action 7: Convert Travel Time to Minutes**
```
Calculate: TravelTime ÷ 60
Round: Down
Set Variable: "TravelMinutes"
```

**Action 8: Build API Request**
```
Text (JSON):
{
  "airportCode": "{{AirportCode}}",
  "flightTime": "{{FlightTime}}",
  "travelTimeMinutes": {{TravelMinutes}},
  "hasPreCheck": true,
  "hasCheckedBag": false,
  "isDomestic": true,
  "isFamiliarAirport": true
}
Set Variable: "RequestBody"
```

**Action 9: Call API**
```
Get Contents of URL:
  - URL: https://YOUR-APP-URL.vercel.app/api/calculate
  - Method: POST
  - Headers:
      Content-Type: application/json
  - Request Body: RequestBody
Set Variable: "APIResponse"
```

**Action 10: Parse Response**
```
Get Dictionary Value:
  - Key: "leaveHomeTime"
  - Dictionary: APIResponse
Set Variable: "LeaveTime"

Get Dictionary Value:
  - Key: "arriveAirportTime"
  - Dictionary: APIResponse
Set Variable: "ArriveTime"

Get Dictionary Value:
  - Key: "totalBufferMinutes"
  - Dictionary: APIResponse
Set Variable: "BufferMinutes"
```

**Action 11: Show Notification**
```
Show Notification:
  Title: "✈️ Flight to {{AirportCode}}"
  Body: "Leave home at {{LeaveTime}}
Arrive airport by {{ArriveTime}}
Total buffer: {{BufferMinutes}} min

Current traffic: {{TravelMinutes}} min to airport"
```

**Action 12 (Optional): Set Reminder**
```
Add New Reminder:
  - List: "Travel"
  - Title: "Leave for {{AirportCode}} flight"
  - Alert: "FlightTime - (BufferMinutes × 60) seconds"
```

## Advanced Features

### Morning-Of Automation

Set up an automation that runs this shortcut automatically:

1. Open Shortcuts → Automation tab → "+"
2. **Time of Day** trigger → 6:00 AM
3. Run "Flight Departure Alert" shortcut
4. Check "If I have a flight today"

### Widget Support

Create a second shortcut for widget display:

**Widget Shortcut:**
- Same steps 1-10 as above
- Instead of notification, use:
```
Text:
"🛫 {{AirportCode}} Flight
Leave: {{LeaveTime}}
Traffic: {{TravelMinutes}} min"

Show Result
```

Add to Home Screen as Small Widget

### Siri Integration

Invoke with voice:
- "Hey Siri, when should I leave for my flight?"
- "Hey Siri, run Flight Departure Alert"

## API Request Examples

### Basic Request
```json
POST https://your-app.vercel.app/api/calculate

{
  "airportCode": "SFO",
  "flightTime": "2025-10-15T14:30:00Z",
  "travelTimeMinutes": 45
}
```

### Full Request with Options
```json
{
  "airportCode": "SFO",
  "flightTime": "2025-10-15T14:30:00Z",
  "travelTimeMinutes": 45,
  "travelTimeStdDevMinutes": 13.5,
  "hasCheckedBag": false,
  "hasPreCheck": true,
  "hasClear": false,
  "boardingStartMin": 30,
  "doorCloseMin": 10,
  "isFamiliarAirport": true,
  "isDomestic": true
}
```

### API Response
```json
{
  "success": true,
  "departureTime": "2025-10-15T12:15:00Z",
  "departureTimeFormatted": "Wed, Oct 15, 12:15 PM",
  "leaveHomeTime": "12:15 PM",
  "arriveAirportTime": "1:00 PM",
  "totalBufferMinutes": 150,
  "breakdown": {
    "travelMinutes": 45,
    "securityMinutes": 32,
    "walkingMinutes": 15,
    "parkingMinutes": 10,
    "boardingMinutes": 30
  },
  "flightInfo": {
    "airport": "San Francisco International Airport",
    "airportCode": "SFO",
    "flightTime": "Wed, Oct 15, 2:30 PM"
  }
}
```

## Troubleshooting

### Airport Code Not Found
- Ensure calendar event title contains 3-letter IATA code
- Examples that work: "Flight to SFO", "SFO ✈️ JFK", "Depart SFO 2:30pm"
- Examples that fail: "San Francisco flight", "Bay Area trip"

### Travel Time Issues
- Grant Shortcuts location permissions: Settings → Privacy → Location Services → Shortcuts
- Ensure Apple Maps can route to airport (some small airports may not route correctly)
- Fallback: Hardcode travel time in shortcut instead of using "Get Travel Time"

### API Errors
- Check network connection
- Verify app URL is correct and deployed
- Test API endpoint in browser or Postman first
- Check Vercel logs for errors

### No Upcoming Flights Found
- Ensure flight event is in future
- Check calendar permissions: Settings → Shortcuts → Calendar
- Verify event title contains "Flight" or add custom search term

## Customization

### Add More Context from Calendar
Extract additional info from event notes:
```
Get Notes from: Calendar Event
Match Text: "Confirmation: ([A-Z0-9]{6})"
Set Variable: "ConfirmationCode"
```

### Multi-Airport Support
If flying from different airports:
```
Get Notes from: Calendar Event
Match Text: "Departing: ([A-Z]{3})"
If no match: Use default airport (e.g., SFO)
```

### Risk Tolerance Adjustment
Modify API request based on time of day:
```
If Current Date Hour < 6:
  Set TravelTimeStdDevMinutes to: TravelMinutes × 0.4
Else:
  Set TravelTimeStdDevMinutes to: TravelMinutes × 0.3
```

## Calendar Event Format Recommendations

For best results, format your flight calendar events like this:

**Title:**
```
✈️ SFO → JFK (AA 123)
```

**Notes:**
```
Confirmation: ABC123
Terminal: 2
Gate: 30 (subject to change)
Seat: 15A
```

This allows the shortcut to extract:
- Airport code (SFO)
- Flight number (AA 123)
- Confirmation code
- Terminal info

## Privacy & Security

- All calculations happen on your device or your deployed app
- No data is stored or logged
- Travel time queries use Apple Maps (respects Apple's privacy policy)
- To ensure privacy: Deploy app yourself rather than using third-party service

## Deployment

Deploy your Next.js app to make it accessible to iOS Shortcuts:

**Vercel (Recommended):**
```bash
cd /Users/urikogan/code/whentogo
vercel --prod
```

**Alternative: Cloudflare Pages, Netlify, etc.**

Update shortcut URL to your deployed domain:
```
https://whentogo-yourname.vercel.app/api/calculate
```

## Testing

1. Create a test flight event: "Test Flight SFO" tomorrow at 2pm
2. Run shortcut manually
3. Verify notification appears with correct times
4. Check that travel time matches Apple Maps estimate
5. Adjust parameters (hasPreCheck, hasCheckedBag) to test variations

## Example Use Cases

**Morning Routine:**
- Automation runs at 6 AM
- Checks for flights today
- Sends notification with departure time
- Sets reminder 30 min before departure

**Day Before:**
- Automation runs at 8 PM night before flight
- Shows detailed breakdown
- Suggests packing list based on flight type

**Multiple Flights:**
- Run for each upcoming flight
- Compare departure times
- Optimize schedule accordingly
