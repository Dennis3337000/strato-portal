import { useState } from 'react';
import { Heart, Sparkles, Send, Utensils, Calendar, CheckSquare, MessageCircleHeart, Cake, Navigation } from 'lucide-react';
import type { ProfileData, MoodData, CountdownItem, EventItem, MealItem, NoteItem, UserRole, LiveLocation } from '../types';

const EMOJI_OPTIONS = ['🥰', '😊', '😴', '🥳', '😭', '🥺', '☕', '🍕', '🤒'];

interface DashboardProps {
  role: UserRole;
  profile: ProfileData;
  daysTogether: number;
  moods: Record<string, MoodData>;
  countdown: CountdownItem;
  events: EventItem[];
  meals: MealItem[];
  notes: NoteItem[];
  locations?: Record<string, LiveLocation>;
  onUpdateMood: (emoji: string, text: string) => void;
  onSendHug: () => void;
  onNavigateTab: (tab: string) => void;
}

function getDaysUntilBirthday(birthdayStr?: string): { days: number; formattedDate: string } | null {
  if (!birthdayStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = birthdayStr.split('-');
    if (parts.length < 3) return null;
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    let next = new Date(today.getFullYear(), month, day);
    if (next.getTime() < today.getTime()) {
      next = new Date(today.getFullYear() + 1, month, day);
    }
    const days = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { days, formattedDate: `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.` };
  } catch {
    return null;
  }
}

export default function Dashboard({
  role,
  profile,
  daysTogether,
  moods,
  countdown,
  events,
  meals,
  notes,
  locations,
  onUpdateMood,
  onSendHug,
  onNavigateTab
}: DashboardProps) {
  const currentPartnerName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
  const partnerName = role === 'Partner A' ? (profile.partner_b_name || 'Partner B') : (profile.partner_a_name || 'Partner A');

  const myMood = moods[role || 'Partner A'] || { emoji: '😊', text: 'Gut drauf', updated_at: 'Gerade eben' };
  const partnerRole = role === 'Partner A' ? 'Partner B' : 'Partner A';
  const partnerMood = moods[partnerRole] || { emoji: '🥰', text: 'Denke an dich!', updated_at: 'Vorhin' };

  const [isEditingMood, setIsEditingMood] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(myMood.emoji);
  const [statusText, setStatusText] = useState(myMood.text);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Compute days until countdown
  const targetTime = new Date(countdown.target_date).getTime();
  const now = new Date().getTime();
  const diffDays = Math.max(0, Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24)));

  // Next upcoming event
  const nextEvent = events.length > 0 ? events[0] : null;

  // Today's meal
  const todayDayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][new Date().getDay()];
  const todaysMeal = meals.find(m => m.day === todayDayName);

  // Birthday checks
  const partnerABday = getDaysUntilBirthday(profile.partner_a_birthday);
  const partnerBBday = getDaysUntilBirthday(profile.partner_b_birthday);

  // Nearest birthday
  let nextBirthdayInfo = null;
  if (partnerABday && partnerBBday) {
    if (partnerABday.days <= partnerBBday.days) {
      nextBirthdayInfo = { name: profile.partner_a_name || 'Partner A', ...partnerABday };
    } else {
      nextBirthdayInfo = { name: profile.partner_b_name || 'Partner B', ...partnerBBday };
    }
  } else if (partnerABday) {
    nextBirthdayInfo = { name: profile.partner_a_name || 'Partner A', ...partnerABday };
  } else if (partnerBBday) {
    nextBirthdayInfo = { name: profile.partner_b_name || 'Partner B', ...partnerBBday };
  }

  // Live Location details
  const myLoc = locations?.[role || 'Partner A'];
  const partnerLoc = locations?.[partnerRole];
  let distanceBetweenKm: number | null = null;
  if (myLoc && partnerLoc) {
    const R = 6371;
    const dLat = ((partnerLoc.latitude - myLoc.latitude) * Math.PI) / 180;
    const dLon = ((partnerLoc.longitude - myLoc.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((myLoc.latitude * Math.PI) / 180) *
        Math.cos((partnerLoc.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceBetweenKm = Math.round(R * c * 10) / 10;
  }

  const handleSaveMood = () => {
    onUpdateMood(selectedEmoji, statusText);
    setIsEditingMood(false);
  };

  const triggerHug = () => {
    setShowHeartBurst(true);
    onSendHug();
    setTimeout(() => setShowHeartBurst(false), 1500);
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Love Counter Hero Card */}
      <div className="glass-panel p-4 rounded-3xl relative overflow-hidden text-center shadow-xs">
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
            Unsere Liebesgeschichte
          </span>
          <div className="text-3xl font-black gradient-text my-0.5 flex items-center justify-center gap-1.5">
            <span>{daysTogether}</span>
            <span className="text-xl font-extrabold text-gray-600">Tage</span>
            <Heart size={22} className="text-pink-500 animate-bounce" fill="currentColor" />
          </div>
          <p className="text-[11px] text-gray-500 font-medium truncate">
            Jeder einzelne Tag mit dir ist besonders ✨
          </p>
        </div>
      </div>

      {/* Birthday Banner if available */}
      {nextBirthdayInfo && (
        <div className="bg-gradient-to-r from-amber-400 via-rose-300 to-pink-400 text-white p-3 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-white/25 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-100 block truncate">
                Geburtstags-Countdown 🎂
              </span>
              <p className="font-extrabold text-xs truncate">
                {nextBirthdayInfo.name} ({nextBirthdayInfo.formattedDate})
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="text-lg font-black leading-none block">
              {nextBirthdayInfo.days === 0 ? 'Heute! 🎉' : `in ${nextBirthdayInfo.days} T.`}
            </span>
          </div>
        </div>
      )}

      {/* Big Event Countdown Banner */}
      {countdown && (
        <div
          onClick={() => onNavigateTab('calendar')}
          className="cursor-pointer bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between transition-transform active:scale-98"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-xs">
              <Sparkles size={18} className="animate-spin text-white" style={{ animationDuration: '6s' }} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-pink-100 block">Vorfreude-Zähler</span>
              <h3 className="font-bold text-xs truncate leading-tight">{countdown.title}</h3>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <div className="text-xl font-black leading-none">{diffDays}</div>
            <div className="text-[9px] font-bold text-pink-100 uppercase">Tage</div>
          </div>
        </div>
      )}

      {/* Live GPS & Karte Widget auf dem Dashboard */}
      <div
        onClick={() => onNavigateTab('map')}
        className="cursor-pointer glass-panel p-3.5 rounded-2xl shadow-xs border border-pink-200/90 hover:border-pink-300 transition-all flex items-center justify-between active:scale-98 group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-400 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-pink-600 tracking-wide">
                Live GPS & Karte
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            </div>
            <h4 className="font-black text-xs text-gray-800 truncate">
              {partnerLoc
                ? `${partnerName} • ${partnerLoc.speed && partnerLoc.speed > 5 ? `Fährt ${Math.round(partnerLoc.speed)} km/h 🚗` : 'Vor Ort 🏠'}`
                : `Standort von ${partnerName}`}
            </h4>
            <p className="text-[10px] text-gray-500 truncate">
              {distanceBetweenKm !== null
                ? `${distanceBetweenKm === 0 ? 'Am selben Ort 💕' : `${distanceBetweenKm} km entfernt`} • 🔋 ${partnerLoc?.battery_level || 85}%`
                : 'Tippen um Live-Karte & Tempo zu öffnen →'}
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <span className="bg-pink-100 group-hover:bg-pink-200 text-pink-700 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
            Karte 🗺️
          </span>
        </div>
      </div>

      {/* Mood Sharing Widget */}
      <div className="glass-panel p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">💖</span>
            <h3 className="text-xs font-black text-gray-700">Stimmungs-Radar</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingMood(!isEditingMood)}
            className="text-[11px] font-extrabold text-[var(--color-primary-dark)] hover:underline"
          >
            {isEditingMood ? 'Fertig' : 'Mein Status'}
          </button>
        </div>

        {isEditingMood ? (
          <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100 space-y-2">
            <div className="flex justify-between items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-xl p-1 rounded-lg shrink-0 transition-transform ${
                    selectedEmoji === emoji ? 'bg-pink-100 scale-120 shadow-xs' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={statusText}
                onChange={e => setStatusText(e.target.value)}
                placeholder="Wie fühlst du dich?"
                maxLength={30}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-pink-400 min-w-0"
              />
              <button
                type="button"
                onClick={handleSaveMood}
                className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
              >
                <Send size={11} /> OK
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* My Mood */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-pink-100 text-center flex flex-col justify-between min-w-0">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">
                Ich ({currentPartnerName})
              </span>
              <div className="text-2xl my-0.5">{myMood.emoji}</div>
              <p className="text-[11px] font-bold text-gray-700 truncate">{myMood.text || 'Kein Status'}</p>
              <span className="text-[8px] text-gray-400 mt-0.5">{myMood.updated_at}</span>
            </div>

            {/* Partner's Mood */}
            <div className="bg-gradient-to-br from-pink-50/70 to-purple-50/70 p-2.5 rounded-xl border border-purple-100 text-center flex flex-col justify-between min-w-0">
              <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wide truncate">
                {partnerName}
              </span>
              <div className="text-2xl my-0.5">{partnerMood.emoji}</div>
              <p className="text-[11px] font-bold text-gray-700 truncate">{partnerMood.text || 'Kein Status'}</p>
              <span className="text-[8px] text-gray-400 mt-0.5">{partnerMood.updated_at}</span>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Hug & Love Button */}
      <div className="glass-panel p-3 rounded-2xl shadow-xs text-center relative overflow-hidden">
        {showHeartBurst && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <span className="text-4xl animate-ping">💖</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-pink-500 shrink-0" fill="currentColor" />
              <span className="text-xs font-black text-gray-700 truncate">Umarmungs-Konto</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              Bereits <strong className="text-pink-600 font-extrabold">{profile.hugs_count}</strong> getauscht!
            </p>
          </div>
          <button
            type="button"
            onClick={triggerHug}
            className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3 py-2 rounded-xl text-xs font-extrabold shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1 shrink-0 transition-all"
          >
            <span>Drück mich!</span> 🤗
          </button>
        </div>
      </div>

      {/* Quick Access 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Next Date */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="glass-panel p-3 rounded-2xl cursor-pointer hover:bg-white/95 transition-all border border-pink-50 min-w-0"
        >
          <div className="flex items-center gap-1.5 mb-1 text-pink-500">
            <Calendar size={14} className="shrink-0" />
            <span className="text-[11px] font-extrabold text-gray-600 truncate">Nächstes Date</span>
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">
            {nextEvent ? nextEvent.title : 'Kein Date'}
          </p>
          <span className="text-[9px] text-gray-400 block truncate">
            {nextEvent ? nextEvent.date : 'Tippen zum Planen'}
          </span>
        </div>

        {/* Today's Meal */}
        <div
          onClick={() => onNavigateTab('meals')}
          className="glass-panel p-3 rounded-2xl cursor-pointer hover:bg-white/95 transition-all border border-pink-50 min-w-0"
        >
          <div className="flex items-center gap-1.5 mb-1 text-purple-500">
            <Utensils size={14} className="shrink-0" />
            <span className="text-[11px] font-extrabold text-gray-600 truncate">Heute kochen</span>
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">
            {todaysMeal?.meal_name ? todaysMeal.meal_name : 'Noch nichts'}
          </p>
          <span className="text-[9px] text-gray-400 block truncate">
            {todaysMeal?.cook ? `${todaysMeal.cook}` : 'Zum Wochenplan'}
          </span>
        </div>

        {/* Shopping list shortcut */}
        <div
          onClick={() => onNavigateTab('lists')}
          className="glass-panel p-3 rounded-2xl cursor-pointer hover:bg-white/95 transition-all border border-pink-50 min-w-0"
        >
          <div className="flex items-center gap-1.5 mb-1 text-emerald-500">
            <CheckSquare size={14} className="shrink-0" />
            <span className="text-[11px] font-extrabold text-gray-600 truncate">Einkaufsliste</span>
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">Offene Posten</p>
          <span className="text-[9px] text-gray-400 block truncate">Zur Einkaufsliste</span>
        </div>

        {/* Notes shortcut */}
        <div
          onClick={() => onNavigateTab('lists')}
          className="glass-panel p-3 rounded-2xl cursor-pointer hover:bg-white/95 transition-all border border-pink-50 min-w-0"
        >
          <div className="flex items-center gap-1.5 mb-1 text-amber-500">
            <MessageCircleHeart size={14} className="shrink-0" />
            <span className="text-[11px] font-extrabold text-gray-600 truncate">Liebeszettel</span>
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">
            {notes.length > 0 ? notes[0].content : 'Notiz schreiben'}
          </p>
          <span className="text-[9px] text-gray-400 block truncate">{notes.length} Zettel angepinnt</span>
        </div>
      </div>
    </div>
  );
}
