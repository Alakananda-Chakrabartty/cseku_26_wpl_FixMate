import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Receipt,
  Star,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Booking, DigitalReceipt } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import { DigitalReceiptModal } from './DigitalReceiptModal.tsx';
import { ReviewModal } from './ReviewModal.tsx';

interface CustomerDashboardProps {
  onExploreMore: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onExploreMore }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Modal states
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<DigitalReceipt | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

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

  const handleViewReceipt = async (bookingId: number) => {
    try {
      const receipt = await api.getReceipt(bookingId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      alert(err.message || 'Receipt could not be loaded.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'active') {
      return ['requested', 'accepted', 'paid_confirmed', 'in_progress'].includes(b.status);
    }
    if (filterTab === 'completed') {
      return b.status === 'completed';
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
            ✓ Accepted - Payment Due
          </span>
        );
      case 'paid_confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🔒 Paid & Escrow Confirmed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            ⚡ Service in Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            🎉 Completed & Released
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Service Portal</h1>
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex gap-2">
          {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
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
          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
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
            Search local providers and book your doorstep repair or tutoring slot in seconds.
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
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-blue-200 transition"
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
                      <h3 className="text-base font-bold text-slate-900">{b.provider_name}</h3>
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
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Agreed Price
                    </span>
                    <span className="text-lg font-black text-emerald-700">৳{b.agreed_price} BDT</span>
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
                  {b.status === 'accepted' && 'Provider accepted your request! Please complete payment to confirm.'}
                  {b.status === 'paid_confirmed' && 'Funds in platform escrow. Provider is scheduled to visit.'}
                  {b.status === 'in_progress' && 'Provider is currently executing the service.'}
                  {b.status === 'completed' && 'Service completed. Funds released to provider.'}
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

                  {/* Payment Checkout for accepted bookings */}
                  {b.status === 'accepted' && (
                    <button
                      id={`pay-now-btn-${b.id}`}
                      onClick={() => setSelectedBookingForPayment(b)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ৳{b.agreed_price} (Escrow Checkout)</span>
                    </button>
                  )}

                  {/* Digital Receipt for paid/in_progress/completed */}
                  {['paid_confirmed', 'in_progress', 'completed'].includes(b.status) && (
                    <button
                      id={`receipt-btn-${b.id}`}
                      onClick={() => handleViewReceipt(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Receipt</span>
                    </button>
                  )}

                  {/* Review Button for completed bookings */}
                  {b.status === 'completed' && (
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

      {/* Payment Modal */}
      {selectedBookingForPayment && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onPaymentSuccess={(receipt) => {
            setSelectedBookingForPayment(null);
            setSelectedReceipt(receipt);
            loadBookings();
          }}
        />
      )}

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <DigitalReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
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
