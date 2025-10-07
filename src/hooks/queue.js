// hooks/useQueue.js
import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import {
  getQueueState,
  joinQueue,
  generateSampleQR,
  subscribeToQueueChanges,
} from '../components/actions';

const USER_QUEUE_POSITION_COOKIE = 'userQueuePosition';

export const useQueue = () => {
  const [queue, setQueue] = useState([]);
  const [currentServing, setCurrentServing] = useState(0);
  const [loading, setLoading] = useState(false);

  const [userQueuePosition, setUserQueuePosition] = useState(() => {
    const cookieData = Cookies.get(USER_QUEUE_POSITION_COOKIE);
    if (cookieData) {
      try {
        return JSON.parse(cookieData);
      } catch (e) {
        console.error('Error parsing user queue position cookie', e);
        Cookies.remove(USER_QUEUE_POSITION_COOKIE);
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userQueuePosition) {
      // Set cookie to expire in 1 day.
      Cookies.set(
        USER_QUEUE_POSITION_COOKIE,
        JSON.stringify(userQueuePosition),
        { expires: 1 }
      );
    } else {
      // If user position is null (e.g., served or left queue), remove the cookie.
      Cookies.remove(USER_QUEUE_POSITION_COOKIE);
    }
  }, [userQueuePosition]);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const result = await getQueueState();
      if (result.success) {
        setQueue(result.queue);
        setCurrentServing(result.currentServing);

        // Check if the user's stored position is still valid
        setUserQueuePosition((currentPosition) => {
          if (!currentPosition) {
            return null; // Not in queue, nothing to do.
          }
          const userInQueue = result.queue.find(
            (item) => item.id === currentPosition.id
          );

          if (!userInQueue || !userInQueue.is_active) {
            // User is no longer in the active queue (served or removed).
            return null;
          }

          // If position or wait time has changed, update it.
          if (JSON.stringify(userInQueue) !== JSON.stringify(currentPosition)) {
            return userInQueue;
          }

          // No changes for the user's position.
          return currentPosition;
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      setError('Failed to load queue data');
    }
  }, []);

  const handleJoinQueue = async (qrCode, reminderData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await joinQueue(qrCode, null, reminderData);
      if (result.success) {
        setUserQueuePosition(result.data);
        await fetchQueue();
        return result.data;
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to join queue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAutoJoinQueue = async (reminderData = {}) => {
    if (userQueuePosition) {
      // Already in queue, do nothing.
      return;
    }
    const qrCode = generateSampleQR();
    return handleJoinQueue(qrCode, reminderData);
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to real-time updates
    const subscription = subscribeToQueueChanges((payload) => {
      console.log('Queue updated:', payload);
      fetchQueue();
    });

    // Fallback polling
    const interval = setInterval(fetchQueue, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchQueue]);

  return {
    queue,
    currentServing,
    loading,
    userQueuePosition,
    error,
    joinQueue: handleJoinQueue,
    fetchQueue,
    handleAutoJoinQueue,
  };
};
