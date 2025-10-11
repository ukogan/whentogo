# Flight Departure Alert - Shortcut Configuration

This is a text representation of the iOS Shortcut. Use this as a reference when building the shortcut manually in the iOS Shortcuts app.

## Shortcut Overview

**Name:** Flight Departure Alert
**Icon:** ✈️ (Airplane)
**Color:** Blue
**Share Sheet:** No
**Widget:** Yes

---

## Actions Flow

### 1. FIND CALENDAR EVENTS
```
Action: Find Calendar Events
Filters:
  - Calendar: All Calendars
  - Title: Contains "Flight" OR Contains "✈️"
  - Start Date: Is After → Current Date
Sort By: Start Date
Order: Latest First
Limit: 1

Output → Variable: "Next Flight Event"
```

### 2. GET EVENT TITLE
```
Action: Get Details of Calendar Events
Get: Name
From: Next Flight Event

Output → Variable: "Event Title"
```

### 3. EXTRACT AIRPORT CODE
```
Action: Match Text
Text: Event Title
Pattern: [A-Z]{3}
Match Type: Regular Expression

Output → Variable: "Airport Matches"
```

### 4. GET FIRST AIRPORT CODE
```
Action: Get Item from List
Get: First Item
From: Airport Matches

Output → Variable: "Airport Code"
```

### 5. GET FLIGHT TIME
```
Action: Get Details of Calendar Events
Get: Start Date
From: Next Flight Event

Output → Variable: "Flight Time"
```

### 6. GET CURRENT LOCATION
```
Action: Get Current Location

Output → Variable: "Current Location"
```

### 7. CREATE AIRPORT ADDRESS
```
Action: Text
Text: {{Airport Code}} Airport

Output → Variable: "Airport Search"
```

### 8. GEOCODE AIRPORT
```
Action: Get Addresses from Input
Input: Airport Search

Output → Variable: "Airport Addresses"
```

### 9. GET FIRST ADDRESS
```
Action: Get Item from List
Get: First Item
From: Airport Addresses

Output → Variable: "Airport Location"
```

### 10. GET TRAVEL TIME
```
Action: Get Travel Time
From: Current Location
To: Airport Location
Via: Driving
Service: Apple Maps

Output → Variable: "Travel Time Seconds"
```

### 11. CONVERT TO MINUTES
```
Action: Calculate
Input: Travel Time Seconds ÷ 60
Round: Down

Output → Variable: "Travel Minutes"
```

### 12. CHECK PRECHECK STATUS
```
Action: Ask for Input
Prompt: "Do you have TSA PreCheck?"
Default Answer: "Yes"
Input Type: Text

Output → Variable: "PreCheck Response"
```

### 13. SET PRECHECK BOOLEAN
```
Action: If
Condition: PreCheck Response is "Yes"

  Set Variable: "Has PreCheck" = true

Otherwise:

  Set Variable: "Has PreCheck" = false

End If
```

### 14. BUILD JSON REQUEST
```
Action: Dictionary
Items:
  airportCode: {{Airport Code}}
  flightTime: {{Flight Time}}
  travelTimeMinutes: {{Travel Minutes}}
  hasPreCheck: {{Has PreCheck}}
  hasCheckedBag: false
  isDomestic: true
  isFamiliarAirport: true

Output → Variable: "API Request"
```

### 15. CALL API
```
Action: Get Contents of URL
URL: https://whentoleavefortheairport.vercel.app/api/calculate
Method: POST
Headers:
  Content-Type: application/json
Request Body: API Request

Output → Variable: "API Response"
```

### 16. GET LEAVE TIME
```
Action: Get Dictionary Value
Get Value for Key: "leaveHomeTime"
From: API Response

Output → Variable: "Leave Time"
```

### 17. GET ARRIVAL TIME
```
Action: Get Dictionary Value
Get Value for Key: "arriveAirportTime"
From: API Response

Output → Variable: "Arrive Time"
```

### 18. GET BUFFER MINUTES
```
Action: Get Dictionary Value
Get Value for Key: "totalBufferMinutes"
From: API Response

Output → Variable: "Buffer Minutes"
```

### 19. GET BREAKDOWN
```
Action: Get Dictionary Value
Get Value for Key: "breakdown"
From: API Response

Output → Variable: "Time Breakdown"
```

### 20. SHOW NOTIFICATION
```
Action: Show Notification
Title: ✈️ Flight to {{Airport Code}}
Body:
🏠 Leave home: {{Leave Time}}
🛫 Arrive airport: {{Arrive Time}}
⏱️ Total buffer: {{Buffer Minutes}} min

📍 Current traffic: {{Travel Minutes}} min to airport

Sound: Default
```

### 21. SHOW RESULT
```
Action: Show Result
Text:
Flight: {{Airport Code}}
Departure: {{Flight Time}}

🏠 Leave: {{Leave Time}}
🛫 Arrive: {{Arrive Time}}
⏱️ Buffer: {{Buffer Minutes}} min

Breakdown:
  Travel: {{Time Breakdown.travelMinutes}} min
  Security: {{Time Breakdown.securityMinutes}} min
  Walking: {{Time Breakdown.walkingMinutes}} min
  Parking: {{Time Breakdown.parkingMinutes}} min
```

---

## Automation Setup

### Morning Flight Check

**Trigger:** Time of Day
**Time:** 6:00 AM
**Repeat:** Daily
**Run:** Immediately

**Conditions:**
- If: Find Calendar Events where Start Date is Today AND Title contains "Flight"
- Then: Run "Flight Departure Alert"

### Evening Reminder

**Trigger:** Time of Day
**Time:** 8:00 PM
**Repeat:** Daily

**Conditions:**
- If: Find Calendar Events where Start Date is Tomorrow AND Title contains "Flight"
- Then: Run "Flight Departure Alert"

---

## Widget Configuration

**Widget Type:** Small
**When Tapped:** Run Shortcut
**Update:** On Tap

**Display:**
```
✈️ {{Airport Code}}
Leave: {{Leave Time}}
🚗 {{Travel Minutes}} min
```

---

## Share Sheet Version

For manual triggering from calendar event:

**Accepts:** Calendar Events
**When Run:**
1. Receive Calendar Event from Share Sheet → Variable: "Shared Event"
2. Skip steps 1-5 (use Shared Event instead of finding next flight)
3. Continue with steps 6-21

---

## Variables Summary

| Variable Name | Type | Description |
|---------------|------|-------------|
| Next Flight Event | Calendar Event | Next upcoming flight event |
| Event Title | Text | Event name/title |
| Airport Matches | List | Regex matches for airport codes |
| Airport Code | Text | 3-letter IATA code (e.g., SFO) |
| Flight Time | Date | Flight departure time |
| Current Location | Location | User's current GPS location |
| Airport Search | Text | Search query for airport |
| Airport Addresses | List | Geocoded airport locations |
| Airport Location | Location | Airport coordinates |
| Travel Time Seconds | Number | Raw travel time from Maps |
| Travel Minutes | Number | Travel time rounded to minutes |
| PreCheck Response | Text | User's PreCheck answer |
| Has PreCheck | Boolean | PreCheck status flag |
| API Request | Dictionary | JSON payload for API |
| API Response | Dictionary | JSON response from API |
| Leave Time | Text | Formatted departure time |
| Arrive Time | Text | Formatted arrival time |
| Buffer Minutes | Number | Total buffer time |
| Time Breakdown | Dictionary | Component time breakdown |

---

## Error Handling

### No Flight Found
```
Action: If
Condition: Next Flight Event = No Value

  Show Alert:
    Title: No Upcoming Flight
    Message: No flight events found in your calendar.

  Stop Shortcut

End If
```

### No Airport Code
```
Action: If
Condition: Airport Code = No Value

  Ask for Input:
    Prompt: Enter airport code (e.g., SFO)
    Input Type: Text

  Set Variable: "Airport Code"

End If
```

### API Error
```
Action: If
Condition: API Response.success ≠ true

  Show Alert:
    Title: Calculation Error
    Message: {{API Response.error}}

  Stop Shortcut

End If
```

### Location Permission Denied
```
Action: If
Condition: Current Location = No Value

  Ask for Input:
    Prompt: Enter travel time to airport (minutes)
    Input Type: Number

  Set Variable: "Travel Minutes"
  Skip steps 6-11

End If
```

---

## Testing Checklist

- [ ] Create test flight event in calendar
- [ ] Run shortcut manually
- [ ] Verify airport code extracted correctly
- [ ] Check travel time matches Maps estimate
- [ ] Confirm notification appears
- [ ] Test with PreCheck enabled/disabled
- [ ] Test with location services off (fallback)
- [ ] Test with no flight in calendar (error handling)
- [ ] Test widget display
- [ ] Test automation trigger

---

## Customization Tips

**Add Checked Bag Prompt:**
```
Action: Ask for Input
Prompt: "Do you have a checked bag?"
Set Variable: "Has Checked Bag"
```

**Add Flight Type Detection:**
```
Action: If
Condition: Event Title contains "International"
  Set: isDomestic = false
Otherwise:
  Set: isDomestic = true
End If
```

**Add Multiple Airports:**
```
Action: If
Condition: Current Location is in "San Francisco"
  Set: Airport Code = "SFO"
Else If: Current Location is in "Oakland"
  Set: Airport Code = "OAK"
End If
```

**Add Calendar Reminder:**
```
Action: Add New Reminder
Title: Leave for {{Airport Code}} flight
Alert: {{Flight Time}} - {{Buffer Minutes}} minutes
```
