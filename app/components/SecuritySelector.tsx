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

      {/* Ex-Gaussian Distribution Visualization */}
      <div className="relative mt-5">
        <svg viewBox="0 0 200 50" className="w-full h-12">
          <defs>
            <linearGradient id={`securityGradient-${selected}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Ex-Gaussian distribution shape: normal body + exponential tail */}
          <path
            d="M 0,50 L 0,45 Q 20,25 40,12 T 70,6 Q 85,7 100,12 Q 115,18 130,25 T 160,36 Q 175,40 190,43 L 200,44 L 200,50 Z"
            fill={`url(#securityGradient-${selected})`}
            className="transition-all duration-400"
          />

          {/* Mean marker (dashed line positioned right of peak) */}
          <line
            x1={`${(parseInt(data.avg) / 50) * 200}`}
            y1="3"
            x2={`${(parseInt(data.avg) / 50) * 200}`}
            y2="50"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="3,3"
            className="transition-all duration-400"
          />

          {/* Min label */}
          <text
            x={`${(parseInt(data.min) / 50) * 200}`}
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
            x={`${(parseInt(data.max) / 50) * 200}`}
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
