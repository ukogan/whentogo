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

/**
 * Generate a random sample from an Exponentially Modified Gaussian (ex-Gaussian) distribution
 * This distribution has heavier tails than normal/lognormal and is commonly used for
 * response times and wait times (e.g., TSA security queues).
 *
 * ExGaussian = Normal(mu, sigma) + Exponential(lambda)
 *
 * @param mu - Mean of the Gaussian component
 * @param sigma - Standard deviation of the Gaussian component
 * @param lambda - Rate parameter of the exponential component (controls tail heaviness)
 * @returns Random sample from ex-Gaussian distribution
 */
export function sampleExGaussian(mu: number, sigma: number, lambda: number): number {
  // Generate normal component using Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  const normalSample = mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Generate exponential component
  const exponentialSample = -Math.log(Math.random()) / lambda;

  // Ex-Gaussian is the sum
  return Math.max(0, normalSample + exponentialSample); // Clamp to non-negative
}

/**
 * Fit ex-Gaussian parameters from mean and standard deviation
 * Uses moment matching: given empirical mean and std, estimate mu, sigma, lambda
 *
 * For ex-Gaussian: E[X] = mu + 1/lambda, Var[X] = sigma^2 + 1/lambda^2
 *
 * We use a heuristic: assume the exponential tail contributes 30% of variance
 * This gives heavier tails than lognormal while staying calibrated to observed data
 */
export function fitExGaussian(mean: number, std: number): { mu: number; sigma: number; lambda: number } {
  // Heuristic: exponential component has std = 0.3 * total std (30% of variance from tail)
  const expStd = 0.3 * std;
  const lambda = 1 / expStd;

  // Normal component gets the rest
  const expMean = 1 / lambda;
  const mu = mean - expMean;
  const normalVar = std * std - (1 / (lambda * lambda));
  const sigma = Math.sqrt(Math.max(0, normalVar));

  return { mu, sigma, lambda };
}
