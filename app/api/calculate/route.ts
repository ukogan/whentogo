import { NextRequest, NextResponse } from 'next/server';
import { calculateOptimalDepartureTime } from '@/app/lib/calculations';
import { TripContext, Airport, FlightType } from '@/app/lib/types';
import { AIRPORTS } from '@/app/lib/airports';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract parameters from iOS Shortcut
    const {
      airportCode,
      flightTime,
      travelTimeMinutes,
      travelTimeStdDevMinutes = travelTimeMinutes * 0.3, // Default: 30% coefficient of variation
      hasCheckedBag = false,
      hasPreCheck = false,
      hasClear = false,
      boardingStartMin = 30,
      doorCloseMin = 10,
      isFamiliarAirport = true,
      isDomestic = true,
    } = body;

    // Validate required fields
    if (!airportCode || !flightTime || !travelTimeMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields: airportCode, flightTime, travelTimeMinutes' },
        { status: 400 }
      );
    }

    // Find airport
    const airport = AIRPORTS.find(a => a.code === airportCode.toUpperCase());
    if (!airport) {
      return NextResponse.json(
        { error: `Airport ${airportCode} not found` },
        { status: 404 }
      );
    }

    // Build trip context
    const tripContext: TripContext = {
      airport,
      flightTime: new Date(flightTime),
      flightType: isDomestic ? 'domestic' : 'international',
      hasCheckedBag,
      hasPreCheck,
      hasClear,
      boardingStartMin,
      doorCloseMin,
      isFamiliarAirport,
    };

    // Calculate optimal departure time
    const result = calculateOptimalDepartureTime(
      tripContext,
      travelTimeMinutes,
      travelTimeStdDevMinutes
    );

    // Return iOS-friendly response
    return NextResponse.json({
      success: true,
      departureTime: result.optimalDepartureTime.toISOString(),
      departureTimeFormatted: result.optimalDepartureTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      leaveHomeTime: result.optimalDepartureTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      arriveAirportTime: result.arrivalTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      totalBufferMinutes: result.totalTimeMinutes,
      breakdown: {
        travelMinutes: Math.round(travelTimeMinutes),
        securityMinutes: result.securityMinutes,
        walkingMinutes: result.walkingMinutes,
        parkingMinutes: result.parkingMinutes,
        boardingMinutes: result.boardingMinutes,
      },
      flightInfo: {
        airport: airport.name,
        airportCode: airport.code,
        flightTime: new Date(flightTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
