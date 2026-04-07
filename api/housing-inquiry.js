module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listingId, listingTitle, listerEmail, senderName, senderEmail, message } = req.body;

  if (!listerEmail || !senderEmail || !message || !senderName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Send email to lister via Buttondown (or you could use any SMTP service)
  // For now, we'll use a simple fetch to Buttondown's email endpoint
  // But Buttondown is a newsletter tool, not transactional email.
  // Better approach: use the Supabase edge function or store the message in Supabase
  // and notify via the existing email infrastructure.

  // Store the inquiry in Supabase so admin can see it too
  const SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';

  try {
    // Save inquiry to events table (repurposing as a message store)
    await fetch(`${SB_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        title: `Housing inquiry: ${listingTitle}`,
        description: `From: ${senderName} (${senderEmail})\nTo: ${listerEmail}\nListing: ${listingTitle} (#${listingId})\n\nMessage:\n${message}`,
        category: 'inquiry',
        city: 'Housing',
        source: 'housing-contact',
        status: 'pending',
        url: senderEmail,
        event_date: new Date().toISOString().slice(0, 10)
      })
    });

    // Also try to send a real email notification via a simple webhook
    // This will be picked up by n8n or any email service you configure later
    // For now the inquiry is stored and visible in admin

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Inquiry error:', error);
    return res.status(500).json({ error: 'Failed to send inquiry' });
  }
};
