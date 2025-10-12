'use client';

import { useState } from 'react';
import type { CostPreferences, CostLevel } from '../lib/types';
import EmotionalSlider from './EmotionalSlider';

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
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Missing Flight Dial */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-6 text-center">
          Missing the flight would be:
        </label>
        <EmotionalSlider
          value={costMissing}
          onChange={(val) => setCostMissing(val as CostLevel)}
          labels={missingOptions.map(o => o.label)}
        />
      </div>

      {/* Waiting Time Dial */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-6 text-center">
          Extra time in the airport is:
        </label>
        <EmotionalSlider
          value={costWaiting}
          onChange={(val) => setCostWaiting(val as CostLevel)}
          labels={waitingOptions.map(o => o.label)}
        />
      </div>

      {/* Continue Button */}
      <div>
        <button
          type="submit"
          className="w-full h-14 rounded-xl font-semibold text-white bg-blue-500
                     hover:bg-blue-600 active:scale-[0.98] transition-all text-lg"
        >
          Next: airport and flight details
        </button>
      </div>
    </form>
  );
}
