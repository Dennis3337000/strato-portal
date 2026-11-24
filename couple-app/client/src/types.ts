export type UserRole = 'Partner A' | 'Partner B' | null;

export interface ProfileData {
  partner_a_name: string;
  partner_b_name: string;
  start_date: string;
  partner_a_birthday?: string;
  partner_b_birthday?: string;
  partner_a_city?: string;
  partner_b_city?: string;
  hugs_count: number;
  setup_completed?: boolean | string;
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
  cook?: string;
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

export interface CouponItem {
  id: number;
  title: string;
  icon: string;
  from_partner: string;
  to_partner: string;
  is_redeemed: boolean;
  redeemed_at?: string;
}

export interface MostLikelyVote {
  vote: string;
  created_at: string;
}

export interface DateIdeaItem {
  id: number;
  title: string;
  category: string;
  is_custom: boolean;
}

export interface LetterItem {
  id: number;
  title: string;
  content: string;
  author: string;
  unlock_type: string;
  unlock_condition: string;
  is_opened: boolean;
  created_at: string;
}

export interface PhotoItem {
  id: number;
  title: string;
  image_data: string;
  author: string;
  likes: number;
  created_at: string;
}
