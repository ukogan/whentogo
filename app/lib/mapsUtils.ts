import type { TripContext } from './types';

/**
 * Calculate when user needs to arrive at airport based on their trip context
 */
export function calculateAirportArrivalTime(tripContext: TripContext): Date {
  const flightTime = new Date(tripContext.flightTime);

  // Calculate total buffer time needed at airport (in minutes)
  let bufferMinutes = 0;

  // 1. Bag drop time (if applicable)
  if (tripContext.hasCheckedBag) {
    bufferMinutes += tripContext.hasPriorityBagCheck ? 5 : 15;
  }

  // 2. Security time (mean estimate based on type)
  if (tripContext.hasClear) {
    bufferMinutes += tripContext.airport.securityPriors.withClear.mean;
  } else if (tripContext.hasPreCheck) {
    bufferMinutes += tripContext.airport.securityPriors.withPreCheck.mean;
  } else {
    bufferMinutes += tripContext.airport.securityPriors.noPreCheck.mean;
  }

  // 3. Time to get to gate after security (8 min baseline)
  bufferMinutes += 8;

  // 4. Unfamiliar airport buffer
  if (!tripContext.isFamiliarAirport) {
    bufferMinutes += 20;
  }

  // 5. Buffer to account for door closing time
  bufferMinutes += tripContext.doorCloseMin;

  // Subtract buffer from flight time to get arrival time
  const arrivalTime = new Date(flightTime.getTime() - bufferMinutes * 60 * 1000);
  return arrivalTime;
}

/**
 * Calculate when user should leave home to arrive at airport on time
 * Uses mean travel time estimate
 */
export function calculateDepartureTime(
  arrivalTime: Date,
  travelMinutes: number
): Date {
  return new Date(arrivalTime.getTime() - travelMinutes * 60 * 1000);
}

/**
 * Generate deep link URL to open maps app with directions to airport
 */
export function generateMapsUrl(
  airportCode: string,
  airportName: string,
  mode: 'driving' | 'rideshare' | 'transit',
  tripContext?: TripContext,
  travelMinutes?: number
): string {
  const destination = `${airportName} (${airportCode})`;

  // Calculate desired arrival/departure time if context is provided
  const arrivalTime = tripContext ? calculateAirportArrivalTime(tripContext) : undefined;

  // Detect iOS for Apple Maps
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // Apple Maps URL scheme
    // dirflg: d=driving, r=transit/public transport
    // Note: Apple Maps doesn't support departure/arrival time parameters
    const directionFlag = mode === 'transit' ? 'r' : 'd';
    return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=${directionFlag}`;
  } else {
    // Google Maps (Android and desktop)
    // Map our modes to Google Maps travelmode parameter
    let travelMode = 'driving';
    if (mode === 'transit') {
      travelMode = 'transit';
    } else if (mode === 'rideshare') {
      travelMode = 'driving'; // rideshare uses driving directions
    }

    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;

    // Google Maps only supports time parameters for transit mode
    if (mode === 'transit' && arrivalTime) {
      // Use arrival_time for transit to show routes that arrive by this time
      const arrivalTimestamp = Math.floor(arrivalTime.getTime() / 1000);
      url += `&arrival_time=${arrivalTimestamp}`;
    } else if (mode !== 'transit' && arrivalTime && travelMinutes) {
      // For driving/rideshare, calculate departure time
      // Note: Google Maps driving directions don't support departure_time in URL API
      // But we include it anyway as it may work in some contexts
      const departureTime = calculateDepartureTime(arrivalTime, travelMinutes);
      const departureTimestamp = Math.floor(departureTime.getTime() / 1000);
      url += `&departure_time=${departureTimestamp}`;
    }

    return url;
  }
}
