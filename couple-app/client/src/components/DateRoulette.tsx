import { useState } from 'react';
import { Sparkles, Dices, Plus, Calendar, Check } from 'lucide-react';
import type { DateIdeaItem } from '../types';

interface DateRouletteProps {
  ideas: DateIdeaItem[];
  onAddIdea: (title: string, category: string) => void;
  onScheduleDate: (title: string, category: 'Date' | 'Reise' | 'Jahrestag' | 'Feier' | 'Gemütlich') => void;
}

const CATEGORIES = ['Alle', 'Zuhause', 'Draußen', 'Abenteuer'];

export default function DateRoulette({ ideas, onAddIdea, onScheduleDate }: DateRouletteProps) {
  const [selectedCat, setSelectedCat] = useState('Alle');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState<DateIdeaItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Zuhause');
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const filteredIdeas = ideas.filter(i => selectedCat === 'Alle' || i.category === selectedCat);

  const spinWheel = () => {
    if (filteredIdeas.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setCurrentResult(null);
    setScheduledSuccess(false);

    let counter = 0;
    const totalSpins = 25;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * filteredIdeas.length);
      setCurrentResult(filteredIdeas[randomIdx]);
      counter++;

      if (counter >= totalSpins) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 90);
  };

  const handleAddCustomIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddIdea(newTitle.trim(), newCategory);
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleAddTodayToCalendar = () => {
    if (!currentResult) return;
    const catMapping: 'Date' | 'Reise' | 'Jahrestag' | 'Feier' | 'Gemütlich' =
      currentResult.category === 'Zuhause' ? 'Gemütlich' : 'Date';
    onScheduleDate(currentResult.title, catMapping);
    setScheduledSuccess(true);
  };

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Date-Night Roulette 🎡</h2>
          <p className="text-xs text-gray-400 font-medium">Was unternehmen wir heute Schönes?</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <Plus size={14} /> Eigene Idee
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 transition-all ${
              selectedCat === cat
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-white/90 text-gray-500 hover:bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Roulette Spinner Stage Card */}
      <div className="glass-panel p-5 rounded-3xl text-center relative overflow-hidden border border-pink-100 shadow-xs flex flex-col items-center justify-center min-h-[220px]">
        <div className="absolute top-2 right-2 text-pink-200 opacity-30">
          <Sparkles size={80} />
        </div>

        {/* Central Display */}
        <div className="z-10 w-full my-auto">
          {currentResult ? (
            <div className={`space-y-2 ${isSpinning ? 'scale-95 opacity-80' : 'scale-100 animate-in'}`}>
              <span className="text-[10px] uppercase font-black tracking-widest text-pink-500 bg-pink-50 px-2.5 py-0.5 rounded-full inline-block">
                {currentResult.category}
              </span>
              <h3 className="text-lg font-black text-gray-800 px-2 leading-snug">
                {currentResult.title}
              </h3>
            </div>
          ) : (
            <div className="text-gray-400 space-y-1.5">
              <Dices size={40} className="mx-auto text-pink-400 animate-pulse" />
              <p className="text-xs font-bold text-gray-600">Bereit für eine Überraschung?</p>
              <p className="text-[10px]">Tippe unten auf "Glücksrad drehen"!</p>
            </div>
          )}
        </div>

        {/* Winner Calendar Action */}
        {!isSpinning && currentResult && (
          <div className="mt-3 z-10 animate-in">
            <button
              type="button"
              onClick={handleAddTodayToCalendar}
              disabled={scheduledSuccess}
              className="bg-white/95 border border-pink-200 text-pink-700 px-3 py-1.5 rounded-xl text-[11px] font-extrabold shadow-xs flex items-center gap-1.5 hover:bg-pink-50 transition-all active:scale-95 disabled:opacity-60"
            >
              {scheduledSuccess ? (
                <>
                  <Check size={13} className="text-emerald-500" /> Als Date eingetragen!
                </>
              ) : (
                <>
                  <Calendar size={13} /> Für unser nächstes Date planen
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Spin Button */}
      <button
        type="button"
        onClick={spinWheel}
        disabled={isSpinning || filteredIdeas.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
      >
        <Dices size={18} className={isSpinning ? 'animate-spin' : ''} />
        <span>{isSpinning ? 'Glücksrad dreht sich...' : '🎡 Glücksrad drehen!'}</span>
      </button>

      {/* Available Ideas Preview */}
      <div className="space-y-1.5 pt-2">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wide block">
          Ideen im Lostopf ({filteredIdeas.length})
        </span>
        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
          {filteredIdeas.map(idea => (
            <div
              key={idea.id}
              className="glass-panel p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-gray-700 border border-white/80"
            >
              <span className="truncate pr-2">{idea.title}</span>
              <span className="text-[9px] font-bold bg-pink-50 text-pink-600 px-2 py-0.5 rounded-lg shrink-0">
                {idea.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Date Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-gray-800">Eigene Date-Idee hinzufügen ✨</h3>
            <form onSubmit={handleAddCustomIdea} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Aktivität / Date-Idee</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Sushi selbst rollen 🍣"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Kategorie</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                >
                  <option value="Zuhause">Zuhause 🛋️</option>
                  <option value="Draußen">Draußen 🌆</option>
                  <option value="Abenteuer">Abenteuer 🚗</option>
                </select>
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
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
