export type UserRole = 'Partner A' | 'Partner B' | null;

export interface ProfileData {
  partner_a_name: string;
  partner_b_name: string;
  start_date: string;
  partner_a_birthday?: string;
  partner_b_birthday?: string;
  partner_a_city: string;
  partner_b_city: string;
  hugs_count: number;
  setup_completed?: boolean | string;
}

export interface LiveLocation {
  partner: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number; // km/h
  heading?: number;
  battery_level?: number;
  is_charging?: boolean;
  updated_at: string;
}

export interface MoodData {
  emoji: string;
  text: string;
  updated_at: string;
}

export interface EventItem {
  id: number;
  title: string;
  date: string;
  description?: string;
  category: 'Date' | 'Reise' | 'Jahrestag' | 'Feier' | 'Gemütlich';
}

export interface MealItem {
  id?: number;
  day: string; // 'Montag', 'Dienstag', ...
  meal_name: string;
  cook?: string; // 'Partner A', 'Partner B', 'Beide', 'Restaurant'
  notes?: string;
}

export interface ShoppingItem {
  id: number;
  item: string;
  is_bought: boolean;
  category: string;
}

export interface BucketItem {
  id: number;
  title: string;
  is_done: boolean;
  category: string;
}

export interface NoteItem {
  id: number;
  content: string;
  created_at: string;
  author: string;
  color: string;
}

export interface CountdownItem {
  id?: number;
  title: string;
  target_date: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: 'Romantik' | 'Erinnerungen' | 'Zukunft' | 'Lustig';
}

export interface QuizAnswer {
  answer: string;
  submitted_at: string;
}

export interface QuestionWithAnswers {
  question_id: string;
  question_text: string;
  answers: {
    [partner: string]: QuizAnswer;
  };
}
