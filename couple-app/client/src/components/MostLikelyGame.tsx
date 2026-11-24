import { useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProfileData, UserRole } from '../types';

interface MostLikelyGameProps {
  votes: Record<string, Record<string, { vote: string; created_at: string }>>;
  profile: ProfileData;
  role: UserRole;
  onVote: (questionId: string, partner: string, vote: string) => void;
}

const MOST_LIKELY_QUESTIONS = [
  { id: 'ml1', q: 'Wer schläft beim Film schauen zuerst ein? 😴' },
  { id: 'ml2', q: 'Wer braucht morgens länger im Bad? 🚿' },
  { id: 'ml3', q: 'Wer verlegt ständig Handy oder Schlüssel? 🔑' },
  { id: 'ml4', q: 'Wer gibt mehr Geld für Snacks & Süßigkeiten aus? 🍫' },
  { id: 'ml5', q: 'Wer beansprucht mehr Platz im Bett? 🛌' },
  { id: 'ml6', q: 'Wer ist sturer bei Diskussionen? 😤' },
  { id: 'ml7', q: 'Wer ist morgens muffeliger ohne Kaffee? ☕' },
  { id: 'ml8', q: 'Wer kuschelt mehr und braucht mehr Nähe? 🥰' },
  { id: 'ml9', q: 'Wer würde sich eher ohne Navi im Wald verlaufen? 🌲' },
  { id: 'ml10', q: 'Wer bestellt eher unnötige Dinge im Internet? 📦' },
  { id: 'ml11', q: 'Wer friert schneller und klaut die Bettdecke? 🥶' },
  { id: 'ml12', q: 'Wer braucht länger, um sich für ein Essen zu entscheiden? 🍕' },
  { id: 'ml13', q: 'Wer sagt nach einem Streit zuerst „Entschuldigung“? 😇' },
  { id: 'ml14', q: 'Wer kocht kreativer und leckerer? 🍳' },
  { id: 'ml15', q: 'Wer ist ungeduldiger im Alltag? ⏱️' },
  { id: 'ml16', q: 'Wer plant gemeinsame Urlaube bis ins Detail? 🗺️' },
  { id: 'ml17', q: 'Wer fängt eher mitten in der Nacht an zu snacken? 🍪' },
  { id: 'ml18', q: 'Wer vergisst eher, warum er in ein Zimmer gegangen ist? 🤪' },
  { id: 'ml19', q: 'Wer regt sich beim Autofahren mehr über andere Fahrer auf? 🚗' },
  { id: 'ml20', q: 'Wer weint eher bei einem traurigen Film? 🥺' },
  { id: 'ml21', q: 'Wer drückt morgens 5x auf Schlummern / Snooze? ⏰' },
  { id: 'ml22', q: 'Wer packt für ein Wochenende einen riesigen Koffer? 🧳' },
  { id: 'ml23', q: 'Wer lässt eher leere Verpackungen im Schrank stehen? 📦' },
  { id: 'ml24', q: 'Wer verbringt mehr Zeit auf TikTok oder Instagram? 📱' },
  { id: 'ml25', q: 'Wer fängt grundlos an, im Wohnzimmer albern zu tanzen? 💃' },
  { id: 'ml26', q: 'Wer würde bei einem Horrorfilm eher die Kissen vors Gesicht halten? 🙈' },
  { id: 'ml27', q: 'Wer ist besser im Behalten von Geheimnissen? 🤫' },
  { id: 'ml28', q: 'Wer flirtet ungeschickter, wenn er/sie nervös ist? 😳' },
  { id: 'ml29', q: 'Wer vergisst eher, die Wäsche aus der Waschmaschine zu nehmen? 🧺' },
  { id: 'ml30', q: 'Wer würde eher spontan einen Hund oder eine Katze adoptieren? 🐶' },
  { id: 'ml31', q: 'Wer ist ordentlicher und räumt hinter dem anderen her? 🧹' },
  { id: 'ml32', q: 'Wer redet mehr im Schlaf oder schnarcht heimlich? 💤' },
  { id: 'ml33', q: 'Wer hat mehr Klamotten im Schrank? 👗' },
  { id: 'ml34', q: 'Wer bestellt im Restaurant immer dasselbe Gericht? 🍝' },
  { id: 'ml35', q: 'Wer kann schlechter Nein zu Süßigkeiten sagen? 🍩' },
  { id: 'ml36', q: 'Wer ist handwerklich begabter und baut Möbel auf? 🔨' },
  { id: 'ml37', q: 'Wer würde bei einem Zombie-Angriff länger überleben? 🧟' },
  { id: 'ml38', q: 'Wer macht die peinlicheren Grimassen auf Fotos? 🤪' },
  { id: 'ml39', q: 'Wer nimmt längere Sprachnachrichten auf? 🎙️' },
  { id: 'ml40', q: 'Wer ist kitzeliger? 😂' },
  { id: 'ml41', q: 'Wer trinkt mehr Kaffee am Tag? ☕' },
  { id: 'ml42', q: 'Wer ist schneller beleidigt, wenn man ihn neckt? 🥺' },
  { id: 'ml43', q: 'Wer gibt dem anderen öfter einen Kuss auf die Stirn? 💋' },
  { id: 'ml44', q: 'Wer ist der größere Romantiker von uns beiden? 🌹' },
  { id: 'ml45', q: 'Wer liebt den anderen ein winziges bisschen mehr? ❤️' }
];

export default function MostLikelyGame({ votes, profile, role, onVote }: MostLikelyGameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const currentQ = MOST_LIKELY_QUESTIONS[currentIdx];
  const currentRole = role || 'Partner A';
  const otherRole = currentRole === 'Partner A' ? 'Partner B' : 'Partner A';

  const partnerName = currentRole === 'Partner A' ? (profile.partner_b_name || 'Partner B') : (profile.partner_a_name || 'Partner A');

  const questionVotes = votes[currentQ.id] || {};
  const myVote = questionVotes[currentRole]?.vote;
  const partnerVote = questionVotes[otherRole]?.vote;

  const bothVoted = !!myVote && !!partnerVote;
  const isMatch = bothVoted && myVote === partnerVote;

  const handleSelectVote = (votedFor: string) => {
    onVote(currentQ.id, currentRole, votedFor);
  };

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % MOST_LIKELY_QUESTIONS.length);
  const handlePrev = () => setCurrentIdx((prev) => (prev - 1 + MOST_LIKELY_QUESTIONS.length) % MOST_LIKELY_QUESTIONS.length);
  const handleRandom = () => setCurrentIdx(Math.floor(Math.random() * MOST_LIKELY_QUESTIONS.length));

  return (
    <div className="space-y-3 pb-3 animate-in w-full max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-800">Wer von uns beiden eher...? 👥</h2>
          <p className="text-xs text-gray-400 font-medium">Tippt beide ab und vergleicht!</p>
        </div>
        <button
          type="button"
          onClick={handleRandom}
          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
        >
          <Dices size={13} /> Zufall
        </button>
      </div>

      {/* Main Question Card */}
      <div className="glass-panel p-5 rounded-3xl text-center relative overflow-hidden shadow-xs border border-pink-100">
        <span className="text-[10px] font-black uppercase tracking-wider text-pink-500 bg-pink-50 px-3 py-0.5 rounded-full inline-block mb-3">
          Frage {currentIdx + 1} von {MOST_LIKELY_QUESTIONS.length}
        </span>

        <h3 className="text-base font-black text-gray-800 leading-snug px-1 my-1">
          {currentQ.q}
        </h3>

        {/* Voting Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => handleSelectVote(profile.partner_a_name || 'Partner A')}
            className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center active:scale-95 ${
              myVote === (profile.partner_a_name || 'Partner A')
                ? 'border-pink-500 bg-pink-50/90 shadow-xs'
                : 'border-gray-200 hover:border-pink-200 bg-white/80'
            }`}
          >
            <span className="text-2xl mb-1">👸</span>
            <span className="text-xs font-black text-gray-800 truncate max-w-full">
              {profile.partner_a_name || 'Partner A'}
            </span>
            {myVote === (profile.partner_a_name || 'Partner A') && (
              <span className="text-[9px] font-bold text-pink-600 mt-0.5">Dein Tipp ✓</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectVote(profile.partner_b_name || 'Partner B')}
            className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center active:scale-95 ${
              myVote === (profile.partner_b_name || 'Partner B')
                ? 'border-purple-500 bg-purple-50/90 shadow-xs'
                : 'border-gray-200 hover:border-purple-200 bg-white/80'
            }`}
          >
            <span className="text-2xl mb-1">🤴</span>
            <span className="text-xs font-black text-gray-800 truncate max-w-full">
              {profile.partner_b_name || 'Partner B'}
            </span>
            {myVote === (profile.partner_b_name || 'Partner B') && (
              <span className="text-[9px] font-bold text-purple-600 mt-0.5">Dein Tipp ✓</span>
            )}
          </button>
        </div>

        {/* Reveal Result Section */}
        {bothVoted ? (
          <div
            className={`mt-4 p-3 rounded-2xl border text-center animate-in ${
              isMatch
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/90 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 font-black text-xs mb-0.5">
              {isMatch ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>100% Einigkeit! 🎉</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-amber-600" />
                  <span>Uneinig! 😂</span>
                </>
              )}
            </div>
            <p className="text-[11px] font-medium">
              {isMatch
                ? `Ihr beide habt ${myVote} gewählt!`
                : `Du denkst ${myVote}, aber ${partnerName} denkt ${partnerVote}!`}
            </p>
          </div>
        ) : myVote ? (
          <div className="mt-4 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-center text-gray-400 text-xs">
            <span>Warte auf den Tipp von {partnerName}... ⏳</span>
          </div>
        ) : null}

        {/* Navigation Arrows */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-bold"
          >
            <ChevronLeft size={16} /> Vorherige
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 font-bold"
          >
            Nächste <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
