import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Filter,
  DollarSign,
  Compass,
  SlidersHorizontal,
  Clock,
  Briefcase,
  ChevronRight,
  Zap,
  Droplets,
  Wind,
  Scissors,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { Category, ProviderProfile } from '../types.ts';
import { api } from '../services/api.ts';

interface ProviderSearchProps {
  onSelectProvider: (provider: ProviderProfile) => void;
  onBookProvider: (provider: ProviderProfile) => void;
}

export const ProviderSearch: React.FC<ProviderSearchProps> = ({ onSelectProvider, onBookProvider }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [minRating, setMinRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([200, 2000]);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Customer geolocation reference for Khulna City.
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number; areaName: string }>({
    lat: 22.8456,
    lng: 89.5403,
    areaName: 'Khulna City',
  });

  const popularAreas = [
    'All Areas',
    'Sonadanga',
    'Khalishpur',
    'Daulatpur',
    'Boyra',
    'Khan Jahan Ali',
    'Rupsha',
  ];

  // Fetch Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catList = await api.getCategories();
        setCategories(catList);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Providers based on filters
  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const data = await api.searchProviders({
        query: searchQuery || undefined,
        category_slug: selectedCategory || undefined,
        area: selectedArea && selectedArea !== 'All Areas' ? selectedArea : undefined,
        max_distance: maxDistance,
        min_rating: minRating > 0 ? minRating : undefined,
        price_min: priceRange[0],
        price_max: priceRange[1],
        verified_only: verifiedOnly ? 'true' : undefined,
        customer_lat: customerLocation.lat,
        customer_lng: customerLocation.lng,
      });
      setProviders(data);
    } catch (err) {
      console.error('Failed to search providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, selectedArea, maxDistance, minRating, priceRange, verifiedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders();
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-cyan-500" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-blue-500" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5 text-rose-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      default:
        return <Wrench className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Search Header */}
      <div className="bg-linear-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur-xs mb-4 border border-blue-400/20">
            <Compass className="w-3.5 h-3.5" /> Hyper-Local Direct Matching
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            Find a trusted service provider near you.
          </h1>
          <p className="text-blue-100 text-base sm:text-lg mb-6 leading-relaxed">
            Connect directly with verified electricians, plumbers, AC technicians, tailors, and tutors.
            Real-time proximity calculations, secure online payment, and verified customer reviews.
          </p>

          {/* Search Form Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="search-provider-input"
                type="text"
                placeholder="Search by skill, service or provider name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div className="relative sm:w-56">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                id="search-area-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-white rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs appearance-none cursor-pointer"
              >
                {popularAreas.map((area) => (
                  <option key={area} value={area === 'All Areas' ? '' : area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="search-submit-btn"
              type="submit"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Search</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* User Location Chip */}
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-200">
            <MapPin className="w-3.5 h-3.5 text-blue-300" />
            <span>Calculating distance from: <strong className="text-white">{customerLocation.areaName}</strong></span>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Popular Service Categories</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.slug}`}
                onClick={() => setSelectedCategory(isSelected ? '' : cat.slug)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="mb-2 p-2 rounded-xl bg-slate-100 w-fit inline-block">
                  {getCategoryIcon(cat.icon)}
                </div>
                <div>
                  <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {cat.name}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {cat.provider_count || 0} providers
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Results Layout with Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filter Providers</span>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedArea('');
                  setMaxDistance(20);
                  setMinRating(0);
                  setPriceRange([200, 2000]);
                  setVerifiedOnly(false);
                }}
                className="text-xs text-slate-500 hover:text-blue-600 cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Verified Only Toggle */}
            <div className="mb-5 pb-4 border-b border-slate-100">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Badge Only
                </span>
                <input
                  id="verified-only-checkbox"
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Max Distance Slider */}
            <div className="mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Max Distance (km)
                </label>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Up to {maxDistance} km
                </span>
              </div>
              <input
                id="max-distance-slider"
                type="range"
                min="1"
                max="30"
                step="1"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 km</span>
                <span>15 km</span>
                <span>30 km</span>
              </div>
            </div>

            {/* Minimum Star Rating */}
            <div className="mb-5 pb-4 border-b border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Minimum Rating
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 4.0, 4.5, 4.8].map((starVal) => (
                  <button
                    key={starVal}
                    onClick={() => setMinRating(starVal)}
                    className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      minRating === starVal
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {starVal === 0 ? (
                      'Any'
                    ) : (
                      <>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{starVal}+</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Starting Price (BDT)
                </label>
                <span className="text-xs font-bold text-slate-800">
                  ৳{priceRange[0]} - ৳{priceRange[1]}
                </span>
              </div>
              <input
                id="price-range-slider"
                type="range"
                min="200"
                max="2500"
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>৳200</span>
                <span>৳1,200</span>
                <span>৳2,500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Provider Results Grid */}
        <div className="lg:col-span-3">
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">
              Showing <strong className="text-slate-900">{providers.length}</strong> verified service providers near you
            </div>
            <div className="text-xs text-slate-500">
              Sorted by: <span className="font-semibold text-slate-700">Verified & Nearest Distance</span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No service providers found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                Try widening your distance radius, adjusting the category or price range filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedArea('');
                  setMaxDistance(30);
                  setMinRating(0);
                  setPriceRange([200, 2500]);
                  setVerifiedOnly(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  id={`provider-card-${provider.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Verified Badge, Rating */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <img
                        src={provider.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={provider.provider_name}
                        className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {provider.provider_name}
                          </h3>
                          {provider.is_verified && (
                            <span
                              title="FixMate Verified Service Provider"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-blue-600 mt-0.5">
                          {provider.category_name}
                        </div>

                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{provider.aggregate_rating > 0 ? provider.aggregate_rating.toFixed(1) : 'New'}</span>
                          </div>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 text-[11px]">
                            {provider.total_reviews} verified reviews
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {provider.bio}
                    </p>

                    {/* Meta Specs: Service Area, Distance, Starting Price */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs mb-4">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{provider.service_area}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold justify-end">
                        <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{provider.distance_km ?? 2.4} km away</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{provider.experience_years} yrs experience</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 font-bold justify-end">
                        <span className="text-[10px] font-normal text-slate-500">Starts at</span>
                        <span>৳{provider.starting_price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      id={`view-profile-btn-${provider.id}`}
                      onClick={() => onSelectProvider(provider)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      View Profile & Portfolio
                    </button>
                    <button
                      id={`book-now-btn-${provider.id}`}
                      onClick={() => onBookProvider(provider)}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
