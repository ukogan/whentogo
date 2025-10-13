'use client';

import { useState, useEffect, useRef } from 'react';

type BagCheckOption = 'none' | 'priority' | 'regular';

interface BagCheckSelectorProps {
  hasCheckedBag: boolean;
  hasPriorityBagCheck: boolean;
  onChange: (hasCheckedBag: boolean, hasPriorityBagCheck: boolean) => void;
}

const bagCheckOptions = {
  none: {
    label: 'No bag',
    avg: '0',
    min: '0',
    max: '0',
    stats: { best: '0', typical: '0', worst: '0' },
    hasCheckedBag: false,
    hasPriorityBagCheck: false,
  },
  priority: {
    label: 'Priority',
    avg: '10',
    min: '5',
    max: '15',
    stats: { best: '5', typical: '10', worst: '15' },
    hasCheckedBag: true,
    hasPriorityBagCheck: true,
  },
  regular: {
    label: 'Regular',
    avg: '25',
    min: '15',
    max: '35',
    stats: { best: '15', typical: '25', worst: '35' },
    hasCheckedBag: true,
    hasPriorityBagCheck: false,
  },
};

export default function BagCheckSelector({ hasCheckedBag, hasPriorityBagCheck, onChange }: BagCheckSelectorProps) {
  // Determine initial selection based on props
  const getInitialSelection = (): BagCheckOption => {
    if (!hasCheckedBag) return 'none';
    if (hasPriorityBagCheck) return 'priority';
    return 'regular';
  };

  const [selected, setSelected] = useState<BagCheckOption>(getInitialSelection());
  const [sliderStyle, setSliderStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    updateSlider(selected === 'none' ? 0 : selected === 'priority' ? 1 : 2);
  }, []);

  const updateSlider = (index: number) => {
    const element = optionRefs.current[index];
    if (element) {
      setSliderStyle({
        width: element.offsetWidth,
        left: element.offsetLeft - 3, // Account for padding
      });
    }
  };

  const handleSelect = (option: BagCheckOption, index: number) => {
    setSelected(option);
    updateSlider(index);
    const optionData = bagCheckOptions[option];
    onChange(optionData.hasCheckedBag, optionData.hasPriorityBagCheck);
  };

  const data = bagCheckOptions[selected];

  // Show bar only when there's a bag to check
  const showBar = selected !== 'none';

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Bag Check:
      </label>

      {/* iOS-style pill toggle */}
      <div className="relative inline-flex bg-gray-100 p-[3px] rounded-xl">
        {/* Animated slider background */}
        <div
          className="absolute top-[3px] h-[calc(100%-6px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
          style={{
            width: `${sliderStyle.width}px`,
            left: `${sliderStyle.left}px`,
          }}
        />

        {/* Options */}
        {(['none', 'priority', 'regular'] as BagCheckOption[]).map((option, index) => (
          <div
            key={option}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            onClick={() => handleSelect(option, index)}
            className={`relative z-10 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors duration-200 ${
              selected === option ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {bagCheckOptions[option].label}
          </div>
        ))}
      </div>

      {/* Lognormal Distribution Visualization */}
      {showBar && (
        <div className="relative mt-5 pb-8">
          <svg viewBox="0 0 200 60" className="w-full h-16" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={`bagGradient-${selected}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Distribution curve */}
            <path
              d={(() => {
                const min = parseInt(data.min);
                const max = parseInt(data.max);
                const mode = min + (max - min) * 0.3;
                const sigma = (max - min) / 6;
                const lambda = 0.3;

                const points: Array<{x: number; y: number}> = [];
                const numPoints = 100;

                for (let i = 0; i <= numPoints; i++) {
                  const minute = min + ((max - min) * i / numPoints);
                  const x = (minute / 35) * 200;
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
              fill={`url(#bagGradient-${selected})`}
              className="transition-all duration-400"
            />

            {/* Mean marker */}
            <line
              x1={(parseInt(data.avg) / 35) * 200}
              y1="5"
              x2={(parseInt(data.avg) / 35) * 200}
              y2="60"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              opacity="0.8"
              className="transition-all duration-400"
            />

            {/* Min/Max labels */}
            <text x={(parseInt(data.min) / 35) * 200} y="57" fontSize="8" fill="#6b7280" textAnchor="middle">
              {data.min}
            </text>
            <text x={(parseInt(data.max) / 35) * 200} y="57" fontSize="8" fill="#6b7280" textAnchor="middle">
              {data.max}
            </text>
          </svg>

          {/* Mean value label below */}
          <div className="flex justify-center mt-2">
            <span className="text-sm font-bold text-gray-900">{data.avg} min</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
