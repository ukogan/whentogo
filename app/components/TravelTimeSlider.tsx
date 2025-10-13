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
      <div className="relative mt-5 pb-8">
        <svg viewBox="0 0 200 60" className="w-full h-16" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="travelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#86efac" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Distribution curve */}
          <path
            d={(() => {
              const mode = min + (max - min) * 0.3;
              const sigma = (max - min) / 6;
              const lambda = 0.3;

              const points: Array<{x: number; y: number}> = [];
              const numPoints = 100;

              for (let i = 0; i <= numPoints; i++) {
                const minute = min + ((max - min) * i / numPoints);
                const x = (minute / 120) * 200;
                const relativeTime = minute - mode;

                let y = 0;
                if (relativeTime >= 0) {
                  const gaussianPart = Math.exp(-Math.pow(relativeTime, 2) / (2 * Math.pow(sigma, 2)));
                  const exponentialPart = Math.exp(-lambda * relativeTime);
                  y = gaussianPart * (1 + exponentialPart * 0.3);
                  if (minute > max) y *= Math.exp(-2 * (minute - max));
                }

                points.push({ x, y });
              }

              const maxY = Math.max(...points.map(p => p.y));
              const scaledPoints = points.map(p => ({ x: p.x, y: (p.y / maxY) * 45 }));

              let path = `M ${scaledPoints[0].x} 60 L ${scaledPoints[0].x} ${60 - scaledPoints[0].y}`;
              for (let i = 1; i < scaledPoints.length; i++) {
                const curr = scaledPoints[i];
                path += ` L ${curr.x} ${60 - curr.y}`;
              }
              path += ` L ${scaledPoints[scaledPoints.length - 1].x} 60 Z`;

              return path;
            })()}
            fill="url(#travelGradient)"
            className="transition-all duration-400"
          />

          {/* Mean marker */}
          <line
            x1={(avg / 120) * 200}
            y1="5"
            x2={(avg / 120) * 200}
            y2="60"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.8"
            className="transition-all duration-400"
          />

          {/* Min/Max labels */}
          <text x={(min / 120) * 200} y="57" fontSize="8" fill="#6b7280" textAnchor="middle">
            {min}
          </text>
          <text x={(max / 120) * 200} y="57" fontSize="8" fill="#6b7280" textAnchor="middle">
            {max}
          </text>
        </svg>

        {/* Mean value label below */}
        <div className="flex justify-center mt-2">
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
