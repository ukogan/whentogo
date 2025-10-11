'use client';

import { useState, useEffect, useRef } from 'react';

type BagCheckLevel = 'none' | 'regular' | 'priority';

interface BagCheckSelectorProps {
  hasCheckedBag: boolean;
  hasPriorityBagCheck: boolean;
  onChange: (hasCheckedBag: boolean, hasPriorityBagCheck: boolean) => void;
}

const bagCheckOptions = {
  none: {
    label: 'No Bag',
    avg: '0 min',
    min: '0',
    max: '0',
    hasCheckedBag: false,
    hasPriorityBagCheck: false,
  },
  regular: {
    label: 'Regular',
    avg: '12 min',
    min: '7',
    max: '25 min',
    hasCheckedBag: true,
    hasPriorityBagCheck: false,
  },
  priority: {
    label: 'Priority',
    avg: '5 min',
    min: '3',
    max: '8 min',
    hasCheckedBag: true,
    hasPriorityBagCheck: true,
  },
};

export default function BagCheckSelector({ hasCheckedBag, hasPriorityBagCheck, onChange }: BagCheckSelectorProps) {
  const getInitialSelection = (): BagCheckLevel => {
    if (!hasCheckedBag) return 'none';
    if (hasPriorityBagCheck) return 'priority';
    return 'regular';
  };

  const [selected, setSelected] = useState<BagCheckLevel>(getInitialSelection());
  const [sliderStyle, setSliderStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    updateSlider(selected === 'none' ? 0 : selected === 'regular' ? 1 : 2);
  }, []);

  const updateSlider = (index: number) => {
    const element = optionRefs.current[index];
    if (element) {
      setSliderStyle({
        width: element.offsetWidth,
        left: element.offsetLeft - 3,
      });
    }
  };

  const handleSelect = (option: BagCheckLevel, index: number) => {
    setSelected(option);
    updateSlider(index);
    const optionData = bagCheckOptions[option];
    onChange(optionData.hasCheckedBag, optionData.hasPriorityBagCheck);
  };

  const data = bagCheckOptions[selected];

  // Bar widths: none=0%, regular=100%, priority=35%
  const barClass = selected === 'none' ? 'w-0' : selected === 'regular' ? 'w-full' : 'w-[35%]';

  // Show the bar only if not 'none'
  const showBar = selected !== 'none';

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Bag Check Time
      </label>

      {/* iOS-style pill toggle */}
      <div className="relative inline-flex bg-gray-100 p-[3px] rounded-xl">
        <div
          className="absolute top-[3px] h-[calc(100%-6px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
          style={{
            width: `${sliderStyle.width}px`,
            left: `${sliderStyle.left}px`,
          }}
        />

        {(['none', 'regular', 'priority'] as BagCheckLevel[]).map((option, index) => (
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

      {/* Dynamic width bar - only show if bag is checked */}
      {showBar && (
        <div className="relative h-[60px] flex items-center mt-5">
          <div
            className={`relative h-10 rounded-full transition-all duration-400 ease-out shadow-lg ${barClass}`}
            style={{
              background:
                selected === 'regular'
                  ? 'linear-gradient(90deg, #10b981 0%, #3b82f6 40%, #f97316 100%)'
                  : 'linear-gradient(90deg, #10b981 0%, #10b981 70%, #3b82f6 100%)',
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

            {/* Time markers */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
              <span className="text-[11px] text-white font-medium drop-shadow">{data.min}</span>
              <span className="text-[11px] text-white font-medium drop-shadow">{data.max}</span>
            </div>

            {/* Average indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-xl shadow-md">
              <span className="text-sm font-bold text-gray-900">{data.avg}</span>
            </div>
          </div>
        </div>
      )}

      {/* No bag selected - show placeholder */}
      {!showBar && (
        <div className="h-[60px] flex items-center justify-center text-gray-400 text-sm">
          No bag check time
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
