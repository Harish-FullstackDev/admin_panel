"use client";

import Image from "next/image";

export default function Hero({ backgroundImage }) {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {backgroundImage && (
                <Image src={backgroundImage} alt="" fill priority className="object-cover object-center" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent" />
        </div>
    );
}
