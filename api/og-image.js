const https = require('https');
const http = require('http');

function fetchWithRedirects(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          const u = new URL(url);
          loc = u.protocol + '//' + u.host + loc;
        }
        // Consume response body before following redirect
        res.resume();
        return resolve(fetchWithRedirects(loc, redirects + 1));
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 120000) res.destroy();
      });
      res.on('end', () => resolve({ html: data, finalUrl: url }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractOgImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1] && !m[1].includes('data:') && m[1].startsWith('http')) return m[1];
  }
  return null;
}

function extractRedirectTarget(html) {
  // Look for JS redirects, canonical URLs, or data attributes
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["'](https?:\/\/(?!news\.google)[^"']+)["']/i,
    /window\.location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']/i,
    /window\.location\.replace\(["'](https?:\/\/[^"']+)["']\)/i,
    /http-equiv=["']refresh["'][^>]+url=(https?:\/\/[^"'\s>]+)/i,
    /data-n-au=["'](https?:\/\/[^"']+)["']/i,
    /<a[^>]+href=["'](https?:\/\/(?!news\.google|google\.com)[^"']+)["'][^>]*>/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const result = await fetchWithRedirects(url);
    
    // If we followed redirects and landed on a non-Google-News page, great
    let image = extractOgImage(result.html);
    if (image) return res.status(200).json({ image, resolved: result.finalUrl });

    // If we're still on a Google News page, try to find the real article URL
    if (url.includes('news.google.com') || result.finalUrl.includes('news.google.com')) {
      const realUrl = extractRedirectTarget(result.html);
      if (realUrl && !realUrl.includes('news.google.com')) {
        try {
          const realResult = await fetchWithRedirects(realUrl);
          image = extractOgImage(realResult.html);
          if (image) return res.status(200).json({ image, resolved: realResult.finalUrl });
        } catch (e) { /* continue */ }
      }
    }

    return res.status(404).json({ error: 'No og:image found' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
