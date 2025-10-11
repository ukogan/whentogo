/**
 * Core probabilistic calculations for Airport Timing Advisor
 * Implements critical-fractile newsvendor model with Monte Carlo simulation
 */

import { sampleLognormal, fitLognormalFromMinMax, sampleExGaussian, fitExGaussian, computeQuantile } from './distributions';
import type {
  Airport,
  Recommendation,
  SimulationInputs,
} from './types';

/**
 * Map cost preferences to target confidence levels
 * This replaces the traditional newsvendor model with a more intuitive approach
 * for flight timing where missing a flight is asymmetrically catastrophic.
 *
 * Matrix of confidence levels (rows=costMissing, cols=costWaiting):
 *
 *           costWaiting: 1    2    3    4    5
 * costMissing=1          0.70 0.60 0.50 0.50 0.50
 * costMissing=2          0.85 0.75 0.70 0.65 0.60
 * costMissing=3          0.95 0.92 0.90 0.85 0.80
 * costMissing=4          0.98 0.96 0.95 0.93 0.90
 * costMissing=5          0.995 0.99 0.98 0.97 0.95
 */
const CONFIDENCE_MATRIX: Record<number, Record<number, number>> = {
  1: { 1: 0.70, 2: 0.60, 3: 0.50, 4: 0.50, 5: 0.50 },
  2: { 1: 0.85, 2: 0.75, 3: 0.70, 4: 0.65, 5: 0.60 },
  3: { 1: 0.95, 2: 0.92, 3: 0.90, 4: 0.85, 5: 0.80 },
  4: { 1: 0.98, 2: 0.96, 3: 0.95, 4: 0.93, 5: 0.90 },
  5: { 1: 0.995, 2: 0.99, 3: 0.98, 4: 0.97, 5: 0.95 },
};

/**
 * Default walking times (minutes)
 */
const DEFAULT_PARKING_TIME = 15;
const DEFAULT_CURB_TO_SECURITY = 5;
const DEFAULT_SECURITY_TO_GATE = 10;

/**
 * Number of Monte Carlo samples
 */
const NUM_SAMPLES = 10000;

/**
 * Determine if flight time is during rush hour and return correlation multipliers
 * Morning rush (6-9am) and evening rush (4-7pm) increase both travel and security times
 * This models the dependence described in the paper: rush hour hits both simultaneously
 */
function getRushHourMultipliers(flightTime: Date): { travel: number; security: number } {
  const hour = flightTime.getHours();
  const dayOfWeek = flightTime.getDay(); // 0=Sunday, 6=Saturday

  // Weekend traffic patterns are lighter
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Morning rush: 6am-9am on weekdays
  if (!isWeekend && hour >= 6 && hour < 9) {
    return { travel: 1.3, security: 1.2 }; // 30% longer travel, 20% longer security
  }

  // Evening rush: 4pm-7pm on weekdays
  if (!isWeekend && hour >= 16 && hour < 19) {
    return { travel: 1.25, security: 1.15 }; // 25% longer travel, 15% longer security
  }

  // Off-peak: no multipliers
  return { travel: 1.0, security: 1.0 };
}

/**
 * Get target confidence level from cost preferences
 */
function getTargetConfidence(costMissing: number, costWaiting: number): number {
  return CONFIDENCE_MATRIX[costMissing][costWaiting];
}

/**
 * Get security time parameters based on PreCheck/CLEAR status
 */
function getSecurityPriors(
  airport: Airport,
  hasPreCheck: boolean,
  hasClear: boolean
): { mean: number; std: number } {
  if (hasClear) {
    return airport.securityPriors.withClear;
  } else if (hasPreCheck) {
    return airport.securityPriors.withPreCheck;
  } else {
    return airport.securityPriors.noPreCheck;
  }
}

/**
 * Run Monte Carlo simulation to generate distribution of total travel times
 * X = Travel + Parking + Security + Boarding Buffer
 */
function runMonteCarloSimulation(inputs: SimulationInputs): number[] {
  const { tripContext, travelEstimate } = inputs;

  // Fit lognormal for travel time
  const travelParams = fitLognormalFromMinMax(
    travelEstimate.minMinutes,
    travelEstimate.maxMinutes
  );

  // Get security time parameters
  const securityParams = getSecurityPriors(
    tripContext.airport,
    tripContext.hasPreCheck,
    tripContext.hasClear
  );

  // Fit ex-Gaussian for security (heavier tails than lognormal, as per paper)
  // Ex-Gaussian better captures "nightmare scenarios" in TSA wait times
  const securityExGaussParams = fitExGaussian(securityParams.mean, securityParams.std);

  // Fit lognormal for bag check time (if applicable)
  let bagCheckParams = null;
  if (tripContext.hasCheckedBag) {
    if (tripContext.hasPriorityBagCheck) {
      // Priority bag: 3-8 min (avg 5)
      bagCheckParams = fitLognormalFromMinMax(3, 8);
    } else {
      // Regular bag: 7-25 min (avg 12)
      bagCheckParams = fitLognormalFromMinMax(7, 25);
    }
  }

  // Fixed walking time components
  const parkingTime = travelEstimate.mode === 'driving'
    ? (travelEstimate.parkingToTerminalMin ?? DEFAULT_PARKING_TIME)
    : 0;

  const curbToSecurityTime = travelEstimate.curbToSecurityMin ?? DEFAULT_CURB_TO_SECURITY;
  const securityToGateTime = travelEstimate.securityToGateMin ?? DEFAULT_SECURITY_TO_GATE;
  const doorCloseBuffer = tripContext.doorCloseMin;

  // Terminal train/tram headway (uniform distribution for wait time)
  // Paper: "add a uniform distribution for train headways—missing a train can add 10 minutes"
  const hasTerminalTrain = tripContext.airport.hasTerminalTrain ?? false;
  const trainHeadwayMin = tripContext.airport.trainHeadwayMin ?? 2.5; // Default: ~2.5 min average

  // Get rush hour multipliers (models dependence: rush hour affects both travel AND security)
  const rushHourMultipliers = getRushHourMultipliers(tripContext.flightTime);

  // Generate samples
  const samples: number[] = [];
  for (let i = 0; i < NUM_SAMPLES; i++) {
    // Sample base travel time, then apply rush hour multiplier
    const baseTravelSample = sampleLognormal(travelParams.mu, travelParams.sigma);
    const travelSample = baseTravelSample * rushHourMultipliers.travel;

    // Sample base security time (ex-Gaussian for fat tails), then apply rush hour multiplier
    const baseSecuritySample = sampleExGaussian(
      securityExGaussParams.mu,
      securityExGaussParams.sigma,
      securityExGaussParams.lambda
    );
    const securitySample = baseSecuritySample * rushHourMultipliers.security;

    // Sample bag check time (if applicable)
    const bagCheckSample = bagCheckParams
      ? sampleLognormal(bagCheckParams.mu, bagCheckParams.sigma)
      : 0;

    // Terminal train wait time (uniform distribution: 0 to 2*headway)
    // You might just catch the train (0 wait) or just miss it (full headway wait)
    const trainWaitTime = hasTerminalTrain ? Math.random() * (2 * trainHeadwayMin) : 0;

    // Total time: travel + parking + walk to security + bag check + security + train + walk to gate + door close buffer
    const totalTime = travelSample + parkingTime + curbToSecurityTime + bagCheckSample +
                     securitySample + trainWaitTime + securityToGateTime + doorCloseBuffer;
    samples.push(totalTime);
  }

  return samples;
}

/**
 * Calculate optimal leave time and recommendation range
 */
export function calculateRecommendation(inputs: SimulationInputs): Recommendation {
  const { tripContext, travelEstimate, costPreferences } = inputs;

  // Get target confidence level from preference matrix
  const targetConfidence = getTargetConfidence(
    costPreferences.costMissing,
    costPreferences.costWaiting
  );

  // Run Monte Carlo simulation
  const samples = runMonteCarloSimulation(inputs);

  // Compute optimal total time at target confidence level
  let optimalTotalTimeMinutes = computeQuantile(samples, targetConfidence);

  // Apply robustness premium for unfamiliar airports (per paper: +15-20 min)
  // This handles parameter uncertainty when you haven't flown from this airport before
  if (!tripContext.isFamiliarAirport) {
    const robustnessPremium = 20; // 20 minutes conservatism margin
    optimalTotalTimeMinutes += robustnessPremium;
  }

  // Compute range: show trade-off around optimal point
  // Higher percentile = more time budgeted = earlier departure (safer)
  // Lower percentile = less time budgeted = later departure (efficient)
  const earlierPercentile = Math.min(0.98, targetConfidence + 0.05);  // Cap at 98%
  const laterPercentile = Math.max(targetConfidence - 0.10, 0.70);     // Floor at 70%

  // earlierPercentile (higher) gives MORE time budget = EARLIER leave time
  // laterPercentile (lower) gives LESS time budget = LATER leave time
  const earliestTotalTime = computeQuantile(samples, earlierPercentile);
  const latestTotalTime = computeQuantile(samples, laterPercentile);

  // Convert total times to leave times (flight time - total time)
  // Note: Higher total time needed = Earlier leave time
  const flightTime = tripContext.flightTime.getTime();
  const optimalLeaveTime = new Date(flightTime - optimalTotalTimeMinutes * 60 * 1000);
  const earliest = new Date(flightTime - earliestTotalTime * 60 * 1000);  // More time budgeted = earlier departure
  const latest = new Date(flightTime - latestTotalTime * 60 * 1000);     // Less time budgeted = later departure

  // Calculate probability of making flight at optimal time
  // This is the target confidence by definition (we chose that quantile)
  const probMakeFlight = targetConfidence;

  // Wait time before door closes = total time - time actually needed (approximate)
  const medianActualTime = computeQuantile(samples, 0.5);
  const waitBeforeDoorCloses = Math.max(0, optimalTotalTimeMinutes - medianActualTime);

  // Calculate time relative to boarding start
  // boardingStartMin is how early boarding starts before departure
  // doorCloseMin is how early door closes before departure
  // The difference is the boarding window duration
  const boardingWindowDuration = tripContext.boardingStartMin - tripContext.doorCloseMin;

  // Time from optimal arrival to boarding start
  // If positive: arrive before boarding starts (early)
  // If negative: arrive after boarding starts (rushing)
  const timeRelativeToBoardingStart = waitBeforeDoorCloses - boardingWindowDuration;
  const arriveBeforeBoardingStarts = timeRelativeToBoardingStart > 0;

  // Calculate component breakdown for debug
  const parkingTime = travelEstimate.mode === 'driving'
    ? (travelEstimate.parkingToTerminalMin ?? DEFAULT_PARKING_TIME)
    : 0;

  const curbToSecurityTime = travelEstimate.curbToSecurityMin ?? DEFAULT_CURB_TO_SECURITY;
  const securityToGateTime = travelEstimate.securityToGateMin ?? DEFAULT_SECURITY_TO_GATE;

  const securityParams = getSecurityPriors(
    tripContext.airport,
    tripContext.hasPreCheck,
    tripContext.hasClear
  );

  const components = {
    travel: (travelEstimate.minMinutes + travelEstimate.maxMinutes) / 2,
    parking: parkingTime,
    curbToSecurity: curbToSecurityTime,
    security: securityParams.mean,
    securityToGate: securityToGateTime,
    doorCloseBuffer: tripContext.doorCloseMin,
  };

  return {
    optimalLeaveTime,
    recommendedRange: {
      earliest,
      latest,
    },
    tradeoffMetrics: {
      probMakeFlight,
      waitBeforeDoorCloses,
      arriveBeforeBoardingStarts,
      timeRelativeToBoardingStart,
    },
    samples,
    flightTime: tripContext.flightTime,
    debugInfo: {
      alpha: targetConfidence,
      totalTimeMinutes: optimalTotalTimeMinutes,
      components,
    },
  };
}

/**
 * Validate simulation inputs
 */
export function validateInputs(inputs: SimulationInputs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate travel time range
  if (inputs.travelEstimate.minMinutes <= 0) {
    errors.push('Minimum travel time must be greater than 0');
  }
  if (inputs.travelEstimate.maxMinutes <= inputs.travelEstimate.minMinutes) {
    errors.push('Maximum travel time must be greater than minimum');
  }

  // Validate flight time is in the future
  if (inputs.tripContext.flightTime <= new Date()) {
    errors.push('Flight time must be in the future');
  }

  // Validate parking time for driving mode
  if (inputs.travelEstimate.mode === 'driving') {
    const parkingTime = inputs.travelEstimate.parkingToTerminalMin ?? DEFAULT_PARKING_TIME;
    if (parkingTime < 0) {
      errors.push('Parking time cannot be negative');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
