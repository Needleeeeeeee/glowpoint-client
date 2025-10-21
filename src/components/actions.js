import { format } from "date-fns";
import supabase from "./supabase.js";
import {
  createPaymentInstruction,
  savePaymentInstruction,
  updatePaymentStatus,
  findPaymentInstruction,
  cleanupExpiredInstructions
} from './secure-payments.js';

cleanupExpiredInstructions();
export const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const sanitizeName = (name) => {
  return name
    .trim()
    .replace(/[^a-zA-Z\s'-]/g, "") // Allow only letters, spaces, hyphens, apostrophes
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/^['-\s]+|['-\s]+$/g, "") // Remove leading/trailing special chars
    .substring(0, 50) // Limit to 50 characters
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Title case
    .join(" ");
};

export const fetchServicesAndConfig = async () => {
  try {
    // Fetch the dynamic UI configuration and all services in parallel
    const [configResponse, servicesResponse] = await Promise.all([
      supabase().from("ServiceCategories").select("*").order("sort_order", { ascending: true }),
      supabase().from("Services").select("*")
    ]);

    const { data: serviceCategoriesConfig, error: configError } = configResponse;
    if (configError) throw configError;

    const { data: services, error: servicesError } = servicesResponse;
    if (servicesError) throw servicesError;

    // Group services by their database category name for easy lookup
    const servicesByCategory = services.reduce((acc, service) => {
      const category = service.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});

    return { serviceCategoriesConfig, servicesByCategory };
  } catch (error) {
    console.error("Error fetching services and configuration:", error);
    return { serviceCategoriesConfig: [], servicesByCategory: {} }; // Return empty state on error
  }
};

export const addAppointmentWithPayment = async (appointmentData, paymentData) => {
   if (!appointmentData) return { data: null, error: new Error("No appointment data provided") };

  try {
    const remainingBalance = (appointmentData.totalPrice || 0) - (paymentData.amount || 0);

    const { data, error } = await supabase()
      .from("Appointments")
      .insert({
        Name: appointmentData.name,
        Phone: appointmentData.phone,
        Email: appointmentData.email,
        Date: appointmentData.date,
        Time: appointmentData.time,
        Services: appointmentData.selectedServices,
        Total: appointmentData.totalPrice,
        status: "pending",
        date_created: format(new Date(), "yyyy-MM-dd"),
        payment_id: paymentData.payment_id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error adding appointment with manual payment:", error);
    return { data: null, error: error.message ? error : { message: "An unexpected error occurred while booking." } };
  }
};

export const updateAppointmentWithPayment = async (id, appointmentData, paymentData) => {
  if (!id || !appointmentData) return { data: null, error: new Error("No ID or appointment data provided") };
  if (!paymentData) return { data: null, error: new Error("Payment data is required for rescheduling") };

  try {
    const { data, error } = await supabase()
      .from("Appointments")
      .update({
        // Appointment details
        Email: appointmentData.email,
        Date: appointmentData.date,
        Time: appointmentData.time,
        Services: appointmentData.selectedServices,
        Total: appointmentData.totalPrice,
        status: "pending",
        payment_id: paymentData.payment_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error rescheduling Appointment:", error);
    return { data: null, error };
  }
};

export const addFailedAppointment = async (appointmentId, appointmentData) => {
  if (!appointmentData) return; // appointmentData is still required
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    let query;
    const failedData = {
      status: 'failed',
      // You can add more fields to update here, like a 'failure_reason'
    };

    if (appointmentId) {
      // If an ID is provided, update the existing appointment
      query = supabase().from("Appointments").update(failedData).eq("id", appointmentId);
    } else {
      // If no ID, create a new failed appointment record (fallback)
      query = supabase().from("Appointments").insert({
        Name: appointmentData.name,
        Phone: appointmentData.phone,
        Email: appointmentData.email,
        Date: appointmentData.date,
        Time: appointmentData.time,
        Services: appointmentData.selectedServices,
        Total: appointmentData.totalPrice,
        status: 'failed',
        date_created: today,
      });
    }

    const { data, error } = await query;

    if (error) throw error;
  } catch (error) {
    console.error("Error logging failed appointment:", error);
  }
};

export const checkExistingAppointment = async (phone, date) => {
  try {
    const { data, error } = await supabase()
      .from("Appointments")
      .select("id, Time, Name, Services, Total, Email")
      .eq("Phone", phone)
      .eq("Date", date)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const formattedTime = format(new Date(`2000-01-01T${data.Time}`), "h:mm a");
      return {
        id: data.id,
        message: `You already have an appointment on this day at ${formattedTime}.`,
        details: data,
      };
    }
    return null;
  } catch (err) {
    console.error("Error checking for existing appointment:", err);
    return null;
  }
};

export const finalizeCancellationWithPayment = async (appointmentId, paymentData) => {
  try {
    const { error } = await supabase()
      .from("Appointments")
      .update({
        status: "failed",
        cancelled_at: new Date().toISOString(),
        cancellation_fee_paid: true
      })
      .eq("id", appointmentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error finalizing cancellation:", error);
    return { success: false, error: error.message };
  }
};

export const getAppointmentById = async (id) => {
  if (!id) return null;
  try {
    const { data, error } = await supabase()
      .from("Appointments")
      .select("*, status")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Error fetching appointment by ID:", err);
    return null;
  }
};

export const fetchFullyBookedDates = async () => {
  try {

    const { data, error } = await supabase().rpc('get_fully_booked_dates');

    if (error) throw error;

    // The RPC returns objects like [{ booking_date: '2023-12-25' }], so we map to get just the date strings.
    return data ? data.map(d => d.booking_date) : [];
  } catch (error) {
    console.error("Error fetching fully booked dates:", error);
    return [];
  }
};

export const fetchBookedTimeSlots = async (date) => {
  if (!date) return [];
  try {
    const { data, error } = await supabase()
      .from("Appointments")
      .select("Time, Services")
      .eq("Date", date)
      .in("status", ["pending", "verified", "confirmed", "assigned"]);

    if (error) throw error;

    // Normalize times to HH:MM format (strip seconds if present)
    const normalizedData = (data || []).map(appointment => ({
      ...appointment,
      Time: appointment.Time ? appointment.Time.substring(0, 5) : appointment.Time
    }));

    return normalizedData;
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return [];
  }
};

export const addFeedback = async (feedbackData) => {
  if (!feedbackData || !feedbackData.rating) {
    return { success: false, error: new Error("Rating is required.") };
  }
  try {

    const sanitizedComment = feedbackData.comment
      ? feedbackData.comment
          .trim()
          .replace(/[^a-zA-Z0-9\s?!.,]/g, "")
          .substring(0, 500)
      : "";
    const { error } = await supabase().from("Feedback").insert({
      rating: feedbackData.rating,
      comment: sanitizedComment,
      from_user: feedbackData.from_user,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error adding feedback:", error);
    return { success: false, error };
  }
};

export const validateEmail = (email) => {
  if (!email) return false;
  // A simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

export const sanitizePhone = (phone) => {
  if (!phone) return '';
  // Removes non-digit characters
  return phone.replace(/[^0-9]/g, '');
};

export const getQueueState = async () => {
  try {
    const [queueResponse, settingsResponse] = await Promise.all([
      supabase()
        .from('queue_entries')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true }),
      supabase()
        .from('queue_settings')
        .select('*')
        .eq('id', 1)
        .single()
    ]);

    if (queueResponse.error) throw queueResponse.error;
    if (settingsResponse.error) throw settingsResponse.error;

    return {
      success: true,
      queue: queueResponse.data || [],
      currentServing: settingsResponse.data?.current_serving || 0
    };
  } catch (error) {
    console.error('Error fetching queue state:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify QR code format
export const verifyQRCode = (qrCode) => {
  // Customize this validation based on your QR code format
  return qrCode &&
         qrCode.length >= 8 &&
         qrCode.startsWith('APPT-') &&
         /^APPT-[A-Z0-9]{6,}$/.test(qrCode);
};

// Join queue with QR verification
export const joinQueue = async (qrCode, userId = null, reminderData = {}) => {
  try {
    // Verify QR code format
    if (!verifyQRCode(qrCode)) {
      throw new Error('Invalid QR code format. Code should be APPT-XXXXXX');
    }

    // Check if QR code already used
    const { data: existingEntry } = await supabase()
      .from('queue_entries')
      .select('id')
      .eq('qr_code', qrCode)
      .eq('is_active', true)
      .single();

    if (existingEntry) {
      throw new Error('This QR code is already in the queue');
    }

    // Get current queue length
    const { data: currentQueue, error: queueError } = await supabase()
      .from('queue_entries')
      .select('position')
      .eq('is_active', true);

    if (queueError) throw queueError;

    const position = (currentQueue?.length || 0) + 1;
    const estimatedWaitTime = position * 20;

    // Insert new queue entry
    const { data, error } = await supabase()
      .from('queue_entries')
      .insert({
        user_id: userId || `guest-${Date.now()}`,
        position,
        estimated_wait_time: estimatedWaitTime,
        qr_code: qrCode,
        is_active: true,
        phone: reminderData.phone || null,
        email: reminderData.email || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error joining queue:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate sample QR code for testing
export const generateSampleQR = () => {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APPT-${timestamp.slice(-4)}${randomSuffix}`;
};

// Subscribe to queue changes
export const subscribeToQueueChanges = (callback) => {
  const subscription = supabase()
    .channel('queue_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'queue_entries' },
      callback
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'queue_settings' },
      callback
    )
    .subscribe();

  return subscription;
};

export const processGCashPayment = async (appointmentData, amount) => {
  try {
    const instruction = createPaymentInstruction(appointmentData, amount);
    const saveResult = savePaymentInstruction(instruction);

    if (!saveResult.success) {
      return { success: false, error: 'Failed to create payment instruction' };
    }

    return {
      success: true,
      paymentInstruction: instruction,
      referenceNumber: instruction.referenceNumber,
    };
  } catch (error) {
    console.error('Payment instruction error:', error);
    return { success: false, error: error.message || 'Payment processing failed' };
  }
};

export const verifyGCashPayment = async (referenceNumber, gcashReference) => {
  try {
    const instruction = findPaymentInstruction(referenceNumber);

    if (!instruction) {
      return { success: false, error: 'Payment instruction not found' };
    }

    if (instruction.status === 'verified') {
      return { success: false, error: 'Payment already verified' };
    }

    // Update status to pending verification
    const updateResult = updatePaymentStatus(referenceNumber, 'pending_verification', gcashReference);

    if (!updateResult.success) {
      return { success: false, error: 'Failed to update payment status' };
    }

    return {
      success: true,
      status: 'pending_verification',
      instruction: { ...instruction, status: 'pending_verification', gcashReference }
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: error.message || 'Payment verification failed' };
  }
};
