'use client';

import { useState, useMemo } from 'react';
import type { CostPreferences, CostLevel } from '../lib/types';
import EmotionalSlider from './EmotionalSlider';

interface CostDialsFormProps {
  onComplete: (preferences: CostPreferences) => void;
  onBack: () => void;
}

// Confidence matrix from calculations.ts
const CONFIDENCE_MATRIX: Record<number, Record<number, number>> = {
  1: { 1: 0.80, 2: 0.75, 3: 0.70, 4: 0.65, 5: 0.63 },
  2: { 1: 0.90, 2: 0.87, 3: 0.84, 4: 0.81, 5: 0.78 },
  3: { 1: 0.99, 2: 0.97, 3: 0.95, 4: 0.93, 5: 0.91 },
  4: { 1: 0.9999, 2: 0.9995, 3: 0.9993, 4: 0.9991, 5: 0.9989 },
  5: { 1: 0.999999, 2: 0.999995, 3: 0.999993, 4: 0.999991, 5: 0.999989 },
};

export default function CostDialsForm({ onComplete }: CostDialsFormProps) {
  const [costMissing, setCostMissing] = useState<CostLevel>(3);
  const [costWaiting, setCostWaiting] = useState<CostLevel>(3);

  // Calculate preview metrics
  const previewMetrics = useMemo(() => {
    const confidence = CONFIDENCE_MATRIX[costMissing][costWaiting];

    // Estimate gate wait time based on confidence level
    // Higher confidence = earlier arrival = more wait time
    // This is a rough approximation for preview purposes
    let estimatedWaitMin = 3;
    if (confidence >= 0.999) estimatedWaitMin = 35;
    else if (confidence >= 0.99) estimatedWaitMin = 25;
    else if (confidence >= 0.95) estimatedWaitMin = 18;
    else if (confidence >= 0.90) estimatedWaitMin = 12;
    else if (confidence >= 0.85) estimatedWaitMin = 9;
    else if (confidence >= 0.80) estimatedWaitMin = 7;
    else if (confidence >= 0.75) estimatedWaitMin = 5;
    else if (confidence >= 0.70) estimatedWaitMin = 4;
    else estimatedWaitMin = 3;

    return {
      confidence: Math.round(confidence * 100),
      waitMinutes: estimatedWaitMin,
    };
  }, [costMissing, costWaiting]);

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

      {/* Live Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-4">
          With these settings, you'll aim for:
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Confidence Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confidence</h4>
              <div className="text-3xl font-bold text-green-600 dark:text-green-500 mb-2">
                {previewMetrics.confidence}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chance you'll make your flight</p>
            </div>
          </div>

          {/* Wait Time Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gate time</h4>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-2">
                ~{previewMetrics.waitMinutes} min
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Before door closes</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Adjust the sliders above to change this tradeoff
        </p>
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
