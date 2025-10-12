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
    avg: '38',
    min: '25',
    max: '50',
    stats: { best: '25', typical: '38', worst: '50' },
    hasPreCheck: false,
    hasClear: false,
  },
  fast: {
    label: 'Fast Lane',
    avg: '12',
    min: '7',
    max: '17',
    stats: { best: '7', typical: '12', worst: '17' },
    hasPreCheck: true,
    hasClear: false,
  },
  biometric: {
    label: 'Biometric',
    avg: '8',
    min: '5',
    max: '11',
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

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Security:
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

      {/* Thin gradient line with labels below */}
      <div className="relative mt-5 pb-8">
        <div className="relative h-2 w-full">
          <div
            className="absolute h-2 rounded-full transition-all duration-400 ease-out shadow-md"
            style={{
              left: `${(parseInt(data.min) / 50) * 100}%`,
              width: `${((parseInt(data.max) - parseInt(data.min)) / 50) * 100}%`,
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
          </div>

          {/* Min marker at left edge of gradient bar */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(parseInt(data.min) / 50) * 100}%`,
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
              left: `${(parseInt(data.max) / 50) * 100}%`,
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
              left: `${(parseInt(data.avg) / 50) * 100}%`,
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
