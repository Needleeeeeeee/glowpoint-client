import { useState } from 'react';
import { FiArrowLeft, FiMail, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { validateEmail, sanitizePhone } from './actions';

export const QueueModule = ({ isVisible, onClose, queueState }) => {
  const { queue, currentServing, loading, userQueuePosition, error, joinQueue, scannedQrCode } = queueState;
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wantsSms, setWantsSms] = useState(false);
  const [wantsEmail, setWantsEmail] = useState(false);

  if (!isVisible) return null;

  const handleJoin = async () => {
    if (wantsSms && sanitizePhone(phone).length < 10) {
      toast.error('Please enter a valid phone number for SMS reminders.');
      return;
    }
    if (wantsEmail && !validateEmail(email)) {
      toast.error('Please enter a valid email address for email reminders.');
      return;
    }
    await joinQueue({ phone: wantsSms ? phone : null, email: wantsEmail ? email : null });
  };

  return (
    <div className="fixed inset-0 bg-white z-40 overflow-y-auto pt-20">
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">
                Now Serving: #{currentServing}
              </h2>
              <p className="text-gray-600">
                Total in Queue: {queue.filter(item => item.position > 0).length}
              </p>
            </div>
          </div>

          {/* User Status or Join Queue */}
          {userQueuePosition ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  You're in the Queue! 🎉
                </h3>
                <div className="space-y-2">
                  <p className="text-green-700">
                    Your Position: <span className="font-bold">#{userQueuePosition.position}</span>
                  </p>
                  <p className="text-green-700">
                    Estimated Wait: <span className="font-bold">{userQueuePosition.estimated_wait_time} minutes</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Joined at: {new Date(userQueuePosition.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-green-500 mt-3">
                    QR Code: {userQueuePosition.qr_code}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">{scannedQrCode ? 'Confirm Your Entry' : 'Join the Queue'}</h3>
                <div className="space-y-4 my-6 text-left max-w-sm mx-auto">
                  {/* SMS Reminder */}
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsSms}
                        onChange={(e) => setWantsSms(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700 font-medium">Get SMS reminder</span>
                    </label>
                    {wantsSms && (
                      <div className="relative mt-2">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number (e.g., 09123456789)"
                          value={phone}
                          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                          className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors"
                          maxLength="15"
                        />
                      </div>
                    )}
                  </div>

                  {/* Email Reminder */}
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsEmail}
                        onChange={(e) => setWantsEmail(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700 font-medium">Get Email reminder</span>
                    </label>
                    {wantsEmail && (
                      <div className="relative mt-2">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full max-w-sm"
                >
                  {loading ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            </div>
          )}

          {/* Queue Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
            {queue.filter(item => item.position > 0).length === 0 ? (
              <p className="text-gray-500 text-center py-8">Queue is empty</p>
            ) : (
              <div className="space-y-3">
                {queue
                  .filter(item => item.position > 0)
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">Position #{item.position}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          (Wait: ~{item.estimated_wait_time} min)
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
