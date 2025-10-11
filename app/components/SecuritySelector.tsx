'use client';

import { useState, useEffect, useRef } from 'react';

type SecurityLevel = 'regular' | 'fast' | 'biometric';

interface SecuritySelectorProps {
  hasPreCheck: boolean;
  hasClear: boolean;
  onChange: (hasPreCheck: boolean, hasClear: boolean) => void;
}

const securityOptions = {
  regular: {
    label: 'Regular',
    avg: '38 min',
    min: '25',
    max: '50 min',
    stats: { best: '25', typical: '38', worst: '50' },
    hasPreCheck: false,
    hasClear: false,
  },
  fast: {
    label: 'Fast Lane',
    avg: '12 min',
    min: '7',
    max: '17 min',
    stats: { best: '7', typical: '12', worst: '17' },
    hasPreCheck: true,
    hasClear: false,
  },
  biometric: {
    label: 'Biometric',
    avg: '8 min',
    min: '5',
    max: '11 min',
    stats: { best: '5', typical: '8', worst: '11' },
    hasPreCheck: false,
    hasClear: true,
  },
};

export default function SecuritySelector({ hasPreCheck, hasClear, onChange }: SecuritySelectorProps) {
  // Determine initial selection based on props
  const getInitialSelection = (): SecurityLevel => {
    if (hasClear) return 'biometric';
    if (hasPreCheck) return 'fast';
    return 'regular';
  };

  const [selected, setSelected] = useState<SecurityLevel>(getInitialSelection());
  const [sliderStyle, setSliderStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    updateSlider(selected === 'regular' ? 0 : selected === 'fast' ? 1 : 2);
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

  const handleSelect = (option: SecurityLevel, index: number) => {
    setSelected(option);
    updateSlider(index);
    const optionData = securityOptions[option];
    onChange(optionData.hasPreCheck, optionData.hasClear);
  };

  const data = securityOptions[selected];
  const barClass = selected === 'regular' ? 'w-full' : selected === 'fast' ? 'w-[60%]' : 'w-[35%]';

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Security Screening Speed
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
        {(['regular', 'fast', 'biometric'] as SecurityLevel[]).map((option, index) => (
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
            {securityOptions[option].label}
          </div>
        ))}
      </div>

      {/* Dynamic width bar */}
      <div className="relative h-[60px] flex items-center mt-5">
        <div
          className={`relative h-10 rounded-full transition-all duration-400 ease-out shadow-lg ${barClass}`}
          style={{
            background:
              selected === 'regular'
                ? 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #f97316 100%)'
                : selected === 'fast'
                ? 'linear-gradient(90deg, #10b981 0%, #3b82f6 70%, #f97316 100%)'
                : 'linear-gradient(90deg, #10b981 0%, #10b981 60%, #3b82f6 100%)',
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

      {/* Statistics row */}
      <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{data.stats.best}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Best Case</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{data.stats.typical}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Typical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">{data.stats.worst}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Worst Case</div>
        </div>
      </div>

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
