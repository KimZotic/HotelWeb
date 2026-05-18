"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { HeadphonesIcon, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isRoomPage = pathname?.includes('/room/');
  
  // LOGIK BAHARU: Jika berada di halaman admin, JANGAN RENDER NAVBAR INI (Return null)
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hentikan fungsi Navbar sepenuhnya jika di halaman Admin
  if (isAdminPage) return null;

  const whatsappLink = "https://wa.me/60123456789?text=Hello%20INAP%20MUSE,%20I%20need%20help%20with%20my%20booking.";
  const applyScrolledStyle = isScrolled || isRoomPage;

  return (
    <motion.header
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        applyScrolledStyle || isMobileMenuOpen
          ? "bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm py-4"
          : "bg-gradient-to-b from-black/70 to-transparent py-6"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className={`font-serif text-2xl font-bold tracking-tighter transition-colors duration-300 ${applyScrolledStyle || isMobileMenuOpen ? "text-gray-900" : "text-white"}`}>
          INAP MUSE.
        </Link>

        <div className={`hidden md:flex items-center gap-10 font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${applyScrolledStyle ? "text-gray-500" : "text-gray-300"}`}>
          <Link href="/#rooms" className="hover:text-muse-primary hover:opacity-100 transition-all">Rooms</Link>
          <Link href="/#facilities" className="hover:text-muse-primary hover:opacity-100 transition-all">Facilities</Link>
          <Link href="/#gallery" className="hover:text-muse-primary hover:opacity-100 transition-all">Gallery</Link>
          <Link href="/#location" className="hover:text-muse-primary hover:opacity-100 transition-all">Location</Link>
        </div>

        <div className="hidden md:block">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs tracking-wide transition-all duration-300 ${applyScrolledStyle ? "bg-gray-100 text-gray-700 hover:bg-green-600 hover:text-white" : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-green-500"}`}>
            <HeadphonesIcon size={16} /> Support
          </a>
        </div>

        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`md:hidden p-2 rounded-full transition-colors ${applyScrolledStyle || isMobileMenuOpen ? "text-gray-900 bg-gray-100" : "text-white bg-white/20"}`}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-gray-900/95 backdrop-blur-3xl border-t border-gray-800 mt-4 overflow-hidden rounded-b-[32px] shadow-2xl absolute left-0 right-0">
            <div className="flex flex-col px-8 py-8 gap-4 font-sans text-sm font-bold uppercase tracking-widest text-gray-300">
              <Link href="/#rooms" onClick={() => setIsMobileMenuOpen(false)} className="py-3 border-b border-gray-800 hover:text-white transition-colors">Rooms</Link>
              <Link href="/#facilities" onClick={() => setIsMobileMenuOpen(false)} className="py-3 border-b border-gray-800 hover:text-white transition-colors">Facilities</Link>
              <Link href="/#gallery" onClick={() => setIsMobileMenuOpen(false)} className="py-3 border-b border-gray-800 hover:text-white transition-colors">Gallery</Link>
              <Link href="/#location" onClick={() => setIsMobileMenuOpen(false)} className="py-3 border-b border-gray-800 hover:text-white transition-colors">Location</Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-5 mt-4 bg-green-600 text-white rounded-2xl hover:bg-green-500 transition-colors shadow-lg">
                <HeadphonesIcon size={18} /> WhatsApp Support
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}