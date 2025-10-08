/**
 * Airport data utilities
 */

import airportsData from '../data/airports.json';
import type { Airport } from './types';

// Type assertion for imported JSON
const airports = airportsData as Airport[];

/**
 * Get all airports
 */
export function getAllAirports(): Airport[] {
  return airports;
}

/**
 * Find airport by code (case-insensitive)
 */
export function findAirportByCode(code: string): Airport | undefined {
  return airports.find(
    (airport) => airport.code.toLowerCase() === code.toLowerCase()
  );
}

/**
 * Search airports by code or name (fuzzy search for autocomplete)
 * @param query - Search string
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of matching airports, sorted by relevance
 */
export function searchAirports(query: string, limit: number = 10): Airport[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Score each airport based on match quality
  const scored = airports.map((airport) => {
    let score = 0;

    const code = airport.code.toLowerCase();
    const name = airport.name.toLowerCase();
    const city = airport.city.toLowerCase();

    // Exact code match (highest priority)
    if (code === searchTerm) {
      score += 1000;
    }
    // Code starts with query
    else if (code.startsWith(searchTerm)) {
      score += 500;
    }
    // Code contains query
    else if (code.includes(searchTerm)) {
      score += 100;
    }

    // City name match (high priority)
    if (city === searchTerm) {
      score += 400;
    }
    // City starts with query
    else if (city.startsWith(searchTerm)) {
      score += 300;
    }
    // City contains query
    else if (city.includes(searchTerm)) {
      score += 50;
    }

    // Airport name match
    if (name.includes(searchTerm)) {
      score += 25;
    }

    // Boost large airports slightly (more commonly used)
    if (airport.size === 'large' && score > 0) {
      score += 5;
    }

    return { airport, score };
  });

  // Filter to only matches and sort by score
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.airport);
}

/**
 * Format airport for display (e.g., "SFO - San Francisco International")
 */
export function formatAirportDisplay(airport: Airport): string {
  return `${airport.code} - ${airport.name}`;
}

/**
 * Format airport with city (e.g., "SFO - San Francisco")
 */
export function formatAirportWithCity(airport: Airport): string {
  return `${airport.code} - ${airport.city}`;
}
