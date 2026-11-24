import { useState } from 'react';
import { Send, Lock, Unlock, ChevronLeft, ChevronRight, Dices, HelpCircle } from 'lucide-react';
import type { QuestionWithAnswers, UserRole, ProfileData, QuizQuestion } from '../types';

interface QuizViewProps {
  quizData: QuestionWithAnswers[];
  role: UserRole;
  profile: ProfileData;
  onSubmitAnswer: (questionId: string, questionText: string, partner: string, answer: string) => void;
}

const QUESTION_DECK: QuizQuestion[] = [
  { id: 'q1', question: 'Was war dein allererster Eindruck von mir?', category: 'Erinnerungen' },
  { id: 'q2', question: 'Welche Eigenschaft schätzt du an mir am allermeisten?', category: 'Romantik' },
  { id: 'q3', question: 'Welcher gemeinsame Moment hat dich bisher am glücklichsten gemacht?', category: 'Erinnerungen' },
  { id: 'q4', question: 'Wenn wir morgen eine gemeinsame Weltreise starten könnten: Wohin als Erstes?', category: 'Zukunft' },
  { id: 'q5', question: 'Welches Lied erinnert dich sofort an uns?', category: 'Romantik' },
  { id: 'q6', question: 'Was ist eine kleine Macke von mir, die du heimlich süß findest?', category: 'Lustig' },
  { id: 'q7', question: 'Was ist dein größter Traum für unsere gemeinsame Zukunft?', category: 'Zukunft' },
  { id: 'q8', question: 'Woran hast du gemerkt, dass du dich in mich verliebt hast?', category: 'Romantik' },
  { id: 'q9', question: 'Was bringt uns beide immer sofort zum Lachen?', category: 'Lustig' },
  { id: 'q10', question: 'Was ist dein absolutes Lieblingsessen, wenn wir gemütlich zusammen sind?', category: 'Erinnerungen' },
  { id: 'q11', question: 'Welches Date war für dich bisher das Schönste oder Aufregendste?', category: 'Erinnerungen' },
  { id: 'q12', question: 'Was würdest du tun, wenn wir heute 24 Stunden ohne Handy nur zu zweit hätten?', category: 'Romantik' }
];

export default function QuizView({
  quizData,
  role,
  profile,
  onSubmitAnswer
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerInput, setAnswerInput] = useState('');

  const currentQuestion = QUESTION_DECK[currentIdx];
  const currentRole = role || 'Partner A';
  const otherRole = currentRole === 'Partner A' ? 'Partner B' : 'Partner A';

  const myPartnerName = currentRole === 'Partner A' ? profile.partner_a_name : profile.partner_b_name;
  const otherPartnerName = currentRole === 'Partner A' ? profile.partner_b_name : profile.partner_a_name;

  // Find saved entry for this question
  const savedEntry = quizData.find(q => q.question_id === currentQuestion.id);
  const myAnswer = savedEntry?.answers?.[currentRole];
  const partnerAnswer = savedEntry?.answers?.[otherRole];

  const hasAnswered = !!myAnswer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    onSubmitAnswer(currentQuestion.id, currentQuestion.question, currentRole, answerInput.trim());
    setAnswerInput('');
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % QUESTION_DECK.length);
    setAnswerInput('');
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + QUESTION_DECK.length) % QUESTION_DECK.length);
    setAnswerInput('');
  };

  const handleRandom = () => {
    const r = Math.floor(Math.random() * QUESTION_DECK.length);
    setCurrentIdx(r);
    setAnswerInput('');
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">Tägliches Paar-Quiz</h2>
          <p className="text-xs text-gray-400 font-medium">Beantworten & Partner-Antwort enthüllen 🔐</p>
        </div>
        <button
          onClick={handleRandom}
          className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
          title="Zufällige Frage"
        >
          <Dices size={14} /> Zufall
        </button>
      </div>

      {/* Question Card */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400 font-bold">
          <span className="bg-pink-100 text-pink-600 px-2.5 py-0.5 rounded-full text-[10px]">
            {currentQuestion.category}
          </span>
          <span>Frage {currentIdx + 1} von {QUESTION_DECK.length}</span>
        </div>

        <p className="text-base font-extrabold text-gray-800 leading-snug my-2">
          "{currentQuestion.question}"
        </p>

        {/* Carousel controls */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold"
          >
            <ChevronLeft size={16} /> Vorherige
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-xs text-[var(--color-primary-dark)] hover:text-pink-700 font-semibold"
          >
            Nächste <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Answer Form or Own Answer Display */}
      {!hasAnswered ? (
        <div className="glass-panel p-5 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Deine Antwort ({myPartnerName})
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              required
              rows={3}
              placeholder="Schreibe deine ehrliche Antwort..."
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              className="w-full bg-white/70 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-pink-400"
            />
            <button
              type="submit"
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center justify-center gap-1.5 transition-transform"
            >
              <Send size={14} /> Antwort abschicken
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-panel p-4 rounded-3xl shadow-sm border-l-4 border-pink-400 space-y-1">
          <span className="text-[10px] font-bold uppercase text-gray-400">Deine Antwort:</span>
          <p className="text-xs font-bold text-gray-800">{myAnswer.answer}</p>
        </div>
      )}

      {/* Partner's Answer Section (Blurred until user answers) */}
      <div className="glass-panel p-5 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-purple-600">
            Antwort von {otherPartnerName}
          </span>
          {hasAnswered && partnerAnswer ? (
            <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
              <Unlock size={14} />
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 p-1 rounded-full">
              <Lock size={14} />
            </span>
          )}
        </div>

        {partnerAnswer ? (
          hasAnswered ? (
            <div className="bg-white/80 p-3 rounded-2xl border border-purple-100 animate-in">
              <p className="text-xs font-extrabold text-gray-800 italic">
                "{partnerAnswer.answer}"
              </p>
              <span className="text-[9px] text-gray-400 block mt-1">{partnerAnswer.submitted_at}</span>
            </div>
          ) : (
            <div className="relative py-2">
              <p className="text-xs text-gray-400 filter blur-xs select-none">
                Hier steht die geheime Antwort deines Partners. Du kannst sie erst lesen, wenn du selbst geantwortet hast!
              </p>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-xl">
                <Lock size={20} className="text-purple-500 mb-1" />
                <span className="text-[11px] font-bold text-gray-700">Versteckt bis du antwortest 🔒</span>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-4 text-gray-400">
            <HelpCircle size={24} className="mx-auto mb-1 opacity-40" />
            <p className="text-xs">{otherPartnerName} hat diese Frage noch nicht beantwortet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
