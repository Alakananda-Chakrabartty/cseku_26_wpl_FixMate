import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Layers,
  RefreshCw,
  Trash2,
  MailCheck,
  X,
} from 'lucide-react';
import { AdminAnalytics, AdminUser, VerificationDocument, ProviderSubscriptionReview } from '../types.ts';
import { api } from '../services/api.ts';

export const AdminPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<ProviderSubscriptionReview[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'verifications' | 'analytics' | 'users' | 'subscriptions'>(
    'verifications'
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [reviewingProviderId, setReviewingProviderId] = useState<number | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [ana, ver, accountUsers, providerSubscriptions] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminVerificationQueue(),
        api.getAdminUsers(),
        api.getAdminSubscriptions(),
      ]);

      setAnalytics(ana);
      setVerifications(ver);
      setUsers(accountUsers);
      setSubscriptions(providerSubscriptions);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (account: AdminUser) => {
    if (!window.confirm(`Delete the account for ${account.full_name}? This cannot be undone.`)) return;
    setDeletingUserId(account.id);
    try {
      await api.deleteAdminUser(account.id);
      setFeedbackMessage(`Account for ${account.full_name} deleted.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateVerification = async (
    docId: number,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      await api.verifyDocument({ document_id: docId, status, admin_notes: notes });
      setFeedbackMessage(`Document marked as ${status}. Provider badge updated.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status.');
    }
  };

  const handleReviewSubscription = async (providerId: number, status: 'approved' | 'rejected', notes?: string) => {
    if (reviewingProviderId !== null) return;
    setReviewingProviderId(providerId);
    try {
      await api.reviewProviderSubscription(providerId, { status, notes });
      setFeedbackMessage(`Provider subscription marked as ${status}.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update subscription status.');
    } finally {
      setReviewingProviderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Top Banner */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-purple-950 p-4 text-white shadow-xl sm:mb-8 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-800 text-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">FixMate Administration Engine</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Manage provider verification, monthly subscriptions, and marketplace accounts.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Customer Accounts</span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {analytics.users_by_role.find((entry) => entry.role === 'customer')?.count || 0}
            </div>
            <span className="text-[11px] text-slate-500">Registered customers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Providers</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">
              {analytics.users_by_role.find((entry) => entry.role === 'provider')?.count || 0}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">Registered service providers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Bookings</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {analytics.bookings_by_status.reduce((total, item) => total + Number(item.count), 0)}
            </div>
            <span className="text-[11px] text-slate-500">Total service requests</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Pending Vetting</span>
              <FileCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {analytics.pending_verifications_count}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              Awaiting admin document inspection
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="-mx-3 mb-5 flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3 text-xs font-bold sm:mx-0 sm:mb-6 sm:gap-3 sm:px-0 sm:text-sm">
        <button
          id="admin-tab-verifications"
          onClick={() => setActiveTab('verifications')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 transition cursor-pointer sm:px-3 ${
            activeTab === 'verifications'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Verification Queue ({verifications.filter((v) => v.status === 'pending').length} Pending)</span>
        </button>

        <button
          id="admin-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 transition cursor-pointer sm:px-3 ${
            activeTab === 'analytics'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Platform Telemetry</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 transition cursor-pointer sm:px-3 ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Accounts ({users.length})</span>
        </button>

        <button
          id="admin-tab-subscriptions"
          onClick={() => setActiveTab('subscriptions')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 transition cursor-pointer sm:px-3 ${
            activeTab === 'subscriptions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Subscriptions ({subscriptions.length})</span>
        </button>

      </div>

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Provider Subscription Payments</h3>
              <p className="text-xs text-slate-500 mt-1">View submitted ৳500 bKash or Nagad payments and their transaction IDs. Pending payments appear first for review.</p>
            </div>
            <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">Official payment number: 01752786578</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Wallet</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Paid / approved</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Valid until</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No provider subscription payments have been submitted.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={`${sub.provider_id}-${sub.subscription_transaction_id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            const account = users.find((candidate) => candidate.id === sub.user_id);
                            if (account) {
                              setSelectedUser(account);
                            } else {
                              window.alert('Could not load this provider account. Refresh the admin data and try again.');
                            }
                          }}
                          className="text-left font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                          aria-label={`View ${sub.provider_name}'s profile`}
                        >
                          {sub.provider_name}
                        </button>
                        <div className="text-[11px] text-slate-500">{sub.provider_email}</div>
                        {sub.provider_phone && <div className="text-[11px] text-slate-500">{sub.provider_phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{sub.category_name || 'General'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{sub.subscription_method || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{sub.subscription_transaction_id || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {sub.subscription_paid_at
                          ? new Date(sub.subscription_paid_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          sub.subscription_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.subscription_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sub.subscription_expires_at
                          ? new Date(sub.subscription_expires_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sub.subscription_status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={reviewingProviderId !== null}
                              onClick={() => handleReviewSubscription(sub.provider_id, 'rejected', 'Subscription payment transaction could not be verified locally.')}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-rose-600 font-bold hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
                            >
                              {reviewingProviderId === sub.provider_id ? 'Updating...' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingProviderId !== null}
                              onClick={() => handleReviewSubscription(sub.provider_id, 'approved', 'Monthly subscription verified by admin.')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-bold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
                            >
                              {reviewingProviderId === sub.provider_id ? 'Updating...' : 'Approve'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Registered Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">Unverified accounts are kept out of the marketplace until email verification succeeds.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(account)}
                        className="text-left text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        aria-label={`View details for ${account.full_name}`}
                      >
                        {account.full_name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{account.email}</td>
                    <td className="py-3 px-4 uppercase text-slate-600">{account.role}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${account.email_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <MailCheck className="w-3.5 h-3.5" />
                        {account.email_verified ? 'Verified' : 'Not verified'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {account.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(account)}
                          disabled={deletingUserId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingUserId === account.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedUser(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-details-title"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 id="admin-user-details-title" className="text-lg font-bold text-slate-900">
                  Account Details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">User profile and account information</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close account details"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Account</h3>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Name</dt>
                    <dd className="font-semibold text-slate-900">{selectedUser.full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Role</dt>
                    <dd className="font-semibold capitalize text-slate-900">{selectedUser.role}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Email</dt>
                    <dd className="break-all font-semibold text-slate-900">{selectedUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Phone</dt>
                    <dd className="font-semibold text-slate-900">{selectedUser.phone || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Email status</dt>
                    <dd className="font-semibold text-slate-900">
                      {selectedUser.email_verified ? 'Verified' : 'Not verified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Account created</dt>
                    <dd className="font-semibold text-slate-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedUser.role === 'provider' && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Provider Profile</h3>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Category</dt>
                      <dd className="font-semibold text-slate-900">{selectedUser.provider_category || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Minimum starting rate</dt>
                      <dd className="font-semibold text-slate-900">
                        {selectedUser.provider_starting_price != null ? `৳${selectedUser.provider_starting_price}` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Base location</dt>
                      <dd className="font-semibold text-slate-900">{selectedUser.provider_base_location || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Experience</dt>
                      <dd className="font-semibold text-slate-900">
                        {selectedUser.provider_experience_years ?? 0} years
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Service areas</dt>
                      <dd className="font-semibold text-slate-900">
                        {selectedUser.provider_service_areas?.join(', ') || selectedUser.provider_service_area || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Verification</dt>
                      <dd className="font-semibold capitalize text-slate-900">
                        {selectedUser.provider_verification_status || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Subscription</dt>
                      <dd className="font-semibold capitalize text-slate-900">
                        {selectedUser.provider_subscription_status?.replace('_', ' ') || '—'}
                      </dd>
                    </div>
                    {selectedUser.provider_subscription_method && (
                      <div>
                        <dt className="text-xs text-slate-500">Subscription payment</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedUser.provider_subscription_method}
                          {selectedUser.provider_subscription_transaction_id
                            ? ` · ${selectedUser.provider_subscription_transaction_id}`
                            : ''}
                        </dd>
                      </div>
                    )}
                    {selectedUser.provider_subscription_paid_at && (
                      <div>
                        <dt className="text-xs text-slate-500">Subscription paid</dt>
                        <dd className="font-semibold text-slate-900">
                          {new Date(selectedUser.provider_subscription_paid_at).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {selectedUser.provider_subscription_expires_at && (
                      <div>
                        <dt className="text-xs text-slate-500">Subscription valid until</dt>
                        <dd className="font-semibold text-slate-900">
                          {new Date(selectedUser.provider_subscription_expires_at).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {selectedUser.provider_bio && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-slate-500">Bio</dt>
                        <dd className="whitespace-pre-wrap font-semibold text-slate-900">{selectedUser.provider_bio}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Tab 1: Verification Queue */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Provider Verification Queue & Document Auditing
            </h3>
            <span className="text-xs text-slate-500">
              Approved documents grant immediate "Verified Provider" badges across the marketplace.
            </span>
          </div>

          {verifications.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
              No verification documents currently submitted.
            </div>
          ) : (
            verifications.map((doc) => (
              <div
                key={doc.id}
                id={`admin-doc-${doc.id}`}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left: Document details and provider info */}
                <div className="flex items-start gap-4">
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block shrink-0 group relative rounded-xl overflow-hidden ring-1 ring-slate-200"
                  >
                    <img
                      src={doc.document_url}
                      alt={doc.document_type}
                      className="w-24 h-24 object-cover group-hover:scale-105 transition"
                    />
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">
                      View Full
                    </span>
                  </a>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">{doc.provider_name}</h4>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {doc.category_name} • {doc.service_area}
                      </span>
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

                    <div className="text-xs text-slate-700 font-semibold mt-1">
                      {doc.document_type}
                    </div>

                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Doc #: {doc.document_number || 'Not provided'}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Email: {doc.provider_email} • Phone: {doc.provider_phone}
                    </div>

                    {doc.admin_notes && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <strong>Previous Notes:</strong> {doc.admin_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {doc.status === 'pending' ? (
                    <>
                      <button
                        id={`reject-doc-btn-${doc.id}`}
                        onClick={() => {
                          const note = prompt('Enter rejection feedback for provider:');
                          if (note !== null) {
                            handleUpdateVerification(doc.id, 'rejected', note || 'Document unreadable or invalid');
                          }
                        }}
                        className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        id={`approve-doc-btn-${doc.id}`}
                        onClick={() =>
                          handleUpdateVerification(doc.id, 'approved', 'Verified by Lead Admin Nafis')
                        }
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve & Grant Badge</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 font-semibold">
                      Submitted on {new Date(doc.submitted_at || doc.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Platform Telemetry */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Registered User Accounts</span>
            </h3>

            <div className="space-y-3">
              {analytics.users_by_role.map((u) => (
                <div
                  key={u.role}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs"
                >
                  <span className="font-bold uppercase text-slate-700 tracking-wider">{u.role}</span>
                  <span className="font-black text-slate-900 text-sm">{u.count} Users</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings by Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Bookings Status Distribution</span>
            </h3>

            <div className="space-y-3">
              {analytics.bookings_by_status.map((b) => (
                <div
                  key={b.status}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs"
                >
                  <span className="font-semibold text-slate-700 uppercase tracking-wide">
                    {b.status.replace('_', ' ')}
                  </span>
                  <span className="font-black text-slate-900 text-sm">{b.count} Bookings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
