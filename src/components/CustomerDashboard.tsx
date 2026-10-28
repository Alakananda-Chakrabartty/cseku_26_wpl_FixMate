import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Booking } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ReviewModal } from './ReviewModal.tsx';

interface CustomerDashboardProps {
  onExploreMore: () => void;
  onViewProvider: (providerId: number) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onExploreMore, onViewProvider }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'cancelled'>('all');

  // Modal states
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const list = await api.getBookings();
      setBookings(list);
    } catch (err) {
      console.error('Failed to load customer bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (id: number) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (!reason) return;

    try {
      await api.updateBookingStatus(id, 'cancelled', reason);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'active') {
      return ['requested', 'accepted', 'in_progress'].includes(b.status);
    }
    if (filterTab === 'cancelled') {
      return b.status === 'cancelled' || b.status === 'declined';
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ⏳ Waiting Provider Acceptance
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ✓ Booking Accepted
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            ⚡ Service in Progress
          </span>
        );
      case 'declined':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Declined by Provider
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Top Welcome Bar */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:mb-8 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Customer Service Portal</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active Session
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.full_name}</strong> ({user?.email})
          </p>
        </div>

        <button
          onClick={onExploreMore}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explore More Services</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-5 flex items-center justify-between gap-2 border-b border-slate-200 pb-3 sm:mb-6">
        <div className="flex min-w-0 gap-2 overflow-x-auto">
          {(['all', 'active', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold capitalize transition cursor-pointer sm:px-3.5 ${
                filterTab === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' ? `All Bookings (${bookings.length})` : tab}
            </button>
          ))}
        </div>

        <button
          onClick={loadBookings}
          className="shrink-0 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          ↻ Refresh List
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No bookings in this tab</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Search local providers and book your doorstep repair service slot in seconds.
          </p>
          <button
            onClick={onExploreMore}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            Find a Provider Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              id={`customer-booking-${b.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-200 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Provider info & Ref */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={b.provider_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={b.provider_name}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onViewProvider(b.provider_id)}
                        className="text-base font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        aria-label={`View ${b.provider_name}'s profile`}
                      >
                        {b.provider_name}
                      </button>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {b.category_name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">Ref: #{b.booking_reference}</span>
                      <span>•</span>
                      <span>Phone: {b.provider_contact}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Price */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 sm:justify-end sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Provider Minimum Starting Rate
                    </span>
                    <span className="text-lg font-black text-emerald-700">৳{b.provider_starting_price} BDT</span>
                  </div>
                  <div>{getStatusBadge(b.status)}</div>
                </div>
              </div>

              {/* Service Details & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Schedule: <strong className="text-slate-800">{b.booking_date}</strong> ({b.time_slot})
                  </span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.service_address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Requested: {new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Notes if any */}
              {b.notes && (
                <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 mb-3">
                  <strong className="text-slate-700">Notes:</strong> {b.notes}
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {b.cancelled_reason && (
                <div className="bg-rose-50 p-2.5 rounded-xl text-xs text-rose-700 mb-3">
                  <strong>Cancellation reason:</strong> {b.cancelled_reason}
                </div>
              )}

              {/* Dynamic Action Buttons based on state */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {/* Left note */}
                <div className="text-[11px] text-slate-500">
                  {b.status === 'requested' && 'Awaiting provider confirmation. You will be notified once accepted.'}
                  {b.status === 'accepted' && 'Provider accepted your request. Arrange service payment directly with them.'}
                  {b.status === 'in_progress' && 'Provider has started the service. Arrange payment directly with them.'}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Cancel button for requested/accepted */}
                  {['requested', 'accepted'].includes(b.status) && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {/* Ratings become available after the scheduled service date. */}
                  {['accepted', 'in_progress'].includes(b.status) && b.booking_date.slice(0, 10) <= todayIso && (
                    b.user_rating ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>You rated: {b.user_rating}/5</span>
                      </div>
                    ) : (
                      <button
                        id={`review-btn-${b.id}`}
                        onClick={() => setSelectedBookingForReview(b)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Rate & Review</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onReviewSubmitted={() => {
            setSelectedBookingForReview(null);
            loadBookings();
          }}
        />
      )}
    </div>
  );
};
