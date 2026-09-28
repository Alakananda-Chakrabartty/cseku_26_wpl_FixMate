import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ProviderProfile } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface BookingModalProps {
  provider: ProviderProfile;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  provider,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Tomorrow's date formatted as YYYY-MM-DD default
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [bookingDate, setBookingDate] = useState<string>(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00 AM');
  const [serviceAddress, setServiceAddress] = useState<string>('House 42, Sonadanga, Khulna');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '+880 1819 223344');
  const [notes, setNotes] = useState<string>('');

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isCheckingSlots, setIsCheckingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const standardSlots = [
    '09:00 AM',
    '11:00 AM',
    '02:00 PM',
    '04:00 PM',
    '06:00 PM',
  ];

  // Load booked slots for selected date (Conflict Prevention)
  useEffect(() => {
    async function checkConflicts() {
      setIsCheckingSlots(true);
      setErrorMessage('');
      try {
        const details = await api.getProviderDetails(provider.id, bookingDate);
        setBookedSlots(details.bookedSlots || []);

        // If selected slot is now booked on this date, reset selection to first available
        if (details.bookedSlots && details.bookedSlots.includes(selectedSlot)) {
          const firstAvailable = standardSlots.find((s) => !details.bookedSlots.includes(s));
          if (firstAvailable) {
            setSelectedSlot(firstAvailable);
          }
        }
      } catch (err) {
        console.error('Failed to check slot availability:', err);
      } finally {
        setIsCheckingSlots(false);
      }
    }

    if (bookingDate) {
      checkConflicts();
    }
  }, [bookingDate, provider.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!bookingDate || !selectedSlot || !serviceAddress.trim() || !customerPhone.trim()) {
      setErrorMessage('Please fill in all required booking details.');
      return;
    }

    if (bookedSlots.includes(selectedSlot)) {
      setErrorMessage(`Conflict: ${selectedSlot} is already booked on ${bookingDate}. Please select another time slot.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.createBooking({
        provider_id: provider.id,
        category_id: provider.category_id,
        booking_date: bookingDate,
        time_slot: selectedSlot,
        service_address: serviceAddress.trim(),
        customer_phone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Book Service Slot</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                FixMate Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Provider: <strong className="text-slate-800">{provider.provider_name}</strong> ({provider.category_name})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Booking Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="booking-date-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Time Slot Selection with Conflict Prevention */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Available Time Slots
              </label>
              {isCheckingSlots && (
                <span className="text-[11px] text-blue-600 animate-pulse">
                  Checking calendar conflicts...
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {standardSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isBooked
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{slot}</span>
                    {isBooked && (
                      <span className="text-[9px] font-normal text-rose-500 not-line-through">
                        Reserved
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * Slots marked <span className="text-rose-500 font-semibold">Reserved</span> are blocked by confirmed bookings.
            </p>
          </div>

          {/* Service Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Doorstep Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                id="booking-address-input"
                rows={2}
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="House #, Road #, Area, Landmark..."
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Contact Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="booking-phone-input"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+880 18XX XXXXXX"
                required
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Problem Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Description / Issue Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                id="booking-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the issue (e.g. MCB tripping, bathroom tap leak)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Summary & Price Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Agreed Starting Fee:</span>
              <div className="font-extrabold text-base text-emerald-700">৳{provider.starting_price} BDT</div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <p>Payment required after provider accepts</p>
              <p className="text-blue-600 font-medium">State: Requested → Accepted → Paid</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-booking-request-btn"
              type="submit"
              disabled={isSubmitting || bookedSlots.includes(selectedSlot)}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Requesting...' : 'Send Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
