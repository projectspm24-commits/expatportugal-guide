module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, topic, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // Store in Supabase for admin dashboard
  const SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';

  try {
    await fetch(`${SB_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        title: `Contact: ${topic} — ${name}`,
        description: `From: ${name} (${email})\nTopic: ${topic}\n\n${message}`,
        category: 'contact',
        city: 'Contact',
        source: 'contact-form',
        status: 'pending',
        url: email,
        event_date: new Date().toISOString().slice(0, 10)
      })
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to submit' });
  }
};
