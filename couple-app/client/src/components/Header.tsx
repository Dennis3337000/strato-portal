import { Heart, Settings, UserCheck } from 'lucide-react';
import type { ProfileData, UserRole } from '../types';

interface HeaderProps {
  profile: ProfileData;
  role: UserRole;
  daysTogether: number;
  onOpenSettings: () => void;
  onToggleRole: () => void;
}

export default function Header({ profile, role, daysTogether, onOpenSettings, onToggleRole }: HeaderProps) {
  const currentPartnerName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
  const otherPartnerName = role === 'Partner A' ? (profile.partner_b_name || 'Partner B') : (profile.partner_a_name || 'Partner A');

  return (
    <header className="glass-panel sticky top-0 z-30 px-3 py-2.5 rounded-b-2xl shadow-xs border-b border-white/80 mb-3 w-full">
      <div className="flex items-center justify-between gap-1.5 w-full">
        {/* User Role Switcher Chip */}
        <button
          onClick={onToggleRole}
          type="button"
          title="Tippen um zwischen Partner A & B zu wechseln"
          className="flex items-center gap-1 bg-white/95 text-[11px] font-extrabold text-gray-700 px-2.5 py-1.5 rounded-full shadow-xs border border-pink-100 transition-all active:scale-95 max-w-[145px] shrink min-w-0"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <UserCheck size={13} className="text-[var(--color-primary)] shrink-0" />
          <span className="truncate">
            Ich: <span className="text-[var(--color-primary-dark)]">{currentPartnerName}</span>
          </span>
        </button>

        {/* Days badge */}
        <div className="flex items-center gap-1 bg-pink-50/90 text-pink-600 px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 border border-pink-100">
          <Heart size={11} fill="currentColor" className="text-pink-500 animate-pulse shrink-0" />
          <span className="whitespace-nowrap">{daysTogether} T.</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          type="button"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-full transition-colors shrink-0"
          title="Einstellungen"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Couple Title */}
      <div className="text-center mt-1.5">
        <h1 className="text-lg font-black gradient-text tracking-tight truncate px-2">
          {profile.partner_a_name || 'Partner A'} & {profile.partner_b_name || 'Partner B'}
        </h1>
        <p className="text-[10px] font-bold text-gray-400 truncate">
          Verbunden mit <span className="text-gray-600 font-extrabold">{otherPartnerName}</span> 💕
        </p>
      </div>
    </header>
  );
}
