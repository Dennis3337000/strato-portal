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
  LiveLocation
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

const DEFAULT_LOCATIONS: Record<string, LiveLocation> = {
  'Partner A': {
    partner: 'Partner A',
    latitude: 51.0504,
    longitude: 13.7373,
    accuracy: 8,
    speed: 0,
    heading: 0,
    battery_level: 84,
    is_charging: false,
    updated_at: 'Gerade eben'
  },
  'Partner B': {
    partner: 'Partner B',
    latitude: 48.1351,
    longitude: 11.5820,
    accuracy: 12,
    speed: 28,
    heading: 180,
    battery_level: 76,
    is_charging: true,
    updated_at: 'Vor 1 Min'
  }
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

  // Live Locations & GPS Tracking
  async getLiveLocations(): Promise<Record<string, LiveLocation>> {
    return await fetchWithFallback<Record<string, LiveLocation>>('location', undefined, 'locations', DEFAULT_LOCATIONS);
  },

  async updateLiveLocation(location: Omit<LiveLocation, 'updated_at'>): Promise<void> {
    const locs = getLocal<Record<string, LiveLocation>>('locations', DEFAULT_LOCATIONS);
    locs[location.partner] = {
      ...location,
      updated_at: 'Gerade eben'
    };
    setLocal('locations', locs);

    await fetchWithFallback('location', {
      method: 'POST',
      body: JSON.stringify(location)
    });
  }
};
