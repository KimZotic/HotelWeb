import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event;

  try {
    // 1. Stripe mengesahkan bahawa mesej ini benar-benar datang dari mereka (bukan hacker)
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Jika pelanggan BERJAYA BAYAR
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Dapatkan ID tempahan yang kita selitkan masa mula-mula hantar ke Stripe
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      // 3. Arahkan Supabase untuk tukar status kepada 'paid'
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", bookingId);

      if (error) {
        console.error("Error updating Supabase:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
      
      console.log(`Tempahan ${bookingId} telah berjaya dibayar!`);
    }
  }

  // Wajib beritahu Stripe bahawa kita telah terima mesej mereka dengan selamat
  return NextResponse.json({ received: true });
}