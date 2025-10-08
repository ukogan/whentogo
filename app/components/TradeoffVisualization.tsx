'use client';

import { motion } from 'framer-motion';
import type { Recommendation } from '../lib/types';
import { Clock, Plane, TrendingUp } from 'lucide-react';

interface TradeoffVisualizationProps {
  recommendation: Recommendation;
  onStartOver: () => void;
}

export default function TradeoffVisualization({
  recommendation,
  onStartOver,
}: TradeoffVisualizationProps) {
  const { optimalLeaveTime, recommendedRange, tradeoffMetrics, debugInfo } = recommendation;

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
                {formatTime(recommendedRange.latest)}
              </div>
              <div className="text-2xl text-gray-400">—</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(recommendedRange.earliest)}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">{formatDate(optimalLeaveTime)}</div>
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

          <p className="text-xs text-gray-500 mt-2">Chance you'll make your flight</p>
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

      {/* Debug Info (Collapsible) */}
      {debugInfo && (
        <details className="bg-gray-50 rounded-xl p-4 text-sm">
          <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Technical Details
          </summary>
          <div className="mt-4 space-y-2 text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>Critical fractile (α):</div>
              <div className="font-mono">{(debugInfo.alpha * 100).toFixed(1)}%</div>

              <div>Total time (L*):</div>
              <div className="font-mono">{Math.round(debugInfo.totalTimeMinutes)} min</div>

              <div className="col-span-2 mt-2 font-medium">Components:</div>
              <div className="pl-4">Travel:</div>
              <div className="font-mono">{Math.round(debugInfo.components.travel)} min</div>

              <div className="pl-4">Parking:</div>
              <div className="font-mono">{debugInfo.components.parking} min</div>

              <div className="pl-4">Security:</div>
              <div className="font-mono">{Math.round(debugInfo.components.security)} min</div>

              <div className="pl-4">Boarding buffer:</div>
              <div className="font-mono">{debugInfo.components.boardingBuffer} min</div>
            </div>
          </div>
        </details>
      )}

      {/* Start Over Button */}
      <button
        onClick={onStartOver}
        className="w-full h-12 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200
                   hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        Plan Another Trip
      </button>
    </div>
  );
}
