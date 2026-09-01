"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import CareersHeroText from "./CareersHeroText";
// import heroBg from "@/assets/career/Hero Image.svg";
import heroBg from "@/assets/Careers.jpg";

export default function CareersHero() {
    return (
        <div className="relative w-full h-[340px] sm:h-screen overflow-hidden">
            <Image src={heroBg} alt="" fill priority className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            <Navbar />

            <div className="absolute inset-x-0 bottom-0 md:bottom-65 z-10 px-6 sm:px-10 md:ml-7 lg:px-[165px] pb-10 sm:pb-16">
                <CareersHeroText />
            </div>
        </div>
    );
}
