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

      {/* Distribution Visualization with gradient bar */}
      <div className="relative mt-5 pb-8">
        <div className="relative h-12 w-full">
          {/* Gradient bar positioned based on min/max */}
          <div
            className="absolute rounded-full transition-all duration-400 ease-out shadow-md overflow-hidden"
            style={{
              left: `${(parseInt(data.min) / 50) * 100}%`,
              width: `${((parseInt(data.max) - parseInt(data.min)) / 50) * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.5) 50%, rgba(249, 115, 22, 0.3) 100%)',
            }}
          />

          {/* Mean marker (dashed line positioned right of peak) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 transition-all duration-400"
            style={{
              left: `${(parseInt(data.avg) / 50) * 100}%`,
              backgroundImage: 'repeating-linear-gradient(0deg, #f97316, #f97316 4px, transparent 4px, transparent 8px)',
            }}
          />

          {/* Min label */}
          <div
            className="absolute transition-all duration-400"
            style={{
              left: `${(parseInt(data.min) / 50) * 100}%`,
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
              left: `${(parseInt(data.max) / 50) * 100}%`,
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
