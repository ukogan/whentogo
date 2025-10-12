'use client';

import React, { useState, useRef } from 'react';

interface TimelineSliderProps {
  boardingMinutes: number;
  doorMinutes: number;
  onBoardingChange: (minutes: number) => void;
  onDoorChange: (minutes: number) => void;
  departureTime: string; // HH:MM format
}

export default function TimelineSlider({
  boardingMinutes,
  doorMinutes,
  onBoardingChange,
  onDoorChange,
  departureTime,
}: TimelineSliderProps) {
  const [isDragging, setIsDragging] = useState<'boarding' | 'door' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Format times - subtract minutes from departure
  const formatTime = (offsetMinutes: number) => {
    if (!departureTime) return '--:--';
    const [hours, mins] = departureTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins - offsetMinutes, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Convert minutes to percentage (0-100% on timeline)
  // Timeline shows 0 (departure) to 90 minutes before
  const minutesToPercent = (minutes: number) => {
    return ((90 - minutes) / 90) * 100;
  };

  const boardingPercent = minutesToPercent(boardingMinutes);
  const doorPercent = minutesToPercent(doorMinutes);

  // Drag handlers
  const handleDragStart = (marker: 'boarding' | 'door') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(marker);
  };

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientX;
    }
    return (e as MouseEvent).clientX;
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !trackRef.current) return;

    const clientX = getClientX(e);
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    // Convert percent back to minutes (0% = 90 min, 100% = 0 min)
    const minutes = Math.round(90 - (percent / 100) * 90);

    // Snap to 5-minute increments
    const snappedMinutes = Math.round(minutes / 5) * 5;

    if (isDragging === 'boarding') {
      // Boarding must be between 15-90 minutes before departure
      const newBoardingMinutes = Math.max(15, Math.min(90, snappedMinutes));
      onBoardingChange(newBoardingMinutes);
    } else if (isDragging === 'door') {
      // Door must be between 5 minutes and boarding-5 minutes
      const newDoorMinutes = Math.max(5, Math.min(boardingMinutes - 5, snappedMinutes));
      onDoorChange(newDoorMinutes);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  // Add/remove event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, boardingMinutes, doorMinutes]);

  return (
    <div className="space-y-6">
      {/* Timeline visualization */}
      <div className="px-4">
        {/* Time labels above timeline */}
        <div className="relative mb-2 h-16">
          {/* Boarding time */}
          <div
            className="absolute transition-transform"
            style={{
              left: `${boardingPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-xs font-semibold text-green-700 bg-white px-2 py-1 rounded border border-green-400 shadow-sm whitespace-nowrap mb-1">
              {formatTime(boardingMinutes)}
            </div>
            <div className="text-[10px] text-gray-600 text-center">Boarding</div>
          </div>

          {/* Door close time */}
          <div
            className="absolute transition-transform"
            style={{
              left: `${doorPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-xs font-semibold text-orange-600 bg-white px-2 py-1 rounded border border-orange-400 shadow-sm whitespace-nowrap mb-1">
              {formatTime(doorMinutes)}
            </div>
            <div className="text-[10px] text-gray-600 text-center">Door</div>
          </div>

          {/* Departure time */}
          <div
            className="absolute"
            style={{
              left: '100%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-xs font-semibold text-red-600 bg-white px-2 py-1 rounded border border-red-400 shadow-sm whitespace-nowrap mb-1">
              {formatTime(0)}
            </div>
            <div className="text-[10px] text-gray-600 text-center">Depart</div>
          </div>
        </div>

        {/* Timeline track */}
        <div
          ref={trackRef}
          className="relative h-3 bg-gray-200 rounded-full"
        >
          {/* Boarding segment (green) */}
          <div
            className="absolute h-full bg-green-400 opacity-50 rounded-l-full transition-all"
            style={{
              left: `${boardingPercent}%`,
              right: `${100 - doorPercent}%`,
            }}
          />

          {/* Door segment (orange) */}
          <div
            className="absolute h-full bg-orange-400 opacity-60 rounded-r-full transition-all"
            style={{
              left: `${doorPercent}%`,
              right: '0%',
            }}
          />

          {/* Boarding marker (draggable) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-green-600 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110"
            style={{
              left: `${boardingPercent}%`,
              transform: `translate(-50%, -50%) ${isDragging === 'boarding' ? 'scale(1.2)' : ''}`,
              touchAction: 'none',
            }}
            onMouseDown={handleDragStart('boarding')}
            onTouchStart={handleDragStart('boarding')}
          />

          {/* Door marker (draggable) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110"
            style={{
              left: `${doorPercent}%`,
              transform: `translate(-50%, -50%) ${isDragging === 'door' ? 'scale(1.2)' : ''}`,
              touchAction: 'none',
            }}
            onMouseDown={handleDragStart('door')}
            onTouchStart={handleDragStart('door')}
          />

          {/* Departure marker (fixed) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-red-600 border-2 border-white rounded-full shadow-lg"
            style={{
              left: '100%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Minute markers below timeline */}
        <div className="relative mt-2 h-4">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>90 min</span>
            <span>60 min</span>
            <span>30 min</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
