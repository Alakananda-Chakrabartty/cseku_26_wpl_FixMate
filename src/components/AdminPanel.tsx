import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Percent,
  FileCheck,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { AdminAnalytics, VerificationDocument, TransactionLedger } from '../types.ts';
import { api } from '../services/api.ts';

export const AdminPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [transactions, setTransactions] = useState<TransactionLedger[]>([]);
  const [activeTab, setActiveTab] = useState<'verifications' | 'analytics' | 'settings' | 'transactions'>(
    'verifications'
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [commissionInput, setCommissionInput] = useState<number>(12.5);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [ana, ver, tx] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminVerifications(),
        api.getAdminTransactions(),
      ]);

      setAnalytics(ana);
      setVerifications(ver);
      setTransactions(tx);
      if (ana.current_commission_percentage) {
        setCommissionInput(ana.current_commission_percentage);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
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
      await api.updateVerificationStatus(docId, status, notes);
      setFeedbackMessage(`Document marked as ${status}. Provider badge updated.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status.');
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingCommission(true);
    try {
      await api.updateAdminSettings({ global_commission_percentage: commissionInput });
      setFeedbackMessage(`Global platform commission updated to ${commissionInput}%.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-800 text-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">FixMate Administration Engine</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Oversee provider vetting, platform revenue splits, and marketplace telemetry.
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
              <span className="text-[10px] uppercase font-bold tracking-wider">Gross Volume (GMV)</span>
              <DollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              ৳{analytics.finance.total_gmv.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Gross marketplace payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">FixMate Revenue</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">
              ৳{analytics.finance.total_commission.toFixed(2)}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              At {analytics.current_commission_percentage}% take rate
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Net Provider Payouts</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              ৳{analytics.finance.total_provider_payouts.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Credited to local service providers</span>
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
      <div className="flex items-center border-b border-slate-200 mb-6 gap-3 text-xs sm:text-sm font-bold">
        <button
          id="admin-tab-verifications"
          onClick={() => setActiveTab('verifications')}
          className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
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
          className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Platform Telemetry</span>
        </button>

        <button
          id="admin-tab-transactions"
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Transactions Audit ({transactions.length})</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Commission Settings</span>
        </button>
      </div>

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
                      Processed on {new Date(doc.created_at).toLocaleDateString()}
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

      {/* Tab 3: Transactions Audit */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900">
            Global Marketplace Transaction Ledger & Splits
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">FixMate Commission</th>
                  <th className="py-3 px-4">Net Provider Payout</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payments processed yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-700">{t.transaction_id}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        #{t.booking_reference}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{t.provider_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ৳{parseFloat(String(t.gross_amount)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-purple-700 font-semibold">
                        ৳{parseFloat(String(t.platform_commission)).toFixed(2)} ({t.commission_percentage}%)
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">
                        ৳{parseFloat(String(t.net_provider_payout)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{t.payment_method}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Commission Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Global Platform Commission Configuration
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure the percentage deducted automatically by the FixMate financial engine on every
            successful customer checkout.
          </p>

          <form onSubmit={handleSaveCommission} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Platform Commission Take Rate (%)
              </label>
              <div className="relative">
                <input
                  id="commission-percentage-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(Number(e.target.value))}
                  required
                  className="w-full p-3 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard industry baseline is 10.0% to 15.0%. Default: 12.5%.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <strong className="block">Engine Impact:</strong>
              <p>
                A ৳1,000 BDT job under {commissionInput}% commission will automatically allocate{' '}
                <strong className="text-purple-800">৳{((1000 * commissionInput) / 100).toFixed(2)}</strong> to
                FixMate revenue and{' '}
                <strong className="text-emerald-700">
                  ৳{(1000 - (1000 * commissionInput) / 100).toFixed(2)}
                </strong>{' '}
                to the local provider payout balance.
              </p>
            </div>

            <button
              id="save-commission-btn"
              type="submit"
              disabled={isUpdatingCommission}
              className="py-2.5 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingCommission ? 'Saving...' : 'Update Commission Rate'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
