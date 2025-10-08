import { BUSINESS_CONFIG, PAYMENT_CONFIG } from './config.js';

// Generate secure reference numbers
export const generateSecureReference = (prefix = 'GP') => {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomStr = Array.from(randomBytes)
    .map(byte => byte.toString(36))
    .join('')
    .toUpperCase()
    .substring(0, 4);

  return `${prefix}${timestamp}${randomStr}`;
};

// Create payment instruction
export const createPaymentInstruction = (appointmentData, amount) => {
  const referenceNumber = generateSecureReference();
  const instruction = {
    id: referenceNumber,
    referenceNumber,
    amount,
    currency: PAYMENT_CONFIG.currency,
    paymentType: amount === PAYMENT_CONFIG.cancellationFee ? 'cancellation' : 'booking',
    recipient: {
      gcashNumber: BUSINESS_CONFIG.gcash.number,
      name: BUSINESS_CONFIG.name,
      businessName: BUSINESS_CONFIG.name,
      gcashName: BUSINESS_CONFIG.gcash.name
    },
    appointmentData: {
      name: appointmentData.name,
      phone: appointmentData.phone,
      email: appointmentData.email,
      date: appointmentData.date,
      time: appointmentData.time,
      services: (() => {
        let services = appointmentData.selectedServices || [];
        // Handle cases where services might be a JSON string from the database
        if (typeof services === 'string') {
          try {
            services = JSON.parse(services);
          } catch (e) {
            console.error("Failed to parse services string in payment instruction:", e);
            return [services]; // Fallback to an array with the original string
          }
        }
        return Array.isArray(services) ? services : [];
      })(),      totalCost: appointmentData.totalPrice || 0
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  return instruction;
};

// Storage management using sessionStorage
const STORAGE_KEY = 'payment_instructions';

export const savePaymentInstruction = (instruction) => {
  try {
    const existing = getPaymentInstructions();
    const updated = [...existing, instruction];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Storage error:', error);
    return { success: false, error: error.message };
  }
};

export const getPaymentInstructions = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Storage retrieval error:', error);
    return [];
  }
};

export const updatePaymentStatus = (referenceNumber, status, gcashRef = null) => {
  try {
    const instructions = getPaymentInstructions();
    const updated = instructions.map(instruction =>
      instruction.referenceNumber === referenceNumber
        ? {
            ...instruction,
            status,
            gcashReference: gcashRef,
            verifiedAt: status === 'verified' ? new Date().toISOString() : null
          }
        : instruction
    );

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Status update error:', error);
    return { success: false, error: error.message };
  }
};

export const findPaymentInstruction = (referenceNumber) => {
  const instructions = getPaymentInstructions();
  return instructions.find(i => i.referenceNumber === referenceNumber);
};

// Cleanup expired instructions
export const cleanupExpiredInstructions = () => {
  try {
    const instructions = getPaymentInstructions();
    const now = new Date().toISOString();
    const active = instructions.filter(i => i.expiresAt > now);

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    return active.length !== instructions.length;
  } catch (error) {
    console.error('Cleanup error:', error);
    return false;
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: PAYMENT_CONFIG.currency
  }).format(amount);
};

export const validateGCashReference = (reference) => {
  if (!reference || reference.length < 8) {
    return { valid: false, message: 'Reference number must be at least 8 characters' };
  }

  if (!/^[A-Z0-9]+$/.test(reference.toUpperCase())) {
    return { valid: false, message: 'Reference number can only contain letters and numbers' };
  }

  return { valid: true };
};
