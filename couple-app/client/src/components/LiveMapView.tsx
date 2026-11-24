import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Battery,
  BatteryCharging,
  Gauge,
  Clock,
  Crosshair,
  Play,
  Heart,
  Car,
  Footprints,
  Home,
  Navigation,
  Check,
  X,
  RefreshCw,
  Search,
  Building
} from 'lucide-react';
import type { LiveLocation, ProfileData, UserRole } from '../types';

interface LiveMapViewProps {
  locations: Record<string, LiveLocation>;
  role: UserRole;
  profile: ProfileData;
  isSharingLocation: boolean;
  isAcquiringGPS: boolean;
  gpsStatusMessage?: string | null;
  onToggleSharing: () => void;
  onRequestGPS: () => void;
  onSendManualLocation: (lat: number, lon: number, speed?: number, targetPartner?: string) => void;
}

const POPULAR_LOCATIONS = [
  { name: '🏢 Bosch Werk Dresden', lat: 51.1278, lon: 13.7745, desc: 'Robert-Bosch-Ring 1' },
  { name: '📍 Dresden Zentrum', lat: 51.0504, lon: 13.7373, desc: 'Altmarkt / Frauenkirche' },
  { name: '📍 Leipzig', lat: 51.3397, lon: 12.3731, desc: 'Hauptbahnhof' },
  { name: '📍 Chemnitz', lat: 50.8278, lon: 12.9214, desc: 'Zentrum' },
  { name: '📍 Berlin', lat: 52.5200, lon: 13.4050, desc: 'Alexanderplatz' },
  { name: '📍 München', lat: 48.1351, lon: 11.5820, desc: 'Marienplatz' },
  { name: '📍 Stuttgart', lat: 48.7758, lon: 9.1829, desc: 'Schlossplatz / Bosch Schillerhöhe' },
  { name: '📍 Hamburg', lat: 53.5511, lon: 9.9937, desc: 'Jungfernstieg' },
  { name: '📍 Frankfurt', lat: 50.1109, lon: 8.6821, desc: 'Hauptwache' },
  { name: '📍 Köln', lat: 50.9375, lon: 6.9603, desc: 'Dom' },
  { name: '📍 Wien', lat: 48.2082, lon: 16.3738, desc: 'Stephansplatz' },
  { name: '📍 Zürich', lat: 47.3769, lon: 8.5417, desc: 'Hauptbahnhof' }
];

function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function LiveMapView({
  locations,
  role,
  profile,
  isSharingLocation,
  isAcquiringGPS,
  gpsStatusMessage,
  onToggleSharing,
  onRequestGPS,
  onSendManualLocation
}: LiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  const [pendingPin, setPendingPin] = useState<{ lat: number; lon: number } | null>(null);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const handleSetPreset = (lat: number, lon: number) => {
    onSendManualLocation(lat, lon, 0, currentRole);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1 });
    }
    setShowCitySearch(false);
  };

  const currentRole = role || 'Partner A';
  const partnerRole = currentRole === 'Partner A' ? 'Partner B' : 'Partner A';

  const myName = currentRole === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
  const partnerName = currentRole === 'Partner A' ? (profile.partner_b_name || 'Partner B') : (profile.partner_a_name || 'Partner A');

  const myLocation = locations[currentRole];
  const partnerLocation = locations[partnerRole];

  // Calculate live distance between both coordinates
  const distanceKm =
    myLocation && partnerLocation
      ? calculateDistanceInKm(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude
        )
      : null;

  // Partner movement speed description
  const partnerSpeed = partnerLocation?.speed || 0;
  let speedLabel = 'Stationär / Vor Ort';
  let SpeedIcon = Home;
  if (partnerSpeed > 25) {
    speedLabel = `Fährt mit ${Math.round(partnerSpeed)} km/h`;
    SpeedIcon = Car;
  } else if (partnerSpeed > 4) {
    speedLabel = `Unterwegs (${Math.round(partnerSpeed)} km/h)`;
    SpeedIcon = Footprints;
  } else if (partnerSpeed > 0) {
    speedLabel = `Geht (${Math.round(partnerSpeed)} km/h)`;
    SpeedIcon = Footprints;
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = myLocation
        ? [myLocation.latitude, myLocation.longitude]
        : partnerLocation
        ? [partnerLocation.latitude, partnerLocation.longitude]
        : [51.1657, 10.4515];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Allow clicking on map to reposition manually
      map.on('click', (e: L.LeafletMouseEvent) => {
        setPendingPin({ lat: e.latlng.lat, lon: e.latlng.lng });
      });

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Markers and Connecting Line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords: [number, number][] = [];

    const createMarkerIcon = (isMe: boolean, name: string) => {
      const bgGradient = isMe
        ? 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)'
        : 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
      const initial = (name || (isMe ? 'Ich' : 'P'))[0].toUpperCase();

      return L.divIcon({
        className: 'custom-partner-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 44px; height: 44px; border-radius: 50%;
              background: ${bgGradient};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.25);
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 900; font-size: 16px;
            ">
              ${initial}
            </div>
            <div style="
              position: absolute; bottom: -6px;
              background: #ffffff; color: #4a4a4a;
              border-radius: 9999px; padding: 2px 8px;
              font-size: 10px; font-weight: 800;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              white-space: nowrap; border: 1px solid #f0f0f0;
            ">
              ${isMe ? 'Ich' : name}
            </div>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 26]
      });
    };

    // 1. My Marker
    if (myLocation) {
      const latlng: [number, number] = [myLocation.latitude, myLocation.longitude];
      coords.push(latlng);

      if (markersRef.current['me']) {
        markersRef.current['me'].setLatLng(latlng);
      } else {
        const marker = L.marker(latlng, { icon: createMarkerIcon(true, myName) }).addTo(map);
        marker.bindPopup(`<b>${myName} (Ich)</b><br/>Standort aktiv`);
        markersRef.current['me'] = marker;
      }
    }

    // 2. Partner Marker
    if (partnerLocation) {
      const latlng: [number, number] = [partnerLocation.latitude, partnerLocation.longitude];
      coords.push(latlng);

      if (markersRef.current['partner']) {
        markersRef.current['partner'].setLatLng(latlng);
      } else {
        const marker = L.marker(latlng, { icon: createMarkerIcon(false, partnerName) }).addTo(map);
        marker.bindPopup(`<b>${partnerName}</b><br/>${speedLabel}`);
        markersRef.current['partner'] = marker;
      }
    }

    // 3. Polyline between both
    if (coords.length === 2) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(coords);
      } else {
        polylineRef.current = L.polyline(coords, {
          color: '#ff758c',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.8
        }).addTo(map);
      }
    }
  }, [myLocation, partnerLocation, myName, partnerName, speedLabel]);

  // Map Controls
  const zoomToMe = () => {
    if (myLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([myLocation.latitude, myLocation.longitude], 15, { duration: 1 });
    } else {
      onRequestGPS();
    }
  };

  const zoomToPartner = () => {
    if (partnerLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([partnerLocation.latitude, partnerLocation.longitude], 15, { duration: 1 });
    }
  };

  const fitBoth = () => {
    if (myLocation && partnerLocation && mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [myLocation.latitude, myLocation.longitude],
        [partnerLocation.latitude, partnerLocation.longitude]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  };

  // Confirm manual map click
  const handleConfirmManualPin = () => {
    if (!pendingPin) return;
    onSendManualLocation(pendingPin.lat, pendingPin.lon, 0, currentRole);
    setPendingPin(null);
  };

  // Simulation: Move Partner slightly to demonstrate real-time live speed & movement
  const handleSimulateMovement = () => {
    if (!partnerLocation) return;
    const randomOffsetLat = (Math.random() - 0.5) * 0.008;
    const randomOffsetLon = (Math.random() - 0.5) * 0.008;
    const simulatedSpeed = Math.floor(25 + Math.random() * 40); // 25-65 km/h
    onSendManualLocation(
      partnerLocation.latitude + randomOffsetLat,
      partnerLocation.longitude + randomOffsetLon,
      simulatedSpeed,
      partnerRole
    );
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Live-Karte & GPS 💕</h2>
          <p className="text-xs text-gray-400 font-medium">Echtzeit-Standort & Tempo deines Schatzes</p>
        </div>

        {/* Live sharing switch */}
        <button
          type="button"
          onClick={onToggleSharing}
          className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ${
            isSharingLocation
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isSharingLocation ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
          <span>{isSharingLocation ? 'Live AN' : 'Live AUS'}</span>
        </button>
      </div>

      {/* Prominent Direct Phone GPS Trigger Button */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onRequestGPS}
          disabled={isAcquiringGPS}
          className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 text-white py-2.5 px-4 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-80"
        >
          {isAcquiringGPS ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Lese Telefon-GPS aus...</span>
            </>
          ) : (
            <>
              <Navigation size={15} />
              <span>📡 Meinen echten Telefon-Standort jetzt erfassen</span>
            </>
          )}
        </button>
        {gpsStatusMessage && (
          <p className="text-[10px] text-center font-bold text-gray-500">
            {gpsStatusMessage}
          </p>
        )}
      </div>

      {/* Quick City Presets (Perfect for office/VPN users where GPS resolves to proxy) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-extrabold text-gray-400 shrink-0">Schnellwahl:</span>
        <button
          type="button"
          onClick={() => handleSetPreset(51.1278, 13.7745)}
          className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 active:scale-95 transition-all shadow-xs flex items-center gap-1"
        >
          <Building size={11} /> Bosch Dresden
        </button>
        <button
          type="button"
          onClick={() => handleSetPreset(51.0504, 13.7373)}
          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 active:scale-95 transition-all shadow-xs flex items-center gap-1"
        >
          📍 Dresden Zentrum
        </button>
        <button
          type="button"
          onClick={() => setShowCitySearch(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 active:scale-95 transition-all flex items-center gap-1"
        >
          <Search size={11} /> Stadt wählen
        </button>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[320px] rounded-3xl overflow-hidden shadow-sm border border-pink-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick GPS Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={zoomToPartner}
            title={`Zu ${partnerName} springen`}
            className="w-9 h-9 bg-white/95 text-purple-600 rounded-2xl shadow-md border border-purple-100 flex items-center justify-center hover:bg-white active:scale-90 transition-transform"
          >
            <Heart size={16} fill="currentColor" />
          </button>

          <button
            type="button"
            onClick={zoomToMe}
            title="Zu mir springen"
            className="w-9 h-9 bg-white/95 text-pink-600 rounded-2xl shadow-md border border-pink-100 flex items-center justify-center hover:bg-white active:scale-90 transition-transform"
          >
            <Crosshair size={16} />
          </button>

          <button
            type="button"
            onClick={fitBoth}
            title="Beide anzeigen"
            className="w-9 h-9 bg-white/95 text-gray-700 rounded-2xl shadow-md border border-gray-100 flex items-center justify-center hover:bg-white active:scale-90 transition-transform text-[11px] font-black"
          >
            2x
          </button>
        </div>

        {/* Distance Badge Floating in Map */}
        {distanceKm !== null && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs text-gray-800 px-3 py-1 rounded-full shadow-md border border-pink-200 text-xs font-black flex items-center gap-1.5 pointer-events-none">
            <Heart size={12} className="text-pink-500 animate-pulse" fill="currentColor" />
            <span>
              {distanceKm === 0 ? 'Am selben Ort! 🥰' : `${distanceKm} km voneinander`}
            </span>
          </div>
        )}

        {/* Floating Manual Pin Confirmation Overlay if tapped on map */}
        {pendingPin && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-pink-200 flex items-center justify-between gap-2 animate-in">
            <div className="min-w-0">
              <span className="text-[11px] font-black text-gray-800 block truncate">
                📍 Auf Karte getippt
              </span>
              <span className="text-[10px] text-gray-500 block truncate">
                Standort von {myName} hierher setzen?
              </span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPendingPin(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl bg-gray-100 text-xs"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                onClick={handleConfirmManualPin}
                className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1"
              >
                <Check size={14} /> Setzen
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-gray-400">
        💡 Tipp: Du kannst auch einfach auf die Karte tippen, um deinen Pin manuell zu verschieben!
      </p>

      {/* Partner Live Status Card */}
      {partnerLocation && (
        <div className="glass-panel p-3.5 rounded-2xl shadow-xs border border-purple-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-pink-300 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {(partnerName || 'P')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800 leading-tight">
                  Status von {partnerName}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                  <Clock size={10} />
                  <span>{partnerLocation.updated_at}</span>
                </div>
              </div>
            </div>

            {/* Battery Indicator */}
            {partnerLocation.battery_level !== undefined && partnerLocation.battery_level !== null && (
              <div className="flex items-center gap-1 text-[11px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-100">
                {partnerLocation.is_charging ? (
                  <BatteryCharging size={13} className="text-emerald-500" />
                ) : (
                  <Battery size={13} />
                )}
                <span>{partnerLocation.battery_level}%</span>
              </div>
            )}
          </div>

          {/* Speed & Activity Highlights */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <div className="bg-white/80 p-2 rounded-xl border border-pink-50 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <SpeedIcon size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-gray-400 block truncate">Tempo / Aktivität</span>
                <span className="text-[11px] font-black text-gray-800 truncate block">
                  {speedLabel}
                </span>
              </div>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-purple-50 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Gauge size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-gray-400 block truncate">Genauigkeit</span>
                <span className="text-[11px] font-black text-gray-800 truncate block">
                  ±{Math.round(partnerLocation.accuracy || 10)} Meter
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator / Test Controls (Hilft beim Testen am Schreibtisch) */}
      <div className="glass-panel p-3 rounded-2xl shadow-xs flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-black text-gray-700 block truncate">
            🧪 Fahrt-Simulation
          </span>
          <p className="text-[9px] text-gray-400 truncate">
            Simuliert eine Fahrt von {partnerName} mit GPS-Tempo
          </p>
        </div>
        <button
          type="button"
          onClick={handleSimulateMovement}
          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs shrink-0 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Play size={12} fill="currentColor" /> Test-Fahrt
        </button>
      </div>

      {/* City Search Modal */}
      {showCitySearch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-gray-800">Standort auswählen 📍</h3>
              <button
                type="button"
                onClick={() => setShowCitySearch(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Stadt suchen (z.B. Dresden)..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {POPULAR_LOCATIONS
                .filter(loc => loc.name.toLowerCase().includes(searchFilter.toLowerCase()) || loc.desc.toLowerCase().includes(searchFilter.toLowerCase()))
                .map(loc => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSetPreset(loc.lat, loc.lon)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-pink-50/70 border border-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{loc.name}</span>
                      <span className="text-[10px] text-gray-400 block">{loc.desc}</span>
                    </div>
                    <span className="text-pink-500 text-xs font-bold">Wählen →</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
