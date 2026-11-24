import type {
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

// Relative path so it works seamlessly under /couple/ or /
const BASE_URL = 'api';

// Seed data for offline / standalone mode
const DEFAULT_PROFILE: ProfileData = {
  partner_a_name: '',
  partner_b_name: '',
  start_date: '',
  partner_a_birthday: '',
  partner_b_birthday: '',
  partner_a_city: 'Dresden',
  partner_b_city: 'München',
  hugs_count: 0,
  setup_completed: false
};

const DEFAULT_MOODS: Record<string, MoodData> = {
  'Partner A': { emoji: '🥰', text: 'Freue mich auf dich!', updated_at: 'Heute 10:30' },
  'Partner B': { emoji: '😴', text: 'Brauche noch einen Kaffee', updated_at: 'Heute 09:15' }
};

const DEFAULT_EVENTS: EventItem[] = [
  { id: 1, title: 'Jahrestag Candlelight Dinner', date: '2026-05-12', description: 'Tisch im Lieblingsitaliener reserviert 🍷', category: 'Jahrestag' },
  { id: 2, title: 'Wochenende in den Bergen', date: '2026-06-20', description: 'Hütte gebucht & Wanderschuhe einpacken 🏔️', category: 'Reise' },
  { id: 3, title: 'Kino & Popcorn Abend', date: '2026-04-18', description: 'Neuen Film schauen und kuscheln 🎬', category: 'Date' }
];

const DEFAULT_MEALS: MealItem[] = [
  { day: 'Montag', meal_name: 'Pasta al Limone 🍋', cook: 'Partner A', notes: 'Frischen Parmesan & Basilikum' },
  { day: 'Dienstag', meal_name: 'Tacos mit Guacamole 🌮', cook: 'Beide', notes: 'Mit Limetten' },
  { day: 'Mittwoch', meal_name: 'Gemüse-Curry mit Reis 🍛', cook: 'Partner B', notes: 'Nicht zu scharf' },
  { day: 'Donnerstag', meal_name: 'Selbstgemachte Pizza 🍕', cook: 'Beide', notes: 'Pizzateig schon morgens ansetzen' },
  { day: 'Freitag', meal_name: 'Sushi Night 🍣', cook: 'Restaurant', notes: 'Beim Lieblingsjapaner bestellen' },
  { day: 'Samstag', meal_name: 'Großes Pancake Frühstück 🥞', cook: 'Partner A', notes: 'Mit Blaubeeren und Ahornsirup' },
  { day: 'Sonntag', meal_name: 'Lasagne al Forno 🧀', cook: 'Beide', notes: 'Zusammen gemütlich kochen' }
];

const DEFAULT_SHOPPING: ShoppingItem[] = [
  { id: 1, item: 'Frische Erdbeeren 🍓', is_bought: false, category: 'Obst' },
  { id: 2, item: 'Hafermilch Barista ☕', is_bought: true, category: 'Getränke' },
  { id: 3, item: 'Lieblingsschokolade 🍫', is_bought: false, category: 'Snacks' },
  { id: 4, item: 'Duftkerze Vanille 🕯️', is_bought: false, category: 'Zuhause' }
];

const DEFAULT_BUCKET: BucketItem[] = [
  { id: 1, title: 'Polarlichter in Norwegen sehen 🌌', is_done: false, category: 'Reisen' },
  { id: 2, title: 'Picknick bei Sonnenuntergang am See 🧺', is_done: true, category: 'Romantik' },
  { id: 3, title: 'Heißluftballonfahrt zu zweit 🎈', is_done: false, category: 'Abenteuer' },
  { id: 4, title: 'Zusammen einen Kochkurs machen 🍝', is_done: false, category: 'Erlebnisse' }
];

const DEFAULT_NOTES: NoteItem[] = [
  { id: 1, content: 'Ich liebe dein Lächeln am Morgen! Vergiss deinen Schirm heute nicht ❤️', created_at: 'Heute 08:00', author: 'Partner A', color: '#fef3c7' },
  { id: 2, content: 'Danke für die süße Nachricht. Ich zähle schon die Stunden bis zum Wochenende! 🥰', created_at: 'Gestern 18:30', author: 'Partner B', color: '#fce7f3' }
];

const DEFAULT_COUNTDOWN: CountdownItem = {
  id: 1,
  title: 'Unser nächstes Wiedersehen 💕',
  target_date: '2026-05-12'
};

const DEFAULT_QUIZ: QuestionWithAnswers[] = [
  {
    question_id: 'q1',
    question_text: 'Was war dein allererster Eindruck von mir?',
    answers: {
      'Partner B': { answer: 'Du hattest diese warmen, funkelnden Augen und warst sofort sympathisch!', submitted_at: 'Gestern' }
    }
  }
];

// Helper for LocalStorage cache
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(`cl_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`cl_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// Request helper with timeout and automatic fallback
async function fetchWithFallback<T>(endpoint: string, options?: RequestInit, fallbackKey?: string, defaultVal?: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (fallbackKey) {
        setLocal(fallbackKey, data);
      }
      return data;
    }
  } catch {
    // Network error or offline
  }

  // Fallback to localStorage or default
  if (fallbackKey && defaultVal !== undefined) {
    return getLocal(fallbackKey, defaultVal);
  }
  return defaultVal as T;
}

export const api = {
  // Profile
  async getProfile(): Promise<ProfileData> {
    const raw = await fetchWithFallback<Record<string, string>>('profile', undefined, 'profile_raw', {});
    const cached = getLocal<ProfileData>('profile', DEFAULT_PROFILE);
    if (Object.keys(raw).length > 0) {
      const merged: ProfileData = {
        partner_a_name: raw.partner_a_name || cached.partner_a_name || '',
        partner_b_name: raw.partner_b_name || cached.partner_b_name || '',
        start_date: raw.start_date || cached.start_date || '',
        partner_a_birthday: raw.partner_a_birthday || cached.partner_a_birthday || '',
        partner_b_birthday: raw.partner_b_birthday || cached.partner_b_birthday || '',
        partner_a_city: raw.partner_a_city || cached.partner_a_city || 'Berlin',
        partner_b_city: raw.partner_b_city || cached.partner_b_city || 'München',
        hugs_count: parseInt(raw.hugs_count || String(cached.hugs_count), 10) || 0,
        setup_completed: raw.setup_completed !== undefined ? (raw.setup_completed === 'true' || (raw.setup_completed as any) === true) : cached.setup_completed
      };
      setLocal('profile', merged);
      return merged;
    }
    return cached;
  },

  async updateProfileKey(key: string, value: string): Promise<void> {
    const cached = getLocal<ProfileData>('profile', DEFAULT_PROFILE);
    (cached as any)[key] = key === 'hugs_count' ? parseInt(value, 10) : value;
    setLocal('profile', cached);

    await fetchWithFallback('profile', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    });
  },

  async saveFullProfile(newProfile: Partial<ProfileData>): Promise<void> {
    const cached = getLocal<ProfileData>('profile', DEFAULT_PROFILE);
    const updated = { ...cached, ...newProfile };
    setLocal('profile', updated);

    for (const [key, value] of Object.entries(newProfile)) {
      if (value !== undefined) {
        await fetchWithFallback('profile', {
          method: 'POST',
          body: JSON.stringify({ key, value: String(value) })
        });
      }
    }
  },

  async sendHug(): Promise<number> {
    const cached = getLocal<ProfileData>('profile', DEFAULT_PROFILE);
    cached.hugs_count = (cached.hugs_count || 0) + 1;
    setLocal('profile', cached);

    try {
      const res = await fetch(`${BASE_URL}/hugs`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        cached.hugs_count = data.hugs_count;
        setLocal('profile', cached);
        return data.hugs_count;
      }
    } catch {}
    return cached.hugs_count;
  },

  // Mood
  async getMoods(): Promise<Record<string, MoodData>> {
    const data = await fetchWithFallback<Record<string, MoodData>>('mood', undefined, 'moods', DEFAULT_MOODS);
    return data;
  },

  async updateMood(partner: string, emoji: string, text: string): Promise<void> {
    const moods = getLocal<Record<string, MoodData>>('moods', DEFAULT_MOODS);
    moods[partner] = { emoji, text, updated_at: 'Gerade eben' };
    setLocal('moods', moods);

    await fetchWithFallback('mood', {
      method: 'POST',
      body: JSON.stringify({ partner, emoji, text })
    });
  },

  // Events / Kalender
  async getEvents(): Promise<EventItem[]> {
    return await fetchWithFallback<EventItem[]>('events', undefined, 'events', DEFAULT_EVENTS);
  },

  async addEvent(event: Omit<EventItem, 'id'>): Promise<EventItem> {
    const events = getLocal<EventItem[]>('events', DEFAULT_EVENTS);
    const newId = Date.now();
    const newEvent: EventItem = { ...event, id: newId };
    setLocal('events', [newEvent, ...events]);

    try {
      const res = await fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (res.ok) {
        const serverEvent = await res.json();
        const updated = events.filter(e => e.id !== newId);
        setLocal('events', [serverEvent, ...updated]);
        return serverEvent;
      }
    } catch {}
    return newEvent;
  },

  async deleteEvent(id: number): Promise<void> {
    const events = getLocal<EventItem[]>('events', DEFAULT_EVENTS);
    setLocal('events', events.filter(e => e.id !== id));
    await fetchWithFallback(`events/${id}`, { method: 'DELETE' });
  },

  // Meals / Essensplan
  async getMeals(): Promise<MealItem[]> {
    return await fetchWithFallback<MealItem[]>('meals', undefined, 'meals', DEFAULT_MEALS);
  },

  async saveMeal(meal: MealItem): Promise<void> {
    const meals = getLocal<MealItem[]>('meals', DEFAULT_MEALS);
    const existingIndex = meals.findIndex(m => m.day === meal.day);
    if (existingIndex >= 0) {
      meals[existingIndex] = meal;
    } else {
      meals.push(meal);
    }
    setLocal('meals', meals);

    await fetchWithFallback('meals', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
  },

  // Shopping List
  async getShopping(): Promise<ShoppingItem[]> {
    return await fetchWithFallback<ShoppingItem[]>('shopping', undefined, 'shopping', DEFAULT_SHOPPING);
  },

  async addShoppingItem(item: string, category: string = 'Allgemein'): Promise<ShoppingItem> {
    const list = getLocal<ShoppingItem[]>('shopping', DEFAULT_SHOPPING);
    const newItem: ShoppingItem = { id: Date.now(), item, is_bought: false, category };
    setLocal('shopping', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, category, is_bought: false })
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('shopping', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  async toggleShoppingItem(id: number, is_bought: boolean): Promise<void> {
    const list = getLocal<ShoppingItem[]>('shopping', DEFAULT_SHOPPING);
    const updated = list.map(item => item.id === id ? { ...item, is_bought } : item);
    setLocal('shopping', updated);
    await fetchWithFallback(`shopping/${id}?is_bought=${is_bought}`, { method: 'PUT' });
  },

  async deleteShoppingItem(id: number): Promise<void> {
    const list = getLocal<ShoppingItem[]>('shopping', DEFAULT_SHOPPING);
    setLocal('shopping', list.filter(item => item.id !== id));
    await fetchWithFallback(`shopping/${id}`, { method: 'DELETE' });
  },

  // Bucket List
  async getBucket(): Promise<BucketItem[]> {
    return await fetchWithFallback<BucketItem[]>('bucket', undefined, 'bucket', DEFAULT_BUCKET);
  },

  async addBucketItem(title: string, category: string = 'Abenteuer'): Promise<BucketItem> {
    const list = getLocal<BucketItem[]>('bucket', DEFAULT_BUCKET);
    const newItem: BucketItem = { id: Date.now(), title, is_done: false, category };
    setLocal('bucket', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/bucket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, is_done: false })
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('bucket', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  async toggleBucketItem(id: number, is_done: boolean): Promise<void> {
    const list = getLocal<BucketItem[]>('bucket', DEFAULT_BUCKET);
    const updated = list.map(item => item.id === id ? { ...item, is_done } : item);
    setLocal('bucket', updated);
    await fetchWithFallback(`bucket/${id}?is_done=${is_done}`, { method: 'PUT' });
  },

  async deleteBucketItem(id: number): Promise<void> {
    const list = getLocal<BucketItem[]>('bucket', DEFAULT_BUCKET);
    setLocal('bucket', list.filter(item => item.id !== id));
    await fetchWithFallback(`bucket/${id}`, { method: 'DELETE' });
  },

  // Notes
  async getNotes(): Promise<NoteItem[]> {
    return await fetchWithFallback<NoteItem[]>('notes', undefined, 'notes', DEFAULT_NOTES);
  },

  async addNote(content: string, author: string, color: string = '#fef3c7'): Promise<NoteItem> {
    const list = getLocal<NoteItem[]>('notes', DEFAULT_NOTES);
    const newNote: NoteItem = {
      id: Date.now(),
      content,
      author,
      color,
      created_at: 'Gerade eben'
    };
    setLocal('notes', [newNote, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author, color })
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('notes', [created, ...list]);
        return created;
      }
    } catch {}
    return newNote;
  },

  async deleteNote(id: number): Promise<void> {
    const list = getLocal<NoteItem[]>('notes', DEFAULT_NOTES);
    setLocal('notes', list.filter(n => n.id !== id));
    await fetchWithFallback(`notes/${id}`, { method: 'DELETE' });
  },

  // Countdown
  async getCountdown(): Promise<CountdownItem> {
    return await fetchWithFallback<CountdownItem>('countdown', undefined, 'countdown', DEFAULT_COUNTDOWN);
  },

  async setCountdown(title: string, target_date: string): Promise<void> {
    setLocal('countdown', { title, target_date });
    await fetchWithFallback('countdown', {
      method: 'POST',
      body: JSON.stringify({ title, target_date })
    });
  },

  // Quiz
  async getQuiz(): Promise<QuestionWithAnswers[]> {
    return await fetchWithFallback<QuestionWithAnswers[]>('quiz', undefined, 'quiz', DEFAULT_QUIZ);
  },

  async submitQuizAnswer(question_id: string, question_text: string, partner: string, answer: string): Promise<void> {
    const quizList = getLocal<QuestionWithAnswers[]>('quiz', DEFAULT_QUIZ);
    let q = quizList.find(item => item.question_id === question_id);
    if (!q) {
      q = { question_id, question_text, answers: {} };
      quizList.push(q);
    }
    q.answers[partner] = { answer, submitted_at: 'Gerade eben' };
    setLocal('quiz', quizList);

    await fetchWithFallback('quiz/answer', {
      method: 'POST',
      body: JSON.stringify({ question_id, question_text, partner, answer })
    });
  },

  // Coupons (Gutscheinheft)
  async getCoupons(): Promise<CouponItem[]> {
    return await fetchWithFallback<CouponItem[]>('coupons', undefined, 'coupons', [
      { id: 1, title: '1x Frühstück ans Bett ☕🥐', icon: '🥐', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 2, title: '1x 20-Minuten-Rückenmassage 💆', icon: '💆', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 3, title: '1x Ich koche heute dein Lieblingsessen 🍝', icon: '🍝', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 4, title: '1x Du bestimmst den Film heute Abend 🎬', icon: '🎬', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 5, title: '1x Streit-Joker & Sofort-Versöhnung 😇', icon: '😇', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 6, title: '1x Gemütlicher Fußmassage-Abend 🦶', icon: '🦶', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 7, title: '1x Spontaner Eisbecher geht auf mich 🍦', icon: '🍦', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 8, title: '1x Ein ganzer Tag lang Chef sein 👑', icon: '👑', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 9, title: '1x Ausschlafen ohne Wecker 🛌', icon: '🛌', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 10, title: '1x Ich bringe dir Kaffee/Tee an den Schreibtisch ☕', icon: '☕', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 11, title: '1x Chauffeur-Dienst: Ich fahre heute überall hin 🚗', icon: '🚗', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 12, title: '1x Riesen-Popcorn im Kino geht auf meinen Nacken 🍿', icon: '🍿', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 13, title: '1x Ich übernehme das Aufräumen & Putzen 🧹', icon: '🧹', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 14, title: '1x Mülldienst-Befreiung für eine ganze Woche 🗑️', icon: '🗑️', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 15, title: '1x Ich räume heute die Spülmaschine aus 🍽️', icon: '🍽️', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 16, title: '1x Beruhigende Kopfmassage zum Einschlafen 💆‍♀️', icon: '💆‍♀️', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 17, title: '1x Pizza-Bestellung nach Wahl geht auf mich 🍕', icon: '🍕', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 18, title: '1x Ich erledige den Wocheneinkauf ganz alleine 🛒', icon: '🛒', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 19, title: '1x Deine Lieblingsschokolade als Überraschung 🍫', icon: '🍫', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 20, title: '1x 100 Küsse am Stück 💋', icon: '💋', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 21, title: '1x Fauler Nachmittag auf der Couch ohne schlechtes Gewissen 🛋️', icon: '🛋️', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 22, title: '1x Wir spielen ein Spiel deiner Wahl 🎲', icon: '🎲', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 23, title: '1x Ich mixe dir deinen Lieblingsdrink 🍷', icon: '🍷', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 24, title: '1x Begleitung zum Shoppen mit ehrlicher Beratung 👗', icon: '👗', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false },
      { id: 25, title: '1x Sonntagsbrunch geht auf meine Rechnung 🥐', icon: '🥐', from_partner: 'Partner A', to_partner: 'Partner B', is_redeemed: false }
    ]);
  },

  async addCoupon(coupon: Omit<CouponItem, 'id' | 'is_redeemed'>): Promise<CouponItem> {
    const list = getLocal<CouponItem[]>('coupons', []);
    const newItem: CouponItem = { id: Date.now(), ...coupon, is_redeemed: false };
    setLocal('coupons', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon)
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('coupons', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  async redeemCoupon(id: number): Promise<void> {
    const list = getLocal<CouponItem[]>('coupons', []);
    const now = 'Gerade eben';
    const updated = list.map(c => c.id === id ? { ...c, is_redeemed: true, redeemed_at: now } : c);
    setLocal('coupons', updated);
    await fetchWithFallback(`coupons/${id}/redeem`, { method: 'PUT' });
  },

  async deleteCoupon(id: number): Promise<void> {
    const list = getLocal<CouponItem[]>('coupons', []);
    setLocal('coupons', list.filter(c => c.id !== id));
    await fetchWithFallback(`coupons/${id}`, { method: 'DELETE' });
  },

  // Most Likely To Game (Wer eher...?)
  async getMostLikelyVotes(): Promise<Record<string, Record<string, { vote: string; created_at: string }>>> {
    return await fetchWithFallback('most-likely', undefined, 'most_likely', {});
  },

  async voteMostLikely(question_id: string, partner: string, vote: string): Promise<void> {
    const votes = getLocal<Record<string, Record<string, { vote: string; created_at: string }>>>('most_likely', {});
    if (!votes[question_id]) votes[question_id] = {};
    votes[question_id][partner] = { vote, created_at: 'Gerade eben' };
    setLocal('most_likely', votes);

    await fetchWithFallback('most-likely/vote', {
      method: 'POST',
      body: JSON.stringify({ question_id, partner, vote })
    });
  },

  // Date Ideas (Roulette)
  async getDateIdeas(): Promise<DateIdeaItem[]> {
    return await fetchWithFallback<DateIdeaItem[]>('date-ideas', undefined, 'date_ideas', [
      { id: 1, title: 'Deckenburg im Wohnzimmer bauen & Film schauen 🏰', category: 'Zuhause', is_custom: false },
      { id: 2, title: 'Selbstgemachte Steinofen-Pizza belegen 🍕', category: 'Zuhause', is_custom: false },
      { id: 3, title: 'Romantischer Candlelight-Wellnessabend mit Masken 🧖', category: 'Zuhause', is_custom: false },
      { id: 4, title: 'Cocktails oder Wein auf dem Balkon mixen 🍷', category: 'Zuhause', is_custom: false },
      { id: 5, title: 'Gegenseitig ein 3-Gänge-Menü kochen 🍳', category: 'Zuhause', is_custom: false },
      { id: 6, title: 'Nachtspaziergang mit Eis in der Hand 🍦', category: 'Draußen', is_custom: false },
      { id: 7, title: 'Kinoabend mit Riesen-Popcorn 🍿', category: 'Draußen', is_custom: false },
      { id: 8, title: 'Gemeinsames Bowling- oder Minigolf-Duell 🎳', category: 'Draußen', is_custom: false },
      { id: 9, title: 'Spontanes Sonnenuntergangs-Picknick 🧺', category: 'Draußen', is_custom: false },
      { id: 10, title: 'Besuch in einem neuen Restaurant / Street Food 🍜', category: 'Draußen', is_custom: false },
      { id: 11, title: 'Spontaner Ausflug zum nächsten See / Aussichtspunkt 🚗', category: 'Abenteuer', is_custom: false },
      { id: 12, title: 'Sonntags-Schlemmerbrunch in einem gemütlichen Café 🥐', category: 'Draußen', is_custom: false },
      { id: 13, title: 'Gemeinsamer Spieleabend (Brettspiele oder Konsole) 🎲', category: 'Zuhause', is_custom: false },
      { id: 14, title: 'Sternschnuppen schauen mit Decke im Park 🌠', category: 'Draußen', is_custom: false },
      { id: 15, title: 'Frische Waffeln oder Crêpes backen mit vielen Toppings 🧇', category: 'Zuhause', is_custom: false },
      { id: 16, title: 'Escape Room Abenteuer zu zweit 🕵️', category: 'Abenteuer', is_custom: false },
      { id: 17, title: 'Thermalbad- oder Sauna-Tag 🧖', category: 'Draußen', is_custom: false },
      { id: 18, title: 'Tretboot oder Kanu fahren auf dem See 🛶', category: 'Abenteuer', is_custom: false },
      { id: 19, title: 'Flohmarkt oder Vintage-Laden erkunden 🛍️', category: 'Draußen', is_custom: false },
      { id: 20, title: 'Burger-Contest: Wer baut den geileren Gourmet-Burger? 🍔', category: 'Zuhause', is_custom: false },
      { id: 21, title: 'Einwegkamera-Spaziergang: Fotos machen und entwickeln 📷', category: 'Draußen', is_custom: false },
      { id: 22, title: 'Sushi-Platte zu Hause selbst rollen 🍣', category: 'Zuhause', is_custom: false },
      { id: 23, title: 'Karaoke-Abend im Wohnzimmer zu Lieblingsliedern 🎤', category: 'Zuhause', is_custom: false },
      { id: 24, title: 'Tierpark- oder Zoo-Besuch 🦁', category: 'Draußen', is_custom: false },
      { id: 25, title: 'Museums- oder Kunstausstellungs-Date 🏛️', category: 'Draußen', is_custom: false },
      { id: 26, title: 'Sonnenaufgang anschauen mit heißem Kakao 🌅', category: 'Abenteuer', is_custom: false },
      { id: 27, title: 'Lagerfeuer oder Grillen im Garten / Park 🔥', category: 'Draußen', is_custom: false },
      { id: 28, title: 'Fondue- oder Raclette-Schlemmerabend 🧀', category: 'Zuhause', is_custom: false },
      { id: 29, title: 'Kletterwald oder Bouldern ausprobieren 🧗', category: 'Abenteuer', is_custom: false },
      { id: 30, title: 'Zusammen ein 1000-Teile-Puzzle anfangen 🧩', category: 'Zuhause', is_custom: false },
      { id: 31, title: 'Tacos & Margarita Night 🌮', category: 'Zuhause', is_custom: false },
      { id: 32, title: 'Fahrradtour mit Zwischenstopp im Biergarten 🚲', category: 'Draußen', is_custom: false },
      { id: 33, title: 'Frisches Popcorn & Serienmarathon unter der Bettdecke 📺', category: 'Zuhause', is_custom: false },
      { id: 34, title: 'Planetarium-Besuch unter dem Sternenhimmel 🌌', category: 'Draußen', is_custom: false },
      { id: 35, title: 'Lasertag oder Trampolinpark Action 🎯', category: 'Abenteuer', is_custom: false },
      { id: 36, title: 'Spontaner Nacht-Drive-In zum Burger King / McDonald\'s 🍟', category: 'Abenteuer', is_custom: false },
      { id: 37, title: 'Gegenseitige Ganzkörpermassage mit Massage-Öl 🕯️', category: 'Zuhause', is_custom: false },
      { id: 38, title: 'Zusammen neue Tanzschritte oder Kochen lernen 💃', category: 'Zuhause', is_custom: false },
      { id: 39, title: 'Spaziergang durch den Botanischen Garten 🌺', category: 'Draußen', is_custom: false },
      { id: 40, title: 'Zusammen alte Kinderfotos und Erinnerungen anschauen 📸', category: 'Zuhause', is_custom: false }
    ]);
  },

  async addDateIdea(title: string, category: string): Promise<DateIdeaItem> {
    const list = getLocal<DateIdeaItem[]>('date_ideas', []);
    const newItem: DateIdeaItem = { id: Date.now(), title, category, is_custom: true };
    setLocal('date_ideas', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/date-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category })
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('date_ideas', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  // Letters (Zeitschloss-Liebesbriefe)
  async getLetters(): Promise<LetterItem[]> {
    return await fetchWithFallback<LetterItem[]>('letters', undefined, 'letters', [
      {
        id: 1,
        title: 'Für einen stressigen Tag ❤️',
        content: 'Atme kurz tief durch, mein Schatz. Du machst das großartig und ich bin immer stolz auf dich. Heute Abend koche ich für dich!',
        author: 'Partner A',
        unlock_type: 'mood',
        unlock_condition: 'stress',
        is_opened: false,
        created_at: 'Gestern'
      }
    ]);
  },

  async addLetter(letter: Omit<LetterItem, 'id' | 'is_opened' | 'created_at'>): Promise<LetterItem> {
    const list = getLocal<LetterItem[]>('letters', []);
    const newItem: LetterItem = { id: Date.now(), ...letter, is_opened: false, created_at: 'Heute' };
    setLocal('letters', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letter)
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('letters', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  async openLetter(id: number): Promise<void> {
    const list = getLocal<LetterItem[]>('letters', []);
    const updated = list.map(l => l.id === id ? { ...l, is_opened: true } : l);
    setLocal('letters', updated);
    await fetchWithFallback(`letters/${id}/open`, { method: 'PUT' });
  },

  // Photos (Fotowand & Momente)
  async getPhotos(): Promise<PhotoItem[]> {
    return await fetchWithFallback<PhotoItem[]>('photos', undefined, 'photos', [
      {
        id: 1,
        title: 'Kuscheliger Sonntag ☕❤️',
        image_data: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
        author: 'Partner A',
        likes: 12,
        created_at: 'Gestern'
      },
      {
        id: 2,
        title: 'Spaziergang zu zweit 🍁',
        image_data: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
        author: 'Partner B',
        likes: 8,
        created_at: 'Letzte Woche'
      }
    ]);
  },

  async addPhoto(photo: Omit<PhotoItem, 'id' | 'likes' | 'created_at'>): Promise<PhotoItem> {
    const list = getLocal<PhotoItem[]>('photos', []);
    const now = 'Heute';
    const newItem: PhotoItem = { id: Date.now(), ...photo, likes: 0, created_at: now };
    setLocal('photos', [newItem, ...list]);

    try {
      const res = await fetch(`${BASE_URL}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo)
      });
      if (res.ok) {
        const created = await res.json();
        setLocal('photos', [created, ...list]);
        return created;
      }
    } catch {}
    return newItem;
  },

  async likePhoto(id: number): Promise<number> {
    const list = getLocal<PhotoItem[]>('photos', []);
    let newLikes = 1;
    const updated = list.map(p => {
      if (p.id === id) {
        newLikes = (p.likes || 0) + 1;
        return { ...p, likes: newLikes };
      }
      return p;
    });
    setLocal('photos', updated);

    try {
      const res = await fetch(`${BASE_URL}/photos/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.likes;
      }
    } catch {}
    return newLikes;
  },

  async deletePhoto(id: number): Promise<void> {
    const list = getLocal<PhotoItem[]>('photos', []);
    setLocal('photos', list.filter(p => p.id !== id));
    await fetchWithFallback(`photos/${id}`, { method: 'DELETE' });
  }
};
