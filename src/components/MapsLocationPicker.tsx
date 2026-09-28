import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin } from 'lucide-react';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapsLocationPickerProps {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
  onLocationNameResolved?: (name: string) => void;
}

export const MapsLocationPicker: React.FC<MapsLocationPickerProps> = ({ value, onChange, onLocationNameResolved }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const onLocationNameResolvedRef = useRef(onLocationNameResolved);
  const [mapError, setMapError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onLocationNameResolvedRef.current = onLocationNameResolved;
  }, [onLocationNameResolved]);

  useEffect(() => {
    if (!mapElement.current) return;

    map.current = L.map(mapElement.current).setView(
      value ? [value.lat, value.lng] : [22.8456, 89.5403],
      value ? 15 : 12
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);
    map.current.on('click', (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !value) return;

    const position: L.LatLngExpression = [value.lat, value.lng];
    map.current.setView(position, 15);
    if (!marker.current) {
      marker.current = L.marker(position, { draggable: true, title: 'Drag to set your base location' })
        .addTo(map.current);
      marker.current.on('dragend', () => {
        const point = marker.current?.getLatLng();
        if (point) onChangeRef.current({ lat: point.lat, lng: point.lng });
      });
    } else {
      marker.current.setLatLng(position);
    }
  }, [value]);

  useEffect(() => {
    if (!value || !onLocationNameResolvedRef.current) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(value.lat),
      lon: String(value.lng),
      zoom: '14',
      addressdetails: '1',
    });

    fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not resolve map location.')))
      .then((result) => {
        const address = result.address || {};
        const locality = address.suburb || address.neighbourhood || address.city_district || address.town || address.city || address.village;
        const region = address.state || address.country;
        if (locality) onLocationNameResolvedRef.current?.([locality, region].filter(Boolean).join(', '));
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setMapError('Could not find a place name for this map point. Enter the locality name manually.');
      });

    return () => controller.abort();
  }, [value?.lat, value?.lng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Location access is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ lat: coords.latitude, lng: coords.longitude });
        setIsLocating(false);
      },
      () => {
        setMapError('Could not access your location. Allow location access or choose a point on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="block font-semibold text-slate-700 uppercase tracking-wider">
          Base Location
        </label>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {isLocating ? 'Locating...' : 'Use current location'}
        </button>
      </div>
      <div ref={mapElement} className="h-52 w-full rounded-xl border border-slate-200 bg-slate-100" />
      {mapError && <p className="text-[11px] text-rose-700">{mapError}</p>}
      <p className="flex items-center gap-1 text-[11px] text-slate-500">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {value
          ? `Selected: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Choose your base location on the map or use your current location.'}
      </p>
    </div>
  );
};