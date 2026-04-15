module.exports = async (req, res) => {
  const SITE = 'https://expatportugal.guide';
  
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

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const today = new Date().toISOString().slice(0, 10);
  pages.forEach(p => {
    xml += '  <url><loc>' + SITE + p.loc + '</loc><lastmod>' + today + '</lastmod><changefreq>' + p.freq + '</changefreq><priority>' + p.priority + '</priority></url>\n';
  });
  
  xml += '</urlset>';
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(xml);
};
