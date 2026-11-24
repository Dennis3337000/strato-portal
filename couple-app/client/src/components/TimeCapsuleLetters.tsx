import { useState } from 'react';
import { Mail, Lock, Unlock, Plus, Heart } from 'lucide-react';
import type { LetterItem, ProfileData, UserRole } from '../types';

interface TimeCapsuleLettersProps {
  letters: LetterItem[];
  profile: ProfileData;
  role: UserRole;
  onOpenLetter: (id: number) => void;
  onAddLetter: (title: string, content: string, author: string, unlockType: string, unlockCondition: string) => void;
}

export default function TimeCapsuleLetters({
  letters,
  profile,
  role,
  onOpenLetter,
  onAddLetter
}: TimeCapsuleLettersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockType, setUnlockType] = useState('mood');
  const [condition, setCondition] = useState('stress');

  const currentName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddLetter(title.trim(), content.trim(), currentName, unlockType, condition);
    setTitle('');
    setContent('');
    setShowAddModal(false);
  };

  const handleLetterClick = (letter: LetterItem) => {
    if (!letter.is_opened) {
      onOpenLetter(letter.id);
      setSelectedLetter({ ...letter, is_opened: true });
    } else {
      setSelectedLetter(letter);
    }
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Liebesbriefe mit Zeitschloss 💌</h2>
          <p className="text-xs text-gray-400 font-medium">Versiegelte Botschaften für besondere Momente</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <Plus size={14} /> Brief versiegeln
        </button>
      </div>

      {/* Letters Grid */}
      <div className="space-y-2">
        {letters.length === 0 ? (
          <div className="glass-panel p-6 rounded-3xl text-center text-gray-400">
            <Mail size={32} className="mx-auto mb-1 opacity-30" />
            <p className="text-xs font-bold text-gray-600">Noch keine Briefe versiegelt</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hinterlasse eine geheime Nachricht für deinen Schatz!</p>
          </div>
        ) : (
          letters.map(letter => (
            <div
              key={letter.id}
              onClick={() => handleLetterClick(letter)}
              className={`cursor-pointer glass-panel p-3.5 rounded-2xl shadow-xs border transition-all flex items-center justify-between gap-3 active:scale-98 ${
                letter.is_opened ? 'border-pink-200 bg-white/95' : 'border-purple-200 bg-gradient-to-r from-purple-50/70 to-pink-50/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    letter.is_opened ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  {letter.is_opened ? <Unlock size={18} /> : <Lock size={18} />}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-black text-gray-800 truncate">{letter.title}</h3>
                  <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                    Von {letter.author} • {letter.is_opened ? 'Geöffnet ✓' : 'Versiegelt 🔒'}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-lg">
                  {letter.is_opened ? 'Lesen →' : 'Entsiegeln 🔓'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Letter Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-[#fffdf9] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-3 border-2 border-pink-100 relative">
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <span className="text-xs font-black text-pink-600 flex items-center gap-1">
                <Heart size={14} fill="currentColor" /> Liebesbrief von {selectedLetter.author}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">{selectedLetter.created_at}</span>
            </div>

            <h3 className="text-base font-black text-gray-800 pt-1">{selectedLetter.title}</h3>

            <div className="bg-white/80 p-4 rounded-2xl border border-pink-100 min-h-[120px] max-h-[220px] overflow-y-auto">
              <p className="text-xs text-gray-800 leading-relaxed italic whitespace-pre-wrap">
                "{selectedLetter.content}"
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLetter(null)}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl text-xs font-black shadow-md"
            >
              Schließen 💕
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-gray-800">Geheimen Brief versiegeln 💌</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Titel / Anlass</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Für einen stressigen Tag ❤️"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Wann darf der Brief geöffnet werden?</label>
                <select
                  value={condition}
                  onChange={e => {
                    setCondition(e.target.value);
                    setUnlockType(e.target.value === 'jahrestag' ? 'date' : 'mood');
                  }}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500 bg-white"
                >
                  <option value="stress">Wenn du einen stressigen Tag hattest ☕</option>
                  <option value="vermissen">Wenn du mich gerade ganz doll vermisst 🥰</option>
                  <option value="traurig">Wenn du Trost & eine Umarmung brauchst 🥺</option>
                  <option value="lachen">Wenn du zum Lachen gebracht werden willst 😂</option>
                  <option value="jahrestag">An unserem nächsten Jahrestag 💍</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Deine geheime Nachricht</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Schreibe deinem Schatz etwas von ganzem Herzen..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-pink-500"
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
                  Versiegeln 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
