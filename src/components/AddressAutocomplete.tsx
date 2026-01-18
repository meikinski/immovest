'use client';

import React, { useState, useEffect } from "react";

// Typ richtig angepasst: formatted liegt in properties
type Suggestion = {
  properties: {
    formatted: string;
    postcode?: string;
    city?: string;
    street?: string;
    country?: string;
  };
};

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const AddressAutocomplete = ({ value, onChange }: Props) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();

        console.log("DEBUG: Geoapify Antwort", data);

        if (data.features) {
          setSuggestions(data.features);
        } else {
          console.warn("Keine Vorschläge erhalten");
          setSuggestions([]);
        }
      } catch (e) {
        console.error("Geoapify Fehler:", e);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  const handleSelect = (sug: Suggestion) => {
    onChange(sug.properties.formatted || "");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.target.select();
          setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="z. B. 10115 Berlin oder Mainzer Str. 10"
        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
      />

      {showSuggestions && value.length >= 2 && (
        <div className="absolute z-20 bg-white border-2 border-slate-200 rounded-2xl mt-2 w-full shadow-xl max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-slate-500 font-semibold">
              Suche läuft...
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((sug, idx) => (
                <li
                  key={idx}
                  className="p-3 hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-100 last:border-b-0 transition-colors"
                  onClick={() => handleSelect(sug)}
                >
                  {sug.properties.formatted}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500 font-semibold">
              Keine Ergebnisse gefunden. Versuche eine andere Adresse.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
