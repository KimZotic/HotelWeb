"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Wifi, Bath, BedDouble, Wind, Coffee, ArrowRight, CalendarDays, Star, CheckCircle2, MapPin, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfToday } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css"; 

export default function Home() {
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const roomsData = [
    { id: "room-1", name: "The Master Suite", price: 350, image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop" },
    { id: "room-2", name: "Deluxe Nature", price: 250, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop" },
    { id: "room-3", name: "Classic Studio", price: 180, image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1000&auto=format&fit=crop" }
  ];

  const reviews = [
    { name: "Sarah L.", loc: "United Kingdom", text: "Absolutely breathtaking. The attention to detail in the suite and the surrounding nature made our honeymoon perfect." },
    { name: "Ahmad F.", loc: "Malaysia", text: "Pengalaman 5-bintang yang luar biasa. Suasana tenang dan fasiliti sangat premium. Pasti akan kembali lagi." },
    { name: "John D.", loc: "Australia", text: "The booking process was seamless, and the physical location exceeded all expectations. A hidden gem." },
    { name: "Mei Ling", loc: "Singapore", text: "The architectural design is simply stunning. Blends perfectly with nature without compromising luxury." }
  ];
  const infiniteReviews = [...reviews, ...reviews, ...reviews];

  const scrollToRooms = () => {
    const roomsSection = document.getElementById('rooms');
    roomsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <main className="min-h-screen bg-muse-bg selection:bg-muse-primary selection:text-white pb-0 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[95vh] flex items-center justify-center">
        <motion.div initial={{ scale: 1.05, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000&auto=format&fit=crop" alt="Inap Muse Scenery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30"></div> 
        </motion.div>

        <div className="relative z-10 text-center px-4 flex flex-col items-center mt-12 md:mt-0">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-white/70 font-sans text-xs md:text-sm uppercase tracking-[0.4em] font-semibold mb-6 flex items-center gap-4">
            <span className="w-8 md:w-12 h-[1px] bg-white/40"></span> Exclusive & Serene <span className="w-8 md:w-12 h-[1px] bg-white/40"></span>
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="font-serif text-5xl md:text-9xl font-bold text-white mb-6 tracking-tighter drop-shadow-2xl">
            INAP MUSE
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="font-sans text-base md:text-xl max-w-2xl text-gray-300 font-light leading-relaxed px-4">
            Escape the ordinary. Experience world-class hospitality surrounded by the tranquility of nature.
          </motion.p>
        </div>

        {/* BOOKING BAR */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8, type: "spring" }} className="absolute -bottom-48 md:-bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-30">
          <div className="bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-[32px] p-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex flex-col md:flex-row gap-0 md:gap-4 relative px-2">
              <div onClick={() => { setShowCalendar(!showCalendar); setShowGuestMenu(false); }} className="flex-1 flex items-center gap-4 py-3 px-4 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors border-b md:border-b-0 md:border-r border-gray-100">
                <div className="w-10 h-10 rounded-full bg-muse-primary/10 flex items-center justify-center text-muse-primary flex-shrink-0"><CalendarDays size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Stay Dates</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}` : format(dateRange.from, "MMM d")) : "Select Dates"}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {showCalendar && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-[110%] left-0 md:left-auto md:w-auto w-full bg-white border border-gray-100 shadow-2xl rounded-3xl p-4 z-50">
                    <style>{`.rdp { --rdp-cell-size: 40px; --rdp-accent-color: #AB1509; margin: 0; } .rdp-day_selected { font-weight: bold; } .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f3f4f6; }`}</style>
                    <DayPicker mode="range" selected={dateRange} onSelect={setDateRange} disabled={[{ before: startOfToday() }]} numberOfMonths={1} pagedNavigation />
                    <div className="mt-4 flex justify-end"><button onClick={() => setShowCalendar(false)} className="text-sm font-bold text-muse-primary hover:text-red-900 px-4 py-2">Done</button></div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div onClick={() => { setShowGuestMenu(!showGuestMenu); setShowCalendar(false); }} className="flex-1 flex items-center gap-4 py-3 px-4 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors relative">
                <div className="w-10 h-10 rounded-full bg-muse-primary/10 flex items-center justify-center text-muse-primary flex-shrink-0"><Users size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Guests</span>
                  <span className="font-semibold text-gray-900 text-sm">{guests.adults} Adults{guests.children > 0 ? `, ${guests.children} Children` : ''}</span>
                </div>
                <AnimatePresence>
                  {showGuestMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-[110%] right-0 w-full md:w-[280px] bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 z-50" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-gray-800 text-sm">Adults</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setGuests({...guests, adults: Math.max(1, guests.adults - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-muse-primary transition-all">-</button>
                          <span className="font-bold w-4 text-center">{guests.adults}</span>
                          <button onClick={() => setGuests({...guests, adults: guests.adults + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-muse-primary transition-all">+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col"><span className="font-bold text-gray-800 text-sm">Children</span><span className="text-[10px] text-gray-400">Ages 2-12</span></div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setGuests({...guests, children: Math.max(0, guests.children - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-muse-primary transition-all">-</button>
                          <span className="font-bold w-4 text-center">{guests.children}</span>
                          <button onClick={() => setGuests({...guests, children: guests.children + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-muse-primary transition-all">+</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <button onClick={scrollToRooms} className="w-full md:w-auto bg-gray-900 text-white px-10 py-5 rounded-2xl font-bold tracking-wide hover:bg-muse-primary transition-all duration-300 shadow-xl whitespace-nowrap">
              Check Availability
            </button>
          </div>
        </motion.div>
      </section>

      <div className="h-56 md:h-32"></div>

      {/* 2. ROOMS SECTION */}
      <section id="rooms" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 scroll-mt-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="mb-12 flex flex-col gap-2">
          <span className="text-muse-accent font-sans text-xs uppercase tracking-widest font-semibold block">Accommodations</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">The Collection</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roomsData.map((room, idx) => (
            <Link href={`/room/${room.id}`} key={room.id} className="block">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: idx * 0.1 }} className="bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-gray-100 flex flex-col h-full cursor-pointer">
                <div className="relative h-60 overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full font-bold text-white text-xs">RM {room.price} <span className="font-normal text-gray-300">/night</span></div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2 group-hover:text-muse-primary transition-colors">{room.name}</h3>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                     <div className="flex gap-3 text-gray-400"><Users size={16} /><BedDouble size={16} /><Bath size={16} /></div>
                     <span className="text-xs font-bold text-muse-primary uppercase tracking-wider flex items-center gap-1">View Details <ArrowRight size={14}/></span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FACILITIES SECTION */}
      <section id="facilities" className="bg-white py-20 border-y border-gray-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="text-muse-accent font-sans text-xs uppercase tracking-widest font-semibold mb-2 block">Amenities</span>
            <h2 className="font-serif text-4xl font-bold text-gray-900">World-Class Facilities</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: <Wifi size={32}/>, title: "High-Speed WiFi", desc: "Stay connected anywhere" },
              { icon: <Coffee size={32}/>, title: "Artisan Cafe", desc: "Premium coffee & breakfast" },
              { icon: <Wind size={32}/>, title: "Nature Trail", desc: "Exclusive access to forest" },
              { icon: <CheckCircle2 size={32}/>, title: "Daily Housekeeping", desc: "Pristine cleanliness" }
            ].map((item, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: idx * 0.1 }} className="flex flex-col items-center text-center p-4 md:p-6 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-muse-primary/5 text-muse-primary flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. GALLERY SECTION */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 lg:px-12 py-20 scroll-mt-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">Captivating Moments</h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 md:gap-4 h-[400px] md:h-[500px]">
          <div className="col-span-2 row-span-2 rounded-[24px] overflow-hidden group"><img src="https://leisurepoolscanada.ca/wp-content/uploads/2023/09/060923-DesignTrends-Hero.webp" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Pool" /></div>
          <div className="rounded-[24px] overflow-hidden group"><img src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Nature" /></div>
          <div className="rounded-[24px] overflow-hidden group"><img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Lounge" /></div>
          <div className="col-span-2 rounded-[24px] overflow-hidden group"><img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Bathroom" /></div>
        </div>
      </section>

      {/* 5. LOCATION SECTION (MODERN DRONE AERIAL MAP) */}
      <section id="location" className="bg-gray-50 py-20 border-y border-gray-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">Getting Here</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 p-2">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="w-12 h-12 bg-muse-primary/10 text-muse-primary rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">INAP MUSE Ecopark</h3>
              <p className="text-gray-500 font-sans text-sm leading-relaxed mb-8">
                Jalan Alam Hijau, Bukit Antarabangsa,<br />
                68000 Ampang, Selangor,<br />
                Malaysia
              </p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-muse-primary transition-colors shadow-lg">
                <Map size={16} /> Open in Google Maps
              </a>
            </div>
            
            {/* GAMBAR "MAP" BAHARU (Drone Shot / Aerial View yang Mewah) */}
            <div className="md:col-span-2 h-[350px] md:h-auto rounded-[24px] overflow-hidden relative">
              <img src="https://cdn.libur.com.my/2022/03/444143.jpeg" alt="Aerial Drone Map View" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Animasi Radar & Pin Lokasi */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-muse-primary/40 rounded-full animate-ping"></div>
                <div className="absolute w-20 h-20 bg-muse-primary/30 rounded-full animate-pulse"></div>
                <div className="relative w-14 h-14 bg-white/95 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-muse-primary">
                  <MapPin size={24} fill="currentColor" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. REVIEWS SECTION */}
      <section className="bg-gray-900 py-24 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16 text-center relative z-10">
          <h2 className="font-serif text-4xl font-bold mb-4">Guest Experiences</h2>
          <div className="flex items-center justify-center gap-1 text-yellow-400 mb-2">
            <Star fill="currentColor" size={20}/><Star fill="currentColor" size={20}/><Star fill="currentColor" size={20}/><Star fill="currentColor" size={20}/><Star fill="currentColor" size={20}/>
          </div>
          <p className="text-gray-400 text-sm">Rated 4.9/5 by over 200 international guests.</p>
        </div>

        <div className="relative w-full overflow-hidden flex z-10">
          <motion.div className="flex gap-6 px-3" animate={{ x: [0, -2000] }} transition={{ repeat: Infinity, ease: "linear", duration: 30 }}>
            {infiniteReviews.map((rev, idx) => (
              <div key={idx} className="bg-gray-800 rounded-[24px] p-8 border border-gray-700 w-[350px] flex-shrink-0">
                <p className="text-gray-300 font-sans italic mb-6 leading-relaxed text-sm">"{rev.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm text-white">{rev.name.charAt(0)}</div>
                  <div><h4 className="font-bold text-sm text-white">{rev.name}</h4><span className="text-xs text-gray-500">{rev.loc}</span></div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-gray-900 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-gray-900 to-transparent z-20 pointer-events-none"></div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-black text-gray-400 py-16 px-6 lg:px-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="text-center md:text-left">
            <p className="font-serif text-3xl font-bold text-white mb-2 tracking-tighter">INAP MUSE.</p>
            <p className="text-xs text-gray-500">Elegance meets nature in the heart of Malaysia.</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69A4.83 4.83 0 0 1 15.64 5v8.52a4.48 4.48 0 1 1-4.48-4.48c.28 0 .55.03.82.08v3.15a1.33 1.33 0 1 0 1.25 1.25V2h3.15a7.99 7.99 0 0 0 5.62 2.18v3.15c-1.3-.01-2.5-.54-3.41-1.46z"/>
              </svg>
            </a>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
              <MapPin size={18} />
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 gap-4">
          <p>© {new Date().getFullYear()} INAP MUSE Ecopark. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}