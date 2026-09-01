"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";

export default function SmokeLoader({ onComplete }) {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const smokeContainerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const container = containerRef.current;
    const logo = logoRef.current;
    const smokeContainer = smokeContainerRef.current;

    if (!container || !logo || !smokeContainer) return;

    // Create smoke particles dynamically
    const smokeParticles = [];
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement("div");
      particle.className = "smoke-particle absolute rounded-full opacity-0";

      const size = Math.random() * 120 + 60;
      const x = Math.random() * window.innerWidth;
      const y = window.innerHeight + Math.random() * 200;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.background = `radial-gradient(circle, 
        rgba(54, 80, 165, 0.6) 0%, 
        rgba(45, 142, 197, 0.4) 35%, 
        rgba(48, 205, 176, 0.3) 70%, 
        transparent 100%)`;
      particle.style.filter = `blur(${Math.random() * 3 + 2}px)`;

      smokeContainer.appendChild(particle);
      smokeParticles.push(particle);
    }

    // Set initial states
    gsap.set(logo, {
      scale: 0,
      opacity: 0,
      rotation: -45,
      y: 50,
    });

    gsap.set(smokeParticles, {
      scale: 0,
      opacity: 0,
      rotation: 0,
    });

    // Create main timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          onComplete();
          // Clean up particles
          smokeParticles.forEach((particle) => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          });
        }, 500);
      },
    });

    // Animate smoke particles rising
    tl.to(smokeParticles, {
      scale: 1,
      opacity: 0.8,
      y: `-=${window.innerHeight + 300}`,
      x: "+=random(-100, 100)",
      rotation: "random(-180, 180)",
      duration: 3,
      stagger: {
        amount: 1.5,
        from: "random",
      },
      ease: "power2.out",
    })
      // Logo entrance during smoke animation
      .to(
        logo,
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          y: 0,
          duration: 1.5,
          ease: "back.out(1.7)",
        },
        "-=2"
      )
      // Logo glow pulse
      .to(
        logo,
        {
          filter: "drop-shadow(0 0 30px rgba(48, 205, 176, 0.8))",
          duration: 0.8,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
        "-=0.5"
      )
      // Continue smoke swirling around logo
      .to(
        smokeParticles,
        {
          scale: 1.5,
          opacity: 0.6,
          rotation: "+=random(180, 360)",
          x: "+=random(-150, 150)",
          duration: 2,
          stagger: 0.1,
          ease: "power1.inOut",
        },
        "-=1.5"
      )
      // Final smoke dissipation
      .to(smokeParticles, {
        scale: 2.5,
        opacity: 0,
        y: `-=${200}`,
        rotation: "+=random(180, 360)",
        duration: 1.5,
        stagger: 0.05,
        ease: "power2.in",
      }, "+=0.5")
      // Logo final animation
      .to(
        logo,
        {
          scale: 0.9,
          opacity: 0,
          y: -30,
          duration: 1,
          ease: "power2.in",
        },
        "-=1"
      )
      // Container fade out
      .to(
        container,
        {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
        },
        "-=0.5"
      );

    return () => {
      tl.kill();
      smokeParticles.forEach((particle) => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [mounted, onComplete]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
    >
      {/* Smoke Container */}
      <div ref={smokeContainerRef} className="absolute inset-0 pointer-events-none" />

      {/* Additional atmospheric smoke layers */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={`bg-smoke-${i}`}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${Math.random() * 300 + 150}px`,
              height: `${Math.random() * 300 + 150}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, 
                rgba(54, 80, 165, 0.3) 0%, 
                rgba(45, 142, 197, 0.2) 50%, 
                rgba(48, 205, 176, 0.1) 100%)`,
              filter: `blur(${Math.random() * 5 + 3}px)`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo Container */}
      <div ref={logoRef} className="relative z-10 flex items-center justify-center">
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#3650a5] via-[#2d8ec5] to-[#30cdb0] rounded-full blur-xl opacity-60 scale-150 animate-pulse" />

          {/* Logo */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
            <Image
              src="/assets/Home/SSTLogo.svg"
              alt="SST Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Floating sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 rounded-full opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `linear-gradient(45deg, #3650a5, #2d8ec5, #30cdb0)`,
              boxShadow: "0 0 10px rgba(48, 205, 176, 0.8)",
              animation: `sparkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        .smoke-particle {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
