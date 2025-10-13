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
  const avg = Math.round((min + max) / 2);

  return (
    <div className="space-y-4">
      {/* Lognormal Distribution Visualization */}
      <div className="relative mt-5">
        <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
          <defs>
            <linearGradient id="travelTimeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Lognormal distribution shape: sharp rise, peak left, fat right tail */}
          {/* Distribution spans from min to max horizontally */}
          <path
            d={`M ${(min / 120) * 200},50 L ${(min / 120) * 200},40 Q ${(min / 120) * 200 + 20},18 ${(min / 120) * 200 + 40},9 T ${((min + max) / 2 / 120) * 200},6 Q ${((min + max) / 2 / 120) * 200 + 20},7 ${((min + max) / 2 / 120) * 200 + 40},11 T ${(max / 120) * 200 - 20},22 Q ${(max / 120) * 200 - 10},28 ${(max / 120) * 200},34 L ${(max / 120) * 200},38 L ${(max / 120) * 200},50 Z`}
            fill="url(#travelTimeGradient)"
            className="transition-all duration-400"
          />

          {/* Mean marker (dashed line positioned right of peak) */}
          <line
            x1={`${(avg / 120) * 200}`}
            y1="3"
            x2={`${(avg / 120) * 200}`}
            y2="50"
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="3,3"
            className="transition-all duration-400"
          />

          {/* Min label */}
          <text
            x={`${(min / 120) * 200}`}
            y="46"
            fontSize="9"
            fill="#6b7280"
            textAnchor="middle"
            className="transition-all duration-400"
          >
            {min}
          </text>

          {/* Max label */}
          <text
            x={`${(max / 120) * 200}`}
            y="46"
            fontSize="9"
            fill="#6b7280"
            textAnchor="middle"
            className="transition-all duration-400"
          >
            {max}
          </text>
        </svg>

        {/* Mean value label below */}
        <div className="flex justify-center mt-1">
          <span className="text-sm font-bold text-gray-900">{avg} min</span>
        </div>
      </div>

      {/* Editable Min/Max Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fastest (minutes)</label>
          <input
            type="number"
            value={minMinutes}
            onChange={(e) => onMinChange(e.target.value)}
            min="1"
            placeholder="e.g., 20"
            className="w-full h-12 px-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       border border-gray-200 dark:border-gray-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Slowest (minutes)</label>
          <input
            type="number"
            value={maxMinutes}
            onChange={(e) => onMaxChange(e.target.value)}
            min="1"
            placeholder="e.g., 45"
            className="w-full h-12 px-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       border border-gray-200 dark:border-gray-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
