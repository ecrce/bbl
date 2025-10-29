// api/create-checkout.js
//
// Serverless function for Vercel.
// Creates a Stripe Checkout Session and returns the redirect URL.
// Requires STRIPE_SECRET_KEY to be set in Vercel Project → Settings → Environment Variables.
//
// IMPORTANT:
// - Update the domain strings below if you later change domains.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Allow your production domain
  res.setHeader('Access-Control-Allow-Origin', 'https://ballardbreadlab.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle browser CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST for creating a session
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Expect JSON body:
    // {
    //   "items":[{"name":"ballard bread lab · late night pickup","price":20}],
    //   "email":"customer@example.com"
    // }
    const { items, email } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { message: 'No items passed' } });
    }

    // Convert your cart items to Stripe line_items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name, // shows on Stripe Checkout page
        },
        unit_amount: Math.round(item.price * 100), // $20.00 -> 2000
      },
      quantity: 1,
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url:
        'https://ballardbreadlab.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ballardbreadlab.com/cancel.html',
      customer_email: email,
    });

    // Respond with the Stripe-hosted checkout URL
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe Error:', err);
    return res.status(500).json({ error: { message: err.message } });
  }
}
