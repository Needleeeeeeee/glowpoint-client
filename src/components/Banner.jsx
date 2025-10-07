import React from "react";
import BannerImage from "../assets/SalonBanner.jpg";
import newimage from '../assets/ElaizaG/BGBWElaiza.jpg'
import { FaCalendarAlt } from "react-icons/fa";
import { Link } from "react-scroll";
import { GiFlowerTwirl } from "react-icons/gi";

const Banner = () => {
  return (
    <div
      id="home"
      className="min-h-[80vh] md:min-h-[90vh] flex items-center justify-center text-center px-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),url(${newimage})`,
        backgroundSize: `cover`,
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl text-white z-10 relative px-4">
        <div className="absolute -bottom-12 -right-12 md:-bottom-8 md:-right-8 text-4xl md:text-5xl text-amber-300/20 rotate-12">
          <GiFlowerTwirl />
        </div>

        {/*Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 font-[Great+Vibes] bg-gradient-to-r from-rose-300 via-rose-400 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in pb-4">
          Elaiza G. Beauty Lounge
        </h1>

        {/*Divider */}
        <div className="w-48 md:w-64 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent mx-auto my-6 md:my-8 rounded-full" />

        {/*Subheader*/}
        <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl italic text-amber-100 leading-tight">
            Treat Yourself Right!
          </p>
        </div>

        {/*Btn */}
        <div className=" bg-gradient-to-r from-rose-600 to-amber-400 px-6 py-4 md:py-5 rounded-full text-white uppercase font-bold tracking-widest hover:scale-105 transition-transform duration-300 hover:shadow-2xl flex items-center gap-2 md:gap-3 mx-auto border-2 border-amber-200 hover:border-rose-200 group text-sm md:text-base">
          <FaCalendarAlt className="text-xl md:text-2xl animate-pulse group-hover:animate-none" />
          <Link
            to="contact"
            smooth={true}
            className="text-xs md:text-sm lg:text-base"
          >
            Experience your beautiful self! book now.
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Banner;
