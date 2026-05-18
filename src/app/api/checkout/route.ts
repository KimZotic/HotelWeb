import { NextResponse } from "next/server";
import Stripe from "stripe";

// Memanggil enjin Stripe menggunakan Secret Key dari .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia", // Versi standard
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, price, nights, bookingId } = body;

    // Stripe mengira harga dalam unit sen (cents), jadi kita darab 100
    const totalAmountInCents = Math.round(price * 100);

    // Mencipta sesi pembayaran (Checkout Session)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Menyokong Kad Kredit/Debit
      line_items: [
        {
          price_data: {
            currency: "myr", // Ringgit Malaysia
            product_data: { 
              name: `INAP MUSE: ${roomName}`,
              description: `Penginapan untuk ${nights} malam.`,
            },
            unit_amount: totalAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Hantar pengguna ke halaman Success atau pusing balik jika Cancel
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: { 
        bookingId: bookingId // Simpan ID database kita dalam resit Stripe
      },
    });

    // Kembalikan URL halaman pembayaran Stripe ke Front-end
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}