import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import type {
  UserRole,
  ProfileData,
  MoodData,
  EventItem,
  MealItem,
  ShoppingItem,
  BucketItem,
  NoteItem,
  CountdownItem,
  QuestionWithAnswers,
  CouponItem,
  DateIdeaItem,
  LetterItem,
  PhotoItem
} from './types';
import { api } from './api';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import MealPlanner from './components/MealPlanner';
import QuizView from './components/QuizView';
import ListsView from './components/ListsView';
import SettingsModal from './components/SettingsModal';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('cl_user_role') as UserRole) || 'Partner A';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core App States
  const [profile, setProfile] = useState<ProfileData>({
    partner_a_name: '',
    partner_b_name: '',
    start_date: '',
    partner_a_birthday: '',
    partner_b_birthday: '',
    hugs_count: 0,
    setup_completed: false
  });

  const [moods, setMoods] = useState<Record<string, MoodData>>({});
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [countdown, setCountdown] = useState<CountdownItem>({
    title: 'Unser nächstes Treffen 💕',
    target_date: '2026-05-12'
  });
  const [quizData, setQuizData] = useState<QuestionWithAnswers[]>([]);

  // New features state
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [mostLikelyVotes, setMostLikelyVotes] = useState<Record<string, Record<string, { vote: string; created_at: string }>>>({});
  const [dateIdeas, setDateIdeas] = useState<DateIdeaItem[]>([]);
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Load all data from API on start
  useEffect(() => {
    async function loadData() {
      try {
        const [
          profData,
          moodData,
          eventData,
          mealData,
          shopData,
          buckData,
          noteData,
          cdData,
          qData,
          cData,
          mlData,
          diData,
          letData,
          phData
        ] = await Promise.all([
          api.getProfile(),
          api.getMoods(),
          api.getEvents(),
          api.getMeals(),
          api.getShopping(),
          api.getBucket(),
          api.getNotes(),
          api.getCountdown(),
          api.getQuiz(),
          api.getCoupons(),
          api.getMostLikelyVotes(),
          api.getDateIdeas(),
          api.getLetters(),
          api.getPhotos()
        ]);

        if (profData) {
          setProfile(profData);
          const hasCompleted = profData.setup_completed === true || localStorage.getItem('cl_onboarding_done') === 'true';
          const hasNames = !!profData.partner_a_name && !!profData.partner_b_name;
          if (!hasCompleted || !hasNames) {
            setShowOnboarding(true);
          }
        }
        if (moodData) setMoods(moodData);
        if (eventData) setEvents(eventData);
        if (mealData) setMeals(mealData);
        if (shopData) setShopping(shopData);
        if (buckData) setBucket(buckData);
        if (noteData) setNotes(noteData);
        if (cdData) setCountdown(cdData);
        if (qData) setQuizData(qData);
        if (cData) setCoupons(cData);
        if (mlData) setMostLikelyVotes(mlData);
        if (diData) setDateIdeas(diData);
        if (letData) setLetters(letData);
        if (phData) setPhotos(phData);
      } catch (e) {
        console.error('Fehler beim Laden der Couple-Daten:', e);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleRole = () => {
    const nextRole = role === 'Partner A' ? 'Partner B' : 'Partner A';
    const nextName = nextRole === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
    setRole(nextRole);
    localStorage.setItem('cl_user_role', nextRole);
    showToast(`Eingeloggt als ${nextName} (${nextRole}) 💕`);
  };

  const handleSetRole = (newRole: UserRole) => {
    if (!newRole) return;
    setRole(newRole);
    localStorage.setItem('cl_user_role', newRole);
    const name = newRole === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
    showToast(`Eingeloggt als ${name} (${newRole}) 💕`);
  };

  const handleCompleteOnboarding = async (completedProfile: ProfileData, selectedRole: UserRole) => {
    setProfile(completedProfile);
    if (selectedRole) {
      setRole(selectedRole);
      localStorage.setItem('cl_user_role', selectedRole);
    }
    localStorage.setItem('cl_onboarding_done', 'true');
    await api.saveFullProfile(completedProfile);
    setShowOnboarding(false);
    showToast('Willkommen in eurem Couple-Space! 🎉❤️');
  };

  // Days together calculation
  const daysTogether = Math.max(
    1,
    differenceInDays(new Date(), new Date(profile.start_date || '2023-05-12'))
  );

  // Profile actions
  const handleUpdateProfileKey = async (key: string, value: string) => {
    await api.updateProfileKey(key, value);
    setProfile(prev => ({
      ...prev,
      [key]: key === 'hugs_count' ? parseInt(value, 10) : value
    }));
    showToast('Profil aktualisiert ✨');
  };

  // Hug action
  const handleSendHug = async () => {
    const count = await api.sendHug();
    setProfile(prev => ({ ...prev, hugs_count: count }));
    showToast('Umarmung erfolgreich verschickt! 🤗');
  };

  // Mood action
  const handleUpdateMood = async (emoji: string, text: string) => {
    const currentRole = role || 'Partner A';
    await api.updateMood(currentRole, emoji, text);
    setMoods(prev => ({
      ...prev,
      [currentRole]: { emoji, text, updated_at: 'Gerade eben' }
    }));
    showToast('Stimmung aktualisiert 💖');
  };

  // Event actions
  const handleAddEvent = async (event: Omit<EventItem, 'id'>) => {
    const created = await api.addEvent(event);
    setEvents(prev => [created, ...prev]);
    showToast('Date im Kalender eingetragen 📅');
  };

  const handleDeleteEvent = async (id: number) => {
    await api.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('Date gelöscht');
  };

  const handleUpdateCountdown = async (title: string, target_date: string) => {
    await api.setCountdown(title, target_date);
    setCountdown({ title, target_date });
    showToast('Countdown aktualisiert ⏳');
  };

  // Meal actions
  const handleSaveMeal = async (meal: MealItem) => {
    await api.saveMeal(meal);
    setMeals(prev => {
      const idx = prev.findIndex(m => m.day === meal.day);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = meal;
        return copy;
      }
      return [...prev, meal];
    });
    showToast(`${meal.day} geplant 🍲`);
  };

  // Shopping actions
  const handleAddShopping = async (item: string, category: string = 'Supermarkt') => {
    const created = await api.addShoppingItem(item, category);
    setShopping(prev => [created, ...prev]);
    showToast('Auf Einkaufsliste gesetzt 🛒');
  };

  const handleToggleShopping = async (id: number, isBought: boolean) => {
    await api.toggleShoppingItem(id, isBought);
    setShopping(prev => prev.map(s => (s.id === id ? { ...s, is_bought: isBought } : s)));
  };

  const handleDeleteShopping = async (id: number) => {
    await api.deleteShoppingItem(id);
    setShopping(prev => prev.filter(s => s.id !== id));
  };

  // Bucket actions
  const handleAddBucket = async (title: string, category: string = 'Abenteuer') => {
    const created = await api.addBucketItem(title, category);
    setBucket(prev => [created, ...prev]);
    showToast('Neuer Wunsch hinzugefügt ✨');
  };

  const handleToggleBucket = async (id: number, isDone: boolean) => {
    await api.toggleBucketItem(id, isDone);
    setBucket(prev => prev.map(b => (b.id === id ? { ...b, is_done: isDone } : b)));
  };

  const handleDeleteBucket = async (id: number) => {
    await api.deleteBucketItem(id);
    setBucket(prev => prev.filter(b => b.id !== id));
  };

  // Notes actions
  const handleAddNote = async (content: string, author: string, color: string) => {
    const created = await api.addNote(content, author, color);
    setNotes(prev => [created, ...prev]);
    showToast('Zettelchen angepinnt 💌');
  };

  const handleDeleteNote = async (id: number) => {
    await api.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Quiz actions
  const handleSubmitQuizAnswer = async (
    questionId: string,
    questionText: string,
    partner: string,
    answer: string
  ) => {
    await api.submitQuizAnswer(questionId, questionText, partner, answer);
    setQuizData(prev => {
      let q = prev.find(item => item.question_id === questionId);
      if (!q) {
        q = { question_id: questionId, question_text: questionText, answers: {} };
        prev.push(q);
      }
      q.answers[partner] = { answer, submitted_at: 'Gerade eben' };
      return [...prev];
    });
    showToast('Antwort enthüllt! 🎉');
  };

  // Coupon actions
  const handleRedeemCoupon = async (id: number) => {
    await api.redeemCoupon(id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_redeemed: true, redeemed_at: 'Heute' } : c));
    showToast('Gutschein eingelöst! 🎉💕');
  };

  const handleAddCoupon = async (title: string, icon: string, toPartner: string) => {
    const currentName = role === 'Partner A' ? (profile.partner_a_name || 'Partner A') : (profile.partner_b_name || 'Partner B');
    const created = await api.addCoupon({ title, icon, from_partner: currentName, to_partner: toPartner });
    setCoupons(prev => [created, ...prev]);
    showToast('Gutschein verschenkt! 🎁');
  };

  const handleDeleteCoupon = async (id: number) => {
    await api.deleteCoupon(id);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // Most likely to actions
  const handleVoteMostLikely = async (questionId: string, partner: string, vote: string) => {
    await api.voteMostLikely(questionId, partner, vote);
    setMostLikelyVotes(prev => {
      const copy = { ...prev };
      if (!copy[questionId]) copy[questionId] = {};
      copy[questionId][partner] = { vote, created_at: 'Gerade eben' };
      return copy;
    });
    showToast(`Tipp für ${vote} abgegeben! 🗳️`);
  };

  // Date ideas actions
  const handleAddDateIdea = async (title: string, category: string) => {
    const created = await api.addDateIdea(title, category);
    setDateIdeas(prev => [created, ...prev]);
    showToast('Neue Idee zum Roulette hinzugefügt 🎡');
  };

  // Letters actions
  const handleOpenLetter = async (id: number) => {
    await api.openLetter(id);
    setLetters(prev => prev.map(l => l.id === id ? { ...l, is_opened: true } : l));
    showToast('Brief entsiegelt! 💌');
  };

  const handleAddLetter = async (title: string, content: string, author: string, unlockType: string, unlockCondition: string) => {
    const created = await api.addLetter({ title, content, author, unlock_type: unlockType, unlock_condition: unlockCondition });
    setLetters(prev => [created, ...prev]);
    showToast('Geheimer Liebesbrief versiegelt 🔒');
  };

  // Photo actions
  const handleAddPhoto = async (title: string, imageData: string, author: string) => {
    try {
      const created = await api.addPhoto({ title, image_data: imageData, author });
      setPhotos(prev => [created, ...prev.filter(p => p.id !== created.id)]);
      showToast('Foto auf Fotowand gepinnt! 📸💕');
    } catch (err: any) {
      showToast(`⚠️ Upload-Fehler: ${err.message || 'Konnte nicht gespeichert werden'}`);
    }
  };

  const handleLikePhoto = async (id: number) => {
    const newLikes = await api.likePhoto(id);
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes } : p));
  };

  const handleDeletePhoto = async (id: number) => {
    await api.deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    showToast('Foto entfernt');
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const unboughtCount = shopping.filter(s => !s.is_bought).length;

  return (
    <div className="min-h-[100dvh] w-full max-w-full lg:max-w-5xl xl:max-w-6xl mx-auto relative flex flex-col font-sans select-none overflow-x-hidden pb-20 px-2 sm:px-3 lg:px-6">
      {/* Background Subtle Blobs with pointer-events-none */}
      <div className="fixed top-[-50px] left-[-50px] w-56 h-56 bg-[var(--color-primary-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none" />
      <div className="fixed top-[200px] right-[-60px] w-56 h-56 bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none" />

      {/* Header */}
      <Header
        profile={profile}
        role={role}
        daysTogether={daysTogether}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleRole={handleToggleRole}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 px-3 z-10 overflow-y-auto w-full max-w-full">
        {activeTab === 'dashboard' && (
          <Dashboard
            role={role}
            profile={profile}
            daysTogether={daysTogether}
            moods={moods}
            countdown={countdown}
            events={events}
            meals={meals}
            photos={photos}
            onUpdateMood={handleUpdateMood}
            onSendHug={handleSendHug}
            onNavigateTab={setActiveTab}
            onAddPhoto={handleAddPhoto}
            onLikePhoto={handleLikePhoto}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            countdown={countdown}
            dateIdeas={dateIdeas}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateCountdown={handleUpdateCountdown}
            onAddDateIdea={handleAddDateIdea}
          />
        )}

        {activeTab === 'meals' && (
          <MealPlanner
            meals={meals}
            profile={profile}
            role={role}
            onSaveMeal={handleSaveMeal}
            onAddShoppingItem={handleAddShopping}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            quizData={quizData}
            role={role}
            profile={profile}
            mostLikelyVotes={mostLikelyVotes}
            onSubmitAnswer={handleSubmitQuizAnswer}
            onVoteMostLikely={handleVoteMostLikely}
          />
        )}

        {activeTab === 'lists' && (
          <ListsView
            shopping={shopping}
            bucket={bucket}
            notes={notes}
            coupons={coupons}
            letters={letters}
            photos={photos}
            profile={profile}
            role={role}
            onAddShopping={handleAddShopping}
            onToggleShopping={handleToggleShopping}
            onDeleteShopping={handleDeleteShopping}
            onAddBucket={handleAddBucket}
            onToggleBucket={handleToggleBucket}
            onDeleteBucket={handleDeleteBucket}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onRedeemCoupon={handleRedeemCoupon}
            onAddCoupon={handleAddCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onOpenLetter={handleOpenLetter}
            onAddLetter={handleAddLetter}
            onAddPhoto={handleAddPhoto}
            onLikePhoto={handleLikePhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}
      </main>

      {/* Onboarding Wizard Modal on First Open */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={profile}
          initialRole={role}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          profile={profile}
          role={role}
          onClose={() => setIsSettingsOpen(false)}
          onSetRole={handleSetRole}
          onUpdateProfileKey={handleUpdateProfileKey}
          onResetData={handleResetData}
          onRestartOnboarding={() => {
            setIsSettingsOpen(false);
            setShowOnboarding(true);
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        shoppingBadgeCount={unboughtCount}
      />
    </div>
  );
}
