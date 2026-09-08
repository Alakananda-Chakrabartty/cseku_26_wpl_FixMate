import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ProviderProfile } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  provider: ProviderProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<string>;
  register: (data: any) => Promise<string>;
  updateProfilePhoto: (file: File) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fixmate_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('fixmate_token');
    if (!storedToken) {
      setUser(null);
      setProvider(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
      setProvider(res.provider ?? null);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('fixmate_token');
      setToken(null);
      setUser(null);
      setProvider(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.token) {
        localStorage.setItem('fixmate_token', res.token);
        setToken(res.token);
        setUser(res.user);
        await refreshUser();
      }
      return res.redirectUrl || '';
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Profile photo must be smaller than 2 MB.');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.readAsDataURL(file);
    });

    await api.updateProfilePhoto(dataUrl);
    await refreshUser();
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('fixmate_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res.redirectUrl;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fixmate_token');
    setToken(null);
    setUser(null);
    setProvider(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        provider,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfilePhoto,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
