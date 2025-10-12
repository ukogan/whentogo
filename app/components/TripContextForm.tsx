'use client';

import { useState, useEffect } from 'react';
import AirportAutocomplete from './AirportAutocomplete';
import type { TripContext, Airport, FlightType } from '../lib/types';
import { Calendar, Plane } from 'lucide-react';
import SecuritySelector from './SecuritySelector';
import BagCheckSelector from './BagCheckSelector';
import BoardingClock from './BoardingClock';

interface TripContextFormProps {
  onComplete: (context: TripContext) => void;
  onPartialUpdate?: (partial: Partial<TripContext>) => void;
}

export default function TripContextForm({ onComplete, onPartialUpdate }: TripContextFormProps) {
  // Default to SFO
  const defaultAirport: Airport = {
    code: 'SFO',
    name: 'San Francisco International',
    city: 'San Francisco',
    size: 'large',
    securityPriors: {
      noPreCheck: { mean: 38, std: 14 },
      withPreCheck: { mean: 12, std: 5 },
      withClear: { mean: 8, std: 3 },
    },
  };

  const [airport, setAirport] = useState<Airport | null>(defaultAirport);
  const [flightType, setFlightType] = useState<FlightType>('domestic');
  const [hasCheckedBag, setHasCheckedBag] = useState(false);
  const [hasPriorityBagCheck, setHasPriorityBagCheck] = useState(false);
  const [hasPreCheck, setHasPreCheck] = useState(false);
  const [hasClear, setHasClear] = useState(false);
  const [boardingStartMin, setBoardingStartMin] = useState('30'); // Domestic default
  const [doorCloseMin, setDoorCloseMin] = useState('10'); // Domestic default
  const [isUnfamiliarAirport, setIsUnfamiliarAirport] = useState(false);

  const canContinue = airport;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;

    const context: TripContext = {
      airport,
      flightTime: new Date(), // Will be set by parent component with actual date/time
      flightType,
      hasCheckedBag,
      hasPriorityBagCheck,
      hasPreCheck,
      hasClear,
      boardingStartMin: parseInt(boardingStartMin, 10),
      doorCloseMin: parseInt(doorCloseMin, 10),
      isFamiliarAirport: !isUnfamiliarAirport,
    };

    onComplete(context);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Airport Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Departure airport
        </label>
        <AirportAutocomplete
          selectedAirport={airport}
          onSelectAirport={setAirport}
        />
      </div>

      {/* Airport Knowledge Button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Do you know the airport?
        </label>
        <button
          type="button"
          onClick={() => {
            const newValue = !isUnfamiliarAirport;
            setIsUnfamiliarAirport(newValue);
            // Immediately update parent with new familiarity state
            onPartialUpdate?.({ isFamiliarAirport: !newValue });
          }}
          className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
            !isUnfamiliarAirport
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span>{isUnfamiliarAirport ? 'No (+20 min)' : 'Yes'}</span>
          </div>
        </button>
      </div>

      {/* Bag Check Selector */}
      <BagCheckSelector
        hasCheckedBag={hasCheckedBag}
        hasPriorityBagCheck={hasPriorityBagCheck}
        onChange={(hasBag, isPriority) => {
          setHasCheckedBag(hasBag);
          setHasPriorityBagCheck(isPriority);
          // Immediately update parent with new bag check state
          onPartialUpdate?.({ hasCheckedBag: hasBag, hasPriorityBagCheck: isPriority });
        }}
      />

      {/* Security Selector */}
      <SecuritySelector
        hasPreCheck={hasPreCheck}
        hasClear={hasClear}
        onChange={(preCheck, clear) => {
          setHasPreCheck(preCheck);
          setHasClear(clear);
          // Immediately update parent with new security state
          onPartialUpdate?.({ hasPreCheck: preCheck, hasClear: clear });
        }}
      />

      {/* Boarding Clock */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Gate Time
        </label>
        <BoardingClock
          boardingMinutes={parseInt(boardingStartMin, 10)}
          doorMinutes={parseInt(doorCloseMin, 10)}
          onBoardingChange={(min) => {
            setBoardingStartMin(min.toString());
            // Immediately update parent with new boarding time
            onPartialUpdate?.({ boardingStartMin: min });
          }}
          onDoorChange={(min) => {
            setDoorCloseMin(min.toString());
            // Immediately update parent with new door close time
            onPartialUpdate?.({ doorCloseMin: min });
          }}
          departureTime="12:30"
        />
      </div>

      {/* Continue Button */}
      <button
        type="submit"
        disabled={!canContinue}
        className={`w-full h-12 rounded-xl font-semibold text-white transition-all
                   ${
                     canContinue
                       ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98]'
                       : 'bg-gray-300 cursor-not-allowed'
                   }`}
      >
        Next: travel to airport
      </button>
    </form>
  );
}
