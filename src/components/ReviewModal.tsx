import React, { useState } from 'react';
import { X, Star, AlertCircle, MessageSquare } from 'lucide-react';
import { Booking } from '../types.ts';
import { api } from '../services/api.ts';

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.submitReview({
        booking_id: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });

      onReviewSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rate & Review Job</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Service: <strong className="text-slate-800">{booking.provider_name}</strong> ({booking.category_name})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Star Selection */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Star Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => (
                <button
                  key={starVal}
                  type="button"
                  id={`star-btn-${starVal}`}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starVal)}
                  className="p-1.5 transition transform hover:scale-110 cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      starVal <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              {rating === 5
                ? '⭐⭐⭐⭐⭐ Outstanding (5/5)'
                : rating === 4
                ? '⭐⭐⭐⭐ Great Work (4/5)'
                : rating === 3
                ? '⭐⭐⭐ Average (3/5)'
                : rating === 2
                ? '⭐⭐ Below Expectations (2/5)'
                : '⭐ Poor (1/5)'}
            </span>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Review / Feedback
            </label>
            <textarea
              id="review-comment-input"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the provider punctual? Did they clean up after the job? Share your experience..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-review-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
