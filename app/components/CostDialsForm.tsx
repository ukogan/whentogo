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
  4: { 1: 0.995, 2: 0.993, 3: 0.991, 4: 0.989, 5: 0.987 },
  5: { 1: 0.9999, 2: 0.9995, 3: 0.9993, 4: 0.9991, 5: 0.9989 },
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

    // Estimate boarding timing (typical boarding starts 30-40 min before departure)
    // If wait time is long, you'll arrive before boarding starts
    const boardingStartMin = 35; // Typical boarding start time
    const arriveBeforeBoardingStarts = estimatedWaitMin > boardingStartMin;
    const boardingMinutes = arriveBeforeBoardingStarts
      ? estimatedWaitMin - boardingStartMin
      : boardingStartMin - estimatedWaitMin;

    // Convert confidence to "X out of Y" format
    let outOfText = '';
    const confidencePercent = Math.round(confidence * 100);
    if (confidence >= 0.999) outOfText = '999 out of 1000';
    else if (confidence >= 0.99) outOfText = '99 out of 100';
    else if (confidence >= 0.95) outOfText = '19 out of 20';
    else if (confidence >= 0.90) outOfText = '9 out of 10';
    else if (confidence >= 0.80) outOfText = '4 out of 5';
    else if (confidence >= 0.75) outOfText = '3 out of 4';
    else if (confidence >= 0.66) outOfText = '2 out of 3';
    else outOfText = `${confidencePercent} out of 100`;

    return {
      confidence: confidencePercent,
      outOfText,
      waitMinutes: estimatedWaitMin,
      arriveBeforeBoardingStarts,
      boardingMinutes,
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
        <div className="grid grid-cols-2 gap-3">
          {/* Confidence Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">You&apos;ll make it</h4>
              <div className="text-sm font-bold text-green-600 dark:text-green-500 mb-2">
                {previewMetrics.outOfText}
              </div>
              {/* Airplane icon filled to percentage */}
              <div className="relative h-10 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-16 h-16"
                  style={{ transform: 'rotate(45deg)' }}
                >
                  {/* Background airplane (gray) */}
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                    fill="#e5e7eb"
                  />
                  {/* Filled airplane (green) - clipped to percentage */}
                  <defs>
                    <clipPath id={`preview-plane-clip-${previewMetrics.confidence}`}>
                      <rect x="0" y="0" width="24" height={24 * (previewMetrics.confidence / 100)} />
                    </clipPath>
                  </defs>
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                    fill="#10b981"
                    clipPath={`url(#preview-plane-clip-${previewMetrics.confidence})`}
                  />
                </svg>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">times</p>
            </div>
          </div>

          {/* Wait Time Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gate time before door closes</h4>

            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-2">
              ~{previewMetrics.waitMinutes} min
            </div>

            {/* Coffee Cup Icons */}
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const threshold = i * 15; // 0, 15, 30, 45, 60 minutes
                const isFilled = previewMetrics.waitMinutes > threshold;

                return (
                  <div
                    key={i}
                    className={`w-3 h-4 rounded-sm transition-colors ${
                      isFilled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Boarding Status */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {previewMetrics.arriveBeforeBoardingStarts ? (
                <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                  ✓ Arrive {previewMetrics.boardingMinutes} min before boarding starts
                </p>
              ) : (
                <p className="text-xs text-orange-600 dark:text-orange-500 font-medium">
                  ⚠ Arrive {previewMetrics.boardingMinutes} min after boarding starts
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
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
