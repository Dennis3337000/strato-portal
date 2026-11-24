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
  LiveLocation
} from './types';
import { api } from './api';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import MealPlanner from './components/MealPlanner';
import QuizView from './components/QuizView';
import ListsView from './components/ListsView';
import DistanceView from './components/DistanceView';
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
    partner_a_city: 'Berlin',
    partner_b_city: 'München',
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
  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(() => {
    return localStorage.getItem('cl_share_location') !== 'false';
  });

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
          locData
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
          api.getLiveLocations()
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
        if (locData) setLocations(locData);
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

  // Background Geolocation tracking & Partner location polling
  useEffect(() => {
    // 1. Periodic background polling for partner location every 8s
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await api.getLiveLocations();
        if (fresh) setLocations(fresh);
      } catch {}
    }, 8000);

    // 2. Background Geolocation tracking for active partner
    let watchId: number | null = null;
    let lastSent = 0;

    async function sendCurrentPosition(pos: GeolocationPosition) {
      const now = Date.now();
      // Throttle GPS updates to max once every 10 seconds to save battery
      if (now - lastSent < 10000) return;
      lastSent = now;

      const currentPartner = role || 'Partner A';
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = pos.coords.accuracy || 10;
      const speedKmH =
        pos.coords.speed !== null && pos.coords.speed !== undefined && pos.coords.speed >= 0
          ? Math.round(pos.coords.speed * 3.6)
          : 0;

      // Check battery
      let batteryLevel: number | undefined = undefined;
      let isCharging: boolean | undefined = undefined;
      try {
        if ('getBattery' in navigator) {
          const b: any = await (navigator as any).getBattery();
          batteryLevel = Math.round(b.level * 100);
          isCharging = b.charging;
        }
      } catch {}

      await api.updateLiveLocation({
        partner: currentPartner,
        latitude: lat,
        longitude: lon,
        accuracy,
        speed: speedKmH,
        heading: pos.coords.heading || 0,
        battery_level: batteryLevel,
        is_charging: isCharging
      });

      setLocations(prev => ({
        ...prev,
        [currentPartner]: {
          partner: currentPartner,
          latitude: lat,
          longitude: lon,
          accuracy,
          speed: speedKmH,
          heading: pos.coords.heading || 0,
          battery_level: batteryLevel,
          is_charging: isCharging,
          updated_at: 'Gerade eben'
        }
      }));
    }

    if (isSharingLocation && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        sendCurrentPosition,
        (err) => console.log('GPS watch warning:', err.message),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000
        }
      );
    }

    return () => {
      clearInterval(pollInterval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [role, isSharingLocation]);

  const handleToggleSharing = () => {
    setIsSharingLocation(prev => {
      const next = !prev;
      localStorage.setItem('cl_share_location', String(next));
      showToast(next ? 'Live-Standort teilen aktiviert 🟢' : 'Standort-Freigabe pausiert ⏸️');
      return next;
    });
  };

  const handleSendManualLocation = async (lat: number, lon: number, speed: number = 0) => {
    const targetPartner = role === 'Partner A' ? 'Partner B' : 'Partner A';
    await api.updateLiveLocation({
      partner: targetPartner,
      latitude: lat,
      longitude: lon,
      accuracy: 8,
      speed,
      battery_level: 78,
      is_charging: false
    });
    setLocations(prev => ({
      ...prev,
      [targetPartner]: {
        partner: targetPartner,
        latitude: lat,
        longitude: lon,
        accuracy: 8,
        speed,
        battery_level: 78,
        is_charging: false,
        updated_at: 'Gerade eben'
      }
    }));
    showToast(`Test-Standort von ${targetPartner} aktualisiert! (${speed} km/h 🚗)`);
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
    showToast('Neues Date eingetragen 📅');
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

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const unboughtCount = shopping.filter(s => !s.is_bought).length;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto relative flex flex-col font-sans select-none overflow-x-hidden pb-18">
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
            notes={notes}
            locations={locations}
            onUpdateMood={handleUpdateMood}
            onSendHug={handleSendHug}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            countdown={countdown}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateCountdown={handleUpdateCountdown}
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
            onSubmitAnswer={handleSubmitQuizAnswer}
          />
        )}

        {activeTab === 'lists' && (
          <ListsView
            shopping={shopping}
            bucket={bucket}
            notes={notes}
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
          />
        )}

        {(activeTab === 'map' || activeTab === 'distance') && (
          <DistanceView
            locations={locations}
            profile={profile}
            role={role}
            isSharingLocation={isSharingLocation}
            onToggleSharing={handleToggleSharing}
            onSendManualLocation={handleSendManualLocation}
            onUpdateCity={handleUpdateProfileKey}
            onSendHug={handleSendHug}
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
