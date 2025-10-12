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

      {/* Thin gradient line with labels below */}
      {showBar && (
        <div className="relative mt-5 pb-8">
          <div className="relative h-2 w-full">
            {/* Visible gradient bar - only shows relevant time range */}
            <div
              className="absolute h-2 rounded-full transition-all duration-400 ease-out shadow-md"
              style={{
                left: `${(parseInt(data.min) / 35) * 100}%`,
                width: `${((parseInt(data.max) - parseInt(data.min)) / 35) * 100}%`,
                background: selected === 'priority'
                  ? 'linear-gradient(90deg, #10b981 0%, #10b981 60%, #3b82f6 100%)'
                  : 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #f97316 100%)',
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
                left: `${(parseInt(data.min) / 35) * 100}%`,
                top: '50%',
                transform: 'translate(-100%, -50%) translateX(-8px)',
              }}
            >
              <span className="text-xs text-gray-600">{data.min}</span>
            </div>

            {/* Max marker at right edge of gradient bar */}
            <div
              className="absolute transition-all duration-400"
              style={{
                left: `${(parseInt(data.max) / 35) * 100}%`,
                top: '50%',
                transform: 'translate(0%, -50%) translateX(8px)',
              }}
            >
              <span className="text-xs text-gray-600">{data.max}</span>
            </div>

            {/* Triangle pointer at mean position */}
            <div
              className="absolute top-full mt-1 transition-all duration-400"
              style={{
                left: `${(parseInt(data.avg) / 35) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="flex flex-col items-center">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-500" />
                <span className="text-sm font-bold text-gray-900 mt-1">{data.avg} min</span>
              </div>
            </div>
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
