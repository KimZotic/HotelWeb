import { NextResponse } from "next/server";
import Stripe from "stripe";

// Guna fallback 'sk_test_dummy' supaya Vercel tidak panik semasa proses Build
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: "2025-01-27.acacia", 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, price, nights, bookingId } = body;

    const totalAmountInCents = Math.round(price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "myr",
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: { 
        bookingId: bookingId 
      },
    });

    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}