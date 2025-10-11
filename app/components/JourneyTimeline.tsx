'use client';

import React from 'react';
import type { TripContext, TravelEstimate } from '../lib/types';
import TimeIndicatorRing from './TimeIndicatorRing';

interface JourneyTimelineProps {
  tripContext: TripContext | null;
  travelEstimate: TravelEstimate | null;
  currentSection: 'intro' | 'costs' | 'flight' | 'travel' | 'results';
}

// Material Icons as SVG components
const HomeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const DirectionsCarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
  </svg>
);

const RideshareIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 5c-.97 0-1.78.63-2.06 1.5h-6.88c-.28-.87-1.09-1.5-2.06-1.5-1.22 0-2.2.98-2.2 2.2 0 .81.44 1.52 1.1 1.89v6.82c-.66.37-1.1 1.08-1.1 1.89 0 1.22.98 2.2 2.2 2.2.97 0 1.78-.63 2.06-1.5h6.88c.28.87 1.09 1.5 2.06 1.5 1.22 0 2.2-.98 2.2-2.2 0-.81-.44-1.52-1.1-1.89V8.89c.66-.37 1.1-1.08 1.1-1.89 0-1.22-.98-2.2-2.2-2.2zm0 2c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zM6.5 7c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zm0 10c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm1.06-2.5h-1.62c-.27 0-.5-.22-.5-.5V9c0-.28.22-.5.5-.5h1.62c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5zm5.88 0h-4.88V9h4.88v5.5zm4 2.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm1.06-2.5h-1.62c-.27 0-.5-.22-.5-.5V9c0-.28.22-.5.5-.5h1.62c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5z"/>
  </svg>
);

const TransitIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>
  </svg>
);

const LuggageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9.5 18H8V9h1.5v9zm3.25 0h-1.5V9h1.5v9zm.75-12h-3V3.5h3V6zM16 18h-1.5V9H16v9z"/>
  </svg>
);

const SecurityIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12c.55 0 1 .45 1 1v1H5V7c0-.55.45-1 1-1zm-1 3h14v2H5V9zm7 10c-2.76 0-5-2.24-5-5h10c0 2.76-2.24 5-5 5zm-5-6v1h10v-1H7zm5-6c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z"/>
  </svg>
);

const FlightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
);

const FlightTakeoffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 2.59 4.49c.21.36.62.58 1.06.48l14.39-3.87c.81-.23 1.28-1.05 1.07-1.85z"/>
  </svg>
);

export default function JourneyTimeline({
  tripContext,
  travelEstimate,
  currentSection,
}: JourneyTimelineProps) {
  // Don't show on intro section only
  if (currentSection === 'intro') {
    return null;
  }

  // Calculate segment widths based on average times
  const getSegmentWidth = (step: string): number => {
    if (!tripContext && !travelEstimate) return 20; // Equal widths by default

    switch (step) {
      case 'leave':
        // Travel time (use average of min/max)
        if (travelEstimate) {
          return (travelEstimate.minMinutes + travelEstimate.maxMinutes) / 2;
        }
        return 30;
      case 'arrive':
        // Time to get from arrival to bag check or security (5-10 min)
        return 8;
      case 'bag':
        // Bag check time
        if (!tripContext?.hasCheckedBag) return 0;
        return tripContext.hasPriorityBagCheck ? 10 : 25;
      case 'security':
        // Security time (use airport priors)
        if (!tripContext) return 30;
        const { securityPriors } = tripContext.airport;
        if (tripContext.hasClear) return securityPriors.withClear.mean;
        if (tripContext.hasPreCheck) return securityPriors.withPreCheck.mean;
        return securityPriors.noPreCheck.mean;
      case 'gate':
        // Gate time (boarding start)
        return tripContext?.boardingStartMin || 30;
      case 'depart':
        // No width for departure point
        return 0;
      default:
        return 20;
    }
  };

  // Determine transit icon based on travel mode - use useMemo to avoid recreating on every render
  const transitIcon = React.useMemo(() => {
    const mode = travelEstimate?.mode;
    if (mode === 'transit') return <TransitIcon />;
    if (mode === 'rideshare') return <RideshareIcon />;
    return <DirectionsCarIcon />; // Default to car for 'driving' or undefined
  }, [travelEstimate, tripContext]);

  // Build steps array reactively based on props
  const steps = React.useMemo(() => [
    { key: 'leave', icon: <HomeIcon />, label: 'Leave' },
    { key: 'arrive', icon: transitIcon, label: 'Arrive' },
    ...(tripContext?.hasCheckedBag ? [{ key: 'bag', icon: <LuggageIcon />, label: 'Bag' }] : []),
    { key: 'security', icon: <SecurityIcon />, label: 'Security' },
    { key: 'gate', icon: <FlightIcon />, label: 'Gate' },
    { key: 'depart', icon: <FlightTakeoffIcon />, label: 'Depart' },
  ], [transitIcon, tripContext]);

  // Calculate relative widths for flexbox - recalculate when steps change
  const totalMinutes = React.useMemo(() => {
    return steps.reduce((sum, step) => sum + getSegmentWidth(step.key), 0);
  }, [steps, tripContext, travelEstimate]);

  const getFlexValue = (step: string): number => {
    const width = getSegmentWidth(step);
    if (width === 0) return 0;
    return Math.max(0.5, width / totalMinutes * 10); // Scale to reasonable flex values
  };

  return (
    <div className="w-full py-2 px-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            {/* Step Icon with Time Indicator Ring */}
            <div className="flex flex-col items-center relative z-10">
              <TimeIndicatorRing minutes={getSegmentWidth(step.key)} size={48} strokeWidth={3}>
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
              </TimeIndicatorRing>
            </div>

            {/* Connecting Line (except after last step) */}
            {index < steps.length - 1 && (
              <div
                className="h-1 bg-blue-300 mx-1 relative overflow-hidden"
                style={{
                  flex: getFlexValue(step.key),
                  minWidth: getFlexValue(step.key) === 0 ? '0px' : '20px',
                }}
              >
                {/* Animated shimmer on this line segment */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  style={{
                    animation: 'slideRight 3s ease-in-out infinite',
                    width: '50%',
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
