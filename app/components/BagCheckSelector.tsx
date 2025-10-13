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
        <div className="relative mt-5">
          <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`bagCheckGradient-${selected}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86efac" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Lognormal distribution shape: sharp rise, peak left, fat right tail */}
            {/* Distribution spans from min to max horizontally */}
            <path
              d={`M ${(parseInt(data.min) / 35) * 200},50 L ${(parseInt(data.min) / 35) * 200},40 Q ${(parseInt(data.min) / 35) * 200 + 20},18 ${(parseInt(data.min) / 35) * 200 + 40},9 T ${((parseInt(data.min) + parseInt(data.max)) / 2 / 35) * 200},6 Q ${((parseInt(data.min) + parseInt(data.max)) / 2 / 35) * 200 + 20},7 ${((parseInt(data.min) + parseInt(data.max)) / 2 / 35) * 200 + 40},11 T ${(parseInt(data.max) / 35) * 200 - 20},22 Q ${(parseInt(data.max) / 35) * 200 - 10},28 ${(parseInt(data.max) / 35) * 200},34 L ${(parseInt(data.max) / 35) * 200},38 L ${(parseInt(data.max) / 35) * 200},50 Z`}
              fill={`url(#bagCheckGradient-${selected})`}
              className="transition-all duration-400"
            />

            {/* Mean marker (dashed line positioned right of peak) */}
            <line
              x1={`${(parseInt(data.avg) / 35) * 200}`}
              y1="3"
              x2={`${(parseInt(data.avg) / 35) * 200}`}
              y2="50"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="3,3"
              className="transition-all duration-400"
            />

            {/* Min label */}
            <text
              x={`${(parseInt(data.min) / 35) * 200}`}
              y="46"
              fontSize="9"
              fill="#6b7280"
              textAnchor="middle"
              className="transition-all duration-400"
            >
              {data.min}
            </text>

            {/* Max label */}
            <text
              x={`${(parseInt(data.max) / 35) * 200}`}
              y="46"
              fontSize="9"
              fill="#6b7280"
              textAnchor="middle"
              className="transition-all duration-400"
            >
              {data.max}
            </text>
          </svg>

          {/* Mean value label below */}
          <div className="flex justify-center mt-1">
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
