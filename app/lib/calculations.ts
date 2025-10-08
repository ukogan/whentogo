/**
 * Core probabilistic calculations for Airport Timing Advisor
 * Implements critical-fractile newsvendor model with Monte Carlo simulation
 */

import { sampleLognormal, fitLognormalFromMinMax, computeQuantile } from './distributions';
import type {
  Airport,
  TripContext,
  TravelEstimate,
  CostPreferences,
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
 * Boarding cutoff times (minutes before flight departure)
 */
const BOARDING_CUTOFF = {
  domestic: 15,
  international: 30,
} as const;

/**
 * Default parking-to-terminal time (minutes)
 */
const DEFAULT_PARKING_TIME = 15;

/**
 * Number of Monte Carlo samples
 */
const NUM_SAMPLES = 10000;

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

  // Fit lognormal for security (using mean ± 1.5*std as min/max approximation)
  const securityMin = Math.max(1, securityParams.mean - 1.5 * securityParams.std);
  const securityMax = securityParams.mean + 1.5 * securityParams.std;
  const securityLognormalParams = fitLognormalFromMinMax(securityMin, securityMax);

  // Fixed components
  const parkingTime = travelEstimate.mode === 'driving'
    ? (travelEstimate.parkingToTerminalMin ?? DEFAULT_PARKING_TIME)
    : 0;

  const boardingBuffer = BOARDING_CUTOFF[tripContext.flightType];

  // Generate samples
  const samples: number[] = [];
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const travelSample = sampleLognormal(travelParams.mu, travelParams.sigma);
    const securitySample = sampleLognormal(
      securityLognormalParams.mu,
      securityLognormalParams.sigma
    );

    const totalTime = travelSample + parkingTime + securitySample + boardingBuffer;
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
  const optimalTotalTimeMinutes = computeQuantile(samples, targetConfidence);

  // Compute range: show trade-off around optimal point
  // Higher percentile = more time budgeted = earlier departure (safer)
  // Lower percentile = less time budgeted = later departure (efficient)
  const earlierPercentile = Math.min(0.98, targetConfidence + 0.05);  // Cap at 98%
  const laterPercentile = Math.max(targetConfidence - 0.10, 0.70);     // Floor at 70%

  const earliestTotalTime = computeQuantile(samples, Math.max(earlierPercentile, laterPercentile));
  const latestTotalTime = computeQuantile(samples, Math.min(earlierPercentile, laterPercentile));

  // Convert total times to leave times (flight time - total time)
  // Note: Higher total time needed = Earlier leave time
  const flightTime = tripContext.flightTime.getTime();
  const optimalLeaveTime = new Date(flightTime - optimalTotalTimeMinutes * 60 * 1000);
  const earliest = new Date(flightTime - earliestTotalTime * 60 * 1000);  // More time budgeted = earlier departure
  const latest = new Date(flightTime - latestTotalTime * 60 * 1000);     // Less time budgeted = later departure

  // Calculate probability of making flight at optimal time
  // This is the target confidence by definition (we chose that quantile)
  const probMakeFlight = targetConfidence;

  // Expected wait time = total time - time actually needed (approximate)
  const medianActualTime = computeQuantile(samples, 0.5);
  const expectedWaitMinutes = Math.max(0, optimalTotalTimeMinutes - medianActualTime);

  // Calculate component breakdown for debug
  const parkingTime = travelEstimate.mode === 'driving'
    ? (travelEstimate.parkingToTerminalMin ?? DEFAULT_PARKING_TIME)
    : 0;

  const securityParams = getSecurityPriors(
    tripContext.airport,
    tripContext.hasPreCheck,
    tripContext.hasClear
  );

  const components = {
    travel: (travelEstimate.minMinutes + travelEstimate.maxMinutes) / 2,
    parking: parkingTime,
    security: securityParams.mean,
    boardingBuffer: BOARDING_CUTOFF[tripContext.flightType],
  };

  return {
    optimalLeaveTime,
    recommendedRange: {
      earliest,
      latest,
    },
    tradeoffMetrics: {
      probMakeFlight,
      expectedWaitMinutes,
    },
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
