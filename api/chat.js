const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !messages.length) return res.status(400).json({ error: 'Missing messages' });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: messages
  });

  return new Promise((resolve) => {
    const req2 = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.content && parsed.content[0] ? parsed.content[0].text : 'Sorry, please try again.';
          res.status(200).json({ reply });
        } catch (e) {
          res.status(500).json({ error: 'Parse error' });
        }
        resolve();
      });
    });
    req2.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
    req2.write(body);
    req2.end();
  });
};
