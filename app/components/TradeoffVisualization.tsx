'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Recommendation, SimulationInputs } from '../lib/types';
import { Clock, Plane, TrendingUp, Download, ArrowLeft, Calendar } from 'lucide-react';
import { downloadCalendarEvent } from '../lib/calendarUtils';

interface TradeoffVisualizationProps {
  recommendation: Recommendation;
  simulationInputs: SimulationInputs;
  onStartOver: () => void;
  onBack: () => void;
}

export default function TradeoffVisualization({
  recommendation,
  simulationInputs,
  onStartOver,
  onBack,
}: TradeoffVisualizationProps) {
  const { optimalLeaveTime, recommendedRange, tradeoffMetrics, debugInfo, samples } = recommendation;
  const [adjustmentMinutes, setAdjustmentMinutes] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Download handler for debugging
  const handleDownload = () => {
    const data = {
      timestamp: new Date().toISOString(),
      inputs: {
        airport: {
          code: simulationInputs.tripContext.airport.code,
          name: simulationInputs.tripContext.airport.name,
          size: simulationInputs.tripContext.airport.size,
        },
        flightTime: simulationInputs.tripContext.flightTime.toISOString(),
        flightType: simulationInputs.tripContext.flightType,
        hasCheckedBag: simulationInputs.tripContext.hasCheckedBag,
        hasPreCheck: simulationInputs.tripContext.hasPreCheck,
        hasClear: simulationInputs.tripContext.hasClear,
        travelMode: simulationInputs.travelEstimate.mode,
        travelMinMinutes: simulationInputs.travelEstimate.minMinutes,
        travelMaxMinutes: simulationInputs.travelEstimate.maxMinutes,
        parkingToTerminalMin: simulationInputs.travelEstimate.parkingToTerminalMin,
        costMissing: simulationInputs.costPreferences.costMissing,
        costWaiting: simulationInputs.costPreferences.costWaiting,
      },
      outputs: {
        optimalLeaveTime: optimalLeaveTime.toISOString(),
        recommendedRange: {
          earliest: recommendedRange.earliest.toISOString(),
          latest: recommendedRange.latest.toISOString(),
        },
        probMakeFlight: tradeoffMetrics.probMakeFlight,
        waitBeforeDoorCloses: tradeoffMetrics.waitBeforeDoorCloses,
        debugInfo,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airport-timing-${simulationInputs.tripContext.airport.code}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format times
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate visual metrics
  const safetyScore = Math.round(tradeoffMetrics.probMakeFlight * 100);
  const waitMinutes = Math.round(tradeoffMetrics.waitBeforeDoorCloses);
  const boardingMinutes = Math.abs(Math.round(tradeoffMetrics.timeRelativeToBoardingStart));

  // Generate airplane icons for safety visualization
  const numPlanes = 10;
  const filledPlanes = Math.round((safetyScore / 100) * numPlanes);

  // Convert to qualitative descriptions
  const getConfidenceLabel = (prob: number): string => {
    if (prob >= 0.98) return 'almost certain';
    if (prob >= 0.93) return 'very likely';
    if (prob >= 0.85) return 'likely';
    if (prob >= 0.70) return 'good chance';
    if (prob >= 0.55) return 'decent chance';
    return 'risky';
  };

  // Calculate EXACT adjusted confidence using Monte Carlo samples
  // IMPORTANT: Negative adjustmentMinutes = leave earlier (more time) = HIGHER confidence
  //            Positive adjustmentMinutes = leave later (less time) = LOWER confidence

  // Adjusted time budget = time available if we leave at adjusted time
  // If we leave later (+adjustment), we have LESS time budget (subtract)
  // If we leave earlier (-adjustment), we have MORE time budget (subtract negative = add)
  const adjustedTotalTimeMinutes = (debugInfo?.totalTimeMinutes || 0) - adjustmentMinutes;

  // Calculate exact probability: what % of samples are ≤ our adjusted budget?
  const samplesArray = samples || [];
  const samplesUnderAdjusted = samplesArray.filter(s => s <= adjustedTotalTimeMinutes).length;
  const adjustedConfidence = samplesArray.length > 0 ? samplesUnderAdjusted / samplesArray.length : 0;

  const baseLabel = getConfidenceLabel(tradeoffMetrics.probMakeFlight);
  const adjustedLabel = getConfidenceLabel(adjustedConfidence);

  // Format adjusted time
  // Negative adjustment = leave earlier (move leave time back in time = SUBTRACT)
  // Positive adjustment = leave later (move leave time forward in time = ADD)
  const adjustedLeaveTime = new Date(optimalLeaveTime.getTime() + adjustmentMinutes * 60 * 1000);

  // Create leave time vs probability curve
  const createProbabilityCurve = () => {
    if (!samplesArray || samplesArray.length === 0 || !debugInfo) {
      console.log('No samples available for probability curve');
      return [];
    }

    const flightTime = recommendation.flightTime.getTime();
    const numPoints = 20;
    const curve = [];

    // Generate leave times from +30 min to -60 min relative to optimal (reversed for left-to-right early-to-late)
    for (let i = 0; i < numPoints; i++) {
      const offsetMin = 30 - (i * 90 / (numPoints - 1)); // +30 to -60 minutes (reversed)
      const leaveTimeMs = optimalLeaveTime.getTime() - (offsetMin * 60 * 1000);
      const leaveTime = new Date(leaveTimeMs);

      // Calculate time budget for this leave time
      const timeBudgetMinutes = (flightTime - leaveTimeMs) / (60 * 1000);

      // Calculate probability of missing flight = what % of samples exceed this budget?
      const samplesMissing = samplesArray.filter(s => s > timeBudgetMinutes).length;
      const probMissing = (samplesMissing / samplesArray.length) * 100;

      // Calculate expected wait time at gate = budget - median actual time
      const medianActualTime = samplesArray.slice().sort((a, b) => a - b)[Math.floor(samplesArray.length / 2)];
      const expectedWaitMin = Math.max(0, timeBudgetMinutes - medianActualTime);

      curve.push({
        leaveTime,
        offsetMin,
        probMissing,
        expectedWaitMin,
      });
    }

    console.log('Probability curve:', {
      points: curve.length,
      range: {
        earliest: formatTime(curve[0].leaveTime),
        latest: formatTime(curve[curve.length - 1].leaveTime)
      },
      probRange: {
        min: Math.min(...curve.map(p => p.probMissing)).toFixed(1),
        max: Math.max(...curve.map(p => p.probMissing)).toFixed(1)
      },
    });

    return curve;
  };

  const probabilityCurve = showAdvanced ? createProbabilityCurve() : [];

  return (
    <div className="space-y-8">
      {/* Main Recommendation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
      >
        <div className="text-center space-y-4">
          {/* Time Range */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-2">Leave between</div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(recommendedRange.earliest)}
              </div>
              <div className="text-2xl text-gray-400">—</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(recommendedRange.latest)}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mt-3">
              for {formatTime(simulationInputs.tripContext.flightTime)} flight
            </div>
          </div>

          {/* Explanation */}
          <p className="text-base text-gray-700 leading-relaxed">
            <span className="font-medium">Earlier</span> = more peace of mind.
            <br />
            <span className="font-medium">Later</span> = more time at home.
          </p>
        </div>
      </motion.div>

      {/* Trade-off Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Safety Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Confidence</h3>
          </div>

          <div className="text-3xl font-bold text-green-600 mb-3">{safetyScore}%</div>

          {/* Single large airplane filled to percentage */}
          <div className="relative h-16 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-32 h-32"
              style={{ transform: 'rotate(45deg)' }}
            >
              {/* Background airplane (gray) */}
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#e5e7eb"
              />
              {/* Filled airplane (green) - clipped to percentage */}
              <defs>
                <clipPath id={`plane-clip-${safetyScore}`}>
                  <rect x="0" y="0" width="24" height={24 * (safetyScore / 100)} />
                </clipPath>
              </defs>
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#10b981"
                clipPath={`url(#plane-clip-${safetyScore})`}
              />
            </svg>
          </div>

          <p className="text-xs text-gray-500 mt-2">Chance you&apos;ll make your flight</p>
        </motion.div>

        {/* Wait Time Before Door Closes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Gate time before door closes</h3>
          </div>

          <div className="text-3xl font-bold text-blue-600 mb-3">~{waitMinutes} min</div>

          {/* Coffee Cup Icons */}
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const threshold = i * 15; // 0, 15, 30, 45, 60 minutes
              const isFilled = waitMinutes > threshold;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`w-4 h-5 rounded-sm ${
                    isFilled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Boarding Status */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {tradeoffMetrics.arriveBeforeBoardingStarts ? (
              <p className="text-xs text-green-600 font-medium">
                ✓ Arrive {boardingMinutes} min before boarding starts
              </p>
            ) : (
              <p className="text-xs text-orange-600 font-medium">
                ⚠ Arrive {boardingMinutes} min after boarding starts
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Interactive Time Adjustment Dial */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Adjust Departure Time
        </h3>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Leave earlier</span>
            <span>Leave later</span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={adjustmentMinutes}
            onChange={(e) => setAdjustmentMinutes(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-blue-500
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:hover:bg-blue-600
                       [&::-webkit-slider-thumb]:transition-colors"
          />
          <div className="flex items-center justify-center text-xs text-gray-500 mt-1">
            <span>±20 minutes</span>
          </div>
        </div>

        {/* Current adjustment display */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {adjustmentMinutes === 0 ? (
            <p className="text-center text-gray-600">
              <span className="font-semibold">Slide to explore</span> how leaving earlier or later affects your odds
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Adjusted leave time:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatTime(adjustedLeaveTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Change:</span>
                <span className={`text-sm font-semibold ${
                  adjustmentMinutes < 0 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {adjustmentMinutes > 0 ? '+' : ''}{adjustmentMinutes} min
                </span>
              </div>
              {baseLabel !== adjustedLabel && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    Confidence: <span className="font-semibold">{baseLabel}</span>
                    {' → '}
                    <span className={`font-semibold ${
                      adjustedConfidence > tradeoffMetrics.probMakeFlight ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {adjustedLabel}
                    </span>
                  </p>
                </div>
              )}
              {baseLabel === adjustedLabel && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600 italic">
                    Still {baseLabel} — minimal change
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Risk Analysis Chart - moved from Advanced Mode */}
        {probabilityCurve.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Risk Analysis: When You Leave vs Probability of Missing Flight
            </h4>

            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>

              {/* Chart area */}
              <div className="ml-10 h-full flex items-end gap-px">
                {probabilityCurve.map((point, i) => {
                  const heightPx = (point.probMissing / 100) * 180; // Max 180px for 100%

                  // Check if this is near the adjusted leave time
                  const isNearAdjusted = Math.abs(point.leaveTime.getTime() - adjustedLeaveTime.getTime()) < 5 * 60 * 1000;

                  // Color based on risk level
                  let barColor = 'bg-green-500'; // < 5% risk
                  if (point.probMissing > 20) barColor = 'bg-red-500';
                  else if (point.probMissing > 10) barColor = 'bg-orange-500';
                  else if (point.probMissing > 5) barColor = 'bg-yellow-500';

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                      title={`Leave ${formatTime(point.leaveTime)}: ${point.probMissing.toFixed(1)}% risk`}
                    >
                      <div
                        className={`w-full rounded-t transition-colors ${
                          isNearAdjusted ? 'ring-2 ring-blue-500' : ''
                        } ${barColor}`}
                        style={{ height: `${heightPx}px` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels (show every 4th) */}
              <div className="ml-10 mt-1 flex justify-between text-xs text-gray-500">
                {probabilityCurve
                  .filter((_, i) => i % 4 === 0)
                  .map((point, i) => (
                    <span key={i}>{formatTime(point.leaveTime)}</span>
                  ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>&lt;5% risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>5-10%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>10-20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>&gt;20% risk</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Mode Toggle */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-semibold text-gray-900">Advanced Mode</span>
          <span className="text-sm text-gray-500">
            {showAdvanced ? 'Hide' : 'Show'} Monte Carlo Distribution
          </span>
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Component Distributions */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">
                Time Component Distributions
              </h4>

              {/* Travel Time */}
              <div className="bg-white rounded p-3">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Travel Time: {simulationInputs.travelEstimate.minMinutes}-{simulationInputs.travelEstimate.maxMinutes} min
                </div>
                <div className="h-16 bg-gradient-to-r from-transparent via-green-200 to-transparent rounded opacity-60" />
              </div>

              {/* Security Time */}
              {debugInfo && (
                <div className="bg-white rounded p-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Security Time: ~{Math.round(debugInfo.components.security)} min (avg)
                  </div>
                  <div className="h-16 bg-gradient-to-r from-transparent via-orange-200 to-transparent rounded opacity-60" />
                </div>
              )}
            </div>

            {/* Cost Trade-off Visualization */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                The Trade-off: Risk of Missing Flight vs Wait Time at Gate
              </h4>

              {probabilityCurve.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                  No trade-off data available
                </div>
              ) : (
                <div className="relative h-32">
                  {/* Dual axis chart */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-blue-600 pr-2 font-medium">
                    <span>Long</span>
                    <span className="text-gray-400">Wait</span>
                    <span>Short</span>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-red-600 pl-2 font-medium">
                    <span>High</span>
                    <span className="text-gray-400">Risk</span>
                    <span>Low</span>
                  </div>

                  {/* Chart area */}
                  <div className="mx-12 h-full flex items-center gap-px">
                    {probabilityCurve.map((point, i) => {
                    const maxWait = Math.max(...probabilityCurve.map(p => p.expectedWaitMin));
                    const riskHeight = (point.probMissing / 100) * 50; // Max 50% of container
                    const waitHeight = (point.expectedWaitMin / maxWait) * 50; // Max 50% of container

                    return (
                      <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-0.5">
                        {/* Wait time bar (blue, top) */}
                        <div
                          className="w-full bg-blue-400 opacity-60"
                          style={{ height: `${waitHeight}%` }}
                          title={`Wait: ${Math.round(point.expectedWaitMin)} min`}
                        />
                        {/* Risk bar (red, bottom) */}
                        <div
                          className="w-full bg-red-400 opacity-60"
                          style={{ height: `${riskHeight}%` }}
                          title={`Risk: ${point.probMissing.toFixed(1)}%`}
                        />
                      </div>
                    );
                  })}
                  </div>

                  {/* X-axis */}
                  <div className="mx-12 mt-1 flex justify-between text-xs text-gray-500">
                    <span>Leave earlier</span>
                    <span>Leave later</span>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-gray-600 italic">
                Blue (left axis) = time waiting at gate. Red (right axis) = risk of missing flight.
                Your optimal time balances these based on your preferences.
              </p>
            </div>

            {/* Technical Details */}
            {debugInfo && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <h4 className="font-medium text-gray-700 mb-3">Technical Details</h4>
                <div className="space-y-2 text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Target confidence:</div>
                    <div className="font-mono">{(debugInfo.alpha * 100).toFixed(1)}%</div>

                    <div>Optimal total time:</div>
                    <div className="font-mono">{Math.round(debugInfo.totalTimeMinutes)} min</div>

                    <div className="col-span-2 mt-2 font-medium">Time Components:</div>
                    <div className="pl-4">Travel:</div>
                    <div className="font-mono">{Math.round(debugInfo.components.travel)} min</div>

                    <div className="pl-4">Parking:</div>
                    <div className="font-mono">{debugInfo.components.parking} min</div>

                    <div className="pl-4">Curb → Security:</div>
                    <div className="font-mono">{debugInfo.components.curbToSecurity} min</div>

                    <div className="pl-4">Security:</div>
                    <div className="font-mono">{Math.round(debugInfo.components.security)} min</div>

                    <div className="pl-4">Security → Gate:</div>
                    <div className="font-mono">{debugInfo.components.securityToGate} min</div>

                    <div className="pl-4">Boarding buffer:</div>
                    <div className="font-mono">{debugInfo.components.doorCloseBuffer} min</div>

                    <div className="col-span-2 mt-2 font-medium">Simulation:</div>
                    <div className="pl-4">Sample count:</div>
                    <div className="font-mono">{samples.length.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => downloadCalendarEvent(recommendation, simulationInputs)}
          className="w-full h-14 rounded-xl font-semibold text-white bg-blue-500
                     hover:bg-blue-600 active:scale-[0.98] transition-all
                     flex items-center justify-center gap-2 shadow-lg"
        >
          <Calendar className="h-5 w-5" />
          Add to Calendar
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 h-12 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200
                       hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all
                       flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Data
          </button>
          <button
            onClick={onStartOver}
            className="flex-1 h-12 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200
                       hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            Plan Another Trip
          </button>
        </div>
        <button
          onClick={onBack}
          className="w-full h-12 rounded-xl font-semibold text-gray-600 bg-gray-50
                     hover:bg-gray-100 active:scale-[0.98] transition-all
                     flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit Preferences
        </button>
      </div>
    </div>
  );
}
