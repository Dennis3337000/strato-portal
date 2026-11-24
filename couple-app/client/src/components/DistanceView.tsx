import { useState } from 'react';
import { MapPin, Train, Car, Plane, Heart, Sparkles, Navigation } from 'lucide-react';
import type { LiveLocation, ProfileData, UserRole } from '../types';
import LiveMapView from './LiveMapView';

interface DistanceViewProps {
  locations: Record<string, LiveLocation>;
  profile: ProfileData;
  role: UserRole;
  isSharingLocation: boolean;
  onToggleSharing: () => void;
  onSendManualLocation: (lat: number, lon: number, speed?: number) => void;
  onUpdateCity: (partnerKey: 'partner_a_city' | 'partner_b_city', city: string) => void;
  onSendHug: () => void;
}

// City coordinates database for precise realistic distance
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'München': { lat: 48.1351, lon: 11.5820 },
  'Hamburg': { lat: 53.5511, lon: 9.9937 },
  'Köln': { lat: 50.9375, lon: 6.9603 },
  'Frankfurt': { lat: 50.1109, lon: 8.6821 },
  'Stuttgart': { lat: 48.7758, lon: 9.1829 },
  'Düsseldorf': { lat: 51.2277, lon: 6.7735 },
  'Leipzig': { lat: 51.3397, lon: 12.3731 },
  'Dresden': { lat: 51.0504, lon: 13.7373 },
  'Hannover': { lat: 52.3759, lon: 9.7320 },
  'Nürnberg': { lat: 49.4521, lon: 11.0767 },
  'Wien': { lat: 48.2082, lon: 16.3738 },
  'Zürich': { lat: 47.3769, lon: 8.5417 },
  'Salzburg': { lat: 47.8095, lon: 13.0550 },
  'Innsbruck': { lat: 47.2692, lon: 11.4041 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Rom': { lat: 41.9028, lon: 12.4964 },
  'Barcelona': { lat: 41.3879, lon: 2.1699 },
  'Amsterdam': { lat: 52.3676, lon: 4.9041 }
};

function calculateHaversine(cityA: string, cityB: string): number {
  const coordA = CITY_COORDS[cityA];
  const coordB = CITY_COORDS[cityB];

  if (!coordA || !coordB) {
    if (cityA.toLowerCase() === cityB.toLowerCase()) return 0;
    const hash = (cityA.length + cityB.length) * 37;
    return 120 + (hash % 600);
  }

  const R = 6371; // Earth radius in km
  const dLat = ((coordB.lat - coordA.lat) * Math.PI) / 180;
  const dLon = ((coordB.lon - coordA.lon) * Math.PI) / 180;
  const lat1 = (coordA.lat * Math.PI) / 180;
  const lat2 = (coordB.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function DistanceView({
  locations,
  profile,
  role,
  isSharingLocation,
  onToggleSharing,
  onSendManualLocation,
  onUpdateCity,
  onSendHug
}: DistanceViewProps) {
  const [subTab, setSubTab] = useState<'map' | 'cities'>('map');

  const [cityA, setCityA] = useState(profile.partner_a_city || 'Berlin');
  const [cityB, setCityB] = useState(profile.partner_b_city || 'München');
  const [hugSent, setHugSent] = useState(false);

  const distanceKm = calculateHaversine(cityA, cityB);

  // Approximate travel times
  const trainHours = Math.max(1, Math.round((distanceKm / 130) * 10) / 10);
  const carHours = Math.max(1, Math.round((distanceKm / 100) * 10) / 10);
  const flightHours = Math.max(1, Math.round((distanceKm / 650 + 1) * 10) / 10);

  const handleCityAChange = (c: string) => {
    setCityA(c);
    onUpdateCity('partner_a_city', c);
  };

  const handleCityBChange = (c: string) => {
    setCityB(c);
    onUpdateCity('partner_b_city', c);
  };

  const triggerHug = () => {
    setHugSent(true);
    onSendHug();
    setTimeout(() => setHugSent(false), 2000);
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Sub-tab Pill Switcher */}
      <div className="flex bg-white/90 p-1 rounded-2xl shadow-xs border border-gray-100 gap-1 w-full">
        <button
          type="button"
          onClick={() => setSubTab('map')}
          className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            subTab === 'map'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Navigation size={13} className="shrink-0" />
          <span className="truncate">Live GPS-Karte</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cities')}
          className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            subTab === 'cities'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">Städte-Distanz</span>
        </button>
      </div>

      {/* VIEW 1: LIVE GPS MAP */}
      {subTab === 'map' && (
        <LiveMapView
          locations={locations}
          role={role}
          profile={profile}
          isSharingLocation={isSharingLocation}
          onToggleSharing={onToggleSharing}
          onSendManualLocation={onSendManualLocation}
        />
      )}

      {/* VIEW 2: CITIES DISTANCE & TRAVEL TIMES */}
      {subTab === 'cities' && (
        <div className="space-y-3 animate-in">
          <div>
            <h2 className="text-base font-black text-gray-800">Städte-Entfernung</h2>
            <p className="text-xs text-gray-400 font-medium">Reisezeiten & Routen zwischen euren Wohnorten</p>
          </div>

          {/* Main Distance Visual Card */}
          <div className="glass-panel p-4 rounded-3xl shadow-xs text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                Wohnort-Distanz
              </span>

              {distanceKm === 0 ? (
                <div className="my-2">
                  <span className="text-2xl font-black gradient-text">Am selben Ort! 🥰</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Ihr seid zusammen in einer Stadt.</p>
                </div>
              ) : (
                <div className="my-1.5">
                  <div className="text-4xl font-black gradient-text tracking-tight flex items-center justify-center gap-1">
                    <span>{distanceKm}</span>
                    <span className="text-xl font-bold text-gray-500">km</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate px-1">
                    {profile.partner_a_name} ({cityA}) ↔ {profile.partner_b_name} ({cityB})
                  </p>
                </div>
              )}

              {/* Connected Bridge Graphics */}
              <div className="my-4 px-2 relative flex items-center justify-between">
                <div className="absolute left-6 right-6 top-1/2 h-0.5 border-t-2 border-dashed border-pink-300 -translate-y-1/2 z-0" />

                <div className="z-10 flex flex-col items-center min-w-0 max-w-[80px]">
                  <div className="w-9 h-9 bg-pink-100 border-2 border-pink-400 rounded-xl flex items-center justify-center shadow-xs text-pink-600 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <span className="text-[11px] font-black text-gray-800 mt-1 truncate w-full">{cityA}</span>
                  <span className="text-[9px] text-gray-400 font-bold truncate w-full">{profile.partner_a_name}</span>
                </div>

                <div className="z-10 bg-white p-1.5 rounded-full shadow-xs border border-pink-200 animate-pulse shrink-0">
                  <Heart size={14} fill="#ff9a9e" className="text-[var(--color-primary)]" />
                </div>

                <div className="z-10 flex flex-col items-center min-w-0 max-w-[80px]">
                  <div className="w-9 h-9 bg-purple-100 border-2 border-purple-400 rounded-xl flex items-center justify-center shadow-xs text-purple-600 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <span className="text-[11px] font-black text-gray-800 mt-1 truncate w-full">{cityB}</span>
                  <span className="text-[9px] text-gray-400 font-bold truncate w-full">{profile.partner_b_name}</span>
                </div>
              </div>

              {/* Travel Times Grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100">
                <div className="bg-white/70 p-2 rounded-xl border border-pink-50 text-center min-w-0">
                  <Train size={14} className="mx-auto mb-0.5 text-pink-500" />
                  <span className="text-[8px] uppercase font-bold text-gray-400 block truncate">Bahn</span>
                  <span className="text-[11px] font-black text-gray-700 truncate block">~{trainHours}h</span>
                </div>
                <div className="bg-white/70 p-2 rounded-xl border border-pink-50 text-center min-w-0">
                  <Car size={14} className="mx-auto mb-0.5 text-purple-500" />
                  <span className="text-[8px] uppercase font-bold text-gray-400 block truncate">Auto</span>
                  <span className="text-[11px] font-black text-gray-700 truncate block">~{carHours}h</span>
                </div>
                <div className="bg-white/70 p-2 rounded-xl border border-pink-50 text-center min-w-0">
                  <Plane size={14} className="mx-auto mb-0.5 text-blue-500" />
                  <span className="text-[8px] uppercase font-bold text-gray-400 block truncate">Flug</span>
                  <span className="text-[11px] font-black text-gray-700 truncate block">~{flightHours}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* City Pickers */}
          <div className="glass-panel p-3.5 rounded-2xl shadow-xs space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Wohnorte anpassen
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5 truncate">
                  {profile.partner_a_name}:
                </label>
                <select
                  value={cityA}
                  onChange={e => handleCityAChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-pink-400 truncate"
                >
                  {Object.keys(CITY_COORDS).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-purple-600 block mb-0.5 truncate">
                  {profile.partner_b_name}:
                </label>
                <select
                  value={cityB}
                  onChange={e => handleCityBChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-400 truncate"
                >
                  {Object.keys(CITY_COORDS).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sweet Long Distance Button */}
          <button
            type="button"
            onClick={triggerHug}
            className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-purple-400 text-white py-3 rounded-2xl text-xs font-black shadow-xs hover:shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {hugSent ? (
              <>
                <Sparkles size={14} className="animate-spin" /> Umarmung über {distanceKm} km gesendet! 💕
              </>
            ) : (
              <>
                <Heart size={14} fill="white" /> Virtuelle Umarmung schicken 🤗
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
