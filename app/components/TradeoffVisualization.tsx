'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Recommendation, SimulationInputs } from '../lib/types';
import { Clock, Plane, TrendingUp, Download, ArrowLeft } from 'lucide-react';

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
        expectedWaitMinutes: tradeoffMetrics.expectedWaitMinutes,
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
  const waitMinutes = Math.round(tradeoffMetrics.expectedWaitMinutes);

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

  // Adjusted total time = time we're budgeting if we leave at adjusted time
  // Negative adjustment = leave earlier = MORE time budget (subtract from original)
  // Positive adjustment = leave later = LESS time budget (subtract from original)
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
  const adjustedLeaveTime = new Date(optimalLeaveTime.getTime() - adjustmentMinutes * 60 * 1000);

  // Create histogram data for advanced mode
  const createHistogram = () => {
    if (!samplesArray || samplesArray.length === 0) return [];

    const bucketSize = 5; // 5-minute buckets
    const buckets: Record<number, number> = {};

    samplesArray.forEach(sample => {
      const bucket = Math.floor(sample / bucketSize) * bucketSize;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([bucket, count]) => ({
        time: Number(bucket),
        count,
        percentage: (count / samplesArray.length) * 100,
      }))
      .sort((a, b) => a.time - b.time);
  };

  const histogramData = showAdvanced ? createHistogram() : [];

  return (
    <div className="space-y-8">
      {/* Main Recommendation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Personalized Window</h2>

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
            <div className="text-sm text-gray-500 mt-2">{formatDate(optimalLeaveTime)}</div>
            <div className="text-sm font-medium text-gray-700 mt-3">
              for {formatTime(simulationInputs.tripContext.flightTime)} flight
            </div>
          </div>

          {/* Explanation */}
          <p className="text-base text-gray-700 leading-relaxed">
            <span className="font-medium">Earlier</span> = more peace of mind.{' '}
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
            <Plane className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">Confidence</h3>
          </div>

          <div className="text-3xl font-bold text-green-600 mb-3">{safetyScore}%</div>

          {/* Airplane Icons */}
          <div className="flex gap-1">
            {Array.from({ length: numPlanes }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Plane
                  className={`h-4 w-4 ${
                    i < filledPlanes ? 'text-green-500 fill-green-500' : 'text-gray-300'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">Chance you&apos;ll make your flight</p>
        </motion.div>

        {/* Wait Time */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Wait Time</h3>
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

          <p className="text-xs text-gray-500 mt-2">Expected time at the gate</p>
        </motion.div>
      </div>

      {/* Interactive Time Adjustment Dial */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Explore Trade-offs
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
                      adjustmentMinutes < 0 ? 'text-green-700' : 'text-orange-700'
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
            {/* Histogram Visualization */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Distribution of Total Travel Times
              </h4>

              {histogramData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  No distribution data available. Samples: {samplesArray.length}
                </div>
              ) : (
                <div className="relative h-48">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                    <span>{Math.max(...histogramData.map(d => d.percentage)).toFixed(0)}%</span>
                    <span>0%</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-8 h-full flex items-end gap-0.5">
                    {histogramData.map((bar, i) => {
                    const maxPercentage = Math.max(...histogramData.map(d => d.percentage));
                    const heightPercent = (bar.percentage / maxPercentage) * 100;

                    // Check if this bar contains the adjusted time
                    const isAdjustedInBar = adjustedTotalTimeMinutes >= bar.time &&
                                           adjustedTotalTimeMinutes < bar.time + 5;

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center"
                        title={`${bar.time}-${bar.time + 5} min: ${bar.percentage.toFixed(1)}%`}
                      >
                        <div className="w-full bg-gray-200 rounded-t relative" style={{ height: `${heightPercent}%` }}>
                          <div
                            className={`w-full h-full rounded-t transition-colors ${
                              isAdjustedInBar ? 'bg-blue-500' : 'bg-indigo-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                  {/* X-axis labels (show every 4th) */}
                  <div className="ml-8 mt-1 flex justify-between text-xs text-gray-500">
                    {histogramData
                      .filter((_, i) => i % 4 === 0)
                      .map((bar, i) => (
                        <span key={i}>{bar.time}</span>
                      ))}
                    <span>min</span>
                  </div>
                </div>
              )}

              {/* Legend */}
              {histogramData.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-indigo-400" />
                    <span>Distribution</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Your adjusted time ({Math.round(adjustedTotalTimeMinutes)} min)</span>
                  </div>
                </div>
              )}
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
                    <div className="font-mono">{debugInfo.components.boardingBuffer} min</div>

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
