import React, { useState, useEffect } from "react";
import { Link } from "react-scroll";
import {
  FiHome,
  FiMenu,
  FiUser,
  FiX,
  FiMessageSquare,
  FiStar,
} from "react-icons/fi";
import { FaCalendar, FaScissors, FaPhone } from "react-icons/fa6";
import logo from "../assets/EBL_Logo_Cropped.jpg";

const Navbar = ({ onFeedbackClick, showFeedbackButton }) => {
  const [navShadow, setNavShadow] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setNavShadow(true);
      } else {
        setNavShadow(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed w-full z-50 transition-all duration-500">
      {/*BG navbar */}
      <div
        className={`bg-white backdrop-blur-2xl ${
          navShadow ? "shadow-xl" : "shadow-md"
        }`}
      >
        <nav className="border-b border-pink-400/20">
          <div className="container mx-auto px-4 md:px-6 py-3 sm:py-2">
            <div className="flex items-center justify-between">
              {/*Logo */}
              <div className="flex items-center flex-shrink-0">
                <Link
                  to="home"
                  spy={true}
                  smooth={true}
                  className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-base lg:text-lg hover:scale-105"
                >
                  <span className="cursor-pointer text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent font-[poppins] tracking-tighter whitespace-nowrap">
                    Elaiza G.
                  </span>
                </Link>
              </div>

              {/*Center Menu */}
              <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
                <div className="flex items-center space-x-6 xl:space-x-8">
                  <Link
                    to="home"
                    spy={true}
                    smooth={true}
                    className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-sm xl:text-base hover:scale-105 whitespace-nowrap"
                  >
                    <FiHome className="mr-1" />
                    Home
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  <Link
                    to="about"
                    spy={true}
                    smooth={true}
                    className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-sm xl:text-base hover:scale-105 whitespace-nowrap"
                  >
                    <FiUser className="mr-1" />
                    About
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  <Link
                    to="services"
                    spy={true}
                    smooth={true}
                    className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-sm xl:text-base hover:scale-105 whitespace-nowrap"
                  >
                    <FaScissors className="mr-1 size-3" />
                    Services
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  <Link
                    to="footer"
                    spy={true}
                    smooth={true}
                    className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-sm xl:text-base hover:scale-105 whitespace-nowrap"
                  >
                    <FaPhone className="mr-1 size-3" />
                    Details
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  {showFeedbackButton && (
                    <button
                      onClick={onFeedbackClick}
                      className="flex items-center cursor-pointer text-gray-800 hover:text-pink-700 transition-all duration-300 relative group font-[Poppins] font-medium text-sm xl:text-base hover:scale-105 whitespace-nowrap"
                    >
                      <FiStar className="mr-1 size-3" />
                      Feedback
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-pink-700 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                  )}
                </div>
              </div>

              {/*Right side - Book btn and mobile menu */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="hidden lg:flex items-center">
                  <Link
                    to="contact"
                    spy={true}
                    smooth={true}
                    className="flex items-center bg-pink-400 hover:bg-pink-600 text-white px-4 py-2 xl:px-5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer font-[Poppins] font-semibold border-pink-300 text-sm xl:text-base whitespace-nowrap"
                  >
                    <FaCalendar className="mr-1" />
                    Book Now!
                  </Link>
                </div>

                {/* Mobile/Tablet Menu Button */}
                <button
                  className="lg:hidden text-gray-800 hover:text-pink-700 transition-colors duration-300 p-2 hover:scale-110"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/*Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-pink-200/95 backdrop-blur-lg p-4">
          <button
            className="absolute top-6 right-6 text-gray-800 hover:text-pink-700 transition-colors duration-300 p-2 bg-white/80 rounded-full shadow-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FiX size={24} />
          </button>

          <div className="bg-white/95 border border-pink-300/30 rounded-2xl shadow-2xl p-6 w-11/12 max-w-sm mx-auto">
            <div className="flex flex-col items-center space-y-6">
              <Link
                to="home"
                spy={true}
                smooth={true}
                className="flex flex-col items-center text-gray-800 hover:text-pink-700 transition-all duration-300 font-[Poppins] text-lg hover:scale-105 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiHome className="mb-1 text-xl" />
                Home
              </Link>

              <Link
                to="about"
                spy={true}
                smooth={true}
                className="flex flex-col items-center text-gray-800 hover:text-pink-700 transition-all duration-300 font-[Poppins] text-lg hover:scale-105 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiUser className="mb-1 text-xl" />
                About
              </Link>

              <Link
                to="services"
                spy={true}
                smooth={true}
                className="flex flex-col items-center text-gray-800 hover:text-pink-700 transition-all duration-300 font-[Poppins] text-lg hover:scale-105 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaScissors className="mb-1 text-xl" />
                Services
              </Link>

              <Link
                to="footer"
                spy={true}
                smooth={true}
                className="flex flex-col items-center text-gray-800 hover:text-pink-700 transition-all duration-300 font-[Poppins] text-lg hover:scale-105 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaPhone className="mb-1 text-xl" />
                Details
              </Link>

              {showFeedbackButton && (
                <button
                  onClick={() => {
                    onFeedbackClick();
                    setMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center text-gray-800 hover:text-pink-700 transition-all duration-300 font-[Poppins] text-lg hover:scale-105 py-2"
                >
                  <FiStar className="mb-1 text-xl" />
                  Feedback
                </button>
              )}

              <div className="pt-2 w-full">
                <Link
                  to="contact"
                  spy={true}
                  smooth={true}
                  className="flex flex-col items-center bg-pink-400 hover:bg-pink-500 text-white px-6 py-4 rounded-xl transition-all duration-300 font-[Poppins] font-semibold text-base hover:scale-105 w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FaCalendar className="mb-1 text-lg" />
                  Book Appointment!
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
