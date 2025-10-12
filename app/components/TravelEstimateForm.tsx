'use client';

import { useState } from 'react';
import type { TravelEstimate, TravelMode, TripContext } from '../lib/types';
import { Car, Navigation, Train, MapPin } from 'lucide-react';
import TravelTimeSlider from './TravelTimeSlider';
import { generateMapsUrl } from '../lib/mapsUtils';

interface TravelEstimateFormProps {
  onComplete: (estimate: TravelEstimate) => void;
  onBack: () => void;
  onPartialUpdate?: (partial: Partial<TravelEstimate>) => void;
  tripContext?: TripContext;
}

export default function TravelEstimateForm({ onComplete, onBack, onPartialUpdate, tripContext }: TravelEstimateFormProps) {
  const [mode, setMode] = useState<TravelMode>('rideshare');
  const [minMinutes, setMinMinutes] = useState('25');
  const [maxMinutes, setMaxMinutes] = useState('45');
  const [parkingToTerminalMin, setParkingToTerminalMin] = useState('15');

  const canContinue = minMinutes && maxMinutes && Number(minMinutes) < Number(maxMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;

    const estimate: TravelEstimate = {
      mode,
      minMinutes: Number(minMinutes),
      maxMinutes: Number(maxMinutes),
      parkingToTerminalMin: mode === 'driving' ? Number(parkingToTerminalMin) : undefined,
    };

    onComplete(estimate);
  };

  const modeOptions = [
    {
      value: 'driving' as TravelMode,
      label: 'Driving',
      icon: Car,
      description: '+ parking',
    },
    {
      value: 'rideshare' as TravelMode,
      label: 'Rideshare',
      icon: Navigation,
      description: 'Uber/Lyft',
    },
    {
      value: 'transit' as TravelMode,
      label: 'Transit',
      icon: Train,
      description: 'Bus/train',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How are you getting to the airport?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = mode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  // Immediately update parent with new mode
                  onPartialUpdate?.({ mode: option.value });
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                           ${
                             isSelected
                               ? 'border-blue-500 bg-blue-50'
                               : 'border-gray-200 bg-white hover:border-gray-300'
                           }`}
              >
                <Icon
                  className={`h-6 w-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}
                />
                <div className="text-center">
                  <div
                    className={`text-sm font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Maps App Button */}
      {tripContext && (
        <div className="space-y-2">
          <a
            href={generateMapsUrl(tripContext.airport.code, tripContext.airport.name, mode, tripContext)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            <MapPin className="h-5 w-5" />
            Check Maps for {mode} time
          </a>
          <p className="text-sm text-gray-600 text-center">
            Set arrival to {new Date(tripContext.flightTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Travel Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          About how long does it usually take you to get to the airport?
        </label>
        <TravelTimeSlider
          minMinutes={minMinutes}
          maxMinutes={maxMinutes}
          onMinChange={setMinMinutes}
          onMaxChange={setMaxMinutes}
        />

        {minMinutes && maxMinutes && Number(minMinutes) >= Number(maxMinutes) && (
          <p className="mt-2 text-sm text-red-500">
            Maximum time must be greater than minimum time
          </p>
        )}
      </div>

      {/* Parking Time (conditional) */}
      {mode === 'driving' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How long from parking to the terminal?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={parkingToTerminalMin}
              onChange={(e) => setParkingToTerminalMin(e.target.value)}
              min="0"
              className="w-24 h-12 px-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         border border-gray-200 dark:border-gray-600 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-600 dark:text-gray-400">minutes</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Includes parking, shuttle wait, and walk to terminal
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl font-semibold text-gray-700 bg-gray-100
                     hover:bg-gray-200 active:scale-[0.98] transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canContinue}
          className={`flex-1 h-12 rounded-xl font-semibold text-white transition-all
                     ${
                       canContinue
                         ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98]'
                         : 'bg-gray-300 cursor-not-allowed'
                     }`}
        >
          Next: Get recommendation
        </button>
      </div>
    </form>
  );
}
