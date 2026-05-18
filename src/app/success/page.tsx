"use client";

import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Komponen utama (memerlukan Suspense kerana kita membaca URL Parameter dari Stripe)
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  return (
    <main className="min-h-screen bg-muse-bg flex items-center justify-center p-6 selection:bg-muse-primary selection:text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-8 md:p-12 text-center relative overflow-hidden"
      >
        {/* Latar Belakang Elegan */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-green-50 to-white"></div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm"
          >
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </motion.div>

          <span className="text-muse-accent font-sans text-xs uppercase tracking-[0.2em] font-bold mb-3 block">Payment Successful</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Your Stay is Confirmed.</h1>
          
          <p className="text-gray-500 font-sans mb-8 leading-relaxed">
            Thank you for choosing INAP MUSE. We have received your payment and secured your reservation. An email confirmation has been sent to you.
          </p>

          {sessionId && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8 text-left flex items-start gap-4">
              <CalendarDays className="text-gray-400 mt-1" size={20} />
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Reference ID</span>
                <span className="text-sm font-mono text-gray-700 font-medium break-all">{sessionId.replace('cs_test_', '').substring(0, 15).toUpperCase()}</span>
              </div>
            </div>
          )}

          <Link href="/" className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-5 rounded-2xl font-bold tracking-wide hover:bg-muse-primary transition-colors shadow-lg hover:shadow-xl">
            Return to Homepage <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

// Balut dalam Suspense untuk Next.js best practices
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}