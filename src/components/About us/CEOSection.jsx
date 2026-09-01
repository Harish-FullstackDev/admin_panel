import React, { Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import CEOImage from "../../assets/aboutus/CEO3.png";
import CEOBG from "../../assets/aboutus/CEOBG.svg";

const AnimatedCEOMessage = dynamic(() => import("./AnimatedAbouts/AnimatedCEO.jsx"), {
  ssr: false, 
  loading: () => <CEOMessageSkeleton />, 
});

const CEOMessageSkeleton = () => (
  <section
    className="relative text-white pt-16 bg-cover bg-center overflow-x-hidden overflow-hidden"
    style={{ backgroundImage: `url(${CEOBG.src})` }}
  >
    <div className="w-full px-6 lg:px-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div className="lg:col-span-2">
        <div className="flex items-center space-x-2 text-gray-300 text-sm mb-2">
          <span className="text-blue-500">✦</span>
          <p className="text-sm font-medium tracking-wider uppercase">
            Message from CEO
          </p>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Leading with <span className="gradient-text">Innovation</span>
        </h2>
        <p className="text-gray-200 mb-6 leading-loose [br]:block [br]:mb-4">
          "The future belongs to enterprises that embrace change fearlessly. At
          SFT, we partner with our clients to accelerate
          <br /> this journey from digitizing processes to adopting cloud,
          analytics, and next-generation enterprise platforms. Our <br />
          strength lies in our people, our partnerships, and our passion for
          excellence. Together, we are not just building <br />
          solutions, we are shaping the future of intelligent enterprises."
        </p>
        <div>
          <p className="font-semibold text-lg">- Krishnakumar</p>
          <p className="text-sm text-gray-300">
            Chief Executive Officer <br />
            Support Studio Technologies
          </p>
        </div>
      </div>
      <div className="flex justify-center lg:justify-end items-start">
        <Image
          src={CEOImage}
          alt="CEO"
          className="rounded-xl object-cover shadow-lg"
        />
      </div>
    </div>
  </section>
);

const MessageFromCEO = () => {
  return (
    <Suspense fallback={<CEOMessageSkeleton />}>
      <AnimatedCEOMessage />
    </Suspense>
  );
};

export default MessageFromCEO;
