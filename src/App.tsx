import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ProviderSearch } from './components/ProviderSearch.tsx';
import { ProviderDetailModal } from './components/ProviderDetailModal.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { ProviderDashboard } from './components/ProviderDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProviderProfile } from './types.ts';
import { ShieldCheck, Wrench, Heart, CheckCircle2 } from 'lucide-react';

function FixMateMain() {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<string>('search');

  // Modals
  const [selectedProviderDetail, setSelectedProviderDetail] = useState<ProviderProfile | null>(null);
  const [selectedProviderForBooking, setSelectedProviderForBooking] = useState<ProviderProfile | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'search' && (
          <ProviderSearch
            onSelectProvider={(p) => setSelectedProviderDetail(p)}
            onBookProvider={(p) => setSelectedProviderForBooking(p)}
          />
        )}

        {currentView === 'dashboard' && (
          <CustomerDashboard onExploreMore={() => handleNavigate('search')} />
        )}

        {currentView === 'provider-dashboard' && <ProviderDashboard />}

        {currentView === 'admin' && <AdminPanel />}
      </main>

      {/* Provider Details & Reviews Modal */}
      {selectedProviderDetail && (
        <ProviderDetailModal
          provider={selectedProviderDetail}
          onClose={() => setSelectedProviderDetail(null)}
          onBookNow={(p) => {
            setSelectedProviderDetail(null);
            setSelectedProviderForBooking(p);
          }}
        />
      )}

      {/* Booking Slot Modal */}
      {selectedProviderForBooking && (
        <BookingModal
          provider={selectedProviderForBooking}
          onClose={() => setSelectedProviderForBooking(null)}
          onOpenAuth={() => {
            setSelectedProviderForBooking(null);
            setAuthModalMode('login');
          }}
          onSuccess={() => {
            setSelectedProviderForBooking(null);
            showToast('Service slot requested successfully! View status in My Bookings.');
            handleNavigate('dashboard');
          }}
        />
      )}

      {/* Authentication Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={(redirectView) => {
            setAuthModalMode(null);
            if (redirectView === '/admin') {
              handleNavigate('admin');
            } else if (redirectView === '/provider-dashboard') {
              handleNavigate('provider-dashboard');
            } else {
              handleNavigate('dashboard');
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm">FixMate</span>
                <p className="text-[11px] text-slate-400">Hyper-Local Services Marketplace Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-medium">
              <button
                onClick={() => handleNavigate('search')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Find Providers
              </button>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Customer Portal
              </button>
              <button
                onClick={() => handleNavigate('provider-dashboard')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Provider Hub
              </button>
              <button
                onClick={() => handleNavigate('admin')}
                className="hover:text-purple-600 transition cursor-pointer"
              >
                Admin Panel
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              © {new Date().getFullYear()} FixMate. Automated platform commission, proximity matching, and escrow protection.
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>National ID & Trade License Vetted Professionals</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FixMateMain />
    </AuthProvider>
  );
}
