"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ContactBand from "./ContactBand";
import defaultHeroBg from "@/assets/career/Careers hero BG.jpg";

export default function CareersLayout({
    children,
    breadcrumbs,
    showContactBand = false,
    cardBg = "bg-slate-50",
    heroBg = defaultHeroBg,
}) {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <div className="relative w-full h-[340px] sm:h-[669px] overflow-hidden">
                <Image
                    src={heroBg}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center"
                />
                <Navbar />
            </div>

            {children && (
                <main className="relative z-10 flex-grow w-full -mt-16 sm:-mt-87 pb-16">
                    <div className={`w-full lg:w-[80%] lg:ml-auto ${cardBg}`}>
                        {breadcrumbs && (
                            <div className="flex items-center gap-2 px-6 sm:px-10 py-4 text-sm">
                                {breadcrumbs}
                            </div>
                        )}
                        <div className="px-4 sm:px-8 py-10">
                            {children}
                        </div>
                    </div>
                </main>
            )}

            {showContactBand && <ContactBand />}
            <Footer />
        </div>
    );
}
