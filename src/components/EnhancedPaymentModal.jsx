import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiInfo, FiSmartphone, FiClock, FiAlertCircle, FiDownload, FiMail,FiPhone } from 'react-icons/fi';
import { formatCurrency, validateGCashReference } from './secure-payments.js';
import gcashQrCode from '../assets/Elaiza GCASH.jpg';

const EnhancedPaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  paymentInstruction
}) => {
  const [copied, setCopied] = useState('');
  const [gcashReference, setGcashReference] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !paymentInstruction) return null;

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const handleReferenceChange = (e) => {
    const value = e.target.value.toUpperCase();
    setGcashReference(value);

    if (value.length > 0) {
      const validation = validateGCashReference(value);
      setReferenceError(validation.valid ? '' : validation.message);
    } else {
      setReferenceError('');
    }
  };

  const handleSubmit = async () => {
    const validation = validateGCashReference(gcashReference);
    if (!validation.valid) {
      setReferenceError(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(gcashReference);
    } catch (error) {
      console.error('Submission error:', error);
    }
    setIsSubmitting(false);
  };

  const { recipient, amount, currency, referenceNumber, appointmentData } = paymentInstruction;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Complete GCash Payment</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Amount */}
          <div className="text-center bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <p className="text-sm text-green-700 mb-2">Amount to Pay</p>
            <p className="text-4xl font-bold text-green-800">{formatCurrency(amount)}</p>
          </div>

          {/* GCash Instructions */}
          <div className="space-y-4">
            <div className="flex items-center text-green-600 mb-3">
              <FiSmartphone className="w-5 h-5 mr-2" />
              <span className="font-semibold">Send via GCash to:</span>
            </div>

            {/* GCash Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-green-700 font-medium">GCash Number</p>
                      <p className="text-2xl font-bold text-green-800 font-mono">{recipient.gcashNumber}</p>
                      <p className="text-sm text-green-600">{recipient.name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(recipient.gcashNumber, 'gcash')}
                      className="p-3 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors flex items-center justify-center gap-2 w-[90px]"
                    >
                      {copied === 'gcash' ? (
                        <>
                          <FiCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-4 h-4" />
                          <span className="text-sm font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <hr className="border-green-200" />

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-yellow-700 font-medium">Reference Number</p>
                      <p className="text-lg font-bold text-yellow-800 font-mono">{referenceNumber}</p>
                      <p className="text-xs text-yellow-600">Include this in your message</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(referenceNumber, 'ref')}
                      className="p-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg transition-colors flex items-center justify-center gap-2 w-[90px]"
                    >
                      {copied === 'ref' ? (
                        <>
                          <FiCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-4 h-4" />
                          <span className="text-sm font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center">
                <img src={gcashQrCode} alt="GCash QR Code" className="rounded-lg w-full max-w-[250px] h-auto" />
                <p className="text-xs text-gray-500 mt-2 text-center">Or scan to pay</p>
                <a
                  href={gcashQrCode}
                  download="Glowpoint-GCash-QR.jpg"
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download QR</span>
                </a>
              </div>
            </div>
          </div>

          {/* Step-by-step Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <FiInfo className="w-4 h-4 mr-2" />
              Payment Steps:
            </h4>
            <div className="space-y-3">
              {[
                'Open your GCash app',
                'Tap "Send Money"',
                `Enter: ${recipient.gcashNumber}`,
                `Send exactly: ${formatCurrency(amount)}`,
                `Message: "${referenceNumber}"`,
                'Take screenshot of confirmation'
              ].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Appointment Details */}
          {appointmentData && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-3">Appointment Summary:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-3 text-sm">
                <div className="sm:col-span-2">
                  <p className="text-blue-700 font-medium">Name:</p>
                  <p className="text-blue-900">{appointmentData.name}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-blue-700 font-medium">Contact:</p>
                  {appointmentData.phone && (
                    <p className="text-blue-900">
                      <FiPhone className="inline mr-1" /> {appointmentData.phone}
                    </p>
                  )}
                  {appointmentData.email && (
                    <p className="text-blue-900 break-words">
                      <FiMail className="inline mr-1" /> {appointmentData.email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Date:</p>
                  <p className="text-blue-900">{new Date(appointmentData.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Time:</p>
                  <p className="text-blue-900">{appointmentData.time}</p>
                </div>
              </div>
              {appointmentData.services && appointmentData.services.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-700 font-medium text-sm mb-1">Services:</p>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    {appointmentData.services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-blue-700 font-medium text-sm">Total Service Cost:</p>
                <p className="text-blue-900 font-bold">{formatCurrency(appointmentData.totalPrice || appointmentData.totalCost || 0)}</p>
              </div>
            </div>
          )}

          {/* GCash Reference Input */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700">
              Enter GCash Transaction Reference:
            </label>
            <input
              type="text"
              value={gcashReference}
              onChange={handleReferenceChange}
              placeholder="e.g., 1234567890 or ABC123DEF456"
              className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-colors font-mono text-center text-lg ${
                referenceError
                  ? 'border-red-300 focus:border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-green-500 bg-gray-50'
              }`}
              disabled={isSubmitting}
            />
            {referenceError && (
              <div className="flex items-center text-red-600 text-sm">
                <FiAlertCircle className="w-4 h-4 mr-2" />
                <span>{referenceError}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 text-center">
              This is the reference number shown in your GCash app after successful payment
            </p>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start">
              <FiAlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-2">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Send the exact amount: {formatCurrency(amount)}</li>
                  <li>Include the reference number in your GCash message</li>
                  <li>Your appointment will be confirmed within 5-10 minutes</li>
                  <li>Keep your GCash receipt for verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!gcashReference.trim() || !!referenceError || isSubmitting}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-colors ${
              gcashReference.trim() && !referenceError && !isSubmitting
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'I\'ve Sent Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPaymentModal;
