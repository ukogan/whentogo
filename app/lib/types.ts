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
  hasTerminalTrain?: boolean;    // Does this airport have a train/tram between terminals?
  trainHeadwayMin?: number;       // Average wait time between trains (e.g., ATL=2, DFW=2.5)
}

export interface TripContext {
  airport: Airport;
  flightTime: Date;
  flightType: FlightType;
  hasCheckedBag: boolean;
  hasPriorityBagCheck: boolean; // Priority bag drop (airline status, premium cabin)
  hasPreCheck: boolean;
  hasClear: boolean;
  boardingStartMin: number;  // Minutes before departure when boarding starts (default 30)
  doorCloseMin: number;      // Minutes before departure when door closes (default 15)
  isFamiliarAirport: boolean; // Have you flown from this airport before? (affects robustness premium)
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
    probMakeFlight: number;           // Probability of making flight at optimal time
    waitBeforeDoorCloses: number;     // Expected wait time before door closes
    arriveBeforeBoardingStarts: boolean;  // Whether you arrive before boarding starts
    timeRelativeToBoardingStart: number;  // Minutes before (+) or after (-) boarding starts
  };
  samples: number[];              // Monte Carlo samples for interactive exploration
  flightTime: Date;               // Flight departure time
  debugInfo?: {
    alpha: number;                // Critical fractile ratio
    totalTimeMinutes: number;     // Total time from leave to door close
    components: {
      travel: number;
      parking: number;
      curbToSecurity: number;
      security: number;
      securityToGate: number;
      doorCloseBuffer: number;    // Changed from boardingBuffer
    };
  };
}

export interface SimulationInputs {
  tripContext: TripContext;
  travelEstimate: TravelEstimate;
  costPreferences: CostPreferences;
}
