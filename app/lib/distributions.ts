/**
 * Statistical distribution utilities for probabilistic calculations
 */

/**
 * Generate a random sample from a lognormal distribution
 * @param mu - Mean of underlying normal distribution
 * @param sigma - Standard deviation of underlying normal distribution
 * @returns Random sample from lognormal distribution
 */
export function sampleLognormal(mu: number, sigma: number): number {
  // Box-Muller transform to generate normal random variable
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Transform to lognormal
  return Math.exp(mu + sigma * z);
}

/**
 * Fit lognormal parameters from min-max range
 * Uses method of moments approximation:
 * - Assumes min ≈ exp(μ - 1.5σ)
 * - Assumes max ≈ exp(μ + 1.5σ)
 *
 * @param min - Minimum value (e.g., fastest travel time)
 * @param max - Maximum value (e.g., slowest travel time)
 * @returns Object with mu and sigma parameters for lognormal distribution
 */
export function fitLognormalFromMinMax(min: number, max: number): { mu: number; sigma: number } {
  if (min <= 0 || max <= 0) {
    throw new Error('Min and max must be positive for lognormal distribution');
  }
  if (min >= max) {
    throw new Error('Min must be less than max');
  }

  // Using the approximation that the range covers ±1.5 sigma
  const logMin = Math.log(min);
  const logMax = Math.log(max);

  const mu = (logMin + logMax) / 2;
  const sigma = (logMax - logMin) / 3; // 3 = 2 * 1.5

  return { mu, sigma };
}

/**
 * Compute quantile (inverse CDF) from sorted samples
 * @param samples - Array of samples (must be sorted)
 * @param quantile - Quantile to compute (0-1)
 * @returns Value at the specified quantile
 */
export function computeQuantile(samples: number[], quantile: number): number {
  if (quantile < 0 || quantile > 1) {
    throw new Error('Quantile must be between 0 and 1');
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.floor(quantile * (sorted.length - 1));

  // Linear interpolation between adjacent indices
  const lower = sorted[index];
  const upper = sorted[Math.min(index + 1, sorted.length - 1)];
  const fraction = (quantile * (sorted.length - 1)) - index;

  return lower + fraction * (upper - lower);
}

/**
 * Compute mean from array of samples
 */
export function mean(samples: number[]): number {
  return samples.reduce((sum, val) => sum + val, 0) / samples.length;
}

/**
 * Compute standard deviation from array of samples
 */
export function standardDeviation(samples: number[]): number {
  const avg = mean(samples);
  const squaredDiffs = samples.map(val => Math.pow(val - avg, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}
