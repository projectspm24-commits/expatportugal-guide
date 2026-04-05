const https = require('https');
const http = require('http');

function fetchPage(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          const u = new URL(url);
          loc = u.protocol + '//' + u.host + loc;
        }
        return resolve(fetchPage(loc, redirects + 1));
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 100000) res.destroy();
      });
      res.on('end', () => resolve(data));
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
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image:src["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1] && !m[1].includes('data:') && m[1].startsWith('http')) return m[1];
  }
  return null;
}

// For Google News URLs, try to find the actual article URL from the page
function extractRedirectUrl(html) {
  // Google News sometimes includes the real URL in a <a> tag or data attribute
  const patterns = [
    /data-n-au=["']([^"']+)["']/,
    /<a[^>]+href=["'](https?:\/\/(?!news\.google)[^"']+)["'][^>]*class=["'][^"']*article/i,
    /window\.location\.replace\(["']([^"']+)["']\)/,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1] && m[1].startsWith('http')) return m[1];
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const html = await fetchPage(url);
    
    // First try direct OG image extraction
    let image = extractOgImage(html);
    if (image) return res.status(200).json({ image });

    // If it's a Google News URL and we didn't find an image,
    // try to find the actual article URL and fetch that
    if (url.includes('news.google.com')) {
      const realUrl = extractRedirectUrl(html);
      if (realUrl) {
        try {
          const realHtml = await fetchPage(realUrl);
          image = extractOgImage(realHtml);
          if (image) return res.status(200).json({ image });
        } catch (e) { /* continue */ }
      }
    }

    return res.status(404).json({ error: 'No og:image found' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
