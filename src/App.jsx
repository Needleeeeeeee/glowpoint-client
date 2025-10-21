import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { getAppointmentById } from "./components/actions.js";
import Cookies from "js-cookie";

import Navbar from "./components/Navbar";
import Banner from "./components/Banner";
import About from "./components/About";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Feedback from "./components/Feedback";
import { QueueModule } from "./components/Queue.jsx";
import { useQueue } from "./hooks/queue.js";
import "react-toastify/dist/ReactToastify.css";
import { FaClipboardList } from "react-icons/fa6";
const RECENTLY_BOOKED_APPOINTMENT_COOKIE = "recentlyBookedAppointment";

function App() {
  const [showQueue, setShowQueue] = useState(false);
  const queueState = useQueue();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("joinQueue") === "true") {
      const qrCode = urlParams.get("qrCode");
      if (!queueState.userQueuePosition && qrCode) {
        setShowQueue(true);
        queueState.setScannedQrCode(qrCode);
      }
      const newUrl = `${window.location.pathname}${
        window.location.search
          .replace(/([?&])(joinQueue|qrCode)=[^&]*/g, "")
          .replace(/^&/, "?") || window.location.hash
      }`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [queueState.userQueuePosition, queueState.setScannedQrCode]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [recentlyBooked, setRecentlyBooked] = useState(null);

  const handleOpenFeedbackModal = () => setIsFeedbackModalOpen(true);
  const handleCloseFeedbackModal = () => setIsFeedbackModalOpen(false);

  useEffect(() => {
    const checkRecentAppointment = async () => {
      const cookieData = Cookies.get(RECENTLY_BOOKED_APPOINTMENT_COOKIE);
      if (cookieData) {
        try {
          const storedAppointment = JSON.parse(cookieData);
          if (storedAppointment.id) {
            const latestAppointment = await getAppointmentById(
              storedAppointment.id
            );

            if (latestAppointment) {
              setRecentlyBooked(latestAppointment);

              const isPast =
                new Date(latestAppointment.Date) <
                new Date().setHours(0, 0, 0, 0);
              if (isPast && latestAppointment.status !== "success") {
                Cookies.remove(RECENTLY_BOOKED_APPOINTMENT_COOKIE);
              }
            } else {
              Cookies.remove(RECENTLY_BOOKED_APPOINTMENT_COOKIE);
              setRecentlyBooked(null);
            }
          }
        } catch (e) {
          console.error("Error processing recent appointment cookie", e);
          Cookies.remove(RECENTLY_BOOKED_APPOINTMENT_COOKIE);
          setRecentlyBooked(null);
        }
      }
    };
    checkRecentAppointment();
  }, []);
  const showFeedbackButton = !!recentlyBooked;

  return (
    <div>
      <div>
        <Navbar
          showFeedbackButton={showFeedbackButton}
          onFeedbackClick={handleOpenFeedbackModal}
        />
        <Banner />
        <About />
        <Services />
        <Contact
          recentlyBooked={recentlyBooked}
          setRecentlyBooked={setRecentlyBooked}
          onFeedbackClick={handleOpenFeedbackModal}
        />
        <Footer
          showFeedbackButton={showFeedbackButton}
          onFeedbackClick={handleOpenFeedbackModal}
        />

        <Feedback
          isOpen={isFeedbackModalOpen}
          onClose={handleCloseFeedbackModal}
          userName={recentlyBooked?.Name}
        />

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-4">
          <button
            onClick={() => setShowQueue(true)}
            className="bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title="Queue Management"
          >
            <FaClipboardList className="size-5" />
            <span>Queue</span>
          </button>
        </div>
      </div>
      <QueueModule
        isVisible={showQueue}
        onClose={() => setShowQueue(false)}
        queueState={queueState}
      />
    </div>
  );
}

export default App;
