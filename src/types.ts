export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
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
  latitude: number;
  longitude: number;
  bio: string;
  experience_years: number;
  starting_price: number;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  aggregate_rating: number;
  total_reviews: number;
  distance_km?: number;
  portfolio_images?: string[];
  available_days?: string[];
  available_slots?: string[];
}

export interface VerificationDocument {
  id: number;
  provider_id: number;
  document_type: string;
  document_url: string;
  document_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
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
  | 'paid_confirmed'
  | 'in_progress'
  | 'completed'
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
  agreed_price: number;
  status: BookingStatus;
  cancelled_reason?: string;
  created_at: string;
  updated_at?: string;
  category_name?: string;
  customer_name?: string;
  customer_contact?: string;
  customer_avatar?: string;
  provider_name?: string;
  provider_contact?: string;
  provider_avatar?: string;
  provider_service_area?: string;
  provider_is_verified?: boolean;
  transaction_id?: string;
  payment_method?: string;
  payment_status?: string;
  paid_at?: string;
  user_rating?: number;
  user_review_comment?: string;
}

export interface TransactionLedger {
  id: number;
  booking_id: number;
  payment_id: number;
  provider_id: number;
  gross_amount: number;
  commission_percentage: number;
  platform_commission: number;
  net_provider_payout: number;
  payout_status: 'held' | 'eligible' | 'paid_out';
  created_at: string;
  booking_reference?: string;
  booking_date?: string;
  booking_status?: string;
  category_name?: string;
  payment_method?: string;
  transaction_id?: string;
  customer_name?: string;
  provider_name?: string;
  provider_service_area?: string;
}

export interface DigitalReceipt {
  receipt_id: string;
  booking_reference: string;
  booking_date: string;
  time_slot: string;
  service_address: string;
  booking_status: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  provider_name: string;
  provider_area: string;
  transaction_id: string;
  payment_method: string;
  paid_at: string;
  gross_amount: number;
  commission_percentage: number;
  platform_commission: number;
  net_provider_payout: number;
  payout_status: string;
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
  finance: {
    total_gmv: number;
    total_commission: number;
    total_provider_payouts: number;
  };
  current_commission_percentage: number;
}
