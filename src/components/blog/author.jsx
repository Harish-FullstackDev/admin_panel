"use client";

import Image from "next/image";
import authors from "@/components/blog/AuthorData";

export default function AuthorSection() {
    return (
        <section className="py-10  bg-gradient-to-r from-blue-50 via-blue-50 to-blue-50" >
            <div className="max-w-9xl mx-auto px-6">
                <div className="rounded-none bg-gray-100 backdrop-blur-xl border border-white/60 shadow-lg px-8 py-10">

                    <div className="text-center mb-12">
                        <h2 className="text-[28px] font-semibold text-slate-900">
                            Meet Our Authors
                        </h2>
                        <p className="text-lg font-light mt-3 max-w-2xl mx-auto">
                            Our experts share practical insights on AI, ERP, CRM,
                            cloud technologies, and digital transformation.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-12">
                        {authors.map((author) => (
                            <div
                                key={author.id}
                                className="flex items-center gap-4 min-w-[260px]"
                            >
                                <div className="rounded-full p-1 bg-white/50 backdrop-blur-sm border border-white/70">
                                    <Image
                                        src={author.image}
                                        alt={author.name}
                                        width={60}
                                        height={60}
                                        className="rounded-full object-cover"
                                    />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        {author.name}
                                    </h2>
                                    <p className="text-lg text-blue-600 font-light">
                                        {author.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}