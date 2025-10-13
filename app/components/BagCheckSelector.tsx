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

      {/* Distribution Visualization with gradient bar */}
      {showBar && (
        <div className="relative mt-5 pb-8">
          <div className="relative h-12 w-full">
            {/* Gradient bar positioned based on min/max */}
            <div
              className="absolute rounded-full transition-all duration-400 ease-out shadow-md overflow-hidden"
              style={{
                left: `${(parseInt(data.min) / 35) * 100}%`,
                width: `${((parseInt(data.max) - parseInt(data.min)) / 35) * 100}%`,
                height: '100%',
                background: 'linear-gradient(to right, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.5) 50%, rgba(249, 115, 22, 0.3) 100%)',
              }}
            />

            {/* Mean marker (dashed line positioned right of peak) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-500 transition-all duration-400"
              style={{
                left: `${(parseInt(data.avg) / 35) * 100}%`,
                backgroundImage: 'repeating-linear-gradient(0deg, #22c55e, #22c55e 4px, transparent 4px, transparent 8px)',
              }}
            />

            {/* Min label */}
            <div
              className="absolute transition-all duration-400"
              style={{
                left: `${(parseInt(data.min) / 35) * 100}%`,
                top: '100%',
                transform: 'translateX(-50%)',
                marginTop: '4px',
              }}
            >
              <span className="text-xs text-gray-600">{data.min}</span>
            </div>

            {/* Max label */}
            <div
              className="absolute transition-all duration-400"
              style={{
                left: `${(parseInt(data.max) / 35) * 100}%`,
                top: '100%',
                transform: 'translateX(-50%)',
                marginTop: '4px',
              }}
            >
              <span className="text-xs text-gray-600">{data.max}</span>
            </div>
          </div>

          {/* Mean value label below */}
          <div className="flex justify-center mt-6">
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
