const crypto = require('crypto');

const TOTP_SECRET_HEX = 'b62ae964487665f847fde74242563879b9c470a2';
const TRUST_SECRET = 'expatpt-trust-2026-secret';
const TRUST_DAYS = 7;

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

function createTrustToken() {
  const expires = Date.now() + TRUST_DAYS * 24 * 60 * 60 * 1000;
  const payload = expires.toString();
  const sig = crypto.createHmac('sha256', TRUST_SECRET).update(payload).digest('hex').substring(0, 16);
  return payload + '.' + sig;
}

function verifyTrustToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', TRUST_SECRET).update(payload).digest('hex').substring(0, 16);
  if (sig !== expectedSig) return false;
  return Date.now() < parseInt(payload);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { code, trustToken } = req.body || {};
  
  // Check trusted device token first
  if (trustToken) {
    if (verifyTrustToken(trustToken)) {
      return res.status(200).json({ valid: true, trusted: true });
    }
  }
  
  if (!code || code.length !== 6) {
    return res.status(400).json({ valid: false, error: 'Invalid code format' });
  }
  
  const valid = [
    generateTOTP(TOTP_SECRET_HEX, 30, -1),
    generateTOTP(TOTP_SECRET_HEX, 30, 0),
    generateTOTP(TOTP_SECRET_HEX, 30, 1)
  ].includes(code);
  
  if (valid) {
    return res.status(200).json({ valid: true, trustToken: createTrustToken() });
  }
  return res.status(200).json({ valid: false });
};
