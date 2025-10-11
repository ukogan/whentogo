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
      {/* Thin gradient line with labels below - matches SecuritySelector style */}
      <div className="relative mt-5 pb-8">
        <div className="relative h-2 w-full">
          <div
            className="absolute h-2 rounded-full transition-all duration-400 ease-out shadow-md"
            style={{
              left: `${(min / 120) * 100}%`,
              width: `${((max - min) / 120) * 100}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #f97316 100%)',
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-full">
              <div
                className="absolute top-0 w-full h-full animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 3s linear infinite',
                }}
              />
            </div>
          </div>

          {/* Min marker at left edge of gradient bar */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(min / 120) * 100}%`,
              top: '50%',
              transform: 'translate(-100%, -50%) translateX(-8px)',
            }}
          >
            <span className="text-xs text-gray-600">{min}</span>
          </div>

          {/* Max marker at right edge of gradient bar */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(max / 120) * 100}%`,
              top: '50%',
              transform: 'translate(0%, -50%) translateX(8px)',
            }}
          >
            <span className="text-xs text-gray-600">{max}</span>
          </div>

          {/* Triangle pointer at mean position */}
          <div
            className="absolute top-full mt-1 transition-all duration-400"
            style={{
              left: `${(avg / 120) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-500" />
              <span className="text-sm font-bold text-gray-900 mt-1">{avg} min</span>
            </div>
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
