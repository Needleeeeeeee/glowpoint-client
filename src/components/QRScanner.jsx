// components/QRScanner.jsx
import { useState } from 'react';
import { generateSampleQR } from './actions';

export const QRScanner = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError('Please enter a valid QR code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onScan(manualCode.trim());
    } catch (err) {
      setError(err.message || 'Invalid QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Enter your appointment QR code:
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="APPT-ABC123"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !manualCode.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Joining Queue...' : 'Join Queue'}
          </button>

          {/* Demo button for testing */}
          <button
            type="button"
            onClick={() => setManualCode(generateSampleQR())}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            🧪 Generate Sample QR (for testing)
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            QR codes should start with "APPT-" followed by your appointment reference
          </p>
        </div>
      </div>
    </div>
  );
};
