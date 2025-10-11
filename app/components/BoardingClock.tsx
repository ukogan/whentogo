'use client';

import React, { useState, useEffect, useRef } from 'react';

interface BoardingClockProps {
  boardingMinutes: number;
  doorMinutes: number;
  onBoardingChange: (minutes: number) => void;
  onDoorChange: (minutes: number) => void;
  departureTime: string; // HH:MM format
}

export default function BoardingClock({
  boardingMinutes,
  doorMinutes,
  onBoardingChange,
  onDoorChange,
  departureTime,
}: BoardingClockProps) {
  const clockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'boarding' | 'door' | null>(null);

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(120, 120, radius, startAngle);
    const end = polarToCartesian(120, 120, radius, endAngle);

    // Calculate the angle difference, handling wraparound
    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += 360;

    const largeArcFlag = angleDiff > 180 ? '1' : '0';

    return [
      'M',
      120,
      120,
      'L',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      1,
      end.x,
      end.y,
      'Z',
    ].join(' ');
  };

  // Extract the minute value from departure time to show on clock face
  const getMinuteAngle = (timeString: string, offsetMinutes: number) => {
    if (!timeString) return 0;
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = mins - offsetMinutes;
    // Convert to positive minute value (0-59)
    const displayMinute = ((totalMinutes % 60) + 60) % 60;
    // Convert to degrees (6° per minute)
    return displayMinute * 6;
  };

  const boardingAngle = getMinuteAngle(departureTime, boardingMinutes);
  const doorAngle = getMinuteAngle(departureTime, doorMinutes);
  const departureAngle = getMinuteAngle(departureTime, 0);

  const boardingPos = polarToCartesian(120, 120, 110, boardingAngle);
  const doorPos = polarToCartesian(120, 120, 110, doorAngle);
  const departurePos = polarToCartesian(120, 120, 110, departureAngle);

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

  // Drag handlers
  const handleDragStart = (marker: 'boarding' | 'door') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(marker);
    // Don't change preset when dragging - keep current selection
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Calculate angle in degrees
    // atan2(dy, dx) gives angle from center, with 0 at 3 o'clock (right), going counterclockwise
    // We need to adjust so 0 is at 12 o'clock (top) and goes clockwise
    // Subtract 90 to make 0 at top, then negate to reverse direction
    let angle = -(Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    // Convert angle to minutes (0-59)
    let minutes = Math.round((angle / 360) * 60);
    if (minutes === 60) minutes = 0;

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
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, boardingMinutes, doorMinutes]);

  return (
    <div className="space-y-4">
      {/* Clock Visualization */}
      <div className="flex justify-center py-8">
        <div ref={clockRef} className="relative w-60 h-60 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
            {/* Clock face */}
            <circle cx="120" cy="120" r="110" fill="#f7fafc" stroke="#e2e8f0" strokeWidth="2" />

            {/* 5-minute tick marks and labels */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => {
              const angle = (minute / 60) * 360;
              const tickStart = polarToCartesian(120, 120, 105, angle);
              const tickEnd = polarToCartesian(120, 120, 110, angle);
              const labelPos = polarToCartesian(120, 120, 95, angle);

              return (
                <g key={minute}>
                  {/* Tick mark */}
                  <line
                    x1={tickStart.x}
                    y1={tickStart.y}
                    x2={tickEnd.x}
                    y2={tickEnd.y}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Label (rotated back to be readable) */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                    transform={`rotate(90, ${labelPos.x}, ${labelPos.y})`}
                  >
                    {minute}
                  </text>
                </g>
              );
            })}

            {/* Boarding segment (green) - from boarding to door close */}
            <path
              d={createArc(boardingAngle, doorAngle, 110)}
              fill="#48bb78"
              opacity="0.3"
              className="transition-all duration-300"
            />

            {/* Door segment (orange) - from door close to departure */}
            <path
              d={createArc(doorAngle, departureAngle, 110)}
              fill="#f6ad55"
              opacity="0.5"
              className="transition-all duration-300"
            />

            {/* Boarding marker at 12 o'clock */}
            <line
              x1="120"
              y1="10"
              x2="120"
              y2="30"
              stroke="#48bb78"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Minute hand for boarding (at 12 o'clock) */}
            <line
              x1="120"
              y1="120"
              x2={boardingPos.x}
              y2={boardingPos.y}
              stroke="#48bb78"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Minute hand for door close */}
            <line
              x1="120"
              y1="120"
              x2={doorPos.x}
              y2={doorPos.y}
              stroke="#f6ad55"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Minute hand for departure */}
            <line
              x1="120"
              y1="120"
              x2={departurePos.x}
              y2={departurePos.y}
              stroke="#e53e3e"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Door marker */}
            <circle
              cx={doorPos.x}
              cy={doorPos.y}
              r="8"
              fill="#f6ad55"
              stroke="white"
              strokeWidth="2"
            />

            {/* Departure marker */}
            <circle
              cx={departurePos.x}
              cy={departurePos.y}
              r="8"
              fill="#e53e3e"
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          {/* Time labels on perimeter */}
          {/* Boarding time label - draggable */}
          <div
            className="absolute text-center cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-110"
            style={{
              left: `${120 + Math.cos((boardingAngle - 90) * Math.PI / 180) * 135}px`,
              top: `${120 + Math.sin((boardingAngle - 90) * Math.PI / 180) * 135}px`,
              transform: `translate(-50%, -50%) ${isDragging === 'boarding' ? 'scale(1.1)' : ''}`
            }}
            onMouseDown={handleDragStart('boarding')}
          >
            <div className="text-xs font-semibold text-green-700 bg-white/80 px-2 py-1 rounded-md border border-green-300">
              {formatTime(boardingMinutes)}
            </div>
            <div className="text-[10px] text-gray-500">Boarding</div>
          </div>

          {/* Door close time label - draggable */}
          <div
            className="absolute text-center cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-110"
            style={{
              left: `${120 + Math.cos((doorAngle - 90) * Math.PI / 180) * 135}px`,
              top: `${120 + Math.sin((doorAngle - 90) * Math.PI / 180) * 135}px`,
              transform: `translate(-50%, -50%) ${isDragging === 'door' ? 'scale(1.1)' : ''}`
            }}
            onMouseDown={handleDragStart('door')}
          >
            <div className="text-xs font-semibold text-orange-600 bg-white/80 px-2 py-1 rounded-md border border-orange-300">
              {formatTime(doorMinutes)}
            </div>
            <div className="text-[10px] text-gray-500">Door Close</div>
          </div>

          {/* Departure time label */}
          <div
            className="absolute text-center"
            style={{
              left: `${120 + Math.cos((departureAngle - 90) * Math.PI / 180) * 135}px`,
              top: `${120 + Math.sin((departureAngle - 90) * Math.PI / 180) * 135}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="text-xs font-semibold text-red-600">{formatTime(0)}</div>
            <div className="text-[10px] text-gray-500">Departure</div>
          </div>
        </div>
      </div>


    </div>
  );
}
