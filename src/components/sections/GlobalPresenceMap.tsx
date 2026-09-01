'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, Mail, Globe } from 'lucide-react';

// --- Data Structures & Type Definitions ---

export interface Coordinate {
  x: number;
  y: number;
}

export interface OfficeLocation {
  id: string;
  name: string;
  type: 'HQ' | 'Regional';
  coordinates: Coordinate;
  timezone: string;
  address: string;
  phone: string;
  email: string;
}

const LOCATIONS: OfficeLocation[] = [
  {
    id: "pondy-hq",
    name: "Puducherry",
    type: "HQ",
    coordinates: { x: 72.5, y: 52.2 },
    timezone: "IST (GMT +5:30)",
    address: "SST Tower, Main Road, Puducherry, India",
    phone: "+91 413 XXXXXXX",
    email: "hq@supportstudio.tech"
  },
  {
    id: "oman-office",
    name: "Oman",
    type: "Regional",
    coordinates: { x: 64.5, y: 45.0 },
    timezone: "GST (GMT +4:00)",
    address: "Muscat, Sultanate of Oman",
    phone: "+968 2456 7890",
    email: "oman@supportstudio.tech"
  },
  {
    id: "uae-office",
    name: "UAE",
    type: "Regional",
    coordinates: { x: 65.0, y: 40.3 },
    timezone: "GST (GMT +4:00)",
    address: "Dubai Internet City, Dubai, UAE",
    phone: "+971 4 234 5678",
    email: "uae@supportstudio.tech"
  },
  {
    id: "qatar-office",
    name: "Qatar",
    type: "Regional",
    coordinates: { x: 63.5, y: 40.1 },
    timezone: "AST (GMT +3:00)",
    address: "Doha, Qatar",
    phone: "+974 4456 7890",
    email: "qatar@supportstudio.tech"
  },
  {
    id: "ksa-jeddah",
    name: "KSA – Jeddah",
    type: "Regional",
    coordinates: { x: 60.5, y: 43.0 },
    timezone: "AST (GMT +3:00)",
    address: "Jeddah, Saudi Arabia",
    phone: "+966 12 123 4567",
    email: "ksa@supportstudio.tech"
  },
  {
    id: "kuwait-office",
    name: "Kuwait",
    type: "Regional",
    coordinates: { x: 62.4, y: 36.1 },
    timezone: "AST (GMT +3:00)",
    address: "Kuwait City, Kuwait",
    phone: "+965 2234 5678",
    email: "kuwait@supportstudio.tech"
  },
  {
    id: "riyadh-office",
    name: "Riyadh",
    type: "Regional",
    coordinates: { x: 62.6, y: 41.4 },
    timezone: "AST (GMT +3:00)",
    address: "Olaya District, Riyadh, KSA",
    phone: "+966 11 123 4567",
    email: "riyadh@supportstudio.tech"
  }
];

// --- Live Offset Clock Component ---

interface LiveClockProps {
  timezone: string;
}

const LiveClock: React.FC<LiveClockProps> = ({ timezone }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const match = timezone.match(/GMT\s*([+-]\d+(?::\d+)?)/);
        if (!match) {
          setTime('');
          return;
        }
        const offsetStr = match[1];
        const multiplier = offsetStr.startsWith('-') ? -1 : 1;
        const absOffset = offsetStr.replace(/^[+-]/, '');
        const parts = absOffset.split(':');
        const offsetHours = parseInt(parts[0], 10) * multiplier;
        const offsetMinutes = (parts[1] ? parseInt(parts[1], 10) : 0) * multiplier;

        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const localTime = new Date(utc + (3600000 * offsetHours) + (60000 * offsetMinutes));

        setTime(localTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }));
      } catch (err) {
        setTime('');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <span className="font-bold text-slate-800 tabular-nums">
      {time || 'Calculating...'}
    </span>
  );
};

// --- Tooltip Component ---

interface TooltipCardProps {
  location: OfficeLocation;
}

const TooltipCard: React.FC<TooltipCardProps> = ({ location }) => {
  const isHQ = location.type === 'HQ';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 min-w-[140px] bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-[0_12px_24px_-4px_rgba(5,150,105,0.12)] pointer-events-none"
    >
      <div className="flex flex-col justify-center items-center">
        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold text-white rounded-md uppercase tracking-wider mb-1 ${isHQ ? 'bg-emerald-600' : 'bg-teal-500'
          }`}>
          {isHQ ? 'Global HQ' : 'Regional Office'}
        </span>
        <h4 className="text-slate-900 font-bold text-sm leading-tight text-center">{location.name}</h4>
      </div>

      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-slate-100/50 -z-10" />
    </motion.div>
  );
};

// --- Pin Marker Component (Monochromatic Depth Setup) ---

interface MapPinMarkerProps {
  location: OfficeLocation;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const MapPinMarker: React.FC<MapPinMarkerProps> = ({
  location,
  isActive,
  isHovered,
  onSelect,
  onHoverStart,
  onHoverEnd
}) => {
  const isHQ = location.type === 'HQ';

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${isHovered || isActive ? 'z-50' : 'z-20'}`}
      style={{ left: `${location.coordinates.x}%`, top: `${location.coordinates.y}%` }}
    >
      <motion.button
        type="button"
        className="relative flex items-center justify-center p-2 rounded-full cursor-pointer focus:outline-none"
        onClick={onSelect}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        onFocus={onHoverStart}
        onBlur={onHoverEnd}
        whileHover={{ scale: 1.25 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        aria-label={`Office in ${location.name}`}
      >
        {isHQ ? (
          /* HQ PIN — EMERALD DEPTH */
          <>
            <span className="absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white shadow-md shadow-emerald-600/50" />
          </>
        ) : (
          /* REGIONAL PIN — TEAL DEPTH */
          <>
            <span
              className={`absolute inline-flex rounded-full opacity-40 transition-all duration-300 ${isActive || isHovered ? 'h-6 w-6 bg-teal-300 animate-ping' : 'h-4 w-4 bg-teal-200'
                }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white shadow-md transition-colors duration-300 ${isActive || isHovered ? 'bg-teal-500' : 'bg-teal-400'
                }`}
            />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isHovered && <TooltipCard location={location} />}
      </AnimatePresence>
    </div>
  );
};

// --- Main Map Component ---

export default function GlobalPresenceMap() {
  const [activeLocation, setActiveLocation] = useState<OfficeLocation | null>(LOCATIONS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  useEffect(() => {
    if (hoveredId) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % LOCATIONS.length;
        setActiveLocation(LOCATIONS[next]);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [hoveredId]);

  return (
    <section className="relative py-24 bg-white overflow-visible">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Title Header */}
        <motion.div
          className="text-center mb-12"
          variants={headerVariants as any}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-emerald-600 text-base sm:text-lg">✦</span>
            <p className="text-xs sm:text-sm font-medium tracking-widest uppercase text-slate-500">
              Our Global Presence
            </p>
          </motion.div>
          <motion.h2
            className="text-3xl lg:text-6xl xl:text-4xl font-normal leading-tight mb-4 text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Connecting Enterprises <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent font-semibold">Across Borders</span>
          </motion.h2>
          <motion.p
            className="text-gray-600 max-w-4xl mx-auto leading-relaxed text-md mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Support Studio Technologies (SST) combines local expertise with global delivery capabilities.<br />
            With our headquarters in India and a strong footprint across the Middle East, we bring world-class enterprise solutions solutions closer to our clients.
          </motion.p>
        </motion.div>

        {/* Dual-Panel Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">

          {/* Left Panel: Map Canvas */}
          <div className="lg:col-span-8 relative bg-slate-50/50 border border-slate-100 rounded-[2rem] p-4 md:p-6 overflow-hidden shadow-sm shadow-slate-200/20">
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/worldmap.svg"
                alt="World Map – SST Office Locations"
                className="block w-full h-auto rounded-xl pointer-events-none select-none opacity-90"
                draggable={false}
              />

              <div className="absolute inset-0 z-10">
                {LOCATIONS.map((loc) => (
                  <MapPinMarker
                    key={loc.id}
                    location={loc}
                    isActive={activeLocation?.id === loc.id}
                    isHovered={hoveredId === loc.id}
                    onSelect={() => {
                      setActiveLocation(loc);
                      setCurrentIndex(LOCATIONS.findIndex(l => l.id === loc.id));
                    }}
                    onHoverStart={() => {
                      setHoveredId(loc.id);
                      setActiveLocation(loc);
                      setCurrentIndex(LOCATIONS.findIndex(l => l.id === loc.id));
                    }}
                    onHoverEnd={() => {
                      setHoveredId(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Map Legend */}
            <div className="mt-4 flex flex-wrap gap-6 text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 uppercase">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-600/20" />
                <span>Global HQ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white ring-2 ring-teal-500/20" />
                <span>Regional Nodes</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Dynamic Color Sync Sidebar */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex-1 bg-white border border-slate-100 p-8 rounded-2xl shadow-md shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
              <AnimatePresence mode="wait">
                {activeLocation ? (
                  <motion.div
                    key={activeLocation.id}
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -12 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      {/* --- SYNCED UI ACCENT BADGE --- */}
                      <div className="flex items-center gap-2 mb-6">
                        <span className={`inline-block px-3 py-1 text-[10px] font-black text-white rounded-full uppercase tracking-widest transition-colors duration-300 ${activeLocation.type === 'HQ' ? 'bg-emerald-600' : 'bg-teal-500'
                          }`}>
                          {activeLocation.type === 'HQ' ? 'Global HQ' : 'Regional Office'}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-300 ${activeLocation.type === 'HQ' ? 'bg-emerald-500' : 'bg-teal-400'
                          }`} />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active</span>
                      </div>

                      {/* Head Office Name */}
                      <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-none">
                        {activeLocation.name}
                      </h3>

                      {/* --- SYNCED CLOCK BAR ICON --- */}
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl mb-6">
                        <Clock className={`w-4 h-4 shrink-0 transition-colors duration-300 ${activeLocation.type === 'HQ' ? 'text-emerald-600' : 'text-teal-500'
                          }`} />
                        <span className="text-xs text-slate-500 font-medium">
                          Local Time: <LiveClock timezone={activeLocation.timezone} />
                        </span>
                        <span className="text-slate-350">|</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {activeLocation.timezone.split(' ')[0]}
                        </span>
                      </div>

                      {/* --- SYNCED ADDRESS PIN ICON --- */}
                      <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 mb-6 flex gap-3.5 items-start">
                        <MapPin className={`w-5 h-5 shrink-0 mt-0.5 transition-colors duration-300 ${activeLocation.type === 'HQ' ? 'text-emerald-600' : 'text-teal-500'
                          }`} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Office Location</p>
                          <p className="text-slate-700 text-sm leading-relaxed font-semibold">
                            {activeLocation.address}
                          </p>
                        </div>
                      </div>

                      {/* --- SYNCED CONTACT ICON BLOCKS --- */}
                      <div className="space-y-4 border-t border-slate-150 pt-6">
                        <div className="flex items-center gap-4 group">
                          <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 transition-all duration-300 ${activeLocation.type === 'HQ'
                            ? 'text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'text-teal-500 group-hover:bg-teal-500 group-hover:text-white'
                            }`}>
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Direct Line</p>
                            <p className="text-slate-800 font-bold text-sm select-all">{activeLocation.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                          <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 transition-all duration-300 ${activeLocation.type === 'HQ'
                            ? 'text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'text-teal-500 group-hover:bg-teal-500 group-hover:text-white'
                            }`}>
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Email Inquiries</p>
                            <a
                              href={`mailto:${activeLocation.email}`}
                              className={`text-slate-800 font-bold text-sm transition-colors duration-200 ${activeLocation.type === 'HQ' ? 'hover:text-emerald-600' : 'hover:text-teal-500'
                                }`}
                            >
                              {activeLocation.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Fallback Global State */
                  <motion.div
                    key="unhovered-state"
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -12 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="flex flex-col items-center justify-center text-center p-8 py-16 h-full min-h-[400px] border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 cursor-default"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 w-12 h-12 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-600 bg-white shadow-sm">
                        <Globe className="w-5 h-5 animate-spin [animation-duration:12s]" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-2">Global Operations Hub</h4>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-[220px] leading-relaxed">
                      Hover over any interactive pin location on the map to explore office details.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}