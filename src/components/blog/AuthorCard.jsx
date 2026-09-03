"use client";

import Image from "next/image";
import { Linkedin, Globe } from "lucide-react";
import author from "./AuthorData";

export default function AuthorCard() {
    return (
        <section className="mt-20 border-t pt-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Image
                        src={author.image}
                        alt={author.name}
                        width={90}
                        height={90}
                        className="rounded-full object-cover"
                    />

                    <div className="flex-1">
                        <p className="text-sm text-blue-600 font-semibold uppercase">
                            About the Author
                        </p>

                        <h3 className="text-2xl font-bold mt-2">
                            {author.name}
                        </h3>

                        <p className="text-slate-500 mt-1">
                            {author.designation}
                        </p>

                        <p className="mt-4 leading-7 text-slate-600">
                            {author.bio}
                        </p>

                        <div className="flex gap-4 mt-6">
                            <a
                                href={author.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                                <Linkedin size={18} />
                                LinkedIn
                            </a>

                            <a
                                href={author.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                                <Globe size={18} />
                                Website
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}