'use client';

import { useState } from 'react';

interface EmotionalSliderProps {
  value: number; // 1-5
  onChange: (value: number) => void;
  labels: string[];
}

export default function EmotionalSlider({ value, onChange, labels }: EmotionalSliderProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const displayValue = hoveredValue ?? value;

  // Custom face illustrations for each level
  const faces = [
    // Level 1: Happy/Calm
    <svg key={1} viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="35" cy="40" r="4" fill="currentColor" />
      <circle cx="65" cy="40" r="4" fill="currentColor" />
      <path d="M 30 60 Q 50 70 70 60" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>,
    // Level 2: Slight concern
    <svg key={2} viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <path d="M 32 38 L 38 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="65" cy="40" r="4" fill="currentColor" />
      <path d="M 35 62 L 65 62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>,
    // Level 3: Worried
    <svg key={3} viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="35" cy="42" r="4" fill="currentColor" />
      <circle cx="65" cy="42" r="4" fill="currentColor" />
      <path d="M 30 65 Q 50 60 70 65" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>,
    // Level 4: Stressed (sweat drops)
    <svg key={4} viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="35" cy="40" r="5" fill="currentColor" />
      <circle cx="65" cy="40" r="5" fill="currentColor" />
      <path d="M 30 68 Q 50 63 70 68" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Sweat drops */}
      <circle cx="22" cy="32" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="38" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>,
    // Level 5: Overwhelmed (explosion lines)
    <svg key={5} viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="32" cy="40" r="3" fill="currentColor" />
      <circle cx="68" cy="40" r="3" fill="currentColor" />
      <path d="M 35 70 L 65 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Explosion lines */}
      <line x1="15" y1="25" x2="8" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="85" y1="25" x2="92" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="50" x2="8" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="75" x2="12" y2="82" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="75" x2="88" y2="82" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>,
  ];

  const colors = [
    'text-green-500',
    'text-blue-400',
    'text-yellow-500',
    'text-orange-500',
    'text-red-500',
  ];

  const handleClick = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Face buttons in a row */}
      <div className="flex items-center justify-between px-4">
        {faces.map((face, index) => {
          const faceValue = index + 1;
          const isActive = displayValue === faceValue;

          return (
            <button
              key={faceValue}
              type="button"
              onClick={() => handleClick(faceValue)}
              onMouseEnter={() => setHoveredValue(faceValue)}
              onMouseLeave={() => setHoveredValue(null)}
              className={`relative transition-all duration-200 ${colors[index]} ${
                isActive
                  ? 'transform scale-110'
                  : 'opacity-50 hover:opacity-75 hover:scale-105'
              }`}
              style={{ width: '44px', height: '44px' }}
            >
              {face}
              {/* Active indicator ring */}
              {isActive && (
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg" />
              )}
            </button>
          );
        })}
      </div>

      {/* Label centered below icons */}
      <div className="flex justify-center min-h-[48px] pt-2">
        <p className={`text-sm font-medium transition-all duration-200 ${
          displayValue === 1 ? 'text-green-700' :
          displayValue === 2 ? 'text-blue-600' :
          displayValue === 3 ? 'text-yellow-700' :
          displayValue === 4 ? 'text-orange-700' :
          'text-red-700'
        }`}>
          {labels[displayValue - 1]}
        </p>
      </div>
    </div>
  );
}
