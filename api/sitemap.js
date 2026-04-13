const https = require('https');

const SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
const SB_KEY = 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';
const SITE = 'https://expatportugal.guide';

function sbFetch(path) {
  return new Promise((resolve, reject) => {
    https.get(SB_URL + '/rest/v1/' + path, {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve([]); } });
    }).on('error', () => resolve([]));
  });
}

module.exports = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  
  // Static pages
  const pages = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/calendar.html', priority: '0.9', freq: 'daily' },
    { loc: '/news.html', priority: '0.9', freq: 'daily' },
    { loc: '/directory.html', priority: '0.8', freq: 'weekly' },
    { loc: '/lifestyle_services.html', priority: '0.8', freq: 'weekly' },
    { loc: '/housing.html', priority: '0.8', freq: 'daily' },
    { loc: '/communities.html', priority: '0.7', freq: 'weekly' },
    { loc: '/tools.html', priority: '0.7', freq: 'monthly' },
    { loc: '/live_local.html', priority: '0.6', freq: 'monthly' },
    { loc: '/guides/nif-portugal.html', priority: '0.9', freq: 'monthly' },
    { loc: '/guides/moving-to-portugal.html', priority: '0.9', freq: 'monthly' },
    { loc: '/contact.html', priority: '0.4', freq: 'monthly' },
    { loc: '/privacy.html', priority: '0.2', freq: 'yearly' },
  ];

  // Fetch upcoming events for deep links
  const events = await sbFetch('events?status=eq.approved&category=not.eq.config&event_date=gte.' + today + '&order=event_date.asc&limit=50&select=id,event_date');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pages.forEach(p => {
    xml += `  <url><loc>${SITE}${p.loc}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`;
  });
  
  // Add individual event deep links
  events.forEach(e => {
    xml += `  <url><loc>${SITE}/calendar.html?event=${e.id}</loc><lastmod>${e.event_date}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
  });
  
  xml += '</urlset>';
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(xml);
};
