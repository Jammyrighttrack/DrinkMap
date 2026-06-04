import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, StarIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { submitReview, selectIsSubmitting, selectSubmitError, clearSubmitError } from '../reviewsSlice';

const TASTE_TAG_OPTIONS = [
  'Đắng vừa', 'Ngọt vừa', 'Chua nhẹ', 'Đậm đà', 'Thanh mát',
  'Béo ngậy', 'Thơm', 'Nhẹ nhàng', 'Mạnh mẽ', 'Sạch vị',
];

const STAR_LABELS = ['', 'Tệ', 'Không thích', 'Bình thường', 'Thích', 'Tuyệt vời'];

/**
 * WriteReviewModal - Modal viết đánh giá cho quán nước
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {Function} onClose - Hàm đóng modal
 * @param {string} shopId - ID của quán
 * @param {string} shopName - Tên quán (hiển thị trong modal)
 * @param {Function} onSuccess - Callback sau khi gửi thành công (refresh reviews)
 */
export function WriteReviewModal({ isOpen, onClose, shopId, shopName, onSuccess }) {
  const dispatch = useDispatch();
  const isSubmitting = useSelector(selectIsSubmitting);
  const submitError = useSelector(selectSubmitError);

  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleClose = () => {
    if (isSubmitting) return;
    // Reset state
    setHoveredStar(0);
    setSelectedStar(0);
    setComment('');
    setSelectedTags([]);
    setSuccessMessage('');
    dispatch(clearSubmitError());
    onClose();
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStar === 0) return;

    try {
      await dispatch(
        submitReview({
          shopId,
          rating: selectedStar,
          comment: comment.trim() || undefined,
          tasteTags: selectedTags,
        })
      ).unwrap();

      setSuccessMessage('Cảm ơn bạn đã đánh giá! ✨');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch {
      // Error is handled by Redux state (submitError)
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">Viết đánh giá</h3>
                <p className="text-sm text-zinc-500 mt-0.5 truncate max-w-[220px]">{shopName}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-5">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setSelectedStar(star)}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                      <StarIcon
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoveredStar || selectedStar)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-200 fill-zinc-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className={`text-sm font-bold transition-opacity ${selectedStar || hoveredStar ? 'opacity-100 text-amber-500' : 'opacity-0'}`}>
                  {STAR_LABELS[hoveredStar || selectedStar]}
                </span>
                {selectedStar === 0 && (
                  <p className="text-xs text-zinc-400">Chọn số sao để đánh giá</p>
                )}
              </div>

              {/* Comment textarea */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Nhận xét của bạn
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về quán... (không bắt buộc)"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-[15px] text-zinc-800 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <div className="text-right text-[11px] text-zinc-400 mt-1">{comment.length}/500</div>
              </div>

              {/* Taste tags */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Hương vị cảm nhận
                </label>
                <div className="flex flex-wrap gap-2">
                  {TASTE_TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error or success message */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-semibold text-center">
                  {submitError}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-600 font-bold text-center">
                  {successMessage}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={selectedStar === 0 || isSubmitting}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Gửi đánh giá
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
