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
      {/* Distribution Visualization with gradient bar */}
      <div className="relative mt-5 pb-8">
        <div className="relative h-12 w-full">
          {/* Gradient bar positioned based on min/max */}
          <div
            className="absolute rounded-full transition-all duration-400 ease-out shadow-md overflow-hidden"
            style={{
              left: `${(min / 120) * 100}%`,
              width: `${((max - min) / 120) * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.5) 50%, rgba(249, 115, 22, 0.3) 100%)',
            }}
          />

          {/* Mean marker (dashed line positioned right of peak) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-500 transition-all duration-400"
            style={{
              left: `${(avg / 120) * 100}%`,
              backgroundImage: 'repeating-linear-gradient(0deg, #22c55e, #22c55e 4px, transparent 4px, transparent 8px)',
            }}
          />

          {/* Min label */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(min / 120) * 100}%`,
              top: '100%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
            }}
          >
            <span className="text-xs text-gray-600">{min}</span>
          </div>

          {/* Max label */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(max / 120) * 100}%`,
              top: '100%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
            }}
          >
            <span className="text-xs text-gray-600">{max}</span>
          </div>
        </div>

        {/* Mean value label below */}
        <div className="flex justify-center mt-6">
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
