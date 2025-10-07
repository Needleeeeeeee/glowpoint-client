import Popover from "@mui/material/Popover";
import { addDays, format } from "date-fns";
import Cookies from "js-cookie";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  addAppointmentWithPayment as addAppointmentAction,
  addFailedAppointment,
  checkExistingAppointment,
  fetchBookedTimeSlots,
  fetchFullyBookedDates,
  fetchServicesAndConfig,
  finalizeCancellationWithPayment,
  processGCashPayment,
  sanitizeName,
  titleCase,
  updateAppointmentWithPayment as updateAppointmentAction,
  validateEmail,
  verifyGCashPayment,
} from "./actions.js";
import Modal from "./Modal.jsx";
import TimePicker from "./TimePicker.jsx";

import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiInfo,
  FiMail,
  FiPhone,
  FiStar,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { PAYMENT_CONFIG } from "./config.js";
import EnhancedPaymentModal from "./EnhancedPaymentModal.jsx";

const RECENTLY_BOOKED_APPOINTMENT_COOKIE = "recentlyBookedAppointment";

const normalizePhoneNumber = (input) => {
  if (!input) return "";
  // Remove all non-digit characters
  const cleaned = input.trim().replace(/\D/g, "");

  if (cleaned.startsWith("639") && cleaned.length === 12) {
    // Handles 639171234567 -> 9171234567
    return cleaned.substring(2);
  }
  if (cleaned.startsWith("09") && cleaned.length === 11) {
    // Handles 09171234567 -> 9171234567
    return cleaned.substring(1);
  }

  return cleaned;
};

const Contact = ({ recentlyBooked, setRecentlyBooked, onFeedbackClick }) => {
  const [errors, setError] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isRecentCancelModalOpen, setIsRecentCancelModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [isExistingCancelModalOpen, setIsExistingCancelModalOpen] =
    useState(false);
  const debounceCheckRef = useRef(null);
  const [existingAppointmentError, setExistingAppointmentError] =
    useState(null);
  const minDate = format(addDays(new Date(), 3), "yyyy-MM-dd");

  const [timeAnchorEl, setTimeAnchorEl] = useState(null);

  const handleTimeClick = (event) => {
    setTimeAnchorEl(event.currentTarget);
  };

  const handleTimeClose = () => {
    setTimeAnchorEl(null);
  };

  const timePickerOpen = Boolean(timeAnchorEl);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categorySelections, setCategorySelections] = useState({});

  // Service states
  const [allServices, setAllServices] = useState({});
  const [serviceConfig, setServiceConfig] = useState({
    categories: [],
    initialSelections: {},
  });
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationData, setCancellationData] = useState(null);
  const [paymentInstruction, setPaymentInstruction] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [wantsSms, setWantsSms] = useState(false);
  const [wantsEmail, setWantsEmail] = useState(false);

  useEffect(() => {
    const loadServicesAndConfig = async () => {
      setIsLoadingServices(true);
      const { serviceCategoriesConfig, servicesByCategory } =
        await fetchServicesAndConfig();

      if (serviceCategoriesConfig && servicesByCategory) {
        const initialSelections = serviceCategoriesConfig.reduce(
          (acc, config) => {
            if (config.type === "ExclusiveDropdown") {
              acc[config.category_key] = null;
            }
            return acc;
          },
          {}
        );

        setServiceConfig({
          categories: serviceCategoriesConfig,
          initialSelections,
        });
        setCategorySelections(initialSelections);
        setAllServices(servicesByCategory);
        console.log("Services and config loaded successfully");
      }
      setIsLoadingServices(false);
    };
    loadServicesAndConfig();
  }, []);

  useEffect(() => {
    const loadFullyBookedDates = async () => {
      const dates = await fetchFullyBookedDates();
      if (dates) {
        setFullyBookedDates(dates);
      }
    };
    loadFullyBookedDates();
  }, []);

  useEffect(() => {
    const doCheck = async () => {
      // Don't run this check if we're already in a reschedule flow
      if (rescheduleData) {
        return;
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      if (!date || !/^9\d{9}$/.test(normalizedPhone)) {
        setExistingAppointmentError(null);
        return;
      }

      const existing = await checkExistingAppointment(normalizedPhone, date);
      setExistingAppointmentError(existing);
    };

    // Clear any existing timer
    if (debounceCheckRef.current) {
      clearTimeout(debounceCheckRef.current);
    }

    if (phone && date && !rescheduleData) {
      debounceCheckRef.current = setTimeout(doCheck, 500);
    } else {
      // If inputs are invalid or we are rescheduling, clear the error immediately
      setExistingAppointmentError(null);
    }
  }, [phone, date, rescheduleData]);

  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!date) {
        setBookedSlots([]);
        return;
      }
      if (fullyBookedDates.includes(date)) {
        setError((prev) => ({
          ...prev,
          date: "This date is fully booked. Please select another.",
        }));
        setBookedSlots([]);
        return;
      } else if (
        errors.date === "This date is fully booked. Please select another."
      ) {
        setError((prev) => {
          const newErrors = { ...prev };
          delete newErrors.date;
          return newErrors;
        });
      }

      setIsLoadingSlots(true);
      const slots = await fetchBookedTimeSlots(date);
      setBookedSlots(slots || []);
      setIsLoadingSlots(false);
    };

    loadBookedSlots();
  }, [date, fullyBookedDates]);

  const calculateTotalPrice = useCallback(() => {
    let total = 0;

    const allServicesList = Object.values(allServices).flat();

    selectedServices.forEach((serviceName) => {
      const service = allServicesList.find(
        (s) => `${s.service} - ${titleCase(s.category)}` === serviceName
      );
      if (service && service.price) {
        const price = parseFloat(service.price);
        if (!isNaN(price)) total += price;
      }
    });

    return total;
  }, [selectedServices, allServices]);

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedServices, calculateTotalPrice]);

  const disabledTimes = useMemo(() => {
    if (!bookedSlots.length) {
      return [];
    }

    const disabled = new Set();
    const blockDuration = 60; // 1 hour in minutes

    const timeToMinutes = (t) => {
      if (!t) return 0;
      const [hours, minutes] = t.split(":").map(Number);
      return hours * 60 + minutes;
    };

    bookedSlots.forEach((slot) => {
      const startMinutes = timeToMinutes(slot);
      const endMinutes = startMinutes + blockDuration;
      const increment = 15;
      const minTimeMinutes = timeToMinutes("11:00");
      const maxTimeMinutes = timeToMinutes("18:00");

      for (let m = minTimeMinutes; m <= maxTimeMinutes; m += increment) {
        if (m >= startMinutes && m < endMinutes) {
          const hours = Math.floor(m / 60);
          const minutes = m % 60;
          const timeString = `${String(hours).padStart(2, "0")}:${String(
            minutes
          ).padStart(2, "0")}`;
          disabled.add(timeString);
        }
      }
    });

    return Array.from(disabled);
  }, [bookedSlots]);

  useEffect(() => {
    if (time && disabledTimes.includes(time)) {
      setTime("");
      toast.warn(
        "The previously selected time is now unavailable. Please choose a new time."
      );
    }
  }, [time, disabledTimes]);

  // Effect to clear any dependent add-ons when their parent is unselected
  useEffect(() => {
    const dependencies = serviceConfig.categories.filter(
      (c) => c.type === "AddOnDropdown" && c.depends_on
    );

    if (dependencies.length === 0) return;

    setSelectedServices((currentSelectedServices) => {
      let newSelectedServices = [...currentSelectedServices];
      let changed = false;

      dependencies.forEach((config) => {
        if (!categorySelections[config.depends_on]) {
          const addOnServiceNames = (allServices[config.db_category] || []).map(
            (s) => `${s.service} - ${titleCase(s.category)}`
          );

          const originalLength = newSelectedServices.length;
          newSelectedServices = newSelectedServices.filter(
            (s) => !addOnServiceNames.includes(s)
          );
          if (newSelectedServices.length < originalLength) {
            changed = true;
          }
        }
      });

      return changed ? newSelectedServices : currentSelectedServices;
    });
  }, [categorySelections, allServices, serviceConfig.categories]);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any dropdown
      if (!event.target.closest(".dropdown-container")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (category) => {
    console.log("Toggle dropdown:", category); // Debug log
    setActiveDropdown(activeDropdown === category ? null : category);
  };

  // Handle exclusive category selection
  const handleCategorySelection = (category, service) => {
    console.log("Category selection:", category, service.service); // Debug log

    const currentSelection = categorySelections[category];
    const serviceString = `${service.service} - ${titleCase(service.category)}`;

    if (currentSelection && currentSelection.service === service.service) {
      // Unselect if clicking the same service
      setCategorySelections((prev) => ({ ...prev, [category]: null }));
      setSelectedServices((prev) => prev.filter((s) => s !== serviceString));
    } else {
      // A new service is selected in this category
      let newSelectedServices = [...selectedServices];

      // Remove previous selection from this category if it exists
      if (currentSelection) {
        const oldServiceString = `${currentSelection.service} - ${titleCase(
          currentSelection.category
        )}`;
        newSelectedServices = newSelectedServices.filter(
          (s) => s !== oldServiceString
        );
      }

      // Add new selection
      newSelectedServices.push(serviceString);

      setCategorySelections((prev) => ({ ...prev, [category]: service }));
      setSelectedServices(newSelectedServices);
    }

    // Close dropdown after selection
    setActiveDropdown(null);
  };

  // Handle add-on services
  const handleAddOnSelection = (service) => {
    console.log("Add-on selection:", service.service); // Debug log
    const serviceString = `${service.service} - ${titleCase(service.category)}`;

    setSelectedServices((prev) =>
      prev.includes(serviceString)
        ? prev.filter((s) => s !== serviceString)
        : [...prev, serviceString]
    );
  };

  // Clear all selections function
  const clearAllSelections = () => {
    setCategorySelections(serviceConfig.initialSelections || {});
    setSelectedServices([]);
    setActiveDropdown(null);

    toast.info("All selections cleared", {
      position: "bottom-right",
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  };
  // Check if any services are selected
  const hasAnySelections = () => {
    return (
      selectedServices.length > 0 ||
      Object.values(categorySelections).some((selection) => selection !== null)
    );
  };

  const getSelectedServiceName = (category, label) => {
    const selected = categorySelections[category];
    if (!selected) return `Select ${label}`;
    return selected.service;
  };

  const clearCategorySelection = (category, e) => {
    e.stopPropagation();
    const currentSelection = categorySelections[category];
    if (currentSelection) {
      const serviceString = `${currentSelection.service} - ${titleCase(
        currentSelection.category
      )}`;
      setCategorySelections((prev) => ({ ...prev, [category]: null }));
      setSelectedServices((prev) => prev.filter((s) => s !== serviceString));
    }
  };

  const handleNameChange = (e) => {
    const rawValue = e.target.value;
    const sanitized = rawValue
      .replace(/[^a-zA-Z\s'-]/g, "") // Remove invalid characters as user types
      .replace(/\s{3,}/g, "  ") // Limit excessive spaces
      .substring(0, 50); // Limit length

    setName(sanitized);
  };

  const validateForm = useCallback(() => {
    const errors = {};
    // Sanitize and validate name
    const sanitizedName = sanitizeName(name);

    if (!sanitizedName.trim()) {
      errors.name = "Name is required.";
    } else if (sanitizedName.length < 2) {
      errors.name = "Name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s'-]+$/.test(sanitizedName)) {
      errors.name =
        "Name can only contain letters, spaces, hyphens, and apostrophes.";
    }

    if (!wantsSms && !wantsEmail) {
      errors.notifications = "Please select at least one notification method.";
    }

    if (wantsSms) {
      if (!phone.trim()) {
        errors.phone = "Phone number is required for SMS notifications.";
      }
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!/^9\d{9}$/.test(normalizedPhone)) {
        errors.phone =
          "Please enter a valid PH mobile number (e,g,. 0917123456).";
      }
    }
    if (wantsEmail) {
      if (!email.trim()) {
        errors.email = "Email is required for email notifications.";
      } else if (!validateEmail(email)) {
        errors.email = "Please enter a valid email address.";
      }
    }
    if (selectedServices.length === 0)
      errors.services = "Please select at least one service.";
    if (!date) errors.date = "Date is required.";
    if (!time) errors.time = "Time is required.";

    return errors;
  }, [name, phone, email, selectedServices, date, time, wantsSms, wantsEmail]);
  const toggleServices = useCallback((service) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (existingAppointmentError && !rescheduleData) {
      toast.error(existingAppointmentError.message, { autoClose: 4000 });
      return;
    }
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setError(validationErrors);
      return;
    }
    setError({});
    const finalSanitizedName = sanitizeName(name);
    const normalizedPhone = normalizePhoneNumber(phone);
    setFormData({
      name: finalSanitizedName,
      phone: normalizedPhone,
      email,
      date,
      time,
      selectedServices,
      totalPrice,
    });
    if (name !== finalSanitizedName) {
      setName(finalSanitizedName); // Update UI to show sanitized name
    }
    setIsModalOpen(true);
  };

  const handlePaymentConfirmation = async (gcashReference) => {
    if (!paymentInstruction || (!formData && !cancellationData)) return;

    setIsProcessing(true);

    try {
      const verificationResult = await verifyGCashPayment(
        paymentInstruction.referenceNumber,
        gcashReference
      );

      if (!verificationResult.success) {
        toast.error(verificationResult.error || "Failed to verify payment.");
        setIsProcessing(false);
        return;
      }

      const paymentData = {
        referenceNumber: paymentInstruction.referenceNumber,
        gcashReference: gcashReference,
        amount: paymentInstruction.amount,
        payment_id: gcashReference
      };

      let result;
      let successMessage;

      if (paymentInstruction.paymentType === "cancellation") {
        if (!cancellationData) throw new Error("Cancellation data not found.");
        result = await finalizeCancellationWithPayment(
          cancellationData.appointmentId,
          paymentData
        );
        successMessage =
          "Cancellation fee submitted. Your appointment will be cancelled shortly.";
        if (result.success) {
          setRecentlyBooked(null);
          Cookies.remove(RECENTLY_BOOKED_APPOINTMENT_COOKIE);
        }
      } else if (rescheduleData) {
        result = await updateAppointmentAction(
          rescheduleData.id,
          formData,
          paymentData
        );
        successMessage =
          "Reschedule fee submitted. Your appointment is pending verification.";
      } else {
        result = await addAppointmentAction(formData, paymentData);
        successMessage =
          "Booking successful! Your appointment is pending verification.";
      }

      if (result.error) {
        toast.error(
          result.error.message ||
            "An error occurred while saving your appointment."
        );
        await addFailedAppointment({
          ...(formData || cancellationData),
          reason: result.error.message,
        });
      } else {
        toast.success(successMessage);
        if (paymentInstruction.paymentType !== "cancellation" && result.data) {
          const appointmentDetails = {
            id: result.data.id,
            ...(formData || {}),
            ...result.data,
          };
          Cookies.set(
            RECENTLY_BOOKED_APPOINTMENT_COOKIE,
            JSON.stringify(appointmentDetails),
            { expires: new Date(appointmentDetails.Date) }
          );
          setRecentlyBooked(appointmentDetails);

        }
        // Reset form state
        setName("");
        setPhone("");
        setEmail("");
        setDate("");
        setTime("");
        setSelectedServices([]);
        setCategorySelections(serviceConfig.initialSelections || {});
        setRescheduleData(null);
        setFormData(null);
      }
    } catch (error) {
      console.error("Error during payment confirmation:", error);
      toast.error("An unexpected error occurred during confirmation.");
    } finally {
      setIsProcessing(false);
      setIsPaymentModalOpen(false);
      setPaymentInstruction(null);
      setCancellationData(null);
    }
  };

  const handleConfirmAppointment = async () => {
    setIsModalOpen(false);
    setIsProcessing(true);

    try {
      const amount = rescheduleData
        ? PAYMENT_CONFIG.bookingFee // Assuming reschedule fee is same as booking fee
        : PAYMENT_CONFIG.bookingFee;

      const paymentResult = await processGCashPayment(formData, amount);

      if (paymentResult.success) {
        setPaymentInstruction(paymentResult.paymentInstruction);
        setIsPaymentModalOpen(true);
      } else {
        toast.error(
          paymentResult.error || "Failed to create payment instruction."
        );
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("An error occurred while preparing for payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAppointment = () => {
    setIsModalOpen(false);
    setFormData(null);
  };
  const handleCancelWithFee = async (appointmentData) => {
    setIsCancelling(true);
    setIsRecentCancelModalOpen(false);
    setIsExistingCancelModalOpen(false);

    try {
      const cancelData = {
        name: appointmentData.Name,
        phone: appointmentData.Phone,
        date: appointmentData.Date,
        time: appointmentData.Time,
        selectedServices: appointmentData.Services || [],
        totalPrice: appointmentData.Total || 0,
      };

      const paymentResult = await processGCashPayment(
        cancelData, PAYMENT_CONFIG.cancellationFee
      );

      if (paymentResult.success) {
        setCancellationData({
          appointmentId: appointmentData.id,
          ...cancelData,
        });
        setPaymentInstruction(paymentResult.paymentInstruction);
        setIsPaymentModalOpen(true);
      } else {
        toast.error(
          paymentResult.error ||
            "Failed to create cancellation payment instruction."
        );
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      toast.error("An error occurred during cancellation.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Also update the handleCancelRecentAppointment function to use the new fee system
  const handleCancelRecentAppointment = () => {
    if (!recentlyBooked) return;
    handleCancelWithFee(recentlyBooked);
    setIsRecentCancelModalOpen(false);
  };

  const handleRescheduleFromRecent = () => {
    if (!recentlyBooked) return;

    // Populate form with data from the recent appointment
    setName(recentlyBooked.Name);
    setPhone(recentlyBooked.Phone);
    setEmail(recentlyBooked.Email || "");
    setDate(recentlyBooked.Date);
    setTime(recentlyBooked.Time);
    setSelectedServices(recentlyBooked.Services);

    // Set the form to reschedule mode
    setRescheduleData({ id: recentlyBooked.id });

    // Hide the "recent appointment" card to avoid confusion
    setRecentlyBooked(null);

    // Scroll to the form and notify the user
    toast.info(
      "Your appointment details have been loaded. Please select a new date and/or time to reschedule."
    );
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  };

  const handleRescheduleClick = () => {
    if (existingAppointmentError) {
      setRescheduleData({ id: existingAppointmentError.id });
      setExistingAppointmentError(null);
      toast.info(
        "Please select a new date and/or time, then click 'Reschedule Appointment'."
      );
    }
  };

  const handleOpenExistingCancelModal = () => {
    setIsExistingCancelModalOpen(true);
  };

  const leftColumnCategories = serviceConfig.categories.filter(
    (c) => c.column === "left"
  );
  const rightColumnCategories = serviceConfig.categories.filter(
    (c) => c.column === "right"
  );
  const fullWidthCategories = serviceConfig.categories.filter(
    (c) => c.column === "full"
  );

  // Simplified dropdown component for exclusive categories
  const ExclusiveDropdown = ({ category, services, label }) => (
    <div className="mt-6">
      <label className="block text-yellow-700 text-lg font-medium mb-3">
        {label}
      </label>
      <div className="relative dropdown-container">
        <div
          onClick={() => toggleDropdown(category)}
          className="w-full flex items-center justify-between p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-150 hover:border-yellow-400 transition-all text-left"
        >
          <div className="flex items-center">
            <span className="font-medium text-base md:text-sm text-gray-800">
              {getSelectedServiceName(category, label)}
            </span>
            {categorySelections[category] && (
              <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-800 text-xs rounded-full">
                Selected
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {categorySelections[category] && (
              <button
                type="button"
                onClick={(e) => clearCategorySelection(category, e)}
                className="p-1 hover:bg-yellow-200 rounded-full transition-colors"
                title="Clear selection"
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <FiChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                activeDropdown === category ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {activeDropdown === category && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-yellow-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2">
              {services.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">
                  No services available
                </div>
              ) : (
                services.map((service) => {
                  const isSelected =
                    categorySelections[category]?.service === service.service;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleCategorySelection(category, service)}
                      className={`
                        w-full flex items-center mb-1 p-3 rounded-lg border-2 transition-all text-left
                        ${
                          isSelected
                            ? "bg-yellow-200 border-yellow-400 shadow-md"
                            : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300"
                        }
                      `}
                    >
                      <div
                        className={`w-5 h-5 mr-3 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "border-yellow-500 bg-yellow-50"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-grow flex justify-between items-center">
                        <span className="font-medium text-gray-800">
                          {service.service}
                        </span>
                        <span className="text-sm text-gray-500 font-semibold">
                          ₱{parseFloat(service.price).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Simplified dropdown component for add-on categories
  const AddOnDropdown = ({ category, services, label, disabled = false }) => {
    const selectedCount = services.filter((service) =>
      selectedServices.includes(
        `${service.service} - ${titleCase(service.category)}`
      )
    ).length;

    const disabledTitle = `Please select a main ${
      label.split(" ")[0]
    } service first.`;

    return (
      <div className="mt-6">
        <label className="block text-yellow-700 text-lg font-medium mb-3">
          {label}
        </label>
        <div className="relative dropdown-container">
          <div
            onClick={!disabled ? () => toggleDropdown(category) : undefined}
            className={`w-full flex items-center justify-between p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg transition-all text-left ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200"
                : "cursor-pointer hover:bg-yellow-150 hover:border-yellow-400"
            }`}
            title={disabled ? disabledTitle : ""}
          >
            <div className="flex items-center">
              <span className="font-medium text-base md:text-sm text-gray-800">
                {disabled ? `Select a main service first` : `Select ${label}`}
              </span>
              {selectedCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-800 text-xs rounded-full">
                  {selectedCount} selected
                </span>
              )}
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                !disabled && activeDropdown === category ? "rotate-180" : ""
              }`}
            />
          </div>

          {activeDropdown === category && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-yellow-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              <div className="p-2">
                {services.length === 0 ? (
                  <div className="p-3 text-gray-500 text-center">
                    No add-ons available
                  </div>
                ) : (
                  services.map((service) => {
                    const serviceString = `${service.service} - ${titleCase(
                      service.category
                    )}`;
                    const isSelected = selectedServices.includes(serviceString);

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleAddOnSelection(service)}
                        className={`
                        w-full flex mb-1 items-center p-3 rounded-lg border-2 transition-all text-left
                        ${
                          isSelected
                            ? "bg-yellow-200 border-yellow-400 shadow-md"
                            : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300"
                        }
                      `}
                      >
                        <div
                          className={`
                        w-5 h-5 mr-3 border-2 rounded flex items-center justify-center flex-shrink-0
                        ${
                          isSelected
                            ? "bg-yellow-500 border-yellow-500"
                            : "bg-white border-gray-300"
                        }
                      `}
                        >
                          {isSelected && (
                            <FiCheck className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-grow flex justify-between items-center">
                          <span className="font-medium text-gray-800">
                            {service.service}
                          </span>
                          <span className="text-sm text-gray-500 font-semibold">
                            ₱{parseFloat(service.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="contact"
      className="py-20 bg-yellow-50 min-h-screen px-4 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 font-[Poppins] bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent pb-4">
            Book Your Beauty Session
          </h2>
          <p className="text-yellow-600 text-lg sm:text-xl font-medium">
            Let us create your perfect beauty experience
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-yellow-100"
        >
          {/*Services */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <label className="block text-yellow-700 text-lg font-medium">
                Select Services
              </label>
            </div>

            {isLoadingServices ? (
              <div className="text-center py-10">
                <p className="text-yellow-600">Loading services...</p>
              </div>
            ) : (
              <>
                {/* Service Dropdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-0">
                    {leftColumnCategories.map((config) => {
                      const Component =
                        config.type === "ExclusiveDropdown"
                          ? ExclusiveDropdown
                          : AddOnDropdown;
                      return (
                        <Component
                          key={config.category_key}
                          category={config.category_key}
                          services={allServices[config.db_category] || []}
                          label={config.label}
                          disabled={
                            config.depends_on
                              ? !categorySelections[config.depends_on]
                              : false
                          }
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-0">
                    {rightColumnCategories.map((config) => {
                      const Component =
                        config.type === "ExclusiveDropdown"
                          ? ExclusiveDropdown
                          : AddOnDropdown;
                      return (
                        <Component
                          key={config.category_key}
                          category={config.category_key}
                          services={allServices[config.db_category] || []}
                          label={config.label}
                          disabled={
                            config.depends_on
                              ? !categorySelections[config.depends_on]
                              : false
                          }
                        />
                      );
                    })}
                  </div>
                </div>
                {/* Separate from grid for perfect symmetry */}
                {fullWidthCategories.map((config) => {
                  const Component =
                    config.type === "ExclusiveDropdown"
                      ? ExclusiveDropdown
                      : AddOnDropdown;
                  return (
                    <div className="mt-6" key={config.category_key}>
                      <Component
                        category={config.category_key}
                        services={allServices[config.db_category] || []}
                        label={config.label}
                        disabled={
                          config.depends_on
                            ? !categorySelections[config.depends_on]
                            : false
                        }
                      />
                    </div>
                  );
                })}
              </>
            )}
            {errors.services && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <FiInfo className="inline" />
                {errors.services}
              </p>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="mt-6">
            <label className="block text-yellow-700 text-lg font-medium mb-3">
              Notification Preferences
            </label>
            <div className="space-y-3 rounded-xl border-2 border-yellow-100 p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsSms}
                  onChange={(e) => setWantsSms(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-3 text-gray-700 font-medium">
                  Receive SMS notifications and reminders
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsEmail}
                  onChange={(e) => setWantsEmail(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-3 text-gray-700 font-medium">
                  Receive email notifications and reminders
                </span>
              </label>
            </div>
            {errors.notifications && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <FiInfo className="inline" />
                {errors.notifications}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
            {/*Name */}
            <div className="relative group">
              <FiUser className="absolute left-4 top-4 text-yellow-400 text-xl" />
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={handleNameChange}
                onBlur={() => setName(sanitizeName(name))}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 placeholder-yellow-300 text-yellow-700 font-medium"
                autoFocus
              />
              {errors.name && (
                <p className=" text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
                  <FiInfo className="inline" />
                  {errors.name}
                </p>
              )}
            </div>

            {/*Phone */}
            <div className="relative group">
              <FiPhone className="absolute left-4 top-4 text-yellow-400 text-xl" />
              <input
                disabled={!wantsSms}
                type="tel"
                placeholder="e.g., 09171234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 placeholder-yellow-300 text-yellow-700 font-medium ${!wantsSms ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.phone && (
                <p className=" text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
                  <FiInfo className="inline" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative group md:col-span-2">
              <FiMail className="absolute left-4 top-4 text-yellow-400 text-xl" />
              <input
                disabled={!wantsEmail}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 placeholder-yellow-300 text-yellow-700 font-medium ${!wantsEmail ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
                  <FiInfo className="inline" /> {errors.email}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="relative group">
              <FiCalendar className="absolute left-4 top-4 text-yellow-400 text-xl" />
              <input
                disabled={!!existingAppointmentError && !rescheduleData}
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 placeholder-yellow-300 text-yellow-700 font-medium ${
                  !!existingAppointmentError && !rescheduleData
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
              {errors.date && (
                <p className=" text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
                  <FiInfo className="inline" />
                  {errors.date}
                </p>
              )}
            </div>

            {/* Time */}
            <div className="relative group">
              <FiClock className="absolute left-4 top-4 text-yellow-400 text-xl pointer-events-none z-10" />
              <button
                disabled={
                  !date ||
                  isLoadingSlots ||
                  (!!existingAppointmentError && !rescheduleData)
                }
                type="button"
                onClick={handleTimeClick}
                className={`w-full text-left pl-12 pr-4 py-4 rounded-xl border-2 border-yellow-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 placeholder-yellow-300 text-yellow-700 font-medium bg-white ${
                  !date ||
                  isLoadingSlots ||
                  (!!existingAppointmentError && !rescheduleData)
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                {(() => {
                  if (!date) return "Select a date first";
                  if (isLoadingSlots) return "Loading available times...";
                  if (time)
                    return format(new Date(`2000-01-01T${time}`), "h:mm a");
                  return "Select a time";
                })()}
              </button>
              {errors.time && (
                <p className=" text-red-400 text-sm mt-1 ml-2 flex items-center gap-1">
                  <FiInfo className="inline" />
                  {errors.time}
                </p>
              )}
              <Popover
                open={timePickerOpen}
                anchorEl={timeAnchorEl}
                onClose={handleTimeClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
              >
                <TimePicker
                  value={time}
                  onAccept={setTime}
                  onClose={handleTimeClose}
                  minTime="11:00"
                  maxTime="19:00"
                  increment={15}
                  disabledTimes={disabledTimes}
                />
              </Popover>
            </div>
          </div>

          {/* Selected Services Summary */}
          {hasAnySelections() && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-yellow-700 font-medium">
                  Selected Services ({selectedServices.length}):
                </p>
                <button
                  type="button"
                  onClick={clearAllSelections}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 border border-red-300 rounded-lg transition-all duration-200 text-sm font-medium"
                  title="Clear all selections"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedServices.map((serviceWithCategory, index) => {
                  const allServicesList = Object.values(allServices).flat();
                  const serviceData = allServicesList.find(
                    (s) =>
                      `${s.service} - ${titleCase(s.category)}` ===
                      serviceWithCategory
                  );

                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full"
                      title={
                        serviceData
                          ? `₱${parseFloat(serviceData.price).toFixed(2)}`
                          : ""
                      }
                    >
                      {serviceWithCategory} (₱
                      {serviceData
                        ? parseFloat(serviceData.price).toFixed(2)
                        : "0.00"}
                      )
                    </span>
                  );
                })}
              </div>

              {/* Payment Structure Summary */}
              <div className="border-t border-yellow-300 pt-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-yellow-700">
                      Total Service Cost:
                    </span>
                    <span className="text-lg font-bold text-yellow-700">
                      ₱{totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">
                          Appointment Fee (Online):
                        </span>
                        <span className="font-semibold text-blue-700">
                          ₱100.00
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">
                          Balance (Pay at venue):
                        </span>
                        <span className="font-semibold text-blue-700">
                          ₱{Math.max(0, totalPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        <FiInfo className="inline mr-1" />
                        Secure your appointment with ₱100. Pay remaining balance
                        at the venue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!existingAppointmentError && (
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full mt-4 sm:mt-6 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-yellow-200 hover:scale-[1.02] transition-all duration-300 ${
                isProcessing ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isProcessing
                ? "Processing..."
                : rescheduleData
                ? "Reschedule Appointment"
                : "Book Appointment"}
            </button>
          )}
        </form>

        {/* UI for Recently Booked Appointment */}
        {recentlyBooked && !existingAppointmentError && !rescheduleData && (
          <div className="mt-8 bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-green-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 font-[Poppins]">
                {recentlyBooked.status === "success"
                  ? "Your Past Appointment"
                  : "Your Upcoming Appointment"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {recentlyBooked.status === "success"
                  ? "Thank you for choosing us! We would love to hear your feedback."
                  : "Here are the details of your upcoming appointment. You can reschedule or cancel it here."}
              </p>
            </div>

            {/* Appointment Details */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2 text-sm text-gray-700">
              <p>
                <strong>Name:</strong> {recentlyBooked.Name}
              </p>
              <p>
                <strong>Phone:</strong> {recentlyBooked.Phone}
              </p>
              <p>
                <strong>Email:</strong> {recentlyBooked.Email || "Not provided"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {format(new Date(recentlyBooked.Date), "MMMM d, yyyy")}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {format(
                  new Date(`2000-01-01T${recentlyBooked.Time}`),
                  "h:mm a"
                )}
              </p>
              <div>
                <p>
                  <strong>Services:</strong>
                </p>
                <ul className="list-disc list-inside ml-4">
                  {recentlyBooked.Services ? (
                    Array.isArray(recentlyBooked.Services) ? (
                      recentlyBooked.Services.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))
                    ) : typeof recentlyBooked.Services === "string" ? (
                      <li>{recentlyBooked.Services}</li>
                    ) : (
                      <li>Services not available</li>
                    )
                  ) : (
                    <li>No services listed</li>
                  )}
                </ul>
              </div>
              <p className="pt-2 font-bold text-base text-right">
                <strong>Total:</strong> ₱{recentlyBooked.Total?.toFixed(2)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {recentlyBooked.status === "success" ? (
                <button
                  onClick={onFeedbackClick}
                  className="sm:col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors shadow-sm hover:shadow-md"
                >
                  <FiStar />
                  Leave Feedback
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsRecentCancelModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <FiTrash2 />
                    Cancel Appointment
                  </button>
                  <button
                    onClick={handleRescheduleFromRecent}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <FiCalendar />
                    Reschedule
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* UI for Existing Appointment */}
        {existingAppointmentError &&
          existingAppointmentError.details &&
          !rescheduleData && (
            <div className="mt-8 bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-yellow-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 font-[Poppins]">
                  Your Upcoming Appointment
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {existingAppointmentError.message} You can reschedule to a
                  different time/day or cancel it below.
                </p>
              </div>

              {/* Appointment Details */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Name:</strong>{" "}
                  {existingAppointmentError.details.Name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {existingAppointmentError.details.Email || "Not provided"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {date ? format(new Date(date), "MMMM d, yyyy") : "N/A"}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {existingAppointmentError.details.Time
                    ? format(
                        new Date(
                          `2000-01-01T${existingAppointmentError.details.Time}`
                        ),
                        "h:mm a"
                      )
                    : "N/A"}
                </p>
                <div>
                  <p>
                    <strong>Services:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    {existingAppointmentError.details.Services ? (
                      Array.isArray(
                        existingAppointmentError.details.Services
                      ) ? (
                        existingAppointmentError.details.Services.map(
                          (service, index) => <li key={index}>{service}</li>
                        )
                      ) : typeof existingAppointmentError.details.Services ===
                        "string" ? (
                        <li>{existingAppointmentError.details.Services}</li>
                      ) : (
                        <li>Services not available</li>
                      )
                    ) : (
                      <li>No services listed</li>
                    )}
                  </ul>
                </div>
                <p className="pt-2 font-bold text-base text-right">
                  <strong>Total:</strong> ₱
                  {existingAppointmentError.details.Total
                    ? existingAppointmentError.details.Total.toFixed(2)
                    : "0.00"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleOpenExistingCancelModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                >
                  <FiTrash2 />
                  Cancel Appointment
                </button>
                <button
                  onClick={handleRescheduleClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-sm hover:shadow-md"
                >
                  <FiCalendar />
                  Reschedule
                </button>
              </div>
            </div>
          )}

        <Modal
          isOpen={isRecentCancelModalOpen}
          onClose={() => setIsRecentCancelModalOpen(false)}
          onConfirm={() => {
            if (recentlyBooked) {
              handleCancelWithFee(recentlyBooked);
              setIsRecentCancelModalOpen(false);
            }
          }}
          title="Cancel This Appointment?"
          confirmText={
            isCancelling ? "Processing..." : "Proceed to Pay ₱50 Fee"
          }
          isLoading={isCancelling}
        >
          {/* Modal content stays the same as before */}
          {recentlyBooked && (
            <div className="space-y-4 text-gray-700">
              <div className="text-center">
                <p className="mb-4">
                  To cancel your appointment, a ₱50 cancellation fee is
                  required.
                </p>
              </div>

              <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm">
                <p>
                  <strong>Name:</strong> {recentlyBooked.Name}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {format(new Date(recentlyBooked.Date), "MMMM d, yyyy")}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {format(
                    new Date(`2000-01-01T${recentlyBooked.Time}`),
                    "h:mm a"
                  )}
                </p>
                <div className="pt-2">
                  <p>
                    <strong>Services:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    {recentlyBooked.Services ? (
                      Array.isArray(recentlyBooked.Services) ? (
                        recentlyBooked.Services.map((service, index) => (
                          <li key={index}>{service}</li>
                        ))
                      ) : (
                        <li>{recentlyBooked.Services}</li>
                      )
                    ) : (
                      <li>No services listed</li>
                    )}
                  </ul>
                </div>
                <p className="pt-2 font-bold">
                  <strong>Total Cost:</strong> ₱
                  {recentlyBooked.Total?.toFixed(2) || "0.00"}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-red-800">
                    Cancellation Fee: ₱50.00
                  </span>
                </div>
                <p className="text-xs text-red-700">
                  You will be redirected to GCash to pay the cancellation fee.
                  Once paid, your appointment will be cancelled.
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This action cannot be undone after payment is completed.
              </p>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isExistingCancelModalOpen}
          onClose={() => setIsExistingCancelModalOpen(false)}
          onConfirm={() => {
            if (existingAppointmentError && existingAppointmentError.details) {
              // Create appointment data structure for cancellation
              const appointmentToCancel = {
                id: existingAppointmentError.id,
                Name: existingAppointmentError.details.Name || "Customer",
                Phone: phone, // Use phone from form
                Date: date, // Use date from form
                Time: existingAppointmentError.details.Time,
                Services: existingAppointmentError.details.Services || [],
                Total: existingAppointmentError.details.Total || 0,
              };

              handleCancelWithFee(appointmentToCancel);
              setIsExistingCancelModalOpen(false);
            }
          }}
          title="Cancel Appointment - Cancellation Fee Required"
          confirmText={
            isCancelling ? "Processing..." : "Pay ₱50 Cancellation Fee"
          }
          isLoading={isCancelling}
        >
          {/* Rest of the modal content stays the same */}
          {existingAppointmentError && existingAppointmentError.details ? (
            <div className="space-y-4 text-gray-700">
              <div className="text-center">
                <p className="mb-4">
                  To cancel your appointment, a ₱50 cancellation fee is
                  required.
                </p>
              </div>

              <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-sm">
                <p>
                  <strong>Name:</strong>{" "}
                  {existingAppointmentError.details.Name || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {date ? format(new Date(date), "MMMM d, yyyy") : "N/A"}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {existingAppointmentError.details.Time
                    ? format(
                        new Date(
                          `2000-01-01T${existingAppointmentError.details.Time}`
                        ),
                        "h:mm a"
                      )
                    : "N/A"}
                </p>
                <div className="pt-2">
                  <p>
                    <strong>Services:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    {existingAppointmentError.details.Services ? (
                      Array.isArray(
                        existingAppointmentError.details.Services
                      ) ? (
                        existingAppointmentError.details.Services.map(
                          (service, index) => <li key={index}>{service}</li>
                        )
                      ) : typeof existingAppointmentError.details.Services ===
                        "string" ? (
                        <li>{existingAppointmentError.details.Services}</li>
                      ) : (
                        <li>Services not available</li>
                      )
                    ) : (
                      <li>No services listed</li>
                    )}
                  </ul>
                </div>
                <p className="pt-2 font-bold">
                  <strong>Total Cost:</strong> ₱
                  {existingAppointmentError.details.Total
                    ? existingAppointmentError.details.Total.toFixed(2)
                    : "0.00"}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-red-800">
                    Cancellation Fee: ₱50.00
                  </span>
                </div>
                <p className="text-xs text-red-700">
                  You will be redirected to GCash to pay the cancellation fee.
                  Once paid, your appointment will be cancelled.
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This action cannot be undone after payment is completed.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-gray-700">
              <p>Error: Appointment details not available.</p>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            if (!isProcessing) {
              setIsModalOpen(false);
              setFormData(null);
            }
          }}
          onConfirm={handleConfirmAppointment}
          title={
            rescheduleData ? "Confirm Reschedule" : "Confirm Your Appointment"
          }
          confirmText={
            isProcessing
              ? "Processing..."
              : rescheduleData
              ? "Pay ₱100 Reschedule Fee"
              : "Pay ₱100 Appointment Fee"
          }
          isLoading={isProcessing}
        >
          {formData && (
            <div className="space-y-3 text-gray-700">
              {/* Basic appointment details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Name:</strong>
                  </p>
                  <p className="text-gray-600">{formData.name}</p>
                </div>
                <div>
                  <p>
                    <strong>Phone:</strong>
                  </p>
                  <p className="text-gray-600">0{formData.phone}</p>
                </div>
                <div>
                  <p>
                    <strong>Date:</strong>
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(formData.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Time:</strong>
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(`2000-01-01T${formData.time}`), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Services list */}
              <div className="pt-2 border-t border-gray-200">
                <p className="font-medium mb-2">Selected Services:</p>
                <div className="max-h-32 overflow-y-auto">
                  <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                    {formData.selectedServices.map((service, index) => (
                      <li key={index} className="text-gray-600">
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payment structure */}
              <div className="pt-3 border-t border-gray-200">
                <div
                  className={`bg-blue-50 border rounded-lg p-4 ${
                    rescheduleData ? "border-red-200" : "border-blue-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-800">
                        Total Service Cost:
                      </span>
                      <span className="font-bold text-blue-800">
                        ₱{(formData.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    {!rescheduleData && (
                      <>
                        <hr className="border-blue-300" />
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700">
                              Appointment Fee (Now):
                            </span>
                            <span className="font-semibold text-blue-700">
                              ₱100.00
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700">
                              Balance (Pay at venue):
                            </span>
                            <span className="font-semibold text-blue-700">
                              ₱
                              {Math.max(0, formData.totalPrice || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment method and policy info */}
                {rescheduleData ? (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <FiAlertCircle className="inline mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        A <strong>₱100.00</strong> fee is required to
                        reschedule. This does not count towards your total bill.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center mb-2">
                        <div className="w-5 h-5 mr-2 bg-green-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            G
                          </span>
                        </div>
                        <span className="font-medium">
                          Secure Payment via GCash
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        Pay ₱100 to secure your appointment. The remaining
                        balance (₱
                        {Math.max(0, (formData.totalPrice || 0) - 100).toFixed(
                          2
                        )}
                        ) will be collected at the venue after your service.
                      </p>
                    </div>

                    <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-start">
                        <FiInfo className="inline mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Cancellation Policy:</strong> ₱50 cancellation
                          fee applies if you need to cancel your confirmed
                          appointment.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        <EnhancedPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handlePaymentConfirmation}
          paymentInstruction={paymentInstruction}
        />
      </div>
    </section>
  );
};

export default Contact;
