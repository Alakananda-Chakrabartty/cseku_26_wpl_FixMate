import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  Compass,
  Briefcase,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
} from 'lucide-react';
import { ProviderProfile, Review } from '../types.ts';
import { api } from '../services/api.ts';

interface ProviderDetailModalProps {
  provider: ProviderProfile;
  onClose: () => void;
  onBookNow: (provider: ProviderProfile) => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  onClose,
  onBookNow,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  useEffect(() => {
    async function loadReviews() {
      setIsLoadingReviews(true);
      try {
        const data = await api.getProviderDetails(provider.id);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to load provider details:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    }
    loadReviews();
  }, [provider.id]);

  const portfolio = provider.portfolio_images && provider.portfolio_images.length > 0
    ? provider.portfolio_images
    : [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-start gap-4">
            <img
              src={provider.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={provider.provider_name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900">{provider.provider_name}</h2>
                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Provider
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{provider.category_name}</p>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{provider.aggregate_rating > 0 ? provider.aggregate_rating.toFixed(1) : 'New'}</span>
                  <span className="font-normal text-slate-400">({provider.total_reviews} reviews)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{provider.service_area}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'about' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Bio
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'portfolio' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Work Portfolio ({portfolio.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Verified Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Professional Bio
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {provider.bio}
                </p>
              </div>

              {/* Service Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Briefcase className="w-3.5 h-3.5" /> Experience
                  </div>
                  <div className="text-sm font-bold text-slate-900">{provider.experience_years} Years Active</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Compass className="w-3.5 h-3.5" /> Distance
                  </div>
                  <div className="text-sm font-bold text-slate-900">{provider.distance_km ?? 2.4} km away</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verification
                  </div>
                  <div className="text-sm font-bold text-emerald-700">
                    {provider.is_verified ? 'NID & Trade License Verified' : 'Under Review'}
                  </div>
                </div>
              </div>

              {/* Service Guarantees */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2 text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> FixMate Service Protection
                </div>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-[11px]">
                  <li>Automated platform escrow: provider receives payout only after job completion.</li>
                  <li>Real-time conflict prevention ensures your selected slot is guaranteed.</li>
                  <li>Transparent billing itemizing Platform Fee and Provider Net Earning.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Completed Job Photographs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolio.map((imgUrl, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs group relative">
                    <img
                      src={imgUrl}
                      alt={`Portfolio work ${idx + 1}`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 text-white text-xs font-medium">
                      <span>Verified Completed Job #{idx + 101}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ratings & Reviews from Completed Bookings
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {reviews.length} total reviews
                </span>
              </div>

              {isLoadingReviews ? (
                <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
                  Loading verified reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No reviews submitted yet for this provider.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.customer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={rev.customer_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-bold text-slate-800">{rev.customer_name || 'Verified Customer'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Book Slot trigger */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Starting Service Fee</div>
            <div className="text-xl font-extrabold text-emerald-700">৳{provider.starting_price}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              id="modal-book-slot-btn"
              onClick={() => {
                onClose();
                onBookNow(provider);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Time Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
