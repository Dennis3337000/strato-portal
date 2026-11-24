import { useState } from 'react';
import { Gift, Check, Trash2, Plus, Heart } from 'lucide-react';
import type { CouponItem, ProfileData, UserRole } from '../types';

interface LoveCouponsProps {
  coupons: CouponItem[];
  profile: ProfileData;
  role: UserRole;
  onRedeem: (id: number) => void;
  onAddCoupon: (title: string, icon: string, toPartner: string) => void;
  onDeleteCoupon: (id: number) => void;
}

const DEFAULT_ICONS = ['🥐', '💆', '🍝', '🎬', '😇', '🍦', '👑', '☕', '🛌', '🍷', '🚗', '🍫'];

export default function LoveCoupons({
  coupons,
  profile,
  role,
  onRedeem,
  onAddCoupon,
  onDeleteCoupon
}: LoveCouponsProps) {
  const [filter, setFilter] = useState<'open' | 'redeemed'>('open');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎁');

  const partnerName = role === 'Partner A' ? (profile.partner_b_name || 'Partner B') : (profile.partner_a_name || 'Partner A');

  const filtered = coupons.filter(c => (filter === 'open' ? !c.is_redeemed : c.is_redeemed));

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCoupon(newTitle.trim(), selectedIcon, partnerName);
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Liebes-Gutscheinheft 🎟️</h2>
          <p className="text-xs text-gray-400 font-medium">Kleine Aufmerksamkeiten & Gefallen</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <Plus size={14} /> Gutschein schenken
        </button>
      </div>

      {/* Pill Switcher */}
      <div className="flex bg-white/90 p-1 rounded-2xl shadow-xs border border-gray-100 gap-1 w-full">
        <button
          type="button"
          onClick={() => setFilter('open')}
          className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            filter === 'open'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Gift size={13} className="shrink-0" />
          <span>Einlösbar ({coupons.filter(c => !c.is_redeemed).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('redeemed')}
          className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            filter === 'redeemed'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Check size={13} className="shrink-0" />
          <span>Eingelöst ({coupons.filter(c => c.is_redeemed).length})</span>
        </button>
      </div>

      {/* Coupons List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="glass-panel p-6 rounded-3xl text-center text-gray-400">
            <Gift size={32} className="mx-auto mb-1 opacity-30" />
            <p className="text-xs font-bold text-gray-600">
              {filter === 'open' ? 'Alle Gutscheine wurden eingelöst!' : 'Noch keine Gutscheine eingelöst'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Schenkt euch neue Gutscheine!</p>
          </div>
        ) : (
          filtered.map(coupon => (
            <div
              key={coupon.id}
              className={`relative rounded-2xl p-3.5 transition-all shadow-xs border flex items-center justify-between gap-2.5 ${
                coupon.is_redeemed
                  ? 'bg-gray-50/80 border-dashed border-gray-200 opacity-70'
                  : 'glass-panel border-pink-200/90 hover:border-pink-300'
              }`}
            >
              {/* Left Icon */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                {coupon.icon || '🎁'}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-xs font-black truncate ${coupon.is_redeemed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {coupon.title}
                </h3>
                <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                  {coupon.is_redeemed
                    ? `Eingelöst am ${coupon.redeemed_at || 'kürzlich'} 💕`
                    : `Gültig für ${partnerName}`}
                </span>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-1.5">
                {!coupon.is_redeemed ? (
                  <button
                    type="button"
                    onClick={() => onRedeem(coupon.id)}
                    className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3 py-1.5 rounded-xl text-[11px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Heart size={12} fill="white" /> Einlösen
                  </button>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-black">
                    Eingelöst ✓
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteCoupon(coupon.id)}
                  className="text-gray-300 hover:text-rose-500 p-1 rounded-lg"
                  title="Gutschein löschen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-gray-800">Gutschein verschenken 🎁</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Emoji auswählen</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DEFAULT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`text-xl p-1.5 rounded-xl transition-all ${
                        selectedIcon === icon ? 'bg-pink-100 scale-120 shadow-xs' : 'hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Gutschein-Titel</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. 1x Fußmassage beim Film"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl font-bold text-gray-500 bg-gray-100 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-black text-white bg-[var(--color-primary)] text-xs shadow-md"
                >
                  Verschenken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
