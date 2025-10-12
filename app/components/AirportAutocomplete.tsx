'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAirports, formatAirportWithCity } from '../lib/airports';
import type { Airport } from '../lib/types';
import { Plane } from 'lucide-react';

interface AirportAutocompleteProps {
  selectedAirport: Airport | null;
  onSelectAirport: (airport: Airport) => void;
}

export default function AirportAutocomplete({
  selectedAirport,
  onSelectAirport,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update query when selected airport changes
  useEffect(() => {
    if (selectedAirport) {
      setQuery(formatAirportWithCity(selectedAirport));
      setIsOpen(false);
    }
  }, [selectedAirport]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (value.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results = searchAirports(value, 8);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setFocusedIndex(-1);
  };

  // Handle airport selection
  const handleSelect = (airport: Airport) => {
    onSelectAirport(airport);
    setQuery(formatAirportWithCity(airport));
    setIsOpen(false);
    setSuggestions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelect(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Plane className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search airport code or city..."
          className="w-full h-12 pl-12 pr-4 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     border border-gray-200 dark:border-gray-600 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
                     rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {suggestions.map((airport, index) => (
            <button
              key={airport.code}
              onClick={() => handleSelect(airport)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                         ${index === focusedIndex ? 'bg-blue-50' : ''}
                         ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{airport.code}</div>
                  <div className="text-sm text-gray-600">{airport.city}</div>
                </div>
                <div className="text-xs text-gray-400 uppercase">{airport.size}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
