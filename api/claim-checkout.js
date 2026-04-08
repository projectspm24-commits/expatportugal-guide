const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bizId, tier } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, error: 'Stripe not configured' });
  }

  const products = {
    claimed: {
      name: 'Claim Your Business — Verified (1 year)',
      price: 9900,
      description: 'Verified badge, website link, contact info, up to 3 photos, update your listing. 1 year on ExpatPortugal.guide.'
    },
    featured: {
      name: 'Feature Your Business — Premium (1 year)',
      price: 14900,
      description: 'Featured badge, up to 5 photos, top of category, homepage rotation, newsletter mention. 1 year on ExpatPortugal.guide.'
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
      success_url: `${req.headers.origin || 'https://expatportugal-guide.vercel.app'}/claim-success.html?tier=${tier}&biz_id=${bizId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://expatportugal-guide.vercel.app'}/directory.html`,
      metadata: {
        tier: tier,
        biz_id: String(bizId),
        product: 'business_claim'
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message, url: null });
  }
};
