'use client';

import React, { useState, useEffect } from "react";
import { InputField } from "@/components/InputField";

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
      <InputField
        label=""
        className="input-uniform input-editable"
        value={value}
        onValueChange={onChange} // ✅ das war vorher `onChange`
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="z. B. 10115 Berlin oder Mainzer Str. 10"
      />

      {showSuggestions && value.length >= 2 && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 w-full shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Suche läuft...
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((sug, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelect(sug)}
                >
                  {sug.properties.formatted}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Keine Ergebnisse gefunden. Versuche eine andere Adresse.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
