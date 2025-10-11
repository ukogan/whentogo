'use client';

import { useState } from 'react';
import type { CostPreferences, CostLevel } from '../lib/types';
import { AlertCircle, Clock } from 'lucide-react';

interface CostDialsFormProps {
  onComplete: (preferences: CostPreferences) => void;
  onBack: () => void;
}

export default function CostDialsForm({ onComplete, onBack }: CostDialsFormProps) {
  const [costMissing, setCostMissing] = useState<CostLevel>(3);
  const [costWaiting, setCostWaiting] = useState<CostLevel>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preferences: CostPreferences = {
      costMissing,
      costWaiting,
    };

    onComplete(preferences);
  };

  const missingOptions = [
    { value: 1 as CostLevel, label: "No big deal, I'd catch another flight" },
    { value: 2 as CostLevel, label: 'Annoying and inconvenient' },
    { value: 3 as CostLevel, label: 'Very stressful' },
    { value: 4 as CostLevel, label: 'Expensive or creates major problems' },
    { value: 5 as CostLevel, label: 'Catastrophic — I cannot miss this' },
  ];

  const waitingOptions = [
    { value: 1 as CostLevel, label: "No problem, I'll grab coffee" },
    { value: 2 as CostLevel, label: 'A bit boring' },
    { value: 3 as CostLevel, label: 'A waste of time' },
    { value: 4 as CostLevel, label: 'Really annoying' },
    { value: 5 as CostLevel, label: 'Unbearable — I hate waiting' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Missing Flight Dial */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <label className="text-lg font-semibold text-gray-900">
            Missing the flight would be:
          </label>
        </div>

        <div className="space-y-2">
          {missingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCostMissing(option.value)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all
                         ${
                           costMissing === option.value
                             ? 'border-red-500 bg-red-50'
                             : 'border-gray-200 bg-white hover:border-gray-300'
                         }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                             ${
                               costMissing === option.value
                                 ? 'border-red-500 bg-red-500'
                                 : 'border-gray-300'
                             }`}
                >
                  {costMissing === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-base ${
                    costMissing === option.value ? 'text-red-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Waiting Time Dial */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-blue-500" />
          <label className="text-lg font-semibold text-gray-900">
            Extra time in the airport is:
          </label>
        </div>

        <div className="space-y-2">
          {waitingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCostWaiting(option.value)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all
                         ${
                           costWaiting === option.value
                             ? 'border-blue-500 bg-blue-50'
                             : 'border-gray-200 bg-white hover:border-gray-300'
                         }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                             ${
                               costWaiting === option.value
                                 ? 'border-blue-500 bg-blue-500'
                                 : 'border-gray-300'
                             }`}
                >
                  {costWaiting === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-base ${
                    costWaiting === option.value ? 'text-blue-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

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
          className="flex-1 h-12 rounded-xl font-semibold text-white bg-blue-500
                     hover:bg-blue-600 active:scale-[0.98] transition-all"
        >
          Get Recommendation
        </button>
      </div>
    </form>
  );
}
