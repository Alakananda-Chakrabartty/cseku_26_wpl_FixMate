import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileCheck,
  AlertCircle,
  Plus,
  CreditCard,
  Briefcase,
  MapPin,
  Image as ImageIcon,
  Trash2,
  X,
} from 'lucide-react';
import { ProviderProfile, Booking, VerificationDocument } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MapsLocationPicker } from './MapsLocationPicker.tsx';
import { ServiceAreasEditor } from './ServiceAreasEditor.tsx';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'verification' | 'profile'>('bookings');

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bookingLoadError, setBookingLoadError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // New Document Upload State
  const [docNumber, setDocNumber] = useState<string>('');
  const [nidUrl, setNidUrl] = useState<string>('');
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [documentUploadError, setDocumentUploadError] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // Profile Edit State
  const [editBio, setEditBio] = useState<string>('');
  const [editServiceAreas, setEditServiceAreas] = useState<string[]>([]);
  const [editBaseLocationName, setEditBaseLocationName] = useState<string>('');
  const [editLocation, setEditLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editPortfolioImages, setEditPortfolioImages] = useState<string[]>([]);
  const [editPrice, setEditPrice] = useState<number>(500);
  const [editExp, setEditExp] = useState<number>(5);
  const [editBioExperience, setEditBioExperience] = useState<string>('');
  const [editAvailableDays, setEditAvailableDays] = useState<string>('Monday, Tuesday, Wednesday');
  const [editAvailableHours, setEditAvailableHours] = useState<string>('09:00 AM - 05:00 PM');
  const [subscriptionMethod, setSubscriptionMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [subscriptionTxId, setSubscriptionTxId] = useState<string>('');
  const [isSubmittingSubscription, setIsSubmittingSubscription] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const hasInitializedProfileForm = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profResult, bookingsResult] = await Promise.allSettled([
        api.getProviderProfile(),
        api.getBookings(),
      ]);

      if (profResult.status === 'fulfilled') {
        setProfile(profResult.value.provider);
        setDocuments(profResult.value.documents);

        if (profResult.value.provider && !hasInitializedProfileForm.current) {
          hasInitializedProfileForm.current = true;
          setEditBio(profResult.value.provider.bio || '');
          setEditBaseLocationName(profResult.value.provider.base_location_name || '');
          setEditServiceAreas(
            profResult.value.provider.service_areas?.length
              ? profResult.value.provider.service_areas
              : profResult.value.provider.service_area
                ? [profResult.value.provider.service_area]
                : []
          );
          setEditLocation({
            lat: Number(profResult.value.provider.latitude),
            lng: Number(profResult.value.provider.longitude),
          });
          setEditPortfolioImages(profResult.value.provider.portfolio_images || []);
          setEditPrice(profResult.value.provider.starting_price);
          setEditExp(profResult.value.provider.experience_years);
          setEditBioExperience(profResult.value.provider.bio_experience || '');
          setEditAvailableDays(profResult.value.provider.availability_schedule?.days.join(', ') || '');
          setEditAvailableHours(profResult.value.provider.availability_schedule?.hours || '');
          setSubscriptionMethod(profResult.value.provider.subscription_method || 'bKash');
          setSubscriptionTxId(profResult.value.provider.subscription_transaction_id || '');
        }
      } else {
        console.error('Failed to load provider profile:', profResult.reason);
      }

      if (bookingsResult.status === 'fulfilled') {
        setBookings(bookingsResult.value);
        setBookingLoadError('');
      } else {
        console.error('Failed to load provider bookings:', bookingsResult.reason);
        setBookingLoadError(
          bookingsResult.reason instanceof Error
            ? bookingsResult.reason.message
            : 'Could not load provider bookings.'
        );
      }

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const refreshOnFocus = () => {
      loadData();
    };
    window.addEventListener('focus', refreshOnFocus);
    const refreshTimer = window.setInterval(loadData, 10000);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const handleUpdateBookingStatus = async (
    bookingId: number,
    status: 'accepted' | 'declined' | 'in_progress'
  ) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      setActionSuccess(`Booking updated to "${status}".`);
      setTimeout(() => setActionSuccess(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !nidUrl.trim()) {
      setDocumentUploadError('Enter the NID number and choose an NID image before submitting.');
      return;
    }
    setDocumentUploadError('');
    setIsUploadingDoc(true);
    try {
      await api.submitNid({
        nidNumber: docNumber,
        documentUrl: nidUrl,
        documentType: 'National ID (NID)',
      });
      setActionSuccess('Verification document submitted for Admin review.');
      setDocNumber('');
      setNidUrl('');
      setSelectedDocumentName('');
      setTimeout(() => setActionSuccess(''), 4000);
      await loadData();
    } catch (err: any) {
      setDocumentUploadError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmitSubscription = async () => {
    if (!subscriptionTxId.trim()) {
      alert('Enter your mobile banking transaction ID before submitting it for review.');
      return;
    }

    setIsSubmittingSubscription(true);
    try {
      await api.submitProviderSubscription({
        payment_method: subscriptionMethod,
        transaction_id: subscriptionTxId.trim(),
      });
      setSubscriptionTxId('');
      setActionSuccess('Subscription payment proof submitted for admin verification.');
      setTimeout(() => setActionSuccess(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit subscription proof.');
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateProviderProfile({
        bio: editBio,
        service_areas: editServiceAreas,
        base_location_name: editBaseLocationName,
        latitude: editLocation?.lat,
        longitude: editLocation?.lng,
        portfolio_images: editPortfolioImages,
        starting_price: editPrice,
        experience_years: editExp,
        bio_experience: editBioExperience,
        availability_schedule: {
          days: editAvailableDays.split(',').map((day) => day.trim()).filter(Boolean),
          hours: editAvailableHours.trim(),
        },
      });
      setActionSuccess('Provider profile updated successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 animate-pulse">
        Loading provider portal...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:mb-8 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <div className="flex items-start gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user?.full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {user?.full_name}
              </h1>
              {profile?.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Provider
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Verification Pending
                </span>
              )}
            </div>

            <p className="text-xs text-blue-600 font-bold mt-0.5">
              {profile?.category_name} • {profile?.base_location_name || 'Map location name not set'}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span>Minimum starting rate: <strong className="text-slate-800">৳{profile?.starting_price} BDT</strong></span>
              <span>•</span>
              <span>⭐ {profile?.aggregate_rating ? profile.aggregate_rating.toFixed(1) : 'New'} ({profile?.total_reviews} reviews)</span>
            </div>
          </div>
        </div>

      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-bold">
        <button
          id="tab-bookings"
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Bookings & Jobs ({bookings.length})</span>
        </button>

        <button
          id="tab-verification"
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Center ({documents.length})</span>
        </button>

        <button
          id="tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Edit Public Profile</span>
        </button>
      </div>

      {/* Tab 1: Bookings & Jobs Management */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookingLoadError ? (
            <div className="bg-rose-50 rounded-3xl border border-rose-200 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-rose-900 mb-1">Bookings could not be loaded</h3>
              <p className="text-xs text-rose-700">{bookingLoadError}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No service bookings yet</h3>
              <p className="text-xs text-slate-500">
                When customers book your available slots, you can accept and start services here.
              </p>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                id={`provider-job-${b.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerBooking(b)}
                        className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        aria-label={`View ${b.customer_name || 'Customer'}'s profile`}
                      >
                        {b.customer_name || 'Customer'}
                      </button>
                      <span className="font-mono text-xs text-slate-400">Ref: #{b.booking_reference}</span>
                      <span className="text-xs text-slate-600">Tel: {b.customer_phone}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Schedule: <strong className="text-slate-700">{b.booking_date}</strong> ({b.time_slot})</span>
                      <span>•</span>
                      <span>Address: {b.service_address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {b.notes && (
                  <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                    <strong className="text-slate-700">Customer Problem Notes:</strong> {b.notes}
                  </div>
                )}

                {/* Status action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    {b.status === 'requested' && 'Customer requested this slot. Accept to confirm the appointment.'}
                    {b.status === 'accepted' && 'Appointment accepted. Agree service details and payment directly with the customer.'}
                    {b.status === 'in_progress' && 'Service is in progress. Customer payment is handled directly between you.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Requested state: Accept / Decline */}
                    {b.status === 'requested' && (
                      <>
                        <button
                          id={`decline-job-btn-${b.id}`}
                          onClick={() => handleUpdateBookingStatus(b.id, 'declined')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          id={`accept-job-btn-${b.id}`}
                          onClick={() => handleUpdateBookingStatus(b.id, 'accepted')}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition cursor-pointer"
                        >
                          Accept Booking
                        </button>
                      </>
                    )}

                    {/* Accepted: Start Service */}
                    {b.status === 'accepted' && (
                      <button
                        id={`start-job-btn-${b.id}`}
                        onClick={() => handleUpdateBookingStatus(b.id, 'in_progress')}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Job (Arrived)</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Verification Center */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload New Document Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Submit Verification Documents</h3>
            <p className="text-xs text-slate-500 mb-4">
              FixMate admins verify credentials before granting the Verified Badge.
            </p>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NID Number
                </label>
                <input
                  id="nid-number-input"
                  type="text"
                  value={docNumber}
                  onChange={(e) => {
                    setDocNumber(e.target.value);
                    setDocumentUploadError('');
                  }}
                  placeholder="Enter national ID number"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NID Image
                </label>
                <input
                  id="nid-file-input"
                  type="file"
                  accept="image/*"
                  onClick={(e) => {
                    e.currentTarget.value = '';
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setDocumentUploadError('');
                    if (!file.type.startsWith('image/')) {
                      alert('Please choose an image file.');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 8 * 1024 * 1024) {
                      alert('The document must be smaller than 8 MB.');
                      e.target.value = '';
                      return;
                    }
                    setSelectedDocumentName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setNidUrl(String(reader.result));
                    };
                    reader.onerror = () => {
                      setSelectedDocumentName('');
                      alert('Could not read the selected document. Please try again.');
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500"
                />
                {selectedDocumentName && (
                  <p className="mt-1 text-[11px] text-emerald-700 truncate">
                    Selected: {selectedDocumentName}
                  </p>
                )}
                {nidUrl.startsWith('data:image/') && (
                  <img
                    src={nidUrl}
                    alt="Selected NID preview"
                    className="mt-3 h-28 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
                  />
                )}
              </div>

              <button
                id="submit-doc-btn"
                type="submit"
                disabled={isUploadingDoc || !docNumber.trim() || !nidUrl.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingDoc ? 'Submitting...' : 'Submit to Admin Queue'}</span>
              </button>
              {documentUploadError && (
                <p className="text-xs font-semibold text-rose-600" role="alert">
                  {documentUploadError}
                </p>
              )}
            </form>
          </div>

          {/* Submitted Documents Status List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Document Verification Status</h3>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                No documents uploaded yet. Upload your National ID or Trade License to get verified.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.document_url}
                      alt={doc.document_type}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{doc.document_type}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            doc.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Number: <span className="font-mono text-slate-700">{doc.document_number || 'N/A'}</span>
                      </div>
                      {doc.admin_notes && (
                        <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded">
                          Admin note: {doc.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Submitted: {new Date(doc.submitted_at || doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Edit Profile */}
      {activeTab === 'profile' && profile && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">Edit Provider Profile Details</h3>
          <p className="text-xs text-slate-500 mb-6">
            Set your base location on the map and list the areas you travel to for work.
          </p>

          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-bold text-sm text-amber-900">Monthly provider subscription</div>
                <p className="mt-1 text-amber-800">
                  Pay ৳500 to 01752786578 via bKash or Nagad, then submit the transaction ID for admin review.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-white px-2.5 py-1 font-bold text-amber-800">
                {profile?.subscription_status === 'paid' && profile.subscription_expires_at && new Date(profile.subscription_expires_at) <= new Date()
                  ? 'Expired'
                  : profile?.subscription_status === 'paid'
                  ? 'Approved'
                  : profile?.subscription_status === 'pending'
                  ? 'Pending review'
                  : profile?.subscription_status === 'rejected'
                  ? 'Rejected'
                  : 'Not paid yet'}
              </span>
            </div>
            {profile?.subscription_expires_at && (
              <p className="mt-2 text-amber-800">
                {new Date(profile.subscription_expires_at) <= new Date() ? 'Expired on' : 'Valid until'}{' '}
                {new Date(profile.subscription_expires_at).toLocaleDateString()}.
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(['bKash', 'Nagad'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSubscriptionMethod(method)}
                  className={`rounded-xl border px-3 py-2 font-bold transition cursor-pointer ${
                    subscriptionMethod === method
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block font-semibold text-amber-800 uppercase tracking-wider mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                value={subscriptionTxId}
                onChange={(event) => setSubscriptionTxId(event.target.value)}
                placeholder="Enter your bKash or Nagad transaction ID"
                className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              disabled={isSubmittingSubscription}
              onClick={handleSubmitSubscription}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 font-bold text-white hover:bg-amber-700 transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmittingSubscription ? 'Submitting...' : 'Submit payment proof'}
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <MapsLocationPicker
              value={editLocation}
              onChange={setEditLocation}
              onLocationNameResolved={(name) => setEditBaseLocationName((current) => current || name)}
            />
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Map Location Name
              </label>
              <input
                type="text"
                value={editBaseLocationName}
                onChange={(event) => setEditBaseLocationName(event.target.value)}
                placeholder="e.g. Daulatpur, Khulna"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <ServiceAreasEditor value={editServiceAreas} onChange={setEditServiceAreas} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Starting Rate (BDT)
                </label>
                <input
                  id="edit-price-input"
                  type="number"
                  min="100"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Experience (Years)
                </label>
                <input
                  id="edit-exp-input"
                  type="number"
                  min="0"
                  value={editExp}
                  onChange={(e) => setEditExp(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Professional Bio & Services Offered
              </label>
              <textarea
                id="edit-bio-input"
                rows={4}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Work Experience
              </label>
              <textarea
                id="edit-experience-description-input"
                rows={4}
                value={editBioExperience}
                onChange={(e) => setEditBioExperience(e.target.value)}
                placeholder="Describe your practical experience and specialties"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Work Photos
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold cursor-pointer hover:bg-slate-50">
                <ImageIcon className="w-4 h-4" />
                Add photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={async (event) => {
                    const files = Array.from(event.target.files || []) as File[];
                    event.target.value = '';
                    if (editPortfolioImages.length + files.length > 8) {
                      alert('You can add up to 8 work photos.');
                      return;
                    }
                    if (files.some((file) => file.size > 2 * 1024 * 1024)) {
                      alert('Each work photo must be smaller than 2 MB.');
                      return;
                    }
                    try {
                      const images = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(new Error('Could not read a selected photo.'));
                        reader.readAsDataURL(file);
                      })));
                      setEditPortfolioImages((current) => [...current, ...images]);
                    } catch (error: any) {
                      alert(error.message || 'Could not read the selected photos.');
                    }
                  }}
                />
              </label>
              {editPortfolioImages.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No work photos added.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editPortfolioImages.map((image, index) => (
                    <div key={`${index}-${image.slice(0, 32)}`} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                      <img src={image} alt={`Work photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditPortfolioImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                        aria-label={`Remove work photo ${index + 1}`}
                        className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-white/95 text-rose-600 shadow-sm hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomerBooking && (
                <div
                  className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
                  onClick={() => setSelectedCustomerBooking(null)}
                >
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="booking-customer-profile-title"
                    className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedCustomerBooking.customer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <h2 id="booking-customer-profile-title" className="text-lg font-bold text-slate-900">
                            {selectedCustomerBooking.customer_name || 'Customer'}
                          </h2>
                          <p className="text-xs capitalize text-slate-500">Customer profile</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerBooking(null)}
                        aria-label="Close customer profile"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <dl className="grid grid-cols-1 gap-4 p-5 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Email</dt>
                        <dd className="break-all font-semibold text-slate-900">
                          {selectedCustomerBooking.customer_email || 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Phone</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedCustomerBooking.customer_contact || selectedCustomerBooking.customer_phone || 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Customer since</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedCustomerBooking.customer_account_created_at
                            ? new Date(selectedCustomerBooking.customer_account_created_at).toLocaleDateString()
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Working Days
                </label>
                <input
                  id="edit-availability-days-input"
                  type="text"
                  value={editAvailableDays}
                  onChange={(e) => setEditAvailableDays(e.target.value)}
                  placeholder="Monday, Tuesday, Wednesday"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Time Slots
                </label>
                <input
                  id="edit-availability-hours-input"
                  type="text"
                  value={editAvailableHours}
                  onChange={(e) => setEditAvailableHours(e.target.value)}
                  placeholder="09:00 AM - 05:00 PM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="save-profile-btn"
              type="submit"
              disabled={isSavingProfile}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile Updates'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
