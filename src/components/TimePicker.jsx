import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

const TimeColumn = ({
  items,
  selectedValue,
  onSelect,
  refs,
  isItemDisabled = () => false,
}) => {
  const [highlightStyle, setHighlightStyle] = useState({
    top: "50%",
    transform: "translateY(-50%)"
  });

  const getHighlightPosition = (selectedValue, items) => {
    if (selectedValue === null) {
      return { top: "50%", transform: "translateY(-50%)" };
    }

    const selectedIndex = items.findIndex(item => item.value === selectedValue);
    if (selectedIndex === -1) {
      return { top: "50%", transform: "translateY(-50%)" };
    }

    // Calculate position based on item index
    // Each button is roughly 36px tall (py-1.5 = 6px top + 6px bottom + text height)
    const itemHeight = 36;
    const containerPadding = 40; // py-10 = 40px top padding
    const itemTop = containerPadding + (selectedIndex * itemHeight) + (itemHeight / 2);

    return {
      top: `${itemTop}px`,
      transform: "translateY(-50%)"
    };
  };

  // Update highlight position when selection changes
  useEffect(() => {
    setHighlightStyle(getHighlightPosition(selectedValue, items));
  }, [selectedValue, items]);

  return (
    <div
      className="h-28 overflow-y-scroll no-scrollbar relative w-20 py-10"
      onScroll={(e) => e.stopPropagation()}
    >
      <div
        className="absolute w-full h-8 bg-yellow-200/50 rounded-lg border-y-2 border-yellow-300 pointer-events-none transition-all duration-300 ease-out z-0"
        style={highlightStyle}
      ></div>
      <div className="relative z-10">
        {items.map((item) => (
          <button
            key={item.value}
            ref={(el) => (refs.current[item.value] = el)}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(item.value);
            }}
            onFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            disabled={isItemDisabled(item.value)}
            className={`w-full py-1.5 text-base font-mono rounded-md transition-all duration-200 ${
              selectedValue === item.value
                ? "text-yellow-800 font-bold scale-110"
                : "text-yellow-600/70 hover:bg-yellow-100/50"
            } ${
              isItemDisabled(item.value) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const TimePicker = ({
  value,
  onAccept,
  onClose,
  minTime,
  maxTime,
  increment,
  disabledTimes = [],
  appointmentDuration = 60, // Default to 60 minutes if not provided
}) => {
  const [internalHour, setInternalHour] = useState(null);
  const [internalMinute, setInternalMinute] = useState(null);

  const hourRefs = useRef({});
  const minuteRefs = useRef({});

  const { hours, minutes: minuteOptions } = useMemo(() => {
    const [minHour] = minTime.split(":").map(Number);
    const [maxHour] = maxTime.split(":").map(Number);

    const h = [];
    for (let i = minHour; i <= maxHour; i++) {
      const displayHour = i % 12 === 0 ? 12 : i % 12;
      const ampm = i < 12 || i === 24 ? "AM" : "PM";
      h.push({ value: i, label: `${displayHour} ${ampm}` });
    }

    const m = [];
    for (let i = 0; i < 60; i += increment) {
      m.push({ value: i, label: String(i).padStart(2, "0") });
    }

    return { hours: h, minutes: m };
  }, [minTime, maxTime, increment]);

  // Parse initial value or set default
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setInternalHour(h);
      setInternalMinute(m);
    } else {
      const [defaultHour, defaultMinute] = minTime.split(":").map(Number);
      setInternalHour(defaultHour);
      setInternalMinute(defaultMinute);
    }
  }, [value, minTime]);

  const isMinuteDisabled = useCallback(
  (minute) => {
    const [minHour, minMinute] = minTime.split(":").map(Number);
    const [maxHour, maxMinute] = maxTime.split(":").map(Number);

    if (internalHour === minHour && minute < minMinute) return true;
    if (internalHour === maxHour && minute > maxMinute) return true;

    // Check if the proposed appointment slot overlaps with any disabled times
    const timeToMinutes = (h, m) => h * 60 + m;
    const startMinutes = timeToMinutes(internalHour, minute);
    const endMinutes = startMinutes + appointmentDuration;

    // Iterate through all 15-minute increments of the proposed appointment
    for (let m = startMinutes; m < endMinutes; m += increment) {
      const currentHour = Math.floor(m / 60);
      const currentMinute = m % 60;
      const timeString = `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`;

      // FIX: Check if this time string exists in disabledTimes array
      if (disabledTimes.includes(timeString)) {
        console.log(`Blocking time ${timeString} because it's disabled`);
        return true; // This slot overlaps with a disabled time
      }
    }
    return false;
  },
  [internalHour, minTime, maxTime, disabledTimes, appointmentDuration, increment]
);

  useEffect(() => {
    if (internalHour === null || internalMinute === null) return;
    const getValidMinutes = () =>
      minuteOptions.filter((m) => !isMinuteDisabled(m.value));
    const validMinutes = getValidMinutes().map((m) => m.value);
    if (!validMinutes.includes(internalMinute)) {
      const [minHour, minMinute] = minTime.split(":").map(Number);
      if (internalHour === minHour) {
        setInternalMinute(minMinute);
      } else {
        const [maxHour, maxMinute] = maxTime.split(":").map(Number);
        if (internalHour === maxHour) {
          setInternalMinute(maxMinute);
        }
      }
    }
  }, [
    internalHour,
    internalMinute,
    isMinuteDisabled,
    minTime,
    maxTime,
    minuteOptions,
  ]);

  const handleAccept = () => {
    onAccept(
      `${String(internalHour).padStart(2, "0")}:${String(
        internalMinute
      ).padStart(2, "0")}`
    );
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-center p-2 bg-yellow-50 border-b border-yellow-200">
        <div className="flex items-center space-x-1">
          <TimeColumn
            items={hours}
            selectedValue={internalHour}
            onSelect={setInternalHour}
            refs={hourRefs}
          />
          <span className="text-xl font-bold text-yellow-500">:</span>
          <TimeColumn
            items={minuteOptions}
            selectedValue={internalMinute}
            onSelect={setInternalMinute}
            refs={minuteRefs}
            isItemDisabled={isMinuteDisabled}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 p-3 bg-gray-50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors shadow-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default TimePicker;
