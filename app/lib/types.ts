/**
 * Type definitions for Airport Timing Advisor
 */

export type AirportSize = 'small' | 'medium' | 'large';
export type FlightType = 'domestic' | 'international';
export type TravelMode = 'driving' | 'rideshare' | 'transit';
export type CostLevel = 1 | 2 | 3 | 4 | 5;

export interface SecurityPriors {
  noPreCheck: { mean: number; std: number };
  withPreCheck: { mean: number; std: number };
  withClear: { mean: number; std: number };
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  size: AirportSize;
  securityPriors: SecurityPriors;
}

export interface TripContext {
  airport: Airport;
  flightTime: Date;
  flightType: FlightType;
  hasCheckedBag: boolean;
  hasPreCheck: boolean;
  hasClear: boolean;
}

export interface TravelEstimate {
  mode: TravelMode;
  minMinutes: number;
  maxMinutes: number;
  parkingToTerminalMin?: number;
  curbToSecurityMin?: number;    // Walk time from curb/parking to security checkpoint
  securityToGateMin?: number;     // Walk time from security to gate
}

export interface CostPreferences {
  costMissing: CostLevel;   // How bad is missing the flight? (1=no big deal, 5=cannot miss)
  costWaiting: CostLevel;   // How bad is waiting early? (1=don't mind, 5=hate waiting)
}

export interface Recommendation {
  optimalLeaveTime: Date;
  recommendedRange: {
    earliest: Date;
    latest: Date;
  };
  tradeoffMetrics: {
    probMakeFlight: number;       // Probability of making flight at optimal time
    expectedWaitMinutes: number;   // Expected wait time at gate
  };
  samples: number[];              // Monte Carlo samples for interactive exploration
  flightTime: Date;               // Flight departure time
  debugInfo?: {
    alpha: number;                // Critical fractile ratio
    totalTimeMinutes: number;     // Total time from leave to boarding
    components: {
      travel: number;
      parking: number;
      curbToSecurity: number;
      security: number;
      securityToGate: number;
      boardingBuffer: number;
    };
  };
}

export interface SimulationInputs {
  tripContext: TripContext;
  travelEstimate: TravelEstimate;
  costPreferences: CostPreferences;
}
