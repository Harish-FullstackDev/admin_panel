"use client";

import { useState } from "react";
import imgSap from "./assets/sap-solutions.png";
import imgCloudSolutions from "./assets/cloud-solutions.png";
import imgUiUx from "./assets/ui-ux-design.png";
import imgSupportMaintenance from "./assets/support-maintenance.png";

// ─── SVG gradient background strings ──────────────────────────────────────────

const BG_EA = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 310 360' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><g transform='matrix(14.4 -26.2 28.48 15.653 266.5 111.5)' opacity='1'><rect height='128.11' width='106.55' fill='url(%23grad)' id='quad' shape-rendering='crispEdges'/><use href='%23quad' transform='scale(1 -1)'/><use href='%23quad' transform='scale(-1 1)'/><use href='%23quad' transform='scale(-1 -1)'/></g><defs><linearGradient id='grad' gradientUnits='userSpaceOnUse' x2='5' y2='5'><stop stop-color='rgba(10,146,230,1)' offset='0'/><stop stop-color='rgba(8,113,178,1)' offset='0.264'/><stop stop-color='rgba(5,80,127,1)' offset='0.529'/><stop stop-color='rgba(3,51,79,1)' offset='0.764'/><stop stop-color='rgba(1,21,32,1)' offset='1'/></linearGradient></defs></svg>\")";

const BG_DT = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 310 360' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><g transform='matrix(34.45 -0.05 0.017 11.559 263 127)' opacity='1'><rect height='300.82' width='82.356' fill='url(%23grad)' id='quad' shape-rendering='crispEdges'/><use href='%23quad' transform='scale(1 -1)'/><use href='%23quad' transform='scale(-1 1)'/><use href='%23quad' transform='scale(-1 -1)'/></g><defs><linearGradient id='grad' gradientUnits='userSpaceOnUse' x2='5' y2='5'><stop stop-color='rgba(0,170,255,1)' offset='0'/><stop stop-color='rgba(0,135,202,1)' offset='0.25'/><stop stop-color='rgba(0,100,150,1)' offset='0.5'/><stop stop-color='rgba(0,65,97,1)' offset='0.75'/><stop stop-color='rgba(0,30,45,1)' offset='1'/></linearGradient></defs></svg>\")";

const BG_WEB = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 310 360' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(57.1 10.4 -10.141 55.678 84.5 381)'><stop stop-color='rgba(0,0,0,1)' offset='0.423'/><stop stop-color='rgba(10,117,179,1)' offset='0.539'/><stop stop-color='rgba(0,0,0,1)' offset='0.832'/></radialGradient></defs></svg>\")";

const BG_CS = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 310 360' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><g transform='matrix(20.4 21.1 -58.427 56.489 90 199.5)' opacity='1'><rect height='29.88' width='154.58' fill='url(%23grad)' id='quad' shape-rendering='crispEdges'/><use href='%23quad' transform='scale(1 -1)'/><use href='%23quad' transform='scale(-1 1)'/><use href='%23quad' transform='scale(-1 -1)'/></g><defs><linearGradient id='grad' gradientUnits='userSpaceOnUse' x2='5' y2='5'><stop stop-color='rgba(0,13,20,1)' offset='0.284'/><stop stop-color='rgba(0,71,108,1)' offset='0.552'/><stop stop-color='rgba(0,168,255,1)' offset='1'/></linearGradient></defs></svg>\")";

const SAP_SVG_PATH = "M345.5 110.771C345.5 -3.22918 111 -0.895704 0 0.270962V192.771L332 196.771C342 196.771 345.5 183.771 345.5 110.771Z";

// ─── Hover wrapper ────────────────────────────────────────────────────────────

function HoverCard({ children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-[8px] overflow-hidden w-full h-full"
      style={{
        transform: hovered ? "scale(1.03) translateY(-5px)" : "scale(1) translateY(0)",
        transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease",
        boxShadow: hovered
          ? "0 28px 64px rgba(0,100,170,0.38), 0 0 0 1.5px rgba(0,170,255,0.5)"
          : "0 4px 24px rgba(0,0,0,0.45)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <div
        className="absolute inset-0 pointer-events-none rounded-[8px]"
        style={{
          background: "linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0) 65%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ label, gradientStyle }) {
  return (
    <div
      className="inline-flex items-center justify-center px-[8px] py-[8px] relative rounded-[16px] self-start"
    // style={{ backgroundImage: gradientStyle }}
    >
      {/* <div aria-hidden className="absolute border-[0.25px] border-solid border-white inset-[-0.125px] pointer-events-none rounded-[16.125px]" /> */}
      <span className="relative text-[12px] text-white leading-[12px] whitespace-nowrap" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* {label} */}
      </span>
    </div>
  );
}

// ─── Card text ────────────────────────────────────────────────────────────────

function CardText({ title, description }) {
  return (
    <div className="flex flex-col gap-[16px] w-full">
      <p className="text-white font-semibold text-[22px] sm:text-[26px] lg:text-[28px] leading-[1.2] m-0" style={{ fontFamily: "Inter, sans-serif" }}>
        {title}
      </p>
      <p className="text-white/80 text-[13px] sm:text-[14px] lg:text-[15px] leading-[1.55] m-0" style={{ fontFamily: "Inter, sans-serif" }}>
        {description}
      </p>
    </div>
  );
}

// ─── SAP Card ─────────────────────────────────────────────────────────────────

function Sap() {
  return (
    <HoverCard>
      <div className="absolute inset-0 rounded-[8px] bg-transparent"
      />
      <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none">
        <img alt="" className="absolute inset-0 w-full h-full object-cover " src={imgSap.src || imgSap} />
        <div className="absolute inset-0 rounded-[8px] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(220.601deg, rgba(0,0,0,0) 27.8%, rgb(0,71,112) 100%)",
          }}
        />
      </div>
      <div
        className="absolute pointer-events-none"
        style={{ left: "-16.5px", top: "172.73px", width: "345.5px", height: "196.771px" }}
      >
        {/* <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 345.5 196.771">
          <path d={SAP_SVG_PATH} fill="url(#sapGrad)" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="sapGrad" x1="169.639" x2="169.639" y1="0.212402" y2="196.771">
              <stop stopColor="#004F7D" />
              <stop offset="1" stopColor="#002337" />
            </linearGradient>
          </defs>
        </svg> */}
      </div>
      <div className="absolute top-[26px] left-[24px]">
        {/* <Badge label="Core Expertise" gradientStyle="linear-gradient(72.72deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" /> */}
      </div>
      <div className="absolute bottom-[24px] left-[24px] right-[24px]">
        <CardText title="SAP Solutions" description="From S/4HANA migrations to ZATCA compliance, full-cycle SAP delivery for GCC enterprises." />
      </div>
    </HoverCard>
  );
}

// ─── Gradient card (no photo) ─────────────────────────────────────────────────

function GradientCard({ badge, badgeGradient, title, description, bg }) {
  return (
    <HoverCard>
      <div className="absolute inset-0 rounded-[8px]" style={{ backgroundImage: bg }} />
      <div className="relative flex flex-col justify-between h-full px-[24px] py-[28px]">
        <Badge label={badge} gradientStyle={badgeGradient} />
        <CardText title={title} description={description} />
      </div>
    </HoverCard>
  );
}

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({ badge, badgeGradient, title, description, imgSrc, imgClass, overlay }) {
  return (
    <HoverCard>
      <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none">
        <img alt="" className={imgClass} src={imgSrc?.src || imgSrc} />
      </div>
      <div className="absolute inset-0 rounded-[8px] pointer-events-none" style={{ backgroundImage: overlay }} />
      <div className="relative flex flex-col justify-between h-full px-[24px] py-[28px]">
        <Badge label={badge} gradientStyle={badgeGradient} />
        <CardText title={title} description={description} />
      </div>
    </HoverCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnterpriseSolutionsGrid() {
  return (
    <div className="bg-white py-8">
      <section className="w-full pb-8 sm:pb-20">

        {/* Single responsive grid — 1 col on mobile, 2 on tablet, 4 on desktop */}
        <div className="w-full max-w-[1312px] mx-auto px-13 sm:px-8 xl:px-0">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: "20px 24px" }}
          >
            {[
              { h: 280, el: <Sap /> },
              { h: 280, el: <GradientCard badge="Applications" badgeGradient="linear-gradient(74.54deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="Enterprise Applications" description="End-to-end delivery of business-critical platforms — CRM, ERP, and custom enterprise systems." bg={BG_EA} /> },
              { h: 280, el: <PhotoCard badge="Infrastructure" badgeGradient="linear-gradient(73.63deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%)" title="Cloud Solutions" description="AWS, Azure, and hybrid cloud architectures optimised for scale and sovereignty." imgSrc={imgCloudSolutions} imgClass="absolute w-full h-full object-cover object-right max-w-full sm:max-w-none sm:h-[102.98%] sm:w-[188.98%] sm:left-[-75.29%] sm:top-[-3.05%]" overlay="linear-gradient(220.601deg, rgba(0,0,0,0) 27.8%, rgb(0,71,112) 100%)" /> },
              { h: 280, el: <GradientCard badge="Strategy" badgeGradient="linear-gradient(78.47deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="Digital Transformation" description="Reimagine operations with data-led strategies aligned to Vision 2030 and regional growth mandates." bg={BG_DT} /> },
              { h: 280, el: <GradientCard badge="Development" badgeGradient="linear-gradient(73.99deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="Web Development" description="Scalable full-stack applications from SAP Fiori extensions to bespoke web platforms." bg={BG_WEB} /> },
              { h: 280, el: <PhotoCard badge="Design" badgeGradient="linear-gradient(80deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="UI/UX Design" description="Interfaces that reduce friction and drive adoption — designed for enterprise users, not just aesthetics." imgSrc={imgUiUx} imgClass="absolute w-full h-full object-cover object-right max-w-full sm:max-w-none sm:h-[123.89%] sm:left-[-7.99%] sm:top-[-14.79%] sm:w-[215.78%]" overlay="linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,27,43,0.96) 96.389%)" /> },
              { h: 280, el: <GradientCard badge="Advisory" badgeGradient="linear-gradient(78.28deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="Consulting Services" description="Technology roadmaps and programme governance rooted in GCC enterprise reality — not generic frameworks." bg={BG_CS} /> },
              { h: 280, el: <PhotoCard badge="AMS" badgeGradient="linear-gradient(82.32deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)" title="Support & Maintenance" description="24/7 managed support with defined SLAs keeping your SAP and enterprise systems always on." imgSrc={imgSupportMaintenance} imgClass="absolute w-full h-full object-cover object-right max-w-full sm:max-w-none sm:h-[99.93%] sm:left-[-58%] sm:top-0 sm:w-[174.05%]" overlay="linear-gradient(211.651deg, rgba(0,0,0,0) 35.3%, rgb(0,45,72) 92.1%)" /> },
            ].map(({ el }, i) => (
              <div
                key={i}
                style={{
                  height: "clamp(260px, 30vw, 360px)",
                }}
              >
                {el}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
