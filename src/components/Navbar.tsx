import React from 'react';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  DollarSign,
  UserCheck,
  LogOut,
  LogIn,
  Search,
  Sliders,
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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('search')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">FixMate</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Hyper-Local
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">Find a trusted service provider near you.</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
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
                <span>Provider Hub & Ledger</span>
                {provider?.is_verified ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline ml-1" />
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    Pending
                  </span>
                )}
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
          <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
};
