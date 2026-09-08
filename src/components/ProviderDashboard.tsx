import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileCheck,
  AlertCircle,
  Plus,
  TrendingUp,
  CreditCard,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { ProviderProfile, Booking, TransactionLedger, VerificationDocument } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ProviderDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'ledger' | 'verification' | 'profile'>('bookings');

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ledgerData, setLedgerData] = useState<{
    summary: {
      total_gross: number;
      total_commission_deducted: number;
      total_net_earnings: number;
      available_payout: number;
    };
    ledgers: TransactionLedger[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // New Document Upload State
  const [docType, setDocType] = useState<string>('National ID (NID)');
  const [docNumber, setDocNumber] = useState<string>('NID-8829-1123-009');
  const [docUrl, setDocUrl] = useState<string>(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // Profile Edit State
  const [editBio, setEditBio] = useState<string>('');
  const [editArea, setEditArea] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(500);
  const [editExp, setEditExp] = useState<number>(5);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profRes, bookRes, ledgRes] = await Promise.all([
        api.getProviderProfile(),
        api.getBookings(),
        api.getProviderLedger(),
      ]);

      setProfile(profRes.provider);
      setDocuments(profRes.documents);
      setBookings(bookRes);
      setLedgerData(ledgRes);

      if (profRes.provider) {
        setEditBio(profRes.provider.bio);
        setEditArea(profRes.provider.service_area);
        setEditPrice(profRes.provider.starting_price);
        setEditExp(profRes.provider.experience_years);
      }
    } catch (err) {
      console.error('Failed to load provider hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateBookingStatus = async (
    bookingId: number,
    status: 'accepted' | 'declined' | 'in_progress' | 'completed'
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
    setIsUploadingDoc(true);
    try {
      await api.uploadVerificationDocument({
        document_type: docType,
        document_number: docNumber,
        document_url: docUrl,
      });
      setActionSuccess('Verification document submitted for Admin review.');
      setTimeout(() => setActionSuccess(''), 4000);
      await loadData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateProviderProfile({
        bio: editBio,
        service_area: editArea,
        starting_price: editPrice,
        experience_years: editExp,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user?.full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
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
              {profile?.category_name} • {profile?.service_area}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span>Starts at: <strong className="text-slate-800">৳{profile?.starting_price} BDT</strong></span>
              <span>•</span>
              <span>⭐ {profile?.aggregate_rating ? profile.aggregate_rating.toFixed(1) : 'New'} ({profile?.total_reviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Quick Earnings Snapshot Box */}
        {ledgerData?.summary && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Available Payout Balance
            </span>
            <span className="text-2xl font-black text-emerald-700 block">
              ৳{ledgerData.summary.available_payout.toFixed(2)} BDT
            </span>
            <span className="text-[11px] text-slate-500">
              Net of {profile?.is_verified ? '12.5%' : 'global'} commission
            </span>
          </div>
        )}
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
          id="tab-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Earnings & Commission Ledger</span>
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
          {bookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No service bookings yet</h3>
              <p className="text-xs text-slate-500">
                When customers book your available slots, you can accept, manage, and complete jobs here.
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
                      <h3 className="text-sm font-bold text-slate-900">{b.customer_name || 'Customer'}</h3>
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
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Service Fee</div>
                      <div className="text-base font-black text-emerald-700">৳{b.agreed_price} BDT</div>
                    </div>
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
                    {b.status === 'requested' && 'Customer requested this slot. Accept to allow customer payment.'}
                    {b.status === 'accepted' && 'Waiting for customer to pay online into platform escrow.'}
                    {b.status === 'paid_confirmed' && 'Customer paid! You may start the job when arriving.'}
                    {b.status === 'in_progress' && 'Service in execution. Complete job to release payout.'}
                    {b.status === 'completed' && 'Job successfully completed. Earnings credited to ledger.'}
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

                    {/* Paid Confirmed: Start Job */}
                    {b.status === 'paid_confirmed' && (
                      <button
                        id={`start-job-btn-${b.id}`}
                        onClick={() => handleUpdateBookingStatus(b.id, 'in_progress')}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Job (Arrived)</span>
                      </button>
                    )}

                    {/* In Progress: Complete Job */}
                    {b.status === 'in_progress' && (
                      <button
                        id={`complete-job-btn-${b.id}`}
                        onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Financial Ledger */}
      {activeTab === 'ledger' && ledgerData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Gross Marketplace Value
              </span>
              <span className="text-xl font-black text-slate-900">
                ৳{ledgerData.summary.total_gross.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Total customer payments</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Platform Commission Deducted
              </span>
              <span className="text-xl font-black text-slate-600">
                -৳{ledgerData.summary.total_commission_deducted.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Automated revenue split</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Total Net Earnings
              </span>
              <span className="text-xl font-black text-blue-600">
                ৳{ledgerData.summary.total_net_earnings.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Lifetime earned</span>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider mb-1">
                Available for Payout
              </span>
              <span className="text-xl font-black text-emerald-800">
                ৳{ledgerData.summary.available_payout.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-1">Completed jobs escrow released</span>
            </div>
          </div>

          {/* Itemized Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900">
              Itemized Financial Transaction Ledger
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Gross Service</th>
                    <th className="py-3 px-4">FixMate Fee (%)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Escrow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerData.ledgers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No transactions recorded yet. Completed and paid jobs will automatically log splits here.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledgers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          #{item.booking_reference}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.customer_name || 'Customer'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          ৳{parseFloat(String(item.gross_amount)).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          -৳{parseFloat(String(item.platform_commission)).toFixed(2)} ({item.commission_percentage}%)
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          ৳{parseFloat(String(item.net_provider_payout)).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.payout_status === 'eligible'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.payout_status === 'eligible' ? 'Released / Available' : 'Escrow Held'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  Document Type
                </label>
                <select
                  id="doc-type-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="National ID (NID)">National ID (NID)</option>
                  <option value="Trade License">Trade License</option>
                  <option value="Vocational Certificate">Vocational Training Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document / Certificate Number
                </label>
                <input
                  id="doc-number-input"
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. NID-8829-1123-009"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Image URL
                </label>
                <input
                  id="doc-url-input"
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="submit-doc-btn"
                type="submit"
                disabled={isUploadingDoc}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingDoc ? 'Submitting...' : 'Submit to Admin Queue'}</span>
              </button>
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
                    Uploaded: {new Date(doc.created_at).toLocaleDateString()}
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
            Keep your service area, pricing, and experience up to date for nearby customers.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Service Area / Locality
              </label>
              <input
                id="edit-area-input"
                type="text"
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                placeholder="e.g. Mirpur, Dhaka"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Starting Price (BDT)
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
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
