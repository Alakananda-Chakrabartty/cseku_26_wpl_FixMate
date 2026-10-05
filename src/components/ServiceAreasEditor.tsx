import React, { useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';

interface ServiceAreasEditorProps {
  value: string[];
  onChange: (areas: string[]) => void;
}

export const ServiceAreasEditor: React.FC<ServiceAreasEditorProps> = ({ value, onChange }) => {
  const [newArea, setNewArea] = useState('');

  const addArea = () => {
    const area = newArea.trim();
    if (!area || value.some((savedArea) => savedArea.toLowerCase() === area.toLowerCase())) return;
    onChange([...value, area]);
    setNewArea('');
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-slate-700 uppercase tracking-wider">
        Areas Served
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={newArea}
          onChange={(event) => setNewArea(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addArea();
            }
          }}
          placeholder="Add a neighborhood or city"
          className="min-w-0 flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addArea}
          disabled={!newArea.trim()}
          aria-label="Add service area"
          className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((area) => (
            <li key={area} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{area}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((savedArea) => savedArea !== area))}
                aria-label={`Remove ${area}`}
                className="text-slate-400 hover:text-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};