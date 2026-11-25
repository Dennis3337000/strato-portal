import { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, Send, Utensils, Calendar, CheckSquare, Cake, Camera, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { ProfileData, MoodData, CountdownItem, EventItem, MealItem, UserRole, PhotoItem } from '../types';

const EMOJI_OPTIONS = ['🥰', '😊', '😴', '🥳', '😭', '🥺', '☕', '🍕', '🤒'];

interface DashboardProps {
  role: UserRole;
  profile: ProfileData;
  daysTogether: number;
  moods: Record<string, MoodData>;
  countdown: CountdownItem;
  events: EventItem[];
  meals: MealItem[];
  photos?: PhotoItem[];
  onUpdateMood: (emoji: string, text: string) => void;
  onSendHug: () => void;
  onNavigateTab: (tab: string) => void;
  onAddPhoto?: (title: string, imageData: string, author: string) => void;
  onLikePhoto?: (id: number) => void;
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
  photos = [],
  onUpdateMood,
  onSendHug,
  onNavigateTab,
  onAddPhoto,
  onLikePhoto
}: DashboardProps) {
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [selectedFullscreenPhoto, setSelectedFullscreenPhoto] = useState<PhotoItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-slideshow timer for Dashboard photo card (rotates every 4.5s)
  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhotoIdx(prev => (prev + 1) % photos.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [photos.length]);

  const activePhoto = photos.length > 0 ? photos[currentPhotoIdx % photos.length] : null;

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIdx(prev => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIdx(prev => (prev - 1 + photos.length) % photos.length);
    }
  };

  // Client-side image compression for fast mobile uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setPreviewImage(compressedDataUrl);
          setShowUploadModal(true);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage || isUploading || !onAddPhoto) return;
    setIsUploading(true);
    try {
      await onAddPhoto(photoCaption.trim() || 'Schöner Moment 💕', previewImage, currentPartnerName);
      setPreviewImage(null);
      setPhotoCaption('');
      setShowUploadModal(false);
      setCurrentPhotoIdx(0);
    } finally {
      setIsUploading(false);
    }
  };

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
      {/* Responsive Grid: Auf Smartphone 1 Spalte, ab Tablet/Desktop (md:) 2 Spalten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
        {/* Linke Spalte auf Desktop: Liebes-Counter & Großer Herz-Rahmen */}
        <div className="space-y-3">
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

      {/* ======================================================== */}
      {/* GROSSER PÄRCHEN-BILDERRAHMEN AUS HERZEN (HOMESCREEN SHOWCASE) */}
      {/* ======================================================== */}
      <div className="relative my-1 w-full select-none">
        {/* Romantischer Herz-Rahmen Container */}
        <div className="relative rounded-[32px] p-2.5 sm:p-3.5 bg-gradient-to-br from-pink-300 via-rose-150 to-pink-200 shadow-[0_12px_36px_rgba(244,63,94,0.22)] border-2 border-pink-300/80">
          
          {/* Obere Herz-Girlande & Header-Badge */}
          <div className="flex items-center justify-between text-rose-500 font-black mb-1.5 px-2 select-none">
            <div className="flex items-center gap-1 text-[11px] tracking-widest opacity-85">
              <span>♥</span><span>♥</span><span>♥</span>
              <span className="text-xs">💖</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-0.5 rounded-full shadow-xs border border-pink-200">
              <Heart size={12} className="text-pink-500 fill-current animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-black text-pink-700">
                Unsere Momente
              </span>
              {photos.length > 0 && (
                <span className="text-[9px] font-extrabold text-pink-500 bg-pink-50 px-1.5 py-0.2 rounded-full">
                  {currentPhotoIdx % photos.length + 1}/{photos.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] tracking-widest opacity-85">
              <span className="text-xs">💕</span>
              <span>♥</span><span>♥</span><span>♥</span>
            </div>
          </div>

          {/* Verspielte Herz-Akzente an den 4 Ecken */}
          <div className="absolute -top-2.5 -left-2 text-lg select-none drop-shadow-xs animate-bounce" style={{ animationDuration: '3s' }}>
            💖
          </div>
          <div className="absolute -top-2.5 -right-2 text-lg select-none drop-shadow-xs animate-bounce" style={{ animationDuration: '2.6s' }}>
            💕
          </div>
          <div className="absolute -bottom-2 -left-2 text-base select-none drop-shadow-xs">
            🌸
          </div>
          <div className="absolute -bottom-2 -right-2 text-base select-none drop-shadow-xs animate-bounce" style={{ animationDuration: '3.4s' }}>
            🥰
          </div>

          {/* Weißes Passepartout / Foto-Bett mit Herz-Ornamentik */}
          <div className="bg-white p-2 sm:p-2.5 rounded-[24px] shadow-xs relative overflow-hidden border border-pink-100">
            {activePhoto ? (
              <div 
                className="relative w-full aspect-4/3 sm:h-76 rounded-[18px] overflow-hidden bg-pink-50 group shadow-inner cursor-pointer"
                onClick={() => setSelectedFullscreenPhoto(activePhoto)}
              >
                {/* Das Foto im Herz-Rahmen mit sanftem Zoom & Wechsel */}
                <img
                  key={activePhoto.id}
                  src={activePhoto.image_data}
                  alt={activePhoto.title || 'Unser Schnappschuss'}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 select-none"
                />

                {/* Floating Quick Upload Button (Kamera) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-2.5 right-2.5 bg-black/45 hover:bg-black/60 text-white backdrop-blur-md p-2 rounded-full shadow-md active:scale-90 transition-all z-10 flex items-center gap-1"
                  title="Neues Foto hinzufügen"
                >
                  <Camera size={14} />
                  <span className="text-[10px] font-extrabold pr-1 hidden sm:inline">Neues Foto</span>
                </button>

                {/* Navigation Pfeile (Links / Rechts) */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 active:scale-90 z-10"
                      title="Vorheriges Foto"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 active:scale-90 z-10"
                      title="Nächstes Foto"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Untere Bildunterschrift mit Milchglas-Optik */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-8 pb-2 px-3 rounded-b-[18px] text-white flex items-end justify-between gap-2 z-10">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-white truncate drop-shadow-sm flex items-center gap-1">
                      <span>{activePhoto.title || 'Unser Schnappschuss 💕'}</span>
                    </h3>
                    <p className="text-[10px] text-white/80 font-medium truncate">
                      Von {activePhoto.author} • {activePhoto.created_at || 'Gemeinsamer Moment'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikePhoto?.(activePhoto.id);
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all active:scale-90 text-white shadow-xs"
                      title="Gefällt mir"
                    >
                      <Heart size={13} className="text-rose-400 fill-current" />
                      <span>{activePhoto.likes || 0}</span>
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFullscreenPhoto(activePhoto);
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-1.5 rounded-full text-white transition-all active:scale-90 shadow-xs"
                      title="Großansicht"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State im Bilderrahmen */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-4/3 sm:h-76 rounded-[18px] border-2 border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-50 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 text-white flex items-center justify-center text-2xl shadow-md mb-2.5 group-hover:scale-110 transition-transform">
                  📸
                </div>
                <h4 className="font-black text-sm text-gray-800 mb-0.5">
                  Noch kein Foto im Bilderrahmen 💕
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mb-3 font-medium">
                  Hier erscheinen eure gemeinsamen Schnappschüsse direkt als Diashow mit Herz-Rahmen!
                </p>
                <button
                  type="button"
                  className="bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Camera size={14} /> Erstes Pärchenfoto hochladen
                </button>
              </div>
            )}

            {/* Herz-Pagination / Indikatoren */}
            {photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {photos.slice(0, 10).map((p, idx) => {
                  const isActive = idx === (currentPhotoIdx % photos.length);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCurrentPhotoIdx(idx)}
                      className={`transition-all duration-300 ${
                        isActive 
                          ? 'text-pink-500 text-xs scale-125' 
                          : 'text-pink-200 hover:text-pink-300 text-[10px]'
                      }`}
                      title={`Zu Foto ${idx + 1}`}
                    >
                      ♥
                    </button>
                  );
                })}
                {photos.length > 10 && (
                  <span className="text-[9px] text-pink-300 font-bold">
                    +{photos.length - 10}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Untere Herz-Girlande (Rahmen-Abschluss) */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-rose-400 font-black mt-1.5 select-none tracking-widest opacity-80">
            <span>♥</span><span>♥</span><span>♥</span><span>♥</span><span>♥</span>
            <Heart size={11} className="text-pink-500 inline fill-current animate-pulse" />
            <span>♥</span><span>♥</span><span>♥</span><span>♥</span><span>♥</span>
          </div>
        </div>
      </div>
    </div>

    {/* Rechte Spalte auf Desktop: Countdowns, Stimmungs-Radar & Aktionen */}
    <div className="space-y-3">
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

      {/* Date-Night Roulette Banner */}
      <div
        onClick={() => onNavigateTab('calendar')}
        className="cursor-pointer glass-panel p-3.5 rounded-2xl shadow-xs border border-pink-200/90 hover:border-pink-300 transition-all flex items-center justify-between active:scale-98 group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-400 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-xl">🎡</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-pink-600 tracking-wide">
                Date-Night Roulette
              </span>
              <span className="bg-pink-100 text-pink-600 text-[8px] font-black px-1.5 py-0.2 rounded-full">Neu</span>
            </div>
            <h4 className="font-black text-xs text-gray-800 truncate">
              Was machen wir heute Schönes?
            </h4>
            <p className="text-[10px] text-gray-500 truncate">
              Tippen, um am Date-Glücksrad zu drehen! 🎲
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <span className="bg-pink-100 group-hover:bg-pink-200 text-pink-700 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
            Drehen 🎡
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

        {/* Coupons shortcut */}
        <div
          onClick={() => onNavigateTab('lists')}
          className="glass-panel p-3 rounded-2xl cursor-pointer hover:bg-white/95 transition-all border border-pink-50 min-w-0"
        >
          <div className="flex items-center gap-1.5 mb-1 text-amber-500">
            <span className="text-sm shrink-0">🎟️</span>
            <span className="text-[11px] font-extrabold text-gray-600 truncate">Gutscheine</span>
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">Liebes-Coupons</p>
          <span className="text-[9px] text-gray-400 block truncate">Jetzt einlösen →</span>
        </div>
      </div>
    </div>
  </div>

      {/* Hidden File Input for Mobile Camera / Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* UPLOAD MODAL MIT VORSCHAU */}
      {showUploadModal && previewImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 shadow-xl border-2 border-pink-150 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <h3 className="font-black text-sm text-gray-800 flex items-center gap-1.5">
                <span>📸</span> Foto für den Herz-Rahmen
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
              >
                <X size={14} />
              </button>
            </div>

            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-pink-50 mb-3 border border-pink-100 shadow-inner">
              <img src={previewImage} alt="Vorschau" className="w-full h-full object-cover" />
            </div>

            <form onSubmit={handleConfirmUpload} className="w-full space-y-2.5">
              <input
                type="text"
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                placeholder="Bildunterschrift eingeben... 💕"
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                maxLength={60}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-pink-500 to-rose-400 shadow-xs hover:shadow-md active:scale-95 transition-all"
                >
                  {isUploading ? 'Speichern...' : '❤️ Einrahmen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedFullscreenPhoto && (
        <div 
          onClick={() => setSelectedFullscreenPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in"
        >
          <button
            type="button"
            onClick={() => setSelectedFullscreenPhoto(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 backdrop-blur-md z-10"
          >
            <X size={20} />
          </button>

          <div 
            onClick={e => e.stopPropagation()} 
            className="w-full max-w-md max-h-[85vh] flex flex-col items-center"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 max-h-[68vh]">
              <img
                src={selectedFullscreenPhoto.image_data}
                alt={selectedFullscreenPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center mt-3 text-white">
              <h3 className="font-extrabold text-base text-white flex items-center justify-center gap-1.5">
                <span>{selectedFullscreenPhoto.title || 'Gemeinsamer Moment 💕'}</span>
              </h3>
              <p className="text-xs text-white/70">
                Von {selectedFullscreenPhoto.author} • {selectedFullscreenPhoto.created_at || 'Schnappschuss'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => onLikePhoto?.(selectedFullscreenPhoto.id)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 text-white active:scale-95 transition-all"
                >
                  <Heart size={14} className="text-rose-400 fill-current" />
                  <span>{selectedFullscreenPhoto.likes || 0} Gefällt mir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFullscreenPhoto(null);
                    onNavigateTab('lists');
                  }}
                  className="bg-pink-500/80 hover:bg-pink-500 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white active:scale-95 transition-all"
                >
                  Zur Fotowand →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
