// api/checkout.js
//
// Serverless function for Vercel.
//
// IMPORTANT:
// 1. In Vercel → Project → Settings → Environment Variables:
//    STRIPE_SECRET_KEY = sk_test_xxx  (or your live key later)
//
// 2. We allow only the domain ballardbreadlab.com to call us.
//
// 3. We DO NOT trust client prices. We re-price using a whitelist map.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// whitelist of items you sell and their real prices in cents
// keep names EXACTLY matching what you render in HTML / addToCart()
const PRICE_MAP = {
  "Midnight Herb Loaf": 2000, // $20.00 example if you sell this at 20.00
  "Garlic / Olive Oil Loaf": 2000,
  "Sweet Loaf (cinnamon/vanilla)": 2000,
  "Mini Flashlight (silver)": 600, // $6
  "Mini Flashlight (black)": 600,
  "Crew Socks (black/white logo)": 1200, // $12
  "Crew Socks (gray/white logo)": 1200,
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://ballardbreadlab.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // preflight
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { items, pickupWindow, name, phone, email } = req.body || {};

    // basic sanity checks
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { message: 'Cart is empty.' } });
    }
    if (!name || !phone || !email) {
      return res.status(400).json({ error: { message: 'Missing contact info.' } });
    }
    if (!pickupWindow) {
      return res.status(400).json({ error: { message: 'Missing pickup window.' } });
    }

    // Build Stripe line_items from whitelist, not from client price
    const line_items = [];
    for (const cartItem of items) {
      const { name: cartName } = cartItem || {};
      const amountCents = PRICE_MAP[cartName];

      if (!amountCents) {
        // Item not recognized / not allowed
        return res.status(400).json({
          error: { message: `Unrecognized item: ${cartName}` },
        });
      }

      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: cartName,
          },
          unit_amount: amountCents,
        },
        quantity: 1, // each addToCart pushes one unit
      });
    }

    // Build metadata so you know what to fulfill
    // (Stripe stores metadata on Checkout Session and PaymentIntent)
    const metadata = {
      buyer_name: name,
      buyer_phone: phone,
      buyer_email: email,
      pickup_window: pickupWindow,
      // For quick view, also join item names:
      items: items.map(i => i.name).join(', '),
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items,

      // where Stripe sends them after payment success / cancel
      success_url:
        'https://ballardbreadlab.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ballardbreadlab.com/cancel.html',

      customer_email: email,

      metadata,
    });

    // return checkout link for front-end redirect
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe Error:', err);
    return res.status(500).json({
      error: { message: err.message || 'Stripe error' },
    });
  }
}
