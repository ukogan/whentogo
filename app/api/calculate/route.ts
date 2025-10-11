import { NextRequest, NextResponse } from 'next/server';
import { calculateRecommendation } from '@/app/lib/calculations';
import { SimulationInputs, TripContext, CostLevel } from '@/app/lib/types';
import { findAirportByCode } from '@/app/lib/airports';

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
      costLevel = 3, // Medium cost preference
    } = body;

    // Validate required fields
    if (!airportCode || !flightTime || travelTimeMinutes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: airportCode, flightTime, travelTimeMinutes' },
        { status: 400 }
      );
    }

    // Find airport
    const airport = findAirportByCode(airportCode.toUpperCase());
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

    // Build simulation inputs
    const inputs: SimulationInputs = {
      tripContext,
      travelEstimate: {
        mode: 'driving',
        minMinutes: travelTimeMinutes - travelTimeStdDevMinutes,
        maxMinutes: travelTimeMinutes + travelTimeStdDevMinutes,
      },
      costPreferences: {
        costMissing: costLevel,
        costWaiting: (6 - costLevel) as CostLevel, // Inverse relationship
      },
    };

    // Calculate optimal departure time
    const result = calculateRecommendation(inputs);

    // Calculate arrival time at airport (leave time + travel time)
    const arrivalTime = new Date(result.optimalLeaveTime.getTime() + travelTimeMinutes * 60000);

    // Return iOS-friendly response
    return NextResponse.json({
      success: true,
      departureTime: result.optimalLeaveTime.toISOString(),
      departureTimeFormatted: result.optimalLeaveTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      leaveHomeTime: result.optimalLeaveTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      arriveAirportTime: arrivalTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      totalBufferMinutes: result.debugInfo?.totalTimeMinutes || 0,
      probMakeFlight: Math.round(result.tradeoffMetrics.probMakeFlight * 100),
      breakdown: {
        travelMinutes: Math.round(travelTimeMinutes),
        securityMinutes: Math.round(result.debugInfo?.components.security || 0),
        walkingMinutes: Math.round((result.debugInfo?.components.curbToSecurity || 0) + (result.debugInfo?.components.securityToGate || 0)),
        parkingMinutes: Math.round(result.debugInfo?.components.parking || 0),
        boardingMinutes: Math.round(result.debugInfo?.components.doorCloseBuffer || 0),
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
