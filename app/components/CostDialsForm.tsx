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
    { value: 1 as CostLevel, label: "no big deal, I'll get a bite" },
    { value: 2 as CostLevel, label: 'annoying and inconvenient' },
    { value: 3 as CostLevel, label: 'very stressful' },
    { value: 4 as CostLevel, label: 'expensive' },
    { value: 5 as CostLevel, label: 'catastrophic — I cannot miss this' },
  ];

  const waitingOptions = [
    { value: 1 as CostLevel, label: "no problem, I'll grab coffee" },
    { value: 2 as CostLevel, label: 'a bit boring' },
    { value: 3 as CostLevel, label: 'a waste of time' },
    { value: 4 as CostLevel, label: 'really annoying' },
    { value: 5 as CostLevel, label: 'unbearable — I hate waiting' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Missing Flight - Combined sentence */}
      <div>
        <p className="text-base text-gray-900 mb-4 text-center">
          Missing the flight would be{' '}
          <span className={`font-semibold ${
            costMissing === 1 ? 'text-green-700' :
            costMissing === 2 ? 'text-blue-600' :
            costMissing === 3 ? 'text-yellow-700' :
            costMissing === 4 ? 'text-orange-700' :
            'text-red-700'
          }`}>
            {missingOptions[costMissing - 1].label}
          </span>
        </p>
        <EmotionalSlider
          value={costMissing}
          onChange={(val) => setCostMissing(val as CostLevel)}
          labels={missingOptions.map(o => o.label)}
        />
      </div>

      {/* Waiting Time - Combined sentence */}
      <div>
        <p className="text-base text-gray-900 mb-4 text-center">
          Extra time in the airport is{' '}
          <span className={`font-semibold ${
            costWaiting === 1 ? 'text-green-700' :
            costWaiting === 2 ? 'text-blue-600' :
            costWaiting === 3 ? 'text-yellow-700' :
            costWaiting === 4 ? 'text-orange-700' :
            'text-red-700'
          }`}>
            {waitingOptions[costWaiting - 1].label}
          </span>
        </p>
        <EmotionalSlider
          value={costWaiting}
          onChange={(val) => setCostWaiting(val as CostLevel)}
          labels={waitingOptions.map(o => o.label)}
        />
      </div>

      {/* Live Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
        <div className="space-y-2">
          {/* Confidence Preview - Horizontal Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">You&apos;ll make it</h4>
                <div className="text-lg font-bold text-green-600 dark:text-green-500">
                  {previewMetrics.outOfText}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">times</p>
              </div>
              {/* Airplane icon filled to percentage */}
              <div className="flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12"
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
            </div>
          </div>

          {/* Wait Time Preview - Horizontal Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Gate time</h4>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-500">
                  ~{previewMetrics.waitMinutes} min
                </div>
              </div>
              {/* Coffee Cup Icons */}
              <div className="flex gap-1 flex-shrink-0">
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
            </div>
            {/* Boarding Status */}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {previewMetrics.arriveBeforeBoardingStarts ? (
                <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                  ✓ {previewMetrics.boardingMinutes} min before boarding
                </p>
              ) : (
                <p className="text-xs text-orange-600 dark:text-orange-500 font-medium">
                  ⚠ {previewMetrics.boardingMinutes} min after boarding starts
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
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
