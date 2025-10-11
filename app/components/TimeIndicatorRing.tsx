'use client';

import React from 'react';

interface TimeIndicatorRingProps {
  minutes: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function TimeIndicatorRing({
  minutes,
  size = 48,
  strokeWidth = 3,
  className = '',
  children,
}: TimeIndicatorRingProps) {
  // Cap at 60 minutes for full circle
  const cappedMinutes = Math.min(60, Math.max(0, minutes));

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate how much of the circle to fill (0-60 minutes = 0-100%)
  const progressPercent = cappedMinutes / 60;
  const strokeDashoffset = circumference * (1 - progressPercent);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Icon content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
