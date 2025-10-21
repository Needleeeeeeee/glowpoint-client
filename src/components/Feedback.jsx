import React, { useState } from "react";
import { FiX, FiStar, FiSend } from "react-icons/fi";
import { addFeedback as addFeedbackAction } from "./actions.js";
import { toast } from "react-toastify";

const Feedback = ({ isOpen, onClose, userName }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add this check with better visibility debugging
  if (!isOpen) {
    return null;
  }

  const handleCommentChange = (e) => {
    // Sanitize input to allow only letters, numbers, spaces, and specific punctuation
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s?!.,]/g, "");
    setComment(sanitizedValue);
  };

  const handleStarClick = (index) => {
    setRating(index);
  };

  const handleStarHover = (index) => {
    setHoverRating(index);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating before submitting.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { success } = await addFeedbackAction({
        rating,
        comment,
        from_user: userName,
      });
      setIsSubmitting(false);

      if (success) {
        toast.success("Thank you for your feedback!");
        setRating(0);
        setComment("");
        onClose();
      } else {
        toast.error("Sorry, we couldn't submit your feedback. Please try again.");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setIsSubmitting(false);
      toast.error("Sorry, we couldn't submit your feedback. Please try again.");
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <FiX size={24} />
        </button>
        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-[Poppins]">
          Share Your Feedback
        </h3>
        <p className="text-gray-500 mb-6">How was your experience with us?</p>

        <div className="mb-6">
          <p className="text-pink-700 font-medium mb-3 text-center">
            Your Rating
          </p>
          <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3, 4, 5].map((index) => (
              <FiStar
                key={index}
                size={36}
                className={`cursor-pointer transition-colors duration-200 ${
                  (hoverRating || rating) >= index
                    ? "text-pink-400"
                    : "text-gray-300"
                }`}
                onMouseEnter={() => handleStarHover(index)}
                onMouseLeave={() => handleStarHover(0)}
                onClick={() => handleStarClick(index)}
                style={{
                  fill:
                    (hoverRating || rating) >= index ? "currentColor" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label
            htmlFor="feedback-comment"
            className="block text-pink-700 text-lg font-medium mb-3"
          >
            Any comments? (Optional)
          </label>
          <div className="relative">
            <textarea
              id="feedback-comment"
              rows="4"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Tell us more about your experience..."
              className="w-full p-3 pr-14 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all duration-300 placeholder-pink-300 text-pink-700 font-medium resize-y"
              maxLength="500"
            ></textarea>
            <span className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
              {comment.length} / 500
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
