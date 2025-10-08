
const getEnvVar = (name, fallback = null) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }

  // Fallback to window object (for runtime config)
  if (typeof window !== 'undefined' && window[name]) {
    return window[name];
  }

  return fallback;
};


export const BUSINESS_CONFIG = {
  name: getEnvVar('VITE_APP_BUSINESS_NAME', 'Glow Point Beauty'),
  gcash: {
    number: getEnvVar('VITE_APP_GCASH_NUMBER'),
    name: getEnvVar('VITE_APP_GCASH_NAME'),
    qrCodeUrl: getEnvVar('VITE_GCASH_QR_URL', null)
  },
  contact: {
    phone: getEnvVar('VITE_APP_BUSINESS_PHONE'),
  }
};

export const PAYMENT_CONFIG = {
  bookingFee: parseInt(getEnvVar('VITE_APP_BOOKING_FEE', '100')),
  cancellationFee: parseInt(getEnvVar('VITE_APP_CANCELLATION_FEE', '50')),
  currency: 'PHP'
};

const validateConfig = () => {
  const errors = [];

  if (BUSINESS_CONFIG.gcash.number && !BUSINESS_CONFIG.gcash.number.match(/^09\d{9}$/)) {
    errors.push('VITE_GCASH_NUMBER must be a valid Philippine mobile number (e.g., 09171234567)');
  }

  if (errors.length > 0) {
    console.warn('Configuration issues found:', errors);
  }

  return errors;
};

validateConfig();

export default {
  BUSINESS_CONFIG,
  PAYMENT_CONFIG,
  validateConfig
};
