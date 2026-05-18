"use client";

import { useState, useMemo, useEffect, use } from "react";
import Link from "next/link";
import { Users, BedDouble, Bath, Wifi, Wind, Coffee, Check, Star, X, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { format, differenceInDays, startOfToday, eachDayOfInterval, parseISO } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const roomsData = [
  { 
    id: "room-1", name: "The Master Suite", price: 350, guests: 4,
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop", 
      "https://www.georesort.my/wp-content/uploads/2020/12/rsz_geo21416108.jpg",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop"
    ],
    description: "Our premium suite offering panoramic nature views, a private balcony, and luxurious amenities tailored for the perfect family getaway or honeymoon.",
    amenities: ["Air conditioning", "Private balcony", "Mini fridge", "Smart TV", "Premium toiletries", "Coffee maker", "Bathtub", "High-speed WiFi"]
  },
  { 
    id: "room-2", name: "Deluxe Nature", price: 250, guests: 2,
    images: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop"
    ],
    description: "A cozy and elegant room designed for couples or solo travelers, featuring direct access to the lush garden and modern comforts.",
    amenities: ["Air conditioning", "Garden view", "Smart TV", "Work desk", "Hair dryer", "Walk-in shower"]
  },
  { 
    id: "room-3", name: "Classic Studio", price: 180, guests: 2,
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop", 
      "https://www.georesort.my/wp-content/uploads/2020/12/rsz_geo21416108.jpg",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop"
    ],
    description: "Perfect for solo travelers or short escapes. Equipped with essential modern comforts while maintaining an elegant minimalist aesthetic.",
    amenities: ["Air conditioning", "City/Nature view", "Fast WiFi", "Basic toiletries"]
  }
];

export default function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const room = roomsData.find(r => r.id === unwrappedParams.id);
  
  const [showGallery, setShowGallery] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time Database: Simpan Tarikh yang dah dibook
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  // Update: GUEST COMPREHENSIVE LIST
  const [guests, setGuests] = useState({ adults: 2, children: 0, seniors: 0, pets: 0 });
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  
  const cleaningFee = 50;
  const serviceFee = 30;

  // FETCH DATA DARI SUPABASE UNTUK BLOCK KALENDAR
  useEffect(() => {
    async function fetchBookedDates() {
      // Kita tarik semua tempahan yang telah dibayar (atau tempahan tertunda tapi wujud)
      const { data, error } = await supabase.from('bookings').select('check_in, check_out');
      if (data && !error) {
        let disabled: Date[] = [];
        data.forEach((b: any) => {
          const start = parseISO(b.check_in);
          const end = parseISO(b.check_out);
          disabled = [...disabled, ...eachDayOfInterval({ start, end })];
        });
        setBookedDates(disabled);
      }
    }
    fetchBookedDates();
  }, []);
  
  const calculations = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to || !room) return null;
    const nights = differenceInDays(dateRange.to, dateRange.from);
    if (nights <= 0) return null;
    return { nights, roomTotal: nights * room.price, grandTotal: (nights * room.price) + cleaningFee + serviceFee };
  }, [dateRange, room]);

  // LOGIK HALANG TINDIH TARIKH (Overlap Preventer)
  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      // Periksa jika julat pilihan menyentuh mana-mana tarikh yang di-block
      const isOverlapping = bookedDates.some(d => d >= range.from! && d <= range.to!);
      if (isOverlapping) {
        alert("Pilihan anda bertindih dengan tarikh yang telah ditempah. Sila pilih julat tarikh yang kosong.");
        setDateRange({ from: range.from, to: undefined }); // Reset tarikh Check-out
        return;
      }
    }
    setDateRange(range);
  };

  const handleConfirmBooking = async () => {
    if (!dateRange?.from || !dateRange?.to || !calculations) return;
    setIsSubmitting(true);
    try {
      const { data: bookingData, error } = await supabase.from('bookings').insert([
        {
          customer_name: formData.name, customer_email: formData.email, customer_phone: formData.phone,
          check_in: format(dateRange.from, 'yyyy-MM-dd'), check_out: format(dateRange.to, 'yyyy-MM-dd'),
          guests: guests.adults + guests.children + guests.seniors,
          total_price: calculations.grandTotal, payment_status: 'pending'
        }
      ]).select().single();

      if (error) throw error;

      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room?.name, price: calculations.grandTotal, nights: calculations.nights, bookingId: bookingData?.id || "temp-id" }),
      });
      const stripeData = await response.json();

      if (stripeData.url) window.location.href = stripeData.url;
      else { alert("Stripe Error: " + stripeData.error); setIsSubmitting(false); }
    } catch (err: any) { alert("Sistem Error: " + err.message); setIsSubmitting(false); }
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl pt-32">Room not found.</div>;

  return (
    <main className="min-h-screen bg-white pb-20 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
        <Link href="/#rooms" className="inline-flex items-center gap-2 text-gray-500 hover:text-muse-primary transition-colors font-medium text-sm mb-4"><ArrowLeft size={16} /> Back to Collection</Link>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-2">{room.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
          <span className="flex items-center gap-1"><Star size={16} className="text-yellow-500 fill-yellow-500"/> 4.9 (120 reviews)</span><span>•</span>
          <span className="flex items-center gap-1 text-muse-primary"><Users size={16}/> Up to {room.guests} Guests</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 md:gap-3 h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden relative">
          <div className="md:col-span-2 row-span-2 relative group cursor-pointer" onClick={() => setShowGallery(true)}>
            <img src={room.images[0]} alt="Main Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          {room.images.slice(1, 3).map((img, idx) => (
            <div key={idx} className="relative group cursor-pointer hidden md:block" onClick={() => setShowGallery(true)}><img src={img} alt={`Detail ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
          ))}
          {room.images[3] && <div className="relative group cursor-pointer hidden md:block" onClick={() => setShowGallery(true)}><img src={room.images[3]} alt="Detail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>}
          {room.images[4] && (
            <div className="relative group cursor-pointer hidden md:block" onClick={() => setShowGallery(true)}>
              <img src={room.images[4]} alt="Detail 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              {room.images.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/50">
                  <span className="text-white font-bold text-lg flex items-center gap-2"><ImageIcon size={20}/> +{room.images.length - 5} Photos</span>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setShowGallery(true)} className="md:hidden absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2"><ImageIcon size={16}/> View Gallery</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
        <div className="flex-1 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-100">
            <div className="flex flex-col gap-2"><BedDouble className="text-gray-400" size={24} /><span className="font-bold text-gray-900 text-sm">Premium Bed</span></div>
            <div className="flex flex-col gap-2"><Bath className="text-gray-400" size={24} /><span className="font-bold text-gray-900 text-sm">En-suite Bath</span></div>
            <div className="flex flex-col gap-2"><Wind className="text-gray-400" size={24} /><span className="font-bold text-gray-900 text-sm">Air Conditioned</span></div>
            <div className="flex flex-col gap-2"><Wifi className="text-gray-400" size={24} /><span className="font-bold text-gray-900 text-sm">High-speed WiFi</span></div>
          </div>
          <div><h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">About this space</h3><p className="text-gray-600 font-sans leading-relaxed">{room.description}</p></div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6">What this place offers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {room.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-700 pb-4 border-b border-gray-50 text-sm"><Check size={20} className="text-green-500" /> {amenity}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="bg-white border border-gray-200 shadow-2xl rounded-[32px] p-8 sticky top-28">
            <div className="flex items-end gap-1 mb-8"><span className="font-serif text-4xl font-bold text-gray-900">RM {room.price}</span><span className="text-gray-500 font-medium pb-1">/ night</span></div>
            <button onClick={() => setShowBookingModal(true)} className="w-full bg-muse-primary text-white py-5 rounded-2xl font-bold text-sm tracking-wide hover:bg-red-800 transition-all shadow-[0_8px_20px_rgba(171,21,9,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(171,21,9,0.4)]">
              Check Availability & Book
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Safe and secure booking process.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 flex justify-end z-10 border-b border-gray-100"><button onClick={() => setShowGallery(false)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full font-bold text-sm transition-colors"><X size={16}/> Close</button></div>
            <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-6 md:space-y-12 pb-32">
              {room.images.map((img, idx) => (<motion.img initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} key={idx} src={img} alt={`Gallery ${idx}`} className="w-full rounded-2xl md:rounded-3xl shadow-sm" />))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-serif text-2xl font-bold text-gray-900">Secure Your Stay</h3>
                <button onClick={() => {setShowBookingModal(false); setBookingStep(1);}} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"><X size={20}/></button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 md:p-10">
                {bookingStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">1. Select Dates</h4>
                      <div className="border border-gray-200 rounded-3xl p-4 bg-gray-50 flex justify-center">
                        <style>{`.rdp { --rdp-cell-size: 38px; --rdp-accent-color: #AB1509; margin: 0; font-family: var(--font-sans); } .rdp-day_selected { font-weight: bold; } .rdp-day_disabled { text-decoration: line-through; opacity: 0.3; }`}</style>
                        <DayPicker 
                          mode="range" selected={dateRange} onSelect={handleDateSelect} 
                          disabled={[{ before: startOfToday() }, ...bookedDates]} // BLOCK PAST & BOOKED DATES
                          numberOfMonths={1} pagedNavigation 
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">*Crossed out dates are already booked.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">2. Select Guests</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
                          <div><div className="font-bold text-gray-900 text-sm">Adults</div><div className="text-[11px] text-gray-500">Age 13+</div></div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests({...guests, adults: Math.max(1, guests.adults - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">-</button>
                            <span className="font-bold w-4 text-center text-sm">{guests.adults}</span>
                            <button onClick={() => setGuests({...guests, adults: guests.adults + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
                          <div><div className="font-bold text-gray-900 text-sm">Children</div><div className="text-[11px] text-gray-500">Ages 2-12</div></div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests({...guests, children: Math.max(0, guests.children - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">-</button>
                            <span className="font-bold w-4 text-center text-sm">{guests.children}</span>
                            <button onClick={() => setGuests({...guests, children: guests.children + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
                          <div><div className="font-bold text-gray-900 text-sm">Seniors</div><div className="text-[11px] text-gray-500">Age 60+</div></div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests({...guests, seniors: Math.max(0, guests.seniors - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">-</button>
                            <span className="font-bold w-4 text-center text-sm">{guests.seniors}</span>
                            <button onClick={() => setGuests({...guests, seniors: guests.seniors + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
                          <div><div className="font-bold text-gray-900 text-sm">Pets</div><div className="text-[11px] text-gray-500">Small pets only</div></div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setGuests({...guests, pets: Math.max(0, guests.pets - 1)})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">-</button>
                            <span className="font-bold w-4 text-center text-sm">{guests.pets}</span>
                            <button onClick={() => setGuests({...guests, pets: guests.pets + 1})} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-muse-primary">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setBookingStep(2)} disabled={!calculations} className="w-full bg-muse-primary text-white py-5 rounded-2xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-800 transition-colors shadow-lg">Next: Guest Details</button>
                  </motion.div>
                )}

                {bookingStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">3. Primary Guest Information</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name (As per ID)</label>
                      <input type="text" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-muse-primary outline-none transition-all font-medium" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                      <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-muse-primary outline-none transition-all font-medium" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="tel" onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-muse-primary outline-none transition-all font-medium" placeholder="+60 12-345 6789" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setBookingStep(1)} className="px-6 py-5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Back</button>
                      <button onClick={() => setBookingStep(3)} disabled={!formData.name || !formData.email || !formData.phone} className="flex-1 bg-muse-primary text-white py-5 rounded-2xl font-bold disabled:bg-gray-300 transition-colors shadow-lg hover:bg-red-800">Review Booking</button>
                    </div>
                  </motion.div>
                )}

                {bookingStep === 3 && calculations && dateRange?.from && dateRange?.to && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">4. Booking Summary</h4>
                    <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-200 mb-8">
                      <div className="flex items-start gap-4 mb-6 border-b border-gray-200 pb-6">
                        <img src={room.images[0]} className="w-24 h-24 rounded-2xl object-cover" alt="Room thumbnail" />
                        <div>
                          <h5 className="font-serif text-2xl font-bold text-gray-900">{room.name}</h5>
                          <p className="text-gray-500 text-sm mt-1">{format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</p>
                          <p className="text-gray-500 text-sm">{calculations.nights} Night{calculations.nights > 1 ? 's' : ''} • {guests.adults + guests.children + guests.seniors} Guests</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 mb-6 text-sm">
                        <div className="flex justify-between text-gray-600"><span>RM {room.price} x {calculations.nights} nights</span><span>RM {calculations.roomTotal}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Cleaning fee</span><span>RM {cleaningFee}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Service fee</span><span>RM {serviceFee}</span></div>
                        <div className="flex justify-between text-gray-900 font-bold text-xl pt-4 border-t border-gray-200"><span>Total Amount</span><span>RM {calculations.grandTotal}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setBookingStep(2)} disabled={isSubmitting} className="px-6 py-5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">Back</button>
                      <button onClick={handleConfirmBooking} disabled={isSubmitting} className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-bold transition-colors shadow-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        {isSubmitting ? <><Loader2 className="animate-spin"/> Connecting to Bank...</> : "Confirm & Pay RM " + calculations.grandTotal}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}