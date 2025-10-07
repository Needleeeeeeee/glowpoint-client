import React, { useState } from "react";
import { animateScroll as scroll } from "react-scroll";
import {
  GiFlowerTwirl,
  GiLipstick,
  GiMirrorMirror,
  GiSpray,
} from "react-icons/gi";
import { FaSpa, FaSmile, FaHandSparkles, FaFingerprint } from "react-icons/fa";
import { MdFace, MdOutlineSelfImprovement } from "react-icons/md";

// Import local images
import HairStyling from "../assets/HSC.jpg";
import Microblading from "../assets/MB.jpg";


//newimgs
import Colors from "../assets/ElaizaG/COLORS.jpeg";
import Lipo from "../assets/ElaizaG/LIPO.jpeg";
import Massage from "../assets/ElaizaG/MASSAGE.jpeg";
import Scrubs from "../assets/ElaizaG/SCRUBS.jpeg";
import Laser from "../assets/ElaizaG/LASER.jpeg";
import Facial from "../assets/FACIAL.jpg";
import laserhair from "../assets/LASER_HAIR_REMOVAL.jpg";

const Services = () => {
  const services = [
    {
      id: 1,
      title: "Luxury Facial Therapy",
      price: "₱400-₱2,500",
      image: Laser,
      tags: ["Skincare", "Relaxation"],
      description:
        "Premium facial treatment with organic products and hot stone therapy",
      icon: <MdFace className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 2,
      title: "Hair Restoration",
      price: "₱2,000",
      image: HairStyling,
      tags: ["Haircare", "Styling"],
      description:
        "Expert color matching and precision cutting with top-tier products",
      icon: <GiMirrorMirror className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 3,
      title: "Full/Partial Body Massage",
      price: "₱300-₱650",
      image: Massage,
      tags: ["Spa", "Wellness"],
      description:
        "Aromatherapy massage combining Swedish and deep tissue techniques",
      icon: <FaSpa className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 4,
      title: "Slimming/Lipo/Sculpting",
      price: "₱1,500-₱2,999",
      image: Facial,
      tags: ["Makeup", "Special Events"],
      description:
        "Professional permanent slimming options for targetted fat-loss",
      icon: <GiLipstick className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 5,
      title: "Nails",
      price: "₱120-₱850",
      image: Colors,
      tags: ["Nails", "Care"],
      description: "Luxurious nail treatment with paraffin wax and massage",
      icon: <FaHandSparkles className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 6,
      title: "Laser Whitening/Tattoo Removal",
      price: "₱500-₱2,500",
      image: Lipo,
      tags: ["Permanent", "Treatment"],
      description: "Advanced laser technology for smooth, blemish-free and marking-free skin",
      icon: <FaFingerprint className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 7,
      title: "Microblading",
      price: "₱2,500",
      image: Microblading,
      tags: ["Eyebrows", "Semi-Permanent"],
      description:
        "Natural-looking eyebrow enhancement with micro-pigmentation",
      icon: <MdOutlineSelfImprovement className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 8,
      title: "Cleaning",
      price: "₱400-₱2,500",
      image: Scrubs,
      tags: ["Detox", "Bodycare"],
      description:
        "Exfoliating treatment with herbal wraps for glowing skin and nails",
      icon: <FaSmile className="w-8 h-8 text-amber-600" />,
    },
    {
      id: 9,
      title: "Laser Hair Removal",
      price: "₱400-₱2,500",
      image: laserhair,
      tags: ["Semi-permanent", "Bodycare"],
      description:
        "Advanced laser technology for smooth, hair-free skin",
        icon: <GiSpray className="w-8 h-8 text-amber-600" />,

    },
  ];

  const [showAll, setShowAll] = useState(false);

  const toggleServices = () => {
    setShowAll(!showAll);
    if (!showAll) {
      scroll.scrollMore(500, { smooth: true });
    }
  };

  return (
    <section
      id="services"
      className=" py-20 bg-gradient-to-b from-[#fceed] to-[#f9eab8]"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-[Dancing_Script] mb-4 bg-gradient-to-r form-[#f7e7ce] to-[#ffe5b4] bg-clip-text">
            Our Beauty Lounge Services
          </h2>
          <p className="text-amber-800 max-w-2xl mx-auto text-xl font-medium font-[Dancing_Script]">
            Our Beauty Treatments Tailored for You
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {(showAll ? services : services.slice(0, 6)).map((service) => (
            <div
              key={services.id}
              className="group relative bg-[#fff9e6] rounded-2xl shadow-xl border-2 border-amber-100 overflow-hidden transition-all duration-300 hover:border-amber-200 hover:shadow-2xl hover:-translate-2"
            >
              <div className="relative h-72 overflow-hidden">
                <div className="absolute top04 right-4 z-10 bg-white/30 backdrop-blur-sm p-2 rounded-full">
                  {service.icon}
                </div>
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transform transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  {/*Price Placeholder */}
                  <span className="bg-amber-500/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg">
                    {service.price}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {service.tags.map((tag) => (
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-200 hover:bg-amber-100 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-[Dancing_Script] mb-2 text-amber-800">
                  {service.title}
                </h3>
                <p className="text-amber-600 leading-relaxed font-medium">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/*toggle */}
        <div className="flex justify-center mt-12">
          <button
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-black px-8 py-3 rounded-full hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-200 font-bold flex items-center gap-2"
            onClick={toggleServices}
          >
            {showAll ? "Show Less" : "Explore More"}
            <GiFlowerTwirl className="w-5 h-5 animate-pulse " />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
