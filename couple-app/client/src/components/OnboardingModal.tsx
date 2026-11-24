import { useState } from 'react';
import { Heart, Cake, MapPin, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import type { ProfileData, UserRole } from '../types';

interface OnboardingModalProps {
  initialProfile: ProfileData;
  initialRole: UserRole;
  onComplete: (completedProfile: ProfileData, selectedRole: UserRole) => void;
}

const COMMON_CITIES = [
  'Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart',
  'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover', 'Nürnberg', 'Wien', 'Zürich'
];

export default function OnboardingModal({
  initialProfile,
  initialRole,
  onComplete
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(initialRole || 'Partner A');

  const [partnerAName, setPartnerAName] = useState(initialProfile.partner_a_name || '');
  const [partnerBName, setPartnerBName] = useState(initialProfile.partner_b_name || '');
  const [startDate, setStartDate] = useState(initialProfile.start_date || '2023-05-12');
  const [partnerABirthday, setPartnerABirthday] = useState(initialProfile.partner_a_birthday || '');
  const [partnerBBirthday, setPartnerBBirthday] = useState(initialProfile.partner_b_birthday || '');
  const [cityA, setCityA] = useState(initialProfile.partner_a_city || 'Berlin');
  const [cityB, setCityB] = useState(initialProfile.partner_b_city || 'München');

  // Days calculation preview
  const daysPreview = startDate
    ? Math.max(1, differenceInDays(new Date(), new Date(startDate)))
    : 0;

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Complete setup
      const completed: ProfileData = {
        partner_a_name: partnerAName.trim() || 'Partner A',
        partner_b_name: partnerBName.trim() || 'Partner B',
        start_date: startDate || new Date().toISOString().split('T')[0],
        partner_a_birthday: partnerABirthday,
        partner_b_birthday: partnerBBirthday,
        partner_a_city: cityA || 'Berlin',
        partner_b_city: cityB || 'München',
        hugs_count: initialProfile.hugs_count || 0,
        setup_completed: true
      };
      onComplete(completed, role);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 animate-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[95dvh]">
        {/* Top Decorative Header */}
        <div className="text-center pt-2 pb-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-400 to-rose-300 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-2">
            <Heart size={28} fill="white" className="animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-gray-800">Couple Link ❤️</h2>
          <p className="text-xs text-gray-500 font-medium">Willkommen in eurem gemeinsamen Raum</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center items-center gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-6 bg-pink-500'
                  : step > s
                  ? 'w-2.5 bg-pink-300'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1 py-1">
          {/* STEP 1: Wer bist du? */}
          {step === 1 && (
            <div className="space-y-4 text-center animate-in">
              <div>
                <h3 className="text-base font-extrabold text-gray-800">Wer nutzt die App gerade?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Wähle deine Rolle, um zu starten</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRole('Partner A')}
                  className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                    role === 'Partner A'
                      ? 'border-pink-500 bg-pink-50/80 shadow-md scale-102'
                      : 'border-gray-200 hover:border-pink-200 bg-white'
                  }`}
                >
                  <span className="text-3xl mb-1.5">👸 / 🤴</span>
                  <span className="text-xs font-bold text-gray-800">Ich bin</span>
                  <span className="text-sm font-black text-pink-600">Partner A</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Partner B')}
                  className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                    role === 'Partner B'
                      ? 'border-purple-500 bg-purple-50/80 shadow-md scale-102'
                      : 'border-gray-200 hover:border-purple-200 bg-white'
                  }`}
                >
                  <span className="text-3xl mb-1.5">🥰 / 💖</span>
                  <span className="text-xs font-bold text-gray-800">Ich bin</span>
                  <span className="text-sm font-black text-purple-600">Partner B</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                (Keine Sorge, ihr könnt die Rolle später jederzeit mit 1 Klick wechseln!)
              </p>
            </div>
          )}

          {/* STEP 2: Eure Namen */}
          {step === 2 && (
            <div className="space-y-3 animate-in">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-gray-800">Wie heißt ihr beiden?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tragt eure Vornamen oder Kosenamen ein</p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-pink-600 flex items-center gap-1 mb-1">
                    <UserCheck size={14} /> Name von Partner A:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Dennis"
                    value={partnerAName}
                    onChange={e => setPartnerAName(e.target.value)}
                    className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-600 flex items-center gap-1 mb-1">
                    <UserCheck size={14} /> Name von Partner B:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Sarah"
                    value={partnerBName}
                    onChange={e => setPartnerBName(e.target.value)}
                    className="w-full bg-purple-50/40 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Jahrestag */}
          {step === 3 && (
            <div className="space-y-3 text-center animate-in">
              <div>
                <h3 className="text-base font-extrabold text-gray-800">Wann seid ihr zusammengekommen? 💍</h3>
                <p className="text-xs text-gray-400 mt-0.5">Euer gemeinsamer Liebes-Jahrestag</p>
              </div>

              <div className="pt-2">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 text-center focus:outline-none focus:border-pink-500"
                />
              </div>

              {daysPreview > 0 && (
                <div className="bg-pink-50/90 p-3.5 rounded-2xl border border-pink-100 text-center mt-3">
                  <span className="text-[10px] uppercase font-bold text-pink-500 block">Gemeinsame Zeit</span>
                  <span className="text-3xl font-black text-pink-600 my-0.5 block">{daysPreview} Tage</span>
                  <p className="text-xs text-gray-600">voller Liebe & schöner Momente ✨</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Geburtstage */}
          {step === 4 && (
            <div className="space-y-3 animate-in">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-gray-800">Wann habt ihr Geburtstag? 🎂</h3>
                <p className="text-xs text-gray-400 mt-0.5">Damit ihr den Ehrentag nie vergesst</p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-pink-600 flex items-center gap-1 mb-1">
                    <Cake size={14} /> Geburtstag von {partnerAName || 'Partner A'}:
                  </label>
                  <input
                    type="date"
                    value={partnerABirthday}
                    onChange={e => setPartnerABirthday(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-600 flex items-center gap-1 mb-1">
                    <Cake size={14} /> Geburtstag von {partnerBName || 'Partner B'}:
                  </label>
                  <input
                    type="date"
                    value={partnerBBirthday}
                    onChange={e => setPartnerBBirthday(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Standorte & Abschluss */}
          {step === 5 && (
            <div className="space-y-3 animate-in">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-gray-800">Wo wohnt ihr? 📍</h3>
                <p className="text-xs text-gray-400 mt-0.5">Für den Entfernungs- und Reisezeitrechner</p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-pink-600 flex items-center gap-1 mb-1">
                    <MapPin size={14} /> Stadt von {partnerAName || 'Partner A'}:
                  </label>
                  <select
                    value={cityA}
                    onChange={e => setCityA(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-pink-500"
                  >
                    {COMMON_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-600 flex items-center gap-1 mb-1">
                    <MapPin size={14} /> Stadt von {partnerBName || 'Partner B'}:
                  </label>
                  <select
                    value={cityB}
                    onChange={e => setCityB(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-500"
                  >
                    {COMMON_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-2xl border border-pink-100 text-center mt-3">
                <p className="text-xs font-bold text-gray-700">
                  🎉 Fast geschafft! Euer persönlicher Space ist bereit.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-3 border-t border-gray-100 flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 text-xs transition-colors"
            >
              Zurück
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNext()}
            className="flex-1 py-2.5 rounded-xl font-black text-white bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 hover:opacity-95 text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {step === 5 ? (
              <>
                <Sparkles size={14} /> Unseren Space betreten! 💕
              </>
            ) : (
              <>
                Weiter <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
