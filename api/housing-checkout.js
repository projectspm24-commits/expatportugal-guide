const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tier } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, error: 'Stripe not configured' });
  }

  const products = {
    basic: {
      name: 'Housing Listing — Basic (60 days)',
      price: 900, // cents
      description: 'Basic housing listing on ExpatPortugal.guide. Up to 3 photos, 60 days, search & filters.'
    },
    featured: {
      name: 'Housing Listing — Featured (90 days)',
      price: 2900, // cents
      description: 'Featured housing listing on ExpatPortugal.guide. Up to 10 photos, 90 days, top of results, newsletter mention.'
    }
  };

  const product = products[tier];
  if (!product) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://expatportugal-guide.vercel.app'}/housing-success.html?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://expatportugal-guide.vercel.app'}/housing.html`,
      metadata: {
        tier: tier,
        product: 'housing_listing'
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message, url: null });
  }
};
