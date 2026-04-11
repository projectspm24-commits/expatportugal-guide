const crypto = require('crypto');

const TOTP_SECRET_HEX = 'b62ae964487665f847fde74242563879b9c470a2';

function generateTOTP(secretHex, timeStep = 30, offset = 0) {
  const time = Math.floor(Date.now() / 1000 / timeStep) + offset;
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(time, 4);
  
  const key = Buffer.from(secretHex, 'hex');
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  
  const o = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[o] & 0x7f) << 24 | hmac[o + 1] << 16 | hmac[o + 2] << 8 | hmac[o + 3]) % 1000000;
  
  return String(code).padStart(6, '0');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { code } = req.body || {};
  
  if (!code || code.length !== 6) {
    return res.status(400).json({ valid: false, error: 'Invalid code format' });
  }
  
  // Check current time step and +/- 1 (allows 30s clock drift)
  const valid = [
    generateTOTP(TOTP_SECRET_HEX, 30, -1),
    generateTOTP(TOTP_SECRET_HEX, 30, 0),
    generateTOTP(TOTP_SECRET_HEX, 30, 1)
  ].includes(code);
  
  return res.status(200).json({ valid });
};
