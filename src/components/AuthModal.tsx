import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Briefcase, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Category } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (redirectView: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  // Provider specific fields
  const [categoryId, setCategoryId] = useState<number>(1);
  const [serviceArea, setServiceArea] = useState<string>('Sonadanga, Khulna');
  const [startingPrice, setStartingPrice] = useState<number>(500);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [registrationMessage, setRegistrationMessage] = useState<string>('');

  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories for registration:', err);
      }
    }
    loadCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'login') {
        const redirectUrl = await login({ email, password });
        onSuccess(redirectUrl);
      } else {
        const payload: any = {
          email,
          password,
          full_name: fullName,
          phone,
          role,
        };

        if (role === 'provider') {
          payload.category_id = categoryId;
          payload.service_area = serviceArea;
          payload.starting_price = startingPrice;
        }

        const redirectUrl = await register(payload);
        if (redirectUrl) {
          onSuccess(redirectUrl);
        } else {
          setRegistrationMessage('Account created. Check your Gmail inbox and verify your email before signing in.');
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to FixMate' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login'
                ? 'Access your customer bookings, provider portal, or admin hub'
                : 'Join our verified hyper-local service network'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-center">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 transition cursor-pointer ${
              mode === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 transition cursor-pointer ${
              mode === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {registrationMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
              {registrationMessage}
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  I want to:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      role === 'customer'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👤 Hire a Provider
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      role === 'provider'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ Offer My Services
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-fullname-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aminul Islam"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XX XXXXXX"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Provider specific inputs */}
              {role === 'provider' && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="font-bold text-blue-900">Provider Service Profile</div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Service Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Service Area
                      </label>
                      <input
                        type="text"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        placeholder="Sonadanga, Khulna"
                        required
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Starting Price (BDT)
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={startingPrice}
                        onChange={(e) => setStartingPrice(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer text-xs mt-2"
          >
            {isLoading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Complete Registration'}
          </button>

          {/* Quick Demo Fillers */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-1.5">Or use pre-seeded demo accounts:</span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@fixmate.local');
                  setPassword('Admin@12345');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('karim.electric@fixmate.local');
                  setPassword('Provider@12345');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                Verified Electrician
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('salma.tailors@fixmate.local');
                  setPassword('Provider@12345');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
              >
                Pending Tailor
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('anita.customer@fixmate.local');
                  setPassword('Customer@12345');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
              >
                Customer Anita
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
