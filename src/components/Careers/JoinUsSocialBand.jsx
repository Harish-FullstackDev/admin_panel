"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import linkedinIcon from "@/assets/career/icons/Linkedin.svg";
import instagramIcon from "@/assets/career/icons/Instagram.svg";
import twitterIcon from "@/assets/career/icons/Twitter.svg";
import footerBanner from "@/assets/career/Footer image banner.png";

const SOCIALS = [
    { icon: linkedinIcon, label: "LinkedIn", href: "https://www.linkedin.com/company/supportstudiotechnologies/" },
    { icon: instagramIcon, label: "Instagram", href: "https://www.instagram.com/isupportz.official?igsh=MWF5Z3M2MXFrbXI3cg==" },
    { icon: twitterIcon, label: "Twitter", href: "https://x.com/isupportz?s=11" },
];

export default function JoinUsSocialBand() {
    return (
        <section className="w-full">
            <div className="bg-[#f4f3f9] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8 sm:gap-10">
                        {/* <div className="hidden sm:block w-px h-[142px] bg-[#c9c9c9]" /> */}
                        <div className="flex flex-col gap-6">
                            {/* <div>
                                <p className="text-2xl text-black">Join US</p>
                                <p className="mt-2 text-base sm:text-lg text-black">
                                    Explore career opportunities at SST
                                </p>
                            </div>
                            <a
                                href="#job-listings"
                                className="inline-flex items-center gap-3 text-sm text-[#2d8ec5] font-medium group"
                            >
                                <span className="flex items-center justify-center size-8 rounded-full bg-black text-white transition-transform group-hover:scale-105">
                                    <ArrowUpRight className="w-4 h-4" />
                                </span>
                                Click Here
                            </a> */}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div>
                            <p className="text-2xl text-black">Social</p>
                            <p className="mt-2 text-base sm:text-lg text-black">Follow us for the latest updates</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {SOCIALS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="flex items-center justify-center size-9 rounded-full overflow-hidden transition-transform hover:scale-110"
                                >
                                    <Image src={social.icon} alt="" width={36} height={36} />
                                </a>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
