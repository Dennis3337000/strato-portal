import { useState } from 'react';
import { X, UserCheck, Heart, Check, RefreshCw, Cake, RotateCcw } from 'lucide-react';
import type { ProfileData, UserRole } from '../types';

interface SettingsModalProps {
  profile: ProfileData;
  role: UserRole;
  onClose: () => void;
  onSetRole: (role: UserRole) => void;
  onUpdateProfileKey: (key: string, value: string) => void;
  onResetData: () => void;
  onRestartOnboarding: () => void;
}

export default function SettingsModal({
  profile,
  role,
  onClose,
  onSetRole,
  onUpdateProfileKey,
  onResetData,
  onRestartOnboarding
}: SettingsModalProps) {
  const [partnerAName, setPartnerAName] = useState(profile.partner_a_name);
  const [partnerBName, setPartnerBName] = useState(profile.partner_b_name);
  const [startDate, setStartDate] = useState(profile.start_date);
  const [partnerABirthday, setPartnerABirthday] = useState(profile.partner_a_birthday || '');
  const [partnerBBirthday, setPartnerBBirthday] = useState(profile.partner_b_birthday || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfileKey('partner_a_name', partnerAName.trim() || 'Partner A');
    onUpdateProfileKey('partner_b_name', partnerBName.trim() || 'Partner B');
    onUpdateProfileKey('start_date', startDate);
    onUpdateProfileKey('partner_a_birthday', partnerABirthday);
    onUpdateProfileKey('partner_b_birthday', partnerBBirthday);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-4.5 shadow-2xl space-y-3.5 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Heart size={18} className="text-pink-500 shrink-0" fill="currentColor" />
            <h3 className="text-sm font-black text-gray-800">App-Einstellungen</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Role Switcher */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 block uppercase">
            Aktuell eingeloggt als:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSetRole('Partner A')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                role === 'Partner A'
                  ? 'border-pink-500 bg-pink-50 text-pink-700 font-extrabold shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <UserCheck size={16} className="mx-auto mb-0.5 text-pink-500" />
              <span className="text-xs truncate block font-bold">{partnerAName || 'Partner A'}</span>
              <span className="text-[9px] block text-gray-400">Partner A</span>
            </button>

            <button
              type="button"
              onClick={() => onSetRole('Partner B')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                role === 'Partner B'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-extrabold shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <UserCheck size={16} className="mx-auto mb-0.5 text-purple-500" />
              <span className="text-xs truncate block font-bold">{partnerBName || 'Partner B'}</span>
              <span className="text-[9px] block text-gray-400">Partner B</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-2.5 pt-1">
          <div>
            <label className="text-[11px] font-bold text-pink-600 block mb-0.5">Name Partner A</label>
            <input
              type="text"
              required
              value={partnerAName}
              onChange={e => setPartnerAName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-purple-600 block mb-0.5">Name Partner B</label>
            <input
              type="text"
              required
              value={partnerBName}
              onChange={e => setPartnerBName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Zusammen seit (Jahrestag)</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-pink-400 font-bold text-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1 mb-0.5">
                <Cake size={11} className="text-pink-500" /> Geb. {partnerAName || 'A'}:
              </label>
              <input
                type="date"
                value={partnerABirthday}
                onChange={e => setPartnerABirthday(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-[11px] focus:outline-none focus:border-pink-400 font-semibold text-gray-700"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1 mb-0.5">
                <Cake size={11} className="text-purple-500" /> Geb. {partnerBName || 'B'}:
              </label>
              <input
                type="date"
                value={partnerBBirthday}
                onChange={e => setPartnerBBirthday(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-[11px] focus:outline-none focus:border-pink-400 font-semibold text-gray-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check size={14} /> Gespeichert!
              </>
            ) : (
              'Änderungen speichern'
            )}
          </button>
        </form>

        {/* Re-start Onboarding Button */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            type="button"
            onClick={onRestartOnboarding}
            className="w-full py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={13} /> Einrichtungs-Assistent erneut starten
          </button>

          <button
            type="button"
            onClick={onResetData}
            className="text-[10px] text-gray-400 hover:text-rose-500 font-bold flex items-center justify-center gap-1 mx-auto"
          >
            <RefreshCw size={11} /> Alle Daten zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
