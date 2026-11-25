import { useState } from 'react';
import { Dices, ShoppingBag, Edit3 } from 'lucide-react';
import type { MealItem, ProfileData, UserRole } from '../types';

interface MealPlannerProps {
  meals: MealItem[];
  profile: ProfileData;
  role: UserRole;
  onSaveMeal: (meal: MealItem) => void;
  onAddShoppingItem: (item: string) => void;
}

const DAYS_OF_WEEK = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const RECIPE_INSPIRATIONS = [
  'Selbstgemachte Steinofen-Pizza 🍕',
  'Frische Pasta al Limone mit Parmesan 🍋',
  'Cremiges Thai-Curry mit Duftreis 🍛',
  'Gourmet Burger mit Süßkartoffelpommes 🍔',
  'Sushi-Platte selbst rollen 🍣',
  'Tacos mit Pulled Chicken & Guacamole 🌮',
  'Italienisches Pilz-Risotto 🍄',
  'Frischer Lachs auf Blattspinat & Ofenkartoffeln 🐟',
  'Große Schüssel Gnocchi in Salbeibutter 🧈',
  'Kuscheliger Raclette- oder Fondue-Abend 🧀',
  'Bunte Buddha Bowl mit Erdnuss-Dressing 🥗',
  'Blaubeer-Pancakes zum Abendessen 🥞',
  'Knusprige Wraps mit Halloumi & Hummus 🌯'
];

export default function MealPlanner({
  meals,
  profile,
  onSaveMeal,
  onAddShoppingItem
}: MealPlannerProps) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [cook, setCook] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredientToAdd, setIngredientToAdd] = useState('');
  const [showIngredientInput, setShowIngredientInput] = useState<string | null>(null);

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const todayName = DAYS_OF_WEEK[todayIndex];

  const openEditModal = (day: string) => {
    const existing = meals.find(m => m.day === day);
    setEditingDay(day);
    setMealName(existing?.meal_name || '');
    setCook(existing?.cook || 'Beide');
    setNotes(existing?.notes || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;
    onSaveMeal({
      day: editingDay,
      meal_name: mealName.trim(),
      cook,
      notes: notes.trim()
    });
    setEditingDay(null);
  };

  const rollRandomMeal = () => {
    const random = RECIPE_INSPIRATIONS[Math.floor(Math.random() * RECIPE_INSPIRATIONS.length)];
    setMealName(random);
  };

  const handleAddIngredient = () => {
    if (!ingredientToAdd.trim()) return;
    onAddShoppingItem(ingredientToAdd.trim());
    setIngredientToAdd('');
    setShowIngredientInput(null);
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">Wochen-Essensplan</h2>
          <p className="text-xs text-gray-400 font-medium">Was kochen wir Schönes zusammen? 🍳</p>
        </div>
      </div>

      {/* Weekday List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
        {DAYS_OF_WEEK.map(day => {
          const currentMeal = meals.find(m => m.day === day);
          const isToday = day === todayName;

          return (
            <div
              key={day}
              className={`glass-panel p-4 rounded-3xl transition-all shadow-sm border ${
                isToday
                  ? 'border-pink-300 ring-2 ring-pink-200/50 bg-gradient-to-r from-white/95 to-pink-50/50'
                  : 'border-white/70 hover:border-pink-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="bg-pink-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Heute
                      </span>
                    )}
                    {currentMeal?.cook && (
                      <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {currentMeal.cook}
                      </span>
                    )}
                  </div>

                  {currentMeal?.meal_name ? (
                    <div>
                      <p className="font-bold text-sm text-gray-800">{currentMeal.meal_name}</p>
                      {currentMeal.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{currentMeal.notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Noch kein Gericht eingetragen</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(day)}
                    className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-colors"
                    title="Planen / Ändern"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() => setShowIngredientInput(showIngredientInput === day ? null : day)}
                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Zutat auf Einkaufsliste setzen"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>

              {/* Inline Quick Add Ingredient to Shopping List */}
              {showIngredientInput === day && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 animate-in">
                  <input
                    type="text"
                    value={ingredientToAdd}
                    onChange={e => setIngredientToAdd(e.target.value)}
                    placeholder="Zutat für diesen Tag zur Einkaufsliste..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleAddIngredient()}
                    className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-sm"
                  >
                    + Liste
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{editingDay} kochen 🍲</h3>
              <button
                type="button"
                onClick={rollRandomMeal}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                title="Zufälliges Rezept würfeln"
              >
                <Dices size={14} /> Idee würfeln!
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Mahlzeit / Gericht</label>
                <input
                  type="text"
                  placeholder="z.B. Selbstgemachte Pizza"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Wer kocht?</label>
                <select
                  value={cook}
                  onChange={e => setCook(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                >
                  <option value="Beide">Zusammen kochen 🧑‍🤝‍🧑</option>
                  <option value={`${profile.partner_a_name} kocht`}>{profile.partner_a_name} kocht 👨‍🍳</option>
                  <option value={`${profile.partner_b_name} kocht`}>{profile.partner_b_name} kocht 👩‍🍳</option>
                  <option value="Bestellen / Restaurant">Bestellen / Restaurant 🍕</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Notizen oder Zutaten (optional)</label>
                <textarea
                  rows={2}
                  placeholder="z.B. Parmesan und Rucola kaufen..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
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
    </div>
  );
}
