'use client';

import { useState, useEffect } from 'react';
import AirportAutocomplete from './AirportAutocomplete';
import type { TripContext, Airport, FlightType } from '../lib/types';
import { Calendar, Plane } from 'lucide-react';
import SecuritySelector from './SecuritySelector';
import BagCheckSelector from './BagCheckSelector';

interface TripContextFormProps {
  onComplete: (context: TripContext) => void;
}

export default function TripContextForm({ onComplete }: TripContextFormProps) {
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

  // Default to tomorrow at 12:30 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultTime = '12:30';

  const [airport, setAirport] = useState<Airport | null>(defaultAirport);
  const [flightDate, setFlightDate] = useState(defaultDate);
  const [flightTime, setFlightTime] = useState(defaultTime);
  const [flightType, setFlightType] = useState<FlightType>('domestic');
  const [hasCheckedBag, setHasCheckedBag] = useState(false);
  const [hasPriorityBagCheck, setHasPriorityBagCheck] = useState(false);
  const [hasPreCheck, setHasPreCheck] = useState(false);
  const [hasClear, setHasClear] = useState(false);
  const [boardingStartMin, setBoardingStartMin] = useState('30');
  const [doorCloseMin, setDoorCloseMin] = useState('15');
  const [isUnfamiliarAirport, setIsUnfamiliarAirport] = useState(false);

  // Update boarding times when flight type changes
  useEffect(() => {
    if (flightType === 'domestic') {
      setBoardingStartMin('30');
      setDoorCloseMin('10');
    } else {
      setBoardingStartMin('45');
      setDoorCloseMin('15');
    }
  }, [flightType]);

  const canContinue = airport && flightDate && flightTime;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;

    // Combine date and time into a single Date object
    const flightDateTime = new Date(`${flightDate}T${flightTime}`);

    const context: TripContext = {
      airport,
      flightTime: flightDateTime,
      flightType,
      hasCheckedBag,
      hasPriorityBagCheck,
      hasPreCheck,
      hasClear,
      boardingStartMin: parseInt(boardingStartMin, 10),
      doorCloseMin: parseInt(doorCloseMin, 10),
      isFamiliarAirport: !isUnfamiliarAirport, // Invert: unchecked means familiar
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

      {/* Flight Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flight Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 pl-12 pr-4 text-base bg-white border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departure Time
          </label>
          <input
            type="time"
            value={flightTime}
            onChange={(e) => setFlightTime(e.target.value)}
            className="w-full h-12 px-4 text-base bg-white border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Flight Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flight Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFlightType('domestic')}
            className={`h-12 px-4 rounded-xl border-2 font-medium transition-all
                       ${
                         flightType === 'domestic'
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                       }`}
          >
            Domestic
          </button>
          <button
            type="button"
            onClick={() => setFlightType('international')}
            className={`h-12 px-4 rounded-xl border-2 font-medium transition-all
                       ${
                         flightType === 'international'
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                       }`}
          >
            <div className="flex flex-col items-center">
              <span>International</span>
              <span className="text-xs opacity-70">(earlier boarding)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Boarding Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Boarding Starts (min before departure)
          </label>
          <input
            type="number"
            value={boardingStartMin}
            onChange={(e) => setBoardingStartMin(e.target.value)}
            min="10"
            max="90"
            className="w-full h-12 px-4 text-base bg-white border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Door Closes (min before departure)
          </label>
          <input
            type="number"
            value={doorCloseMin}
            onChange={(e) => setDoorCloseMin(e.target.value)}
            min="5"
            max="30"
            className="w-full h-12 px-4 text-base bg-white border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Security Selector */}
      <SecuritySelector
        hasPreCheck={hasPreCheck}
        hasClear={hasClear}
        onChange={(preCheck, clear) => {
          setHasPreCheck(preCheck);
          setHasClear(clear);
        }}
      />

      {/* Bag Check Selector */}
      <BagCheckSelector
        hasCheckedBag={hasCheckedBag}
        hasPriorityBagCheck={hasPriorityBagCheck}
        onChange={(checkedBag, priorityCheck) => {
          setHasCheckedBag(checkedBag);
          setHasPriorityBagCheck(priorityCheck);
        }}
      />

      {/* Other Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isUnfamiliarAirport}
            onChange={(e) => setIsUnfamiliarAirport(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <Plane className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
            Unfamiliar airport <span className="text-sm text-gray-500">(+20 min)</span>
          </span>
        </label>
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
        Continue
      </button>
    </form>
  );
}
