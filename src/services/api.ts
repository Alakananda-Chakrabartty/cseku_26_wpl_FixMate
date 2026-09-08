import {
  User,
  Category,
  ProviderProfile,
  Booking,
  TransactionLedger,
  DigitalReceipt,
  Review,
  AdminAnalytics,
  VerificationDocument,
} from '../types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('fixmate_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An unexpected error occurred.');
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<{ user: User; token?: string; redirectUrl?: string; message: string; requiresEmailVerification?: boolean }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string; redirectUrl: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCurrentUser: () => request<{ user: User; provider?: ProviderProfile }>('/auth/me'),

  updateProfilePhoto: (avatar_url: string) =>
    request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ avatar_url }),
    }),

  logout: () => request<{ message: string }>('/auth/logout'),

  // Categories
  getCategories: () => request<Category[]>('/categories'),

  // Providers Search & Profile
  searchProviders: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return request<ProviderProfile[]>(`/providers/search?${query.toString()}`);
  },

  getProviderDetails: (id: number, date?: string) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<{ provider: ProviderProfile; reviews: Review[]; bookedSlots: string[] }>(
      `/providers/${id}${q}`
    );
  },

  getProviderProfile: () =>
    request<{ provider: ProviderProfile; documents: VerificationDocument[] }>('/providers/profile'),

  updateProviderProfile: (body: any) =>
    request<{ message: string }>('/providers/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  uploadVerificationDocument: (body: { document_type: string; document_url: string; document_number?: string }) =>
    request<{ message: string; document: VerificationDocument }>('/providers/documents', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Bookings
  createBooking: (body: {
    provider_id: number;
    category_id: number;
    booking_date: string;
    time_slot: string;
    service_address: string;
    customer_phone: string;
    notes?: string;
  }) =>
    request<{ message: string; booking: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getBookings: () => request<Booking[]>('/bookings'),

  updateBookingStatus: (id: number, status: string, cancelled_reason?: string) =>
    request<{ message: string; booking: Booking }>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancelled_reason }),
    }),

  getReceipt: (id: number) => request<DigitalReceipt>(`/bookings/${id}/receipt`),

  // Payments
  checkoutPayment: (body: {
    booking_id: number;
    payment_method: 'SSLCommerz' | 'bKash' | 'Nagad';
    account_number?: string;
    notes?: string;
  }) =>
    request<{
      message: string;
      receipt: DigitalReceipt;
      ledger: TransactionLedger;
    }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Ledger
  getProviderLedger: () =>
    request<{
      summary: {
        total_gross: number;
        total_commission_deducted: number;
        total_net_earnings: number;
        available_payout: number;
      };
      ledgers: TransactionLedger[];
    }>('/ledger/provider'),

  // Reviews
  submitReview: (body: { booking_id: number; rating: number; comment?: string }) =>
    request<{ message: string; review: Review; provider_aggregate_rating: number }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Admin
  getAdminAnalytics: () => request<AdminAnalytics>('/admin/analytics'),

  getAdminVerifications: () => request<VerificationDocument[]>('/admin/verifications'),

  updateVerificationStatus: (id: number, status: 'approved' | 'rejected', admin_notes?: string) =>
    request<{ message: string; document: VerificationDocument }>(`/admin/verifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes }),
    }),

  getAdminSettings: () => request<Array<{ key: string; value: string; description: string }>>('/admin/settings'),

  updateAdminSettings: (body: { global_commission_percentage: number }) =>
    request<{ message: string; global_commission_percentage: number }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getAdminTransactions: () => request<TransactionLedger[]>('/admin/transactions'),
};
