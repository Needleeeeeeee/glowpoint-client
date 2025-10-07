import React from "react";
import { FiFacebook, FiPhone } from "react-icons/fi";
import { toast } from "react-toastify";

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Phone number copied to clipboard");
  } catch (error) {
    toast.error("Error copying to clipboard");
  }
};

const Footer = ({ onFeedbackClick, showFeedbackButton }) => {
  return (
    <footer id="footer" className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/*Brand */}
          <div className="text-center md:text-left lg:text-center xl:text-left">
            <div className="flex justify-center md:justify-start lg:justify-center xl:justify-start items-center mb-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-amber-200 rounded-full blur opacity-30" />

                <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent relative pb-1">
                  Elaiza G. Beauty Lounge
                </h3>
              </div>
            </div>

            <p className="text-amber-600 text-sm leading-relaxed max-w-xs max-auto md:mx-0 lg:mx-auto xl:mx-0 font-medium">
              Treat yourself right! We offer the best in relaxation and
              rejuvenation. Come and experience it for yourself.
              #ElaizaGBeautyLounge #RelaxAndGlow #TaraG
            </p>
          </div>

          {/*Time and Location */}
          <div className="lg:bottom-1 lg:pl-8 border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center md:text-left">
              Opening Hours
            </h4>
            <ul className="space-y-2 text-center md:text-left">
              <li className="text-gray-600 text-sm">
                <span className="font-bold">Daily </span> 11AM-8PM
              </li>
              <li className="text-gray-600 text-sm">
                <span className="font-bold">Located at</span> NSCI Building, Km.
                37 Pulong Buhangin, Santa Maria, Bulacan
              </li>
            </ul>
          </div>

          {/*Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-amber-800 mb-4 font-[Poppins]">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Home", href: "#" },
                { name: "About", href: "#about" },
                { name: "Services", href: "#services" },
                { name: "Book Appointment", href: "#contact" },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-amber-600 hover:text-amber-800 transition-all flex items-center justify-center md:justify-start group text-sm font-medium"
                  >
                    <span className="bg-amber-200 group-hover:bg-amber-300 w-1.5 h-1.5 rounded-full mr-2 transition-colors" />
                    {link.name}
                  </a>
                </li>
              ))}
              {showFeedbackButton && (
                <li>
                  <button
                    onClick={onFeedbackClick}
                    className="text-amber-600 hover:text-amber-800 transition-all flex items-center justify-center md:justify-start group text-sm font-medium"
                  >
                    <span className="bg-amber-200 group-hover:bg-amber-300 w-1.5 h-1.5 rounded-full mr-2 transition-colors" />
                    Leave Feedback
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/*Social Media */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-amber-800 mb-4 font-[Poppins]">
              Connect With Us
            </h4>
            <div className="flex justify-center md:justify-start items-center space-x-4 lg:space-x-5">
              <a
                href="https://www.facebook.com/profile.php?id=61577586449576"
                className="p-2.5 rounded-full text-white bg-amber-600 hover:scale-110 transition-transform duration-300 shadow-sm hover:shadow-amber-200"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                className="p-2.5 rounded-full text-white bg-amber-600 hover:scale-110 transition-transform duration-300 shadow-sm hover:shadow-amber-200 cursor-pointer"
                onClick={() => copyToClipboard("09300784517")}
              >
                <FiPhone className="w-5 h-5" />
              </a>
              <span
                className="text-sm text-amber-600 font-medium cursor-pointer"
                onClick={() => copyToClipboard("09300784517")}
              >
                09300784517
              </span>
            </div>
          </div>
        </div>
        {/*Copyright */}
        <div className="border-t border-amber-100 mt-8 lg:mt-12 pt-6 lg:pt-8 text-center">
          <p className="text-sm text-amber-600 font-medium mb-2">
            &copy;{new Date().getFullYear()} Elaiza G. Beauty Lounge. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
