'use client';

import { useState, useEffect } from 'react';
import TripContextForm from './components/TripContextForm';
import TravelEstimateForm from './components/TravelEstimateForm';
import CostDialsForm from './components/CostDialsForm';
import TradeoffVisualization from './components/TradeoffVisualization';
import JourneyTimeline from './components/JourneyTimeline';
import { calculateRecommendation, validateInputs } from './lib/calculations';
import type {
  TripContext,
  TravelEstimate,
  CostPreferences,
  Recommendation,
  SimulationInputs,
} from './lib/types';
import { Clock, Calendar } from 'lucide-react';

type Section = 'intro' | 'costs' | 'flight' | 'travel' | 'results';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('intro');
  const [costPreferences, setCostPreferences] = useState<CostPreferences | null>(null);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [travelEstimate, setTravelEstimate] = useState<TravelEstimate | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Flight date/time state (moved from TripContextForm)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [flightDate, setFlightDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [flightTime, setFlightTime] = useState('12:30');

  // Smooth scroll to section
  const scrollToSection = (sectionId: Section) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSection(sectionId);
      window.location.hash = sectionId;
    }
  };

  // Handle hash changes (back button, direct links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as Section;
      if (['intro', 'costs', 'flight', 'travel', 'results'].includes(hash)) {
        setCurrentSection(hash);
      }
    };

    handleHashChange(); // Check initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCostsComplete = (preferences: CostPreferences) => {
    setCostPreferences(preferences);
    scrollToSection('flight');
  };

  const handlePartialFlightUpdate = (partial: Partial<TripContext>) => {
    setTripContext((prev) => {
      if (!prev) {
        // Create a partial context with defaults for required fields
        const defaultAirport = {
          code: 'SFO',
          name: 'San Francisco International',
          city: 'San Francisco',
          size: 'large' as const,
          securityPriors: {
            noPreCheck: { mean: 38, std: 14 },
            withPreCheck: { mean: 12, std: 5 },
            withClear: { mean: 8, std: 3 },
          },
        };
        return {
          airport: defaultAirport,
          flightTime: new Date(),
          flightType: 'domestic' as const,
          hasCheckedBag: false,
          hasPriorityBagCheck: false,
          hasPreCheck: false,
          hasClear: false,
          boardingStartMin: 30,
          doorCloseMin: 10,
          isFamiliarAirport: true,
          ...partial,
        };
      }
      return { ...prev, ...partial };
    });
  };

  const handleFlightComplete = (context: TripContext) => {
    // Combine date and time into context
    const flightDateTime = new Date(`${flightDate}T${flightTime}`);
    const updatedContext: TripContext = {
      ...context,
      flightTime: flightDateTime,
    };
    setTripContext(updatedContext);
    scrollToSection('travel');
  };

  const handlePartialTravelUpdate = (partial: Partial<TravelEstimate>) => {
    setTravelEstimate((prev) => {
      if (!prev) {
        // If no previous estimate, create one with defaults
        return {
          mode: partial.mode || 'rideshare',
          minMinutes: partial.minMinutes || 25,
          maxMinutes: partial.maxMinutes || 45,
          ...partial,
        };
      }
      return { ...prev, ...partial };
    });
  };

  const handleTravelComplete = (estimate: TravelEstimate) => {
    if (!tripContext || !costPreferences) {
      setError('Missing required information');
      return;
    }

    const inputs: SimulationInputs = {
      tripContext,
      travelEstimate: estimate,
      costPreferences,
    };

    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      const result = calculateRecommendation(inputs);
      setTravelEstimate(estimate);
      setRecommendation(result);
      setError(null);
      scrollToSection('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const handleStartOver = () => {
    setCostPreferences(null);
    setTripContext(null);
    setTravelEstimate(null);
    setRecommendation(null);
    setError(null);
    scrollToSection('intro');
  };

  // Progress indicator
  const sections: Section[] = ['intro', 'costs', 'flight', 'travel', 'results'];
  const currentSectionIndex = sections.indexOf(currentSection);

  return (
    <div className="min-h-screen bg-gray-50 snap-y snap-mandatory overflow-y-scroll">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => scrollToSection('intro')}
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <Clock className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900">When To Go</h1>
            </button>
            {/* Progress dots */}
            <div className="flex gap-2">
              {sections.map((section, index) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index < currentSectionIndex ? 'bg-blue-500 w-6' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to ${section} section`}
                />
              ))}
            </div>
          </div>

          {/* Journey Timeline */}
          <JourneyTimeline
            tripContext={tripContext}
            travelEstimate={travelEstimate}
            currentSection={currentSection}
          />
        </div>
      </div>

      {/* Section 1: Intro */}
      <section
        id="intro"
        className="min-h-screen snap-start flex items-center justify-center px-4 pt-20 pb-8"
      >
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Stop guessing when to leave for the airport
              </h2>
              <p className="text-lg text-gray-600">
                Strike the balance that works for you, and consider unpredictable travel and security times to get your timing right!
              </p>
            </div>

            {/* Flight Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flight Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-12 pl-12 pr-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               border border-gray-200 dark:border-gray-600 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Departure Time
                </label>
                <input
                  type="time"
                  value={flightTime}
                  onChange={(e) => setFlightTime(e.target.value)}
                  className="w-full h-12 px-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             border border-gray-200 dark:border-gray-600 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => scrollToSection('costs')}
                disabled={!flightDate || !flightTime}
                className="w-full h-14 rounded-xl font-semibold text-white bg-blue-500
                           hover:bg-blue-600 active:scale-[0.98] transition-all text-lg
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weigh peace of mind vs time at home
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Cost Preferences */}
      <section
        id="costs"
        className="min-h-screen snap-start flex items-center justify-center px-4 py-8"
      >
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <CostDialsForm
              onComplete={handleCostsComplete}
              onBack={() => scrollToSection('intro')}
            />
          </div>
        </div>
      </section>

      {/* Section 3: Flight Info */}
      <section
        id="flight"
        className="min-h-screen snap-start flex items-center justify-center px-4 py-8"
      >
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <TripContextForm
              onComplete={handleFlightComplete}
              onPartialUpdate={handlePartialFlightUpdate}
            />
          </div>
        </div>
      </section>

      {/* Section 4: Travel Mode */}
      <section
        id="travel"
        className="min-h-screen snap-start flex items-center justify-center px-4 py-8"
      >
        <div className="max-w-2xl w-full">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <TravelEstimateForm
              onComplete={handleTravelComplete}
              onBack={() => scrollToSection('flight')}
              onPartialUpdate={handlePartialTravelUpdate}
              tripContext={tripContext || undefined}
            />
          </div>
        </div>
      </section>

      {/* Section 5: Results */}
      <section
        id="results"
        className="min-h-screen snap-start flex items-center justify-center px-4 py-8"
      >
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            {recommendation && tripContext && travelEstimate && costPreferences ? (
              <TradeoffVisualization
                recommendation={recommendation}
                simulationInputs={{
                  tripContext,
                  travelEstimate,
                  costPreferences,
                }}
                onStartOver={handleStartOver}
                onBack={() => scrollToSection('travel')}
              />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Complete the previous sections to see your recommendation</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-8">
        <p>v2.0 — Inspired by Gad Allon&apos;s article</p>
      </div>
    </div>
  );
}
