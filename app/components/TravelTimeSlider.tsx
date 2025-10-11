'use client';

interface TravelTimeSliderProps {
  minMinutes: string;
  maxMinutes: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export default function TravelTimeSlider({
  minMinutes,
  maxMinutes,
  onMinChange,
  onMaxChange,
}: TravelTimeSliderProps) {
  const min = Number(minMinutes) || 0;
  const max = Number(maxMinutes) || 60;
  const range = max - min;
  const avg = Math.round((min + max) / 2);

  // Calculate bar width based on range (smaller range = shorter bar)
  const maxRange = 60; // Maximum expected range
  const barWidthPercent = Math.min(100, (range / maxRange) * 100 + 20);

  return (
    <div className="space-y-4">
      {/* Gradient Bar Visualization */}
      <div className="relative h-20 flex items-center mb-2">
        {/* Gradient Bar */}
        <div
          className="relative h-10 rounded-full transition-all duration-300 shadow-md bg-gradient-to-r from-green-400 via-blue-400 to-blue-500"
          style={{ width: `${barWidthPercent}%` }}
        >
          {/* Time markers */}
          <div className="absolute inset-0 flex items-center justify-between px-4 text-white text-xs font-semibold">
            <span>{min} min</span>
            <span>{max} min</span>
          </div>
        </div>

        {/* Average time bubble */}
        <div
          className="absolute bottom-0 flex items-center justify-center"
          style={{ left: `${(barWidthPercent / 2)}%`, transform: 'translateX(-50%)' }}
        >
          <div className="bg-white border-2 border-blue-500 rounded-full px-4 py-1.5 shadow-lg">
            <span className="text-sm font-semibold text-blue-700">{avg} min</span>
          </div>
        </div>
      </div>

      {/* Editable Min/Max Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fastest (minutes)</label>
          <input
            type="number"
            value={minMinutes}
            onChange={(e) => onMinChange(e.target.value)}
            min="1"
            placeholder="e.g., 20"
            className="w-full h-12 px-4 text-base bg-white border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Slowest (minutes)</label>
          <input
            type="number"
            value={maxMinutes}
            onChange={(e) => onMaxChange(e.target.value)}
            min="1"
            placeholder="e.g., 45"
            className="w-full h-12 px-4 text-base bg-white border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
