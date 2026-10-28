export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  workplace_area?: string;
  work_type?: string;
  provider_id?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  provider_count?: number;
}

export interface ProviderProfile {
  id: number;
  user_id: number;
  provider_name: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  service_area: string;
  service_areas?: string[];
  base_location_name?: string;
  latitude: number;
  longitude: number;
  bio?: string | null;
  experience_years: number;
  bio_experience?: string;
  availability_schedule?: {
    days: string[];
    hours: string;
  };
  starting_price: number;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  subscription_status?: 'not_paid' | 'pending' | 'paid' | 'rejected';
  subscription_method?: 'bKash' | 'Nagad';
  subscription_transaction_id?: string;
  subscription_notes?: string;
  subscription_paid_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_due_month?: string;
  aggregate_rating: number;
  total_reviews: number;
  distance_km?: number | null;
  portfolio_images?: string[];
  available_days?: string[];
  available_slots?: string[];
}

export interface ProviderSubscriptionReview {
  provider_id: number;
  user_id: number;
  provider_name: string;
  provider_email: string;
  provider_phone?: string;
  category_name?: string;
  subscription_status: 'not_paid' | 'pending' | 'paid' | 'rejected';
  subscription_method?: 'bKash' | 'Nagad';
  subscription_transaction_id?: string;
  subscription_notes?: string;
  subscription_paid_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_due_month?: string;
  last_updated?: string;
}

export interface VerificationDocument {
  id: number;
  provider_id: number;
  document_type: string;
  document_url: string;
  document_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  submitted_at?: string;
  created_at: string;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  provider_avatar?: string;
  service_area?: string;
  category_name?: string;
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'cancelled';

export interface Booking {
  id: number;
  booking_reference: string;
  customer_id: number;
  provider_id: number;
  category_id: number;
  booking_date: string;
  time_slot: string;
  service_address: string;
  customer_phone: string;
  notes?: string;
  provider_starting_price: number;
  status: BookingStatus;
  cancelled_reason?: string;
  created_at: string;
  updated_at?: string;
  category_name?: string;
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_avatar?: string;
  customer_account_created_at?: string;
  provider_name?: string;
  provider_contact?: string;
  provider_avatar?: string;
  provider_service_area?: string;
  provider_is_verified?: boolean;
  user_rating?: number;
  user_review_comment?: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id: number;
  provider_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  customer_name?: string;
  customer_avatar?: string;
}

export interface AdminAnalytics {
  users_by_role: Array<{ role: string; count: string }>;
  verified_providers_count: number;
  pending_verifications_count: number;
  bookings_by_status: Array<{ status: string; count: string }>;
}

export interface AdminUser {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  email_verified: boolean;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  provider_category?: string | null;
  provider_service_area?: string | null;
  provider_service_areas?: string[] | null;
  provider_base_location?: string | null;
  provider_bio?: string | null;
  provider_experience_years?: number | null;
  provider_starting_price?: number | string | null;
  provider_is_verified?: boolean | null;
  provider_verification_status?: 'pending' | 'approved' | 'rejected' | null;
  provider_subscription_status?: 'not_paid' | 'pending' | 'paid' | 'rejected' | null;
  provider_subscription_method?: 'bKash' | 'Nagad' | null;
  provider_subscription_transaction_id?: string | null;
  provider_subscription_paid_at?: string | null;
  provider_subscription_expires_at?: string | null;
}
