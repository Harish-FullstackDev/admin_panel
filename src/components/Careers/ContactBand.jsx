"use client";

import Image from "next/image";
import mailIcon from "@/assets/career/icons/mail.svg";
import callIcon from "@/assets/career/icons/call.svg";

const WHY_JOIN_US = [
    "Competitive salary and performance-based bonuses",
    "Flexible hybrid and remote work options",
    "Continuous learning and career development support",
    "Collaborative, inclusive team culture",
    "Clear pathways for growth and advancement",
];

export default function ContactBand() {
    return (
        <div className="w-full bg-slate-100 py-16 px-6">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
                <div className="w-full lg:w-[30%]">
                    <h3 className="text-slate-900 font-semibold text-lg mb-4">Why Join Us</h3>
                    <ul className="space-y-2.5">
                        {WHY_JOIN_US.map((point) => (
                            <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                                <span aria-hidden="true">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="w-full lg:w-[70%] flex items-center justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center max-w-3xl">
                        <div className="flex flex-col items-center gap-4">
                            <Image src={mailIcon} alt="" width={24} height={24} />
                            <div className="space-y-2">
                                <h3 className="text-slate-900 font-semibold text-lg">Email us</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Email us for general queries, including marketing and partnership opportunities
                                </p>
                                <a
                                    href="mailto:hr@isupportz.com"
                                    className="block text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    hr@isupportz.com
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Image src={callIcon} alt="" width={24} height={24} />
                            <div className="space-y-2">
                                <h3 className="text-slate-900 font-semibold text-lg">Call us</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Call us to speak to a member of our team. We are always happy to help
                                </p>
                                <a
                                    href="mailto:hr@isupportz.com"
                                    className="block text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    0413-2191301
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
