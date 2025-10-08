'use client';

import { useState } from 'react';
import TripContextForm from './components/TripContextForm';
import TravelEstimateForm from './components/TravelEstimateForm';
import CostDialsForm from './components/CostDialsForm';
import TradeoffVisualization from './components/TradeoffVisualization';
import { calculateRecommendation, validateInputs } from './lib/calculations';
import type {
  TripContext,
  TravelEstimate,
  CostPreferences,
  Recommendation,
  SimulationInputs,
} from './lib/types';
import { Clock } from 'lucide-react';

type Step = 'context' | 'travel' | 'costs' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('context');
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [travelEstimate, setTravelEstimate] = useState<TravelEstimate | null>(null);
  const [costPreferences, setCostPreferences] = useState<CostPreferences | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContextComplete = (context: TripContext) => {
    setTripContext(context);
    setStep('travel');
  };

  const handleTravelComplete = (estimate: TravelEstimate) => {
    setTravelEstimate(estimate);
    setStep('costs');
  };

  const handleCostsComplete = (preferences: CostPreferences) => {
    if (!tripContext || !travelEstimate) {
      setError('Missing trip context or travel estimate');
      return;
    }

    const inputs: SimulationInputs = {
      tripContext,
      travelEstimate,
      costPreferences: preferences,
    };

    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      const result = calculateRecommendation(inputs);
      setCostPreferences(preferences);
      setRecommendation(result);
      setError(null);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const handleStartOver = () => {
    setStep('context');
    setTripContext(null);
    setTravelEstimate(null);
    setCostPreferences(null);
    setRecommendation(null);
    setError(null);
  };

  // Progress indicator
  const steps = ['context', 'travel', 'costs', 'results'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Clock className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Airport Timing Advisor</h1>
          </div>
          <p className="text-gray-600">
            Personalized recommendations for when to leave for your flight
          </p>
        </div>

        {/* Progress Bar */}
        {step !== 'results' && (
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {step === 'context' && <TripContextForm onComplete={handleContextComplete} />}

          {step === 'travel' && (
            <TravelEstimateForm
              onComplete={handleTravelComplete}
              onBack={() => setStep('context')}
            />
          )}

          {step === 'costs' && (
            <CostDialsForm
              onComplete={handleCostsComplete}
              onBack={() => setStep('travel')}
            />
          )}

          {step === 'results' && recommendation && tripContext && travelEstimate && costPreferences && (
            <TradeoffVisualization
              recommendation={recommendation}
              simulationInputs={{
                tripContext,
                travelEstimate,
                costPreferences,
              }}
              onStartOver={handleStartOver}
              onBack={() => setStep('costs')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>v1.0 MVP — Probabilistic flight timing recommendations</p>
        </div>
      </div>
    </div>
  );
}
