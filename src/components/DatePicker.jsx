import { useState, useRef, useEffect } from "react";
import { format, addDays, parse, isAfter, isBefore, startOfDay } from "date-fns";
import { FiCalendar } from "react-icons/fi";
const DatePicker = ({ value, onChange, minDate, disabled, errors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const containerRef = useRef(null);

  const min = new Date(minDate);
  const selected = value ? new Date(value) : null;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day) => {
    const selected = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    );

    // Format as YYYY-MM-DD for database
    const formattedDate = format(selected, "yyyy-MM-dd");
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1)
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDay = getFirstDayOfMonth(displayMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        displayMonth.getFullYear(),
        displayMonth.getMonth(),
        day
      );
      const isDisabled = isBefore(date, min);
      const isSelected =
        selected &&
        selected.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`p-2 text-sm rounded transition-colors ${
            isDisabled
              ? "text-gray-300 cursor-not-allowed"
              : isSelected
              ? "bg-yellow-500 text-white font-bold"
              : "hover:bg-yellow-100 text-gray-700"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative group" ref={containerRef}>
      <FiCalendar className="absolute left-4 top-4 text-yellow-400 text-xl pointer-events-none z-10" />

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 font-medium text-yellow-700 bg-white ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-gray-100 border-gray-200"
            : "cursor-pointer hover:border-yellow-300"
        }`}
      >
        {selected ? format(selected, "MM/dd/yyyy") : "MM/DD/YYYY"}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-72 bg-white border-2 border-yellow-300 rounded-lg shadow-lg p-4">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-yellow-100 rounded transition-colors"
            >
              ←
            </button>
            <h3 className="font-bold text-gray-800">
              {format(displayMonth, "MMMM yyyy")}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-yellow-100 rounded transition-colors"
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}

      {errors && (
        <p className="text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
          <FiInfo className="inline" />
          {errors}
        </p>
      )}
    </div>
  );
};

export default DatePicker;
