import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet's default icons break with bundlers)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  address: string;
  radiusMiles: number;
  onLocationResolved: (coords: Coordinates) => void;
}

const MILES_TO_METERS = 1609.344;

function MapUpdater({ center, radiusMeters }: { center: Coordinates; radiusMeters: number }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLng(center.lat, center.lng).toBounds(radiusMeters * 2);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, center, radiusMeters]);

  return null;
}

export function LocationMap({ address, radiusMiles, onLocationResolved }: LocationMapProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController>(null);

  const geocode = useCallback(async (query: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setGeocoding(true);
    setError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        },
      );
      const data = await res.json();

      if (data.length === 0) {
        setError('Location not found. Try a more specific address.');
        setCoords(null);
        return;
      }

      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setCoords(result);
      onLocationResolved(result);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Failed to geocode address.');
      }
    } finally {
      setGeocoding(false);
    }
  }, [onLocationResolved]);

  useEffect(() => {
    if (!address || address.length < 3) {
      setCoords(null);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(address), 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, geocode]);

  const radiusMeters = radiusMiles * MILES_TO_METERS;

  if (geocoding) {
    return (
      <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 12, color: '#6b7280' }}>
        Searching location...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 12, color: '#991b1b' }}>
        {error}
      </div>
    );
  }

  if (!coords) {
    return (
      <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 12, color: '#6b7280', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 32 }}>&#128205;</span>
        <span>Enter an address to see the map</span>
      </div>
    );
  }

  return (
    <div style={{ height: 250, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lng]} icon={defaultIcon} />
        <Circle
          center={[coords.lat, coords.lng]}
          radius={radiusMeters}
          pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.15 }}
        />
        <MapUpdater center={coords} radiusMeters={radiusMeters} />
      </MapContainer>
    </div>
  );
}
