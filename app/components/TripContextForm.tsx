'use client';

import { useState } from 'react';
import AirportAutocomplete from './AirportAutocomplete';
import type { TripContext, Airport, FlightType } from '../lib/types';
import { Calendar, Luggage, ShieldCheck, Sparkles } from 'lucide-react';

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
  const [hasPreCheck, setHasPreCheck] = useState(false);
  const [hasClear, setHasClear] = useState(false);
  const [boardingStartMin, setBoardingStartMin] = useState('30');
  const [doorCloseMin, setDoorCloseMin] = useState('15');
  const [isFamiliarAirport, setIsFamiliarAirport] = useState(true);

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
      hasPreCheck,
      hasClear,
      boardingStartMin: parseInt(boardingStartMin, 10),
      doorCloseMin: parseInt(doorCloseMin, 10),
      isFamiliarAirport,
    };

    onComplete(context);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Airport Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Which airport are you flying from?
        </label>
        <AirportAutocomplete
          selectedAirport={airport}
          onSelectAirport={setAirport}
        />
      </div>

      {/* Flight Date & Time */}
      <div className="grid grid-cols-2 gap-4">
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
            International
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

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={hasCheckedBag}
            onChange={(e) => setHasCheckedBag(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <Luggage className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
            I&apos;m checking a bag
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={hasPreCheck}
            onChange={(e) => setHasPreCheck(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <ShieldCheck className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
            I have TSA PreCheck
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={hasClear}
            onChange={(e) => setHasClear(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <Sparkles className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
            I have CLEAR
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isFamiliarAirport}
            onChange={(e) => setIsFamiliarAirport(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <Plane className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
            I&apos;ve flown from this airport before
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
