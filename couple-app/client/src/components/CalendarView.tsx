import { useState } from 'react';
import { Plus, Trash2, Calendar, Tag } from 'lucide-react';
import type { EventItem, CountdownItem } from '../types';

interface CalendarViewProps {
  events: EventItem[];
  countdown: CountdownItem;
  onAddEvent: (event: Omit<EventItem, 'id'>) => void;
  onDeleteEvent: (id: number) => void;
  onUpdateCountdown: (title: string, target_date: string) => void;
}

const CATEGORIES: ('Date' | 'Reise' | 'Jahrestag' | 'Feier' | 'Gemütlich')[] = [
  'Date',
  'Reise',
  'Jahrestag',
  'Feier',
  'Gemütlich'
];

export default function CalendarView({
  events,
  countdown,
  onAddEvent,
  onDeleteEvent,
  onUpdateCountdown
}: CalendarViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('Alle');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<'Date' | 'Reise' | 'Jahrestag' | 'Feier' | 'Gemütlich'>('Date');
  const [newDesc, setNewDesc] = useState('');

  // Countdown Edit Form State
  const [cdTitle, setCdTitle] = useState(countdown.title);
  const [cdDate, setCdDate] = useState(countdown.target_date);

  // Filter events
  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'Alle') return true;
    return e.category === selectedFilter;
  });

  const getDaysBadge = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black">Heute! 🎉</span>;
    if (diffDays === 1) return <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-[10px] font-extrabold">Morgen</span>;
    if (diffDays > 1) return <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-bold">in {diffDays} Tagen</span>;
    return <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-medium">Vergangen</span>;
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    onAddEvent({
      title: newTitle.trim(),
      date: newDate,
      category: newCategory,
      description: newDesc.trim() || undefined
    });
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleSaveCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cdTitle.trim() || !cdDate) return;
    onUpdateCountdown(cdTitle.trim(), cdDate);
    setShowCountdownModal(false);
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">Unser Kalender</h2>
          <p className="text-xs text-gray-400 font-medium">Gemeinsame Pläne & Vorfreude</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} /> Date planen
        </button>
      </div>

      {/* Countdown Card with Edit Option */}
      <div className="glass-panel p-4 rounded-3xl border border-pink-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Großer Countdown</span>
            <h4 className="font-bold text-xs text-gray-800">{countdown.title}</h4>
            <span className="text-[10px] text-gray-400">{countdown.target_date}</span>
          </div>
        </div>
        <button
          onClick={() => setShowCountdownModal(true)}
          className="text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-xl"
        >
          Ändern
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {['Alle', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              selectedFilter === cat
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-white/80 text-gray-500 hover:bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center text-gray-400">
            <Calendar size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Keine Termine in dieser Kategorie</p>
            <p className="text-xs text-gray-400 mt-1">Tragt euer nächstes gemeinsames Date ein!</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              className="glass-panel p-4 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-shadow relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-pink-50 text-pink-500 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Tag size={10} /> {event.category}
                    </span>
                    {getDaysBadge(event.date)}
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-800">{event.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Calendar size={12} />
                    <span>{event.date}</span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-600 mt-2 bg-white/60 p-2 rounded-xl">
                      {event.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onDeleteEvent(event.id)}
                  title="Date löschen"
                  className="text-gray-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Neues Date anlegen */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Neues Date eintragen 💕</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Titel</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Romantisches Picknick"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Datum</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Kategorie</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Details / Notizen (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Adresse, Treffpunkt, was man mitbringt..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-xs shadow-md"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Countdown ändern */}
      {showCountdownModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Countdown bearbeiten ⏳</h3>
            <form onSubmit={handleSaveCountdown} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Ereignis-Name</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Unser nächstes Treffen"
                  value={cdTitle}
                  onChange={e => setCdTitle(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Zieldatum</label>
                <input
                  type="date"
                  required
                  value={cdDate}
                  onChange={e => setCdDate(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCountdownModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-xs shadow-md"
                >
                  Übernehmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
