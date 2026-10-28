import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  LogOut,
  LogIn,
  Search,
  Sliders,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ProfilePhotoMenu } from './ProfilePhotoMenu.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, provider, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleHelp = () => {
    setIsMobileMenuOpen(false);
    window.alert('If you face any issues, mail us at:\n\nchakrabarttyalakananda@gmail.com');
  };

  const handleMobileNavigate = (view: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16">
          {/* Brand */}
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => handleMobileNavigate('search')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 sm:h-10 sm:w-10">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">FixMate</span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">Find a trusted service provider near you.</p>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
            <button
              id="nav-search-btn"
              onClick={() => onNavigate('search')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'search'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Explore Providers</span>
            </button>

            {isAuthenticated && user?.role === 'customer' && (
              <button
                id="nav-customer-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Bookings</span>
              </button>
            )}

            {isAuthenticated && user?.role === 'provider' && (
              <button
                id="nav-provider-dashboard-btn"
                onClick={() => onNavigate('provider-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'provider-dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Provider Hub</span>
                {provider?.is_verified ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline ml-1" />
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    Pending
                  </span>
                )}
              </button>
            )}

            {isAuthenticated && (user?.role === 'customer' || user?.role === 'provider') && (
              <button
                id="nav-help-btn"
                onClick={handleHelp}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>Help</span>
              </button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <button
                id="nav-admin-panel-btn"
                onClick={() => onNavigate('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* User Section */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <ProfilePhotoMenu size="sm" dropdownAlign="right" />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                      {user.full_name || user.email.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      {user.role}
                    </div>
                  </div>
                </div>

                <button
                  id="logout-btn"
                  onClick={logout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="login-modal-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  id="register-modal-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            {isAuthenticated && user && <ProfilePhotoMenu size="sm" dropdownAlign="right" />}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <button
              type="button"
              onClick={() => handleMobileNavigate('search')}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Search className="h-4 w-4" /> Explore Providers
            </button>
            {isAuthenticated && user?.role === 'customer' && (
              <button
                type="button"
                onClick={() => handleMobileNavigate('dashboard')}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4" /> My Bookings
              </button>
            )}
            {isAuthenticated && user?.role === 'provider' && (
              <button
                type="button"
                onClick={() => handleMobileNavigate('provider-dashboard')}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Sliders className="h-4 w-4" /> Provider Hub
                {!provider?.is_verified && <span className="ml-auto text-xs text-amber-700">Pending</span>}
              </button>
            )}
            {isAuthenticated && (user?.role === 'customer' || user?.role === 'provider') && (
              <button
                type="button"
                onClick={handleHelp}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" /> Help
              </button>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleMobileNavigate('admin')}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </button>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="mt-1 flex min-h-11 items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-2 text-left text-sm font-semibold text-rose-700"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="min-h-11 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
