import { useState } from 'react';
import { ShoppingBag, Heart, Plus, Trash2, Check, Gift, Mail } from 'lucide-react';
import type { ShoppingItem, BucketItem, NoteItem, CouponItem, LetterItem, ProfileData, UserRole } from '../types';
import LoveCoupons from './LoveCoupons';
import TimeCapsuleLetters from './TimeCapsuleLetters';

interface ListsViewProps {
  shopping: ShoppingItem[];
  bucket: BucketItem[];
  notes: NoteItem[];
  coupons?: CouponItem[];
  letters?: LetterItem[];
  profile: ProfileData;
  role: UserRole;
  onAddShopping: (item: string, category: string) => void;
  onToggleShopping: (id: number, isBought: boolean) => void;
  onDeleteShopping: (id: number) => void;
  onAddBucket: (title: string, category: string) => void;
  onToggleBucket: (id: number, isDone: boolean) => void;
  onDeleteBucket: (id: number) => void;
  onAddNote: (content: string, author: string, color: string) => void;
  onDeleteNote: (id: number) => void;
  onRedeemCoupon?: (id: number) => void;
  onAddCoupon?: (title: string, icon: string, toPartner: string) => void;
  onDeleteCoupon?: (id: number) => void;
  onOpenLetter?: (id: number) => void;
  onAddLetter?: (title: string, content: string, author: string, unlockType: string, unlockCondition: string) => void;
}

export default function ListsView({
  shopping,
  bucket,
  notes,
  coupons = [],
  letters = [],
  profile,
  role,
  onAddShopping,
  onToggleShopping,
  onDeleteShopping,
  onAddBucket,
  onToggleBucket,
  onDeleteBucket,
  onAddNote,
  onDeleteNote,
  onRedeemCoupon = () => {},
  onAddCoupon = () => {},
  onDeleteCoupon = () => {},
  onOpenLetter = () => {},
  onAddLetter = () => {}
}: ListsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'shopping' | 'bucket' | 'letters'>('coupons');

  // Form states
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('#fef3c7');

  const currentAuthorName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');

  const handleAddShopping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    onAddShopping(newShoppingItem.trim(), 'Supermarkt');
    setNewShoppingItem('');
  };

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim()) return;
    onAddBucket(newBucketTitle.trim(), 'Abenteuer');
    setNewBucketTitle('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent.trim(), currentAuthorName, newNoteColor);
    setNewNoteContent('');
  };

  const openShoppingCount = shopping.filter(s => !s.is_bought).length;
  const openCouponsCount = coupons.filter(c => !c.is_redeemed).length;

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-base font-black text-gray-800">Gemeinsames</h2>
        <p className="text-xs text-gray-400 font-medium">Gutscheine, Einkäufe, Wünsche & Briefe</p>
      </div>

      {/* Pill Switcher (4 Compact Subtabs) */}
      <div className="flex bg-white/90 p-1 rounded-2xl shadow-xs border border-gray-100 gap-1 w-full">
        <button
          onClick={() => setActiveSubTab('coupons')}
          type="button"
          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeSubTab === 'coupons'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Gift size={12} className="shrink-0" />
          <span className="truncate">Gutscheine {openCouponsCount > 0 ? `(${openCouponsCount})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shopping')}
          type="button"
          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeSubTab === 'shopping'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShoppingBag size={12} className="shrink-0" />
          <span className="truncate">Einkauf {openShoppingCount > 0 ? `(${openShoppingCount})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bucket')}
          type="button"
          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeSubTab === 'bucket'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Heart size={12} className="shrink-0" />
          <span className="truncate">Wünsche</span>
        </button>

        <button
          onClick={() => setActiveSubTab('letters')}
          type="button"
          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeSubTab === 'letters'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Mail size={12} className="shrink-0" />
          <span className="truncate">Briefe</span>
        </button>
      </div>

      {/* SUB-TAB 1: LOVE COUPONS */}
      {activeSubTab === 'coupons' && (
        <LoveCoupons
          coupons={coupons}
          profile={profile}
          role={role}
          onRedeem={onRedeemCoupon}
          onAddCoupon={onAddCoupon}
          onDeleteCoupon={onDeleteCoupon}
        />
      )}

      {/* SUB-TAB 2: SHOPPING LIST */}
      {activeSubTab === 'shopping' && (
        <div className="space-y-2.5 animate-in">
          {/* Add input */}
          <form onSubmit={handleAddShopping} className="flex gap-1.5 w-full">
            <input
              type="text"
              required
              placeholder="Was brauchen wir? (z.B. Erdbeeren 🍓)"
              value={newShoppingItem}
              onChange={e => setNewShoppingItem(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-400 shadow-xs min-w-0"
            />
            <button
              type="submit"
              className="bg-[var(--color-primary)] text-white px-3.5 rounded-xl text-xs font-bold shadow-xs hover:bg-[var(--color-primary-dark)] shrink-0 flex items-center gap-1"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* List items */}
          <div className="space-y-1.5">
            {shopping.length === 0 ? (
              <div className="glass-panel p-6 text-center text-gray-400 rounded-2xl">
                <ShoppingBag size={28} className="mx-auto mb-1.5 opacity-30" />
                <p className="text-xs">Alles erledigt! Der Kühlschrank ist voll 🎉</p>
              </div>
            ) : (
              shopping.map(item => (
                <div
                  key={item.id}
                  className={`glass-panel p-2.5 rounded-xl flex items-center justify-between transition-all border ${
                    item.is_bought ? 'opacity-60 bg-gray-50/70 border-gray-100' : 'border-white/80'
                  }`}
                >
                  <button
                    onClick={() => onToggleShopping(item.id, !item.is_bought)}
                    type="button"
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        item.is_bought
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 bg-white hover:border-pink-400'
                      }`}
                    >
                      {item.is_bought && <Check size={12} />}
                    </div>
                    <span
                      className={`text-xs font-bold truncate ${
                        item.is_bought ? 'line-through text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      {item.item}
                    </span>
                  </button>

                  <button
                    onClick={() => onDeleteShopping(item.id)}
                    type="button"
                    className="text-gray-300 hover:text-rose-500 p-1 rounded-lg shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BUCKET LIST */}
      {activeSubTab === 'bucket' && (
        <div className="space-y-2.5 animate-in">
          {/* Add Bucket Goal */}
          <form onSubmit={handleAddBucket} className="flex gap-1.5 w-full">
            <input
              type="text"
              required
              placeholder="Neuer Wunsch (z.B. Rom-Trip 🏛️)"
              value={newBucketTitle}
              onChange={e => setNewBucketTitle(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-400 shadow-xs min-w-0"
            />
            <button
              type="submit"
              className="bg-purple-500 text-white px-3.5 rounded-xl text-xs font-bold shadow-xs hover:bg-purple-600 shrink-0 flex items-center gap-1"
            >
              <Plus size={16} />
            </button>
          </form>

          {/* Bucket items */}
          <div className="space-y-1.5">
            {bucket.map(b => (
              <div
                key={b.id}
                className={`glass-panel p-2.5 rounded-xl flex items-center justify-between transition-all border ${
                  b.is_done ? 'bg-purple-50/60 border-purple-100' : 'border-white/80'
                }`}
              >
                <button
                  onClick={() => onToggleBucket(b.id, !b.is_done)}
                  type="button"
                  className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      b.is_done
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'border-pink-300 bg-white hover:bg-pink-50'
                    }`}
                  >
                    <Heart size={10} fill={b.is_done ? 'white' : 'transparent'} />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-extrabold block truncate ${
                        b.is_done ? 'line-through text-purple-400' : 'text-gray-800'
                      }`}
                    >
                      {b.title}
                    </span>
                    <span className="text-[9px] block text-gray-400 truncate">{b.category}</span>
                  </div>
                </button>

                <button
                  onClick={() => onDeleteBucket(b.id)}
                  type="button"
                  className="text-gray-300 hover:text-rose-500 p-1 rounded-lg shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LETTERS & NOTIZEN */}
      {activeSubTab === 'letters' && (
        <div className="space-y-4 animate-in">
          {/* Zeitschloss-Briefe */}
          <TimeCapsuleLetters
            letters={letters}
            profile={profile}
            role={role}
            onOpenLetter={onOpenLetter}
            onAddLetter={onAddLetter}
          />

          {/* Zettelchen Section */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-black text-gray-700">Schnelle Liebes-Post-its 💌</h3>
            {/* Add note card */}
            <form onSubmit={handleAddNote} className="glass-panel p-3.5 rounded-2xl shadow-xs space-y-2">
              <textarea
                required
                rows={2}
                placeholder="Kurzen Zettel schreiben..."
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                className="w-full bg-white/90 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-pink-400"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { color: '#fef3c7', name: 'Gelb' },
                    { color: '#fce7f3', name: 'Rosa' },
                    { color: '#e0e7ff', name: 'Blau' },
                    { color: '#dcfce7', name: 'Grün' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setNewNoteColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        newNoteColor === c.color ? 'scale-125 border-gray-600' : 'border-white'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:bg-[var(--color-primary-dark)]"
                >
                  Anpinnen 📌
                </button>
              </div>
            </form>

            {/* Sticky Notes Grid */}
            <div className="grid grid-cols-2 gap-2">
              {notes.map(note => (
                <div
                  key={note.id}
                  style={{ backgroundColor: note.color || '#fef3c7' }}
                  className="p-3 rounded-2xl shadow-xs border border-black/5 flex flex-col justify-between relative group min-h-[90px] min-w-0"
                >
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    type="button"
                    className="absolute top-1.5 right-1.5 text-gray-400 hover:text-rose-500 p-1 opacity-70"
                  >
                    <Trash2 size={11} />
                  </button>
                  <p className="text-[11px] font-semibold text-gray-800 line-clamp-4 leading-relaxed pr-2">
                    "{note.content}"
                  </p>
                  <div className="mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[8px] text-gray-500 font-bold">
                    <span className="truncate">{note.author}</span>
                    <span className="shrink-0">{note.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
