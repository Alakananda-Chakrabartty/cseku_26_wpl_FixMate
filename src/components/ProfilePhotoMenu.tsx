import React, { useState, useRef, useEffect } from 'react';
import { Eye, Camera, X, Upload, Pencil, Save, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Category } from '../types.ts';
import { MapsLocationPicker } from './MapsLocationPicker.tsx';
import { ServiceAreasEditor } from './ServiceAreasEditor.tsx';

interface ProfilePhotoMenuProps {
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
  dropdownAlign?: 'left' | 'right';
  className?: string;
}

export const ProfilePhotoMenu: React.FC<ProfilePhotoMenuProps> = ({
  size = 'sm',
  shape = 'circle',
  dropdownAlign = 'right',
  className = '',
}) => {
  const { user, provider, updateProfilePhoto, updateProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState('');
  const [editServiceAreas, setEditServiceAreas] = useState<string[]>([]);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLocation, setEditLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editExperienceYears, setEditExperienceYears] = useState<number>(0);
  const [editStartingPrice, setEditStartingPrice] = useState<number>(500);
  const [editBioExperience, setEditBioExperience] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const profilePhoto = user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

  useEffect(() => {
    if (!user) return;
    setEditName(user.full_name || '');
    setEditPhone(user.phone || '');
    setEditType(user.work_type || provider?.category_name || '');
    setEditServiceAreas(
      provider?.service_areas?.length
        ? provider.service_areas
        : provider?.service_area
          ? [provider.service_area]
          : []
    );
    setEditLocationName(provider?.base_location_name || '');
    setEditLocation(
      provider && provider.latitude !== undefined && provider.longitude !== undefined
        ? { lat: Number(provider.latitude), lng: Number(provider.longitude) }
        : null
    );
    setEditExperienceYears(provider?.experience_years ?? 0);
    setEditStartingPrice(provider?.starting_price ?? 500);
    setEditBioExperience(provider?.bio_experience || '');
  }, [user, provider]);

  useEffect(() => {
    if (user?.role === 'provider') {
      api.getCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [user?.role]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close viewer modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsViewerOpen(false);
      }
    };
    if (isViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewerOpen]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      await updateProfilePhoto(file);
    } catch (error: any) {
      alert(error.message || 'Could not update profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const selectedCategory = categories.find((category) => category.name === editType);
      await updateProfile({
        full_name: editName,
        phone: editPhone,
        work_type: user?.role === 'provider' ? editType : '',
        ...(selectedCategory && user?.role === 'provider' ? { category_id: selectedCategory.id } : {}),
      });

      if (user?.role === 'provider') {
        await api.updateProviderProfile({
          category_id: selectedCategory?.id ?? provider?.category_id,
          service_areas: editServiceAreas,
          base_location_name: editLocationName.trim(),
          latitude: editLocation?.lat ?? provider?.latitude,
          longitude: editLocation?.lng ?? provider?.longitude,
          experience_years: editExperienceYears,
          starting_price: editStartingPrice,
          bio_experience: editBioExperience,
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert(error.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  const roundedClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const roleBadgeColor = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    provider: 'bg-blue-100 text-blue-800 border-blue-200',
    customer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[user?.role || 'customer'];

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Hidden File Input for Choose Profile Picture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Avatar Button Trigger */}
      <button
        type="button"
        id="profile-picture-trigger-btn"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={`relative block ${sizeClasses} ${roundedClasses} overflow-hidden ring-2 ring-slate-200 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer group shadow-xs`}
        title="Profile photo options"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <img
          src={profilePhoto}
          alt={profileName}
          className="w-full h-full object-cover"
        />
        {/* Subtle hover overlay */}
        <span className={`absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white`}>
          <Camera className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        </span>
        {isUploading && (
          <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
            ...
          </span>
        )}
      </button>

      {/* Dropdown Menu with 2 Options */}
      {isMenuOpen && (
        <div
          id="profile-picture-options-menu"
          className={`absolute ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
            <div className="text-xs font-bold text-slate-900 truncate">{profileName}</div>
            <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
          </div>

          {/* Option 1: See profile picture */}
          <button
            type="button"
            id="see-profile-picture-btn"
            onClick={() => {
              setIsMenuOpen(false);
              setIsEditing(false);
              setIsViewerOpen(true);
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-blue-50 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-medium">See profile picture</span>
              <span className="block text-[10px] text-slate-400 font-normal">View in full size</span>
            </div>
          </button>

          {/* Option 2: Choose profile picture */}
          <button
            type="button"
            id="choose-profile-picture-btn"
            onClick={() => {
              setIsMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-emerald-50 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-medium">Choose profile picture</span>
              <span className="block text-[10px] text-slate-400 font-normal">Upload new photo</span>
            </div>
          </button>

          <button
            type="button"
            id="edit-profile-btn"
            onClick={() => {
              setIsMenuOpen(false);
              setIsViewerOpen(true);
              setIsEditing(true);
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-amber-50 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-medium">Edit profile</span>
              <span className="block text-[10px] text-slate-400 font-normal">
                {user?.role === 'provider' ? 'Name, area and work type' : 'Name'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Modal: See Profile Picture */}
      {isViewerOpen && (
        <div
          id="profile-picture-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsViewerOpen(false)}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm sm:max-w-md w-full border border-slate-200 animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Profile Picture</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
                >
                  {user?.role}
                </span>
              </div>
              <button
                type="button"
                id="close-profile-modal-btn"
                onClick={() => setIsViewerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Photo Body */}
            <div className="p-6 bg-slate-50 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-slate-200">
                <img
                  src={profilePhoto}
                  alt={profileName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <form onSubmit={handleSaveProfile} className="w-full mt-5 space-y-3 text-left">
                  <label className="block text-xs font-semibold text-slate-700">
                    Name
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} required minLength={2} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
                  </label>

                  <label className="block text-xs font-semibold text-slate-700">
                    Phone
                    <input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm" placeholder="Enter phone number" />
                  </label>

                  {user?.role === 'provider' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-700">
                        Work type
                        {categories.length > 0 ? (
                          <select value={editType} onChange={(event) => setEditType(event.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm">
                            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                          </select>
                        ) : (
                          <input value={editType} onChange={(event) => setEditType(event.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm" placeholder="e.g. Electrician" />
                        )}
                      </label>

                      <label className="block text-xs font-semibold text-slate-700">
                        Starting price (BDT)
                        <input
                          type="number"
                          min={0}
                          value={editStartingPrice}
                          onChange={(event) => setEditStartingPrice(Number(event.target.value) || 0)}
                          className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-700">
                        Experience years
                        <input
                          type="number"
                          min={0}
                          value={editExperienceYears}
                          onChange={(event) => setEditExperienceYears(Number(event.target.value) || 0)}
                          className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-700">
                        Experience summary
                        <textarea
                          value={editBioExperience}
                          onChange={(event) => setEditBioExperience(event.target.value)}
                          rows={3}
                          className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                          placeholder="Share your experience, certifications, and strengths"
                        />
                      </label>

                      <ServiceAreasEditor value={editServiceAreas} onChange={setEditServiceAreas} />

                      <div className="space-y-2">
                        <MapsLocationPicker
                          value={editLocation}
                          onChange={(coordinates) => setEditLocation(coordinates)}
                          onLocationNameResolved={setEditLocationName}
                        />
                        <label className="block text-xs font-semibold text-slate-700">
                          Location name
                          <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <input
                              value={editLocationName}
                              onChange={(event) => setEditLocationName(event.target.value)}
                              className="w-full bg-transparent text-sm outline-none"
                              placeholder="Enter the locality or area name"
                            />
                          </div>
                        </label>
                      </div>
                    </>
                  )}
                  <button type="submit" disabled={isSaving} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save profile'}
                  </button>
                </form>
              )}
              <div className="mt-4 text-center">
                <h3 className="text-base font-bold text-slate-900">{profileName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                id="modal-choose-picture-btn"
                onClick={() => {
                  setIsViewerOpen(false);
                  setIsEditing(false);
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Choose Profile Picture</span>
              </button>
              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
