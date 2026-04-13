var SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
var SB_KEY = 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';
var activeRegion = 'all';
var activeNewsCat = 'all';

/* ── OG Image fetching with category fallbacks ── */
var ogCache = {};
var categoryImages = {
  'bureaucracy': ['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop'],
  'housing': ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'],
  'lifestyle': ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop'],
  'transport': ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=400&fit=crop'],
  'food': ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop'],
  'economy': ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop'],
  'community': ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=400&fit=crop'],
  'news': ['https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1495562569060-2eec283d3391?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1555990538-1e15a2d6d3c5?w=600&h=400&fit=crop']
};
var usedFallbacks = {};

function getCategoryImage(cat, articleId) {
  var pool = categoryImages[cat] || categoryImages['news'];
  if (!articleId) return pool[0];
  for (var i = 0; i < pool.length; i++) {
    if (!usedFallbacks[pool[i]]) { usedFallbacks[pool[i]] = true; return pool[i]; }
  }
  var idx = (articleId || 0) % pool.length;
  return pool[idx];
}

async function fetchOgImage(articleId, sourceUrl, category) {
  if (ogCache[articleId]) return ogCache[articleId];
  try {
    var res = await fetch('/api/og-image?url=' + encodeURIComponent(sourceUrl));
    if (!res.ok) throw new Error('not ok');
    var data = await res.json();
    if (data.image) {
      ogCache[articleId] = data.image;
      fetch(SB_URL + '/rest/v1/articles?id=eq.' + articleId, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ image_url: data.image })
      }).catch(function() {});
      return data.image;
    }
  } catch (e) { /* silent */ }
  var fallback = getCategoryImage(category);
  ogCache[articleId] = fallback;
  return fallback;
}

function loadArticleImage(imgEl, articleId, sourceUrl, emoji, category) {
  var fb = getCategoryImage(category);
  if (!sourceUrl) {
    if (imgEl) imgEl.innerHTML = '<img src="' + fb + '" alt="" style="width:100%;height:100%;object-fit:cover" />';
    return;
  }
  fetchOgImage(articleId, sourceUrl, category).then(function(url) {
    if (url && imgEl) {
      imgEl.innerHTML = '<img src="' + url + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.src=\'' + fb + '\'" />';
    }
  });
}

function isPT(src) {
  src = src || '';
  return src.indexOf('blico') >= 0 || src.indexOf('servador') >= 0 ||
         src.indexOf('gocios') >= 0 || src.indexOf('Resident') >= 0 ||
         src.toLowerCase().indexOf('portuguese') >= 0;
}

async function loadLiveNews() {
  try {
    var q = SB_URL + '/rest/v1/articles?status=in.(approved,auto_approved)&order=published_at.desc&limit=20';
    if (activeRegion !== 'all') q += '&region=eq.' + encodeURIComponent(activeRegion);
    if (activeNewsCat !== 'all') q += '&category=eq.' + encodeURIComponent(activeNewsCat);
    var res = await fetch(q, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    var arts = await res.json();
    var list = document.getElementById('news-list');
    if (!arts || !arts.length) {
      list.innerHTML = '<div class="ni" style="justify-content:center;padding:2rem;color:var(--ink3);font-size:13px">No articles yet.</div>';
      return;
    }
    var ptArts = arts.filter(function(a) { return isPT(a.source_name); });
    var enArts = arts.filter(function(a) { return !isPT(a.source_name); });
    var maxNews = window.innerWidth <= 600 ? 3 : 5;
    var sorted = ptArts.slice(0, 2).concat(enArts).slice(0, maxNews);
    list.innerHTML = sorted.map(function(a) {
      var date = a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today';
      var src = a.source_name || 'Google News';
      var hasImg = !!a.image_url;
      var thumbId = 'ni-thumb-' + a.id;
      var fb = getCategoryImage(a.category, a.id);
      var thumb = hasImg
        ? '<div class="ni-img" id="' + thumbId + '"><img src="' + a.image_url + '" alt="" onerror="this.src=\'' + fb + '\'" /></div>'
        : '<div class="ni-img" id="' + thumbId + '"><img src="' + fb + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>';
      // Queue OG image fetch for articles without images
      if (!hasImg) {
        setTimeout(function() {
          var el = document.getElementById(thumbId);
          if (el) loadArticleImage(el, a.id, a.source_url, a.image_emoji, a.category);
        }, 100);
      }
      return '<a class="ni" href="' + (a.source_url || '#') + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' +
        thumb +
        '<div style="flex:1"><div class="ni-cat">' + (a.category || 'news') + '</div>' +
        '<div class="ni-title">' + a.title + '</div>' +
        '<div class="ni-meta">' + date + '<span class="ni-reg">' + (a.region || 'all') + '</span>' +
        '<span style="font-size:10px;color:var(--ink3);margin-left:5px">via ' + src + '</span></div></div></a>';
    }).join('');
  } catch (e) { console.error('News error:', e); }
}

async function loadHero() {
  try {
    // Fetch articles and homepage config in parallel
    var artRes = fetch(SB_URL + '/rest/v1/articles?status=in.(approved,auto_approved)&order=published_at.desc&limit=20', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    var cfgRes = fetch(SB_URL + '/rest/v1/events?id=eq.300&select=description', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    var arts = await (await artRes).json();
    var pinnedArticleIds = new Set();
    try {
      var cfgData = await (await cfgRes).json();
      if (cfgData && cfgData.length && cfgData[0].description) {
        var hpCfg = JSON.parse(cfgData[0].description);
        (hpCfg.pinned_articles || []).forEach(function(id) { pinnedArticleIds.add(id); });
      }
    } catch(e) {}

    if (!arts || !arts.length) return;
    // Sort: pinned articles first, then by original order (published_at desc)
    if (pinnedArticleIds.size > 0) {
      arts.sort(function(a, b) {
        var aPin = pinnedArticleIds.has(a.id) ? 0 : 1;
        var bPin = pinnedArticleIds.has(b.id) ? 0 : 1;
        if (aPin !== bPin) return aPin - bPin;
        return 0; // keep original published_at order for non-pinned
      });
    }
    var main = arts[0];
    window._heroUrl = main.source_url || '#';
    document.getElementById('hero-cat').textContent = (main.category || 'news').toUpperCase() + ' – just now';
    document.getElementById('hero-title').textContent = main.title;
    document.getElementById('hero-meta').textContent = (main.source_name || '') + ' – ' + (main.region || 'All regions');

    var hm = document.getElementById('hero-main');

    function applyHeroBg(url) {
      var testImg = new Image();
      testImg.onload = function() {
        hm.style.backgroundImage = 'url(' + url + ')';
        hm.style.backgroundSize = 'cover';
        hm.style.backgroundPosition = 'center';
        if (!hm.querySelector('.hero-overlay')) {
          var overlay = document.createElement('div');
          overlay.className = 'hero-overlay';
          overlay.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.1) 100%);border-radius:inherit;z-index:0';
          hm.insertBefore(overlay, hm.firstChild);
        }
        hm.querySelectorAll('.hcat, .htitle, .hmeta, .hero-read').forEach(function(el) {
          el.style.position = 'relative';
          el.style.zIndex = '1';
        });
      };
      testImg.src = url;
    }

    if (main.image_url) {
      applyHeroBg(main.image_url);
    } else {
      // Immediately show category fallback, then try OG image
      applyHeroBg(getCategoryImage(main.category, main.id));
      fetchOgImage(main.id, main.source_url, main.category).then(function(url) {
        if (url && !url.includes('unsplash.com')) applyHeroBg(url);
      });
    }

    var side = document.getElementById('hero-side');
    side.innerHTML = arts.slice(1).map(function(a, i) {
      var id = 'hsc' + i;
      setTimeout(function() {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', function() { window.open(a.source_url || '#', '_blank'); });
        // Load OG image for side card
        if (!a.image_url && el) {
          var sideFb = getCategoryImage(a.category, a.id);
          el.style.backgroundImage = 'url(' + sideFb + ')';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          if (!el.querySelector('.hsc-overlay')) {
            var ov = document.createElement('div');
            ov.className = 'hsc-overlay';
            ov.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.15) 100%);border-radius:inherit';
            el.insertBefore(ov, el.firstChild);
          }
          fetchOgImage(a.id, a.source_url, a.category).then(function(url) {
            if (url && el && !url.includes('unsplash.com')) {
              el.style.backgroundImage = 'url(' + url + ')';
            }
          });
        }
      }, 100);
      var sideBg = a.image_url || getCategoryImage(a.category, a.id);
      var bgStyle = 'background-image:url(' + sideBg + ');background-size:cover;background-position:center';
      var overlayHtml = '<div class="hsc-overlay" style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.15) 100%);border-radius:inherit"></div>';
      return '<div class="hsc" id="' + id + '" style="cursor:pointer;' + bgStyle + '">' +
        overlayHtml +
        '<div style="position:relative;z-index:1"><div class="hsc-cat">' + (a.category || 'news') + '</div>' +
        '<div class="hsc-title">' + a.title + '</div>' +
        '<div class="hsc-meta">' + (a.source_name || '') + '</div></div></div>';
    }).join('');
  } catch (e) { console.error('Hero error:', e); }
}

var weatherCities = {
  all:      { name: 'Lisbon',        lat: 38.72, lon: -9.14 },
  Lisbon:   { name: 'Lisbon',        lat: 38.72, lon: -9.14 },
  Porto:    { name: 'Porto',         lat: 41.15, lon: -8.61 },
  Algarve:  { name: 'Faro',          lat: 37.02, lon: -7.93 },
  Cascais:  { name: 'Cascais',       lat: 38.70, lon: -9.42 },
  Braga:    { name: 'Braga',         lat: 41.55, lon: -8.43 },
  Alentejo: { name: 'Evora',         lat: 38.57, lon: -7.91 },
  Madeira:  { name: 'Funchal',       lat: 32.65, lon: -16.90 },
  Azores:   { name: 'Ponta Delgada', lat: 37.74, lon: -25.67 }
};

function wIcon(c) {
  if (c === 0) return '\u2600\ufe0f';
  if (c <= 2)  return '\ud83c\udf24';
  if (c === 3) return '\u26c5';
  if (c <= 48) return '\ud83c\udf27';
  if (c <= 57) return '\u2602\ufe0f';
  if (c <= 67) return '\ud83c\udf27';
  if (c <= 77) return '\u2744\ufe0f';
  if (c <= 82) return '\ud83c\udf27';
  return '\u26c8\ufe0f';
}

async function loadWeather(region) {
  try {
    var city = weatherCities[region] || weatherCities.all;
    document.getElementById('w-city').textContent = city.name;
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
      '&daily=temperature_2m_max,weathercode&current_weather=true&timezone=Europe%2FLisbon&forecast_days=5';
    var res = await fetch(url);
    var data = await res.json();
    var cur = data.current_weather;
    document.getElementById('w-temp').innerHTML = Math.round(cur.temperature) + '&deg;';
    document.getElementById('w-desc').textContent = cur.weathercode <= 2 ? 'Sunny' : cur.weathercode <= 3 ? 'Partly cloudy' : 'Cloudy intervals';
    var days = data.daily;
    var dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    document.getElementById('w-week').innerHTML = days.time.map(function(d, i) {
      return '<div class="wd"><div class="wd-d">' + dn[new Date(d).getDay()] + '</div>' +
        '<span class="wd-i">' + wIcon(days.weathercode[i]) + '</span>' +
        '<div class="wd-t">' + Math.round(days.temperature_2m_max[i]) + '&deg;</div></div>';
    }).join('');
  } catch (e) { console.error('Weather error:', e); }
}

function loadHolidays() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var hols = [
    { n: '\ud83c\udfab Easter Sunday',       d: '2026-04-05', tip: 'Most important religious holiday. Families gather for lamb or bacalhau. Everything closed.',         closed: true },
    { n: '\ud83c\udff4 Liberty Day',          d: '2026-04-25', tip: 'Celebrates the 1974 Carnation Revolution ending 48 years of dictatorship. Very meaningful.',        closed: true },
    { n: 'Labour Day',                        d: '2026-05-01', tip: 'International Workers Day. Parades in Lisbon and Porto. Most businesses closed.',                    closed: true },
    { n: '\ud83c\uddf5\ud83c\uddf9 Portugal Day', d: '2026-06-10', tip: 'National day. Military parades, flags everywhere. Big national pride day.',                    closed: true },
    { n: 'Corpus Christi',                    d: '2026-06-04', tip: 'Catholic feast day. Flower carpet processions. Most shops closed outside major cities.',             closed: true },
    { n: '\ud83c\udf49 Assumption Day',       d: '2026-08-15', tip: 'Major holiday. Many Portuguese take the whole week off. Beach towns will be packed.',                closed: true },
    { n: 'Republic Day',                      d: '2026-10-05', tip: 'Marks proclamation of the Portuguese Republic in 1910. Government closed, most shops open.',        closed: false },
    { n: '\ud83e\udda2 All Saints Day',       d: '2026-11-01', tip: 'Families visit cemeteries to honour the dead. Most businesses closed.',                             closed: true },
    { n: 'Restoration Day',                   d: '2026-12-01', tip: 'Celebrates Portugal regaining independence from Spain in 1640. Quiet national holiday.',            closed: true },
    { n: 'Immaculate Conception',             d: '2026-12-08', tip: 'Catholic holiday marking the start of Christmas season. Most shops closed.',                        closed: true },
    { n: '\ud83c\udf85 Christmas Day',        d: '2026-12-25', tip: 'Very family-focused. Main meal is Christmas Eve (consoada) with bacalhau. Almost everything closed.', closed: true }
  ];
  var upcoming = hols.filter(function(h) { return new Date(h.d) >= today; }).slice(0, 5);
  document.getElementById('hol-list').innerHTML = upcoming.map(function(h) {
    var hdate = new Date(h.d);
    var diff = Math.round((hdate - today) / 86400000);
    var dateStr = hdate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    var badge = diff === 0 ? '<span class="hol-s">Today!</span>' :
      diff <= 14 ? '<span class="hol-s">' + dateStr + ' soon</span>' :
      '<span class="hol-d">' + dateStr + '</span>';
    var icons = '\ud83d\udc64 Most people off \u00a0 \ud83c\udfe2 ' + (h.closed ? 'Stores likely closed' : 'Stores mostly open');
    return '<div class="hol"><span>' + h.n + '</span>' + badge +
      '<div class="hol-tip">' + h.tip + '<div style="font-size:10px;margin-top:4px;opacity:.75">' + icons + '</div></div></div>';
  }).join('');
}

function setReg(r, el) {
  activeRegion = r;
  document.querySelectorAll('.rp').forEach(function(b) { b.classList.remove('on'); });
  el.classList.add('on');
  var c = document.getElementById('w-city');
  if (c) c.textContent = r === 'all' ? 'Lisbon' : r;
  loadLiveNews();
  loadWeather(r);
  loadEvents();
}

function setCat(c, el) {
  activeNewsCat = c;
  document.querySelectorAll('.cat-card').forEach(function(x) { x.classList.remove('on'); });
  el.classList.add('on');
  loadLiveNews();
}

function subscribe() {
  var e = document.getElementById('sw-email').value.trim();
  if (!e || !e.includes('@')) { alert('Please enter a valid email address.'); return; }
  console.log('Subscribe:', e, document.getElementById('sw-reg').value);
  document.getElementById('sub-widget').innerHTML = '<div style="text-align:center;padding:1.5rem;color:white"><div style="font-size:30px;margin-bottom:10px">\ud83c\uddf5\ud83c\uddf9</div><div style="font-family:Playfair Display,serif;font-size:18px;margin-bottom:6px">You are subscribed!</div><div style="font-size:12px;opacity:.65;line-height:1.7">First digest arrives next Sunday.</div></div>';
}

var catTagMap = {
  'music': 'tm', 'social': 'ts', 'sport': 'tsp', 'market': 'tmk',
  'culture': 'tcu', 'food': 'tfo', 'art': 'tar', 'family': 'tfa', 'dancing': 'tda'
};

var eventCatImageSets = {
  'music': [
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop'
  ],
  'social': [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&h=200&fit=crop'
  ],
  'sport': [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=200&h=200&fit=crop'
  ],
  'market': [
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=200&h=200&fit=crop'
  ],
  'culture': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=200&h=200&fit=crop'
  ],
  'food': [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop'
  ],
  'art': [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=200&h=200&fit=crop'
  ],
  'family': [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=200&h=200&fit=crop'
  ],
  'dancing': [
    'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1524117074681-31bd4de22ad3?w=200&h=200&fit=crop'
  ]
};

var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var _evImgCounter = 0;

function getEventImage(category) {
  var set = eventCatImageSets[category] || eventCatImageSets['culture'];
  var img = set[_evImgCounter % set.length];
  _evImgCounter++;
  return img;
}

var regionCities = {
  'Algarve': ['Algarve','Faro','Lagos','Albufeira','Tavira','Vilamoura','Loulé','Olhão','Portimão','Silves','Sagres'],
  'Lisbon': ['Lisbon','Lisboa'],
  'Porto': ['Porto'],
  'Cascais': ['Cascais','Sintra','Estoril'],
  'Ericeira': ['Ericeira'],
  'Peniche': ['Peniche'],
  'Mafra': ['Mafra'],
  'Braga': ['Braga','Guimarães'],
  'Alentejo': ['Alentejo','Évora','Beja'],
  'Madeira': ['Madeira','Funchal'],
  'Azores': ['Azores','Açores','Ponta Delgada']
};

async function loadEvents() {
  try {
    var today = new Date().toISOString().slice(0, 10);
    var endDate = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);
    var q = SB_URL + '/rest/v1/events?status=eq.approved&category=not.eq.config&event_date=gte.' + today + '&event_date=lte.' + endDate + '&order=event_date.asc&limit=50';
    if (activeRegion !== 'all') {
      var cities = regionCities[activeRegion] || [activeRegion];
      var orParts = cities.map(function(c) { return 'city.ilike.*' + c + '*'; });
      orParts.push('city.eq.All Portugal');
      q += '&or=(' + orParts.join(',') + ')';
    }

    // Fetch events and homepage config in parallel
    var evRes = fetch(q, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    var cfgRes = fetch(SB_URL + '/rest/v1/events?id=eq.300&select=description', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    var events = await (await evRes).json();
    var pinnedEventIds = new Set();
    try {
      var cfgData = await (await cfgRes).json();
      if (cfgData && cfgData.length && cfgData[0].description) {
        var hpCfg = JSON.parse(cfgData[0].description);
        (hpCfg.pinned_events || []).forEach(function(id) { pinnedEventIds.add(id); });
      }
    } catch(e) {}

    var list = document.getElementById('events-list');
    if (!events || !events.length) {
      var region = activeRegion === 'all' ? 'Portugal' : activeRegion;
      list.innerHTML = '<div style="text-align:center;padding:2rem 1.5rem;background:var(--card);border:0.5px solid var(--border);border-radius:var(--rl)">' +
        '<div style="font-size:13px;color:var(--ink2);margin-bottom:10px">No known upcoming events in ' + region + ' this week.</div>' +
        '<div style="font-size:12px;color:var(--ink3);margin-bottom:14px">Know about an event? Help the community!</div>' +
        '<a href="#" onclick="openSubmitEvent();return false" style="display:inline-block;padding:8px 18px;background:var(--warm);border:0.5px solid var(--border);border-radius:var(--r);font-size:12px;font-weight:500;color:var(--ink2)">&#128197; Submit an event &rarr;</a>' +
        '</div>';
      return;
    }

    // Pick one highlight event per day — pinned events always win their day
    var catPriority = { music: 5, art: 4, food: 4, dancing: 4, market: 3, social: 3, sport: 3, family: 2, culture: 1 };
    var byDay = {};
    events.forEach(function(e) {
      var dateKey = e.event_date;
      if (!byDay[dateKey]) byDay[dateKey] = [];
      byDay[dateKey].push(e);
    });

    var highlights = [];
    Object.keys(byDay).sort().forEach(function(dateKey) {
      var dayEvents = byDay[dateKey];
      // Pinned events first, then by category priority
      dayEvents.sort(function(a, b) {
        var aPin = pinnedEventIds.has(a.id) ? 100 : 0;
        var bPin = pinnedEventIds.has(b.id) ? 100 : 0;
        return (bPin + (catPriority[b.category] || 1)) - (aPin + (catPriority[a.category] || 1));
      });
      highlights.push(dayEvents[0]);
    });

    // Show max 7 days
    highlights = highlights.slice(0, 7);
    _evImgCounter = 0;

    list.innerHTML = highlights.map(function(e) {
      var d = new Date(e.event_date + 'T12:00:00');
      var day = d.getDate();
      var mon = d.toLocaleDateString('en-GB', { month: 'short' });
      var dow = dayNames[d.getDay()];
      var tagClass = catTagMap[e.category] || 'ts';
      var loc = [e.venue, e.city].filter(Boolean).join(', ');
      var time = e.event_time ? ' · ' + dow + ' ' + e.event_time : ' · ' + dow;
      var price = e.price && e.price !== 'Free' && e.price !== 'Free entry' ? ' · ' + e.price : '';
      var link = e.url ? ' href="' + e.url + '" target="_blank" rel="noopener"' : '';
      var img = getEventImage(e.category);
      var catEmojis = {music:'🎵',social:'👥',sport:'🏃',market:'🛍',culture:'🏛',food:'🍽',art:'🎨',family:'👨‍👩‍👧'};
      var emoji = catEmojis[e.category] || '📅';
      return '<a class="ev"' + link + '>' +
        '<img class="ev-img" src="' + img + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" />' +
        '<div class="ev-img" style="display:none;align-items:center;justify-content:center;font-size:26px;background:var(--warm)">' + emoji + '</div>' +
        '<div class="ev-date"><div class="ev-day">' + day + '</div><div class="ev-mon">' + mon + '</div></div>' +
        '<div style="flex:1"><div class="ev-title">' + e.title + '</div>' +
        '<div class="ev-loc">' + loc + time + price + '</div>' +
        '<span class="ev-tag ' + tagClass + '">' + (e.category || 'social') + '</span></div></a>';
    }).join('');
  } catch (err) { console.error('Events error:', err); }
}

function openSubmitEvent() {
  var overlay = document.getElementById('submit-event-overlay');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSubmitEvent() {
  var overlay = document.getElementById('submit-event-overlay');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
}

async function submitEvent() {
  var title = document.getElementById('se-title').value.trim();
  var city = document.getElementById('se-city').value.trim();
  var date = document.getElementById('se-date').value;
  var time = document.getElementById('se-time').value;
  var url = document.getElementById('se-url').value.trim();
  var price = document.getElementById('se-price').value.trim();
  var email = document.getElementById('se-email').value.trim();

  if (!title || !city || !date || !time || !url || !price) {
    alert('Please fill in all required fields (event name, city, date, time, event link, and fee).');
    return;
  }

  try {
    var res = await fetch(SB_URL + '/rest/v1/events', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        title: title,
        city: city,
        event_date: date,
        event_time: time,
        url: url,
        price: price,
        description: email ? 'Submitted by: ' + email : 'User submitted',
        category: 'social',
        source: 'User submission',
        status: 'pending'
      })
    });

    if (res.ok) {
      document.getElementById('submit-event-form').innerHTML =
        '<div style="text-align:center;padding:1.5rem">' +
        '<div style="font-size:28px;margin-bottom:10px">&#9989;</div>' +
        '<div style="font-size:15px;font-weight:500;margin-bottom:6px">Event submitted!</div>' +
        '<div style="font-size:12px;color:var(--ink3);margin-bottom:16px">We\'ll review it and add it to the calendar. Thanks for helping the community!</div>' +
        '<button onclick="closeSubmitEvent()" style="padding:8px 20px;background:var(--ink);color:white;border:none;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:Outfit,sans-serif">Close</button>' +
        '</div>';
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch (err) {
    alert('Could not submit. Please try again later.');
  }
}

/* ── SUBMIT EXPAT TIP (homepage) ── */
async function submitTip() {
  var text = document.getElementById('tip-text').value.trim();
  var name = document.getElementById('tip-name').value.trim() || 'Anonymous';
  if (!text) { alert('Please share your tip!'); return; }
  try {
    await fetch(SB_URL + '/rest/v1/events', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ title: 'Expat tip from ' + name, description: text, category: 'tip', status: 'pending', event_date: new Date().toISOString().slice(0, 10) })
    });
    document.getElementById('tip-form').innerHTML = '<div style="text-align:center;padding:6px;font-size:13px"><span style="font-size:18px">&#9989;</span> Thanks ' + name + '! Your tip may be featured in our Sunday newsletter.</div>';
  } catch(e) { alert('Something went wrong. Please try again.'); }
}

/* ── CONTRIBUTE POPUPS (homepage) ── */
var contributeForms = {
  place: {
    title: '&#128205; Add a place',
    sub: 'Help fellow expats discover the best of Portugal.',
    fields: '<input id="cf-name" placeholder="Place name *" />' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<select id="cf-type"><option value="">Type *</option><option value="cafe">Café / Coffee</option><option value="restaurant">Restaurant</option><option value="bar">Bar</option><option value="shop">Shop</option><option value="cowork">Co-working</option><option value="gym">Gym / Fitness</option><option value="beach">Beach</option><option value="park">Park / Garden</option><option value="museum">Museum</option><option value="viewpoint">Viewpoint</option><option value="historic">Historic site</option><option value="entertainment">Entertainment</option></select>' +
      '<select id="cf-city"><option value="">City *</option><option>Lisbon</option><option>Porto</option><option>Algarve</option><option>Cascais</option><option>Ericeira</option><option>Peniche</option><option>Braga</option><option>Alentejo</option><option>Madeira</option></select></div>' +
      '<input id="cf-area" placeholder="Neighbourhood (e.g. Estrela, Foz)" />' +
      '<input id="cf-why" placeholder="Why do you recommend it? *" />' +
      '<input id="cf-url" placeholder="Website or Google Maps link (optional)" />',
    submit: 'submitContributePlace'
  },
  event: {
    title: '&#128197; Submit an event',
    sub: 'Get your event in front of thousands of expats.',
    fields: '<input id="cf-ename" placeholder="Event name *" />' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<input id="cf-edate" type="date" title="Event date *" />' +
      '<input id="cf-etime" type="time" title="Start time" /></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<select id="cf-ecat"><option value="">Category *</option><option value="social">Social / Meetup</option><option value="music">Music / Fado</option><option value="market">Market / Fair</option><option value="food">Food / Drink</option><option value="sport">Sport / Outdoor</option><option value="culture">Culture / Art</option><option value="family">Family</option><option value="dancing">Dancing</option></select>' +
      '<select id="cf-ecity"><option value="">City *</option><option>Lisbon</option><option>Porto</option><option>Algarve</option><option>Cascais</option><option>Ericeira</option><option>Peniche</option><option>Braga</option><option>Alentejo</option><option>Madeira</option></select></div>' +
      '<input id="cf-evenue" placeholder="Venue name or address" />' +
      '<input id="cf-edesc" placeholder="Short description *" />' +
      '<input id="cf-eurl" placeholder="Link to event page or tickets (optional)" />' +
      '<input id="cf-eemail" placeholder="Your email (so we can reach you)" />',
    submit: 'submitContributeEvent'
  },
  community: {
    title: '&#128101; List a community',
    sub: 'Get your group in front of thousands of expats. Free, always.',
    fields: '<input id="cf-cname" placeholder="Community name *" />' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<select id="cf-ctype"><option value="">Type *</option><option value="social">Social / Meetups</option><option value="nomad">Digital nomads</option><option value="family">Families</option><option value="sport">Sports / Outdoor</option><option value="professional">Professional</option><option value="culture">Culture / Language</option><option value="women">Women</option><option value="lgbtq">LGBTQ+</option></select>' +
      '<select id="cf-ccity"><option value="">City *</option><option>Lisbon</option><option>Porto</option><option>Algarve</option><option>Cascais</option><option>Ericeira</option><option>Peniche</option><option>Braga</option><option>Alentejo</option><option>Madeira</option><option value="Online">Online / All Portugal</option></select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<select id="cf-cplatform"><option value="">Platform *</option><option>Meetup</option><option>Facebook</option><option>WhatsApp</option><option>Telegram</option><option>Discord</option><option>Instagram</option><option>Website</option></select>' +
      '<input id="cf-cmembers" placeholder="Approx. members" /></div>' +
      '<input id="cf-curl" placeholder="Join link (URL) *" />' +
      '<input id="cf-cdesc" placeholder="Short description — what\u0027s the vibe?" />',
    submit: 'submitContributeCommunity'
  }
};

function openContribute(type) {
  var f = contributeForms[type];
  var el = document.getElementById('contribute-content');
  var inputStyle = 'width:100%;padding:9px 12px;border:0.5px solid rgba(28,25,23,0.16);border-radius:10px;font-size:13px;font-family:Outfit,sans-serif;outline:none;margin-bottom:6px';
  el.innerHTML = '<button onclick="closeContribute()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#a8a29e">&times;</button>' +
    '<div style="font-size:18px;font-weight:500;margin-bottom:4px">' + f.title + '</div>' +
    '<div style="font-size:13px;color:#57534e;margin-bottom:14px">' + f.sub + '</div>' +
    '<div id="cf-form">' + f.fields + '</div>' +
    '<button onclick="' + f.submit + '()" style="width:100%;padding:12px;background:#c0381a;color:white;border:none;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;font-family:Outfit,sans-serif;margin-top:4px">Submit &rarr;</button>';
  el.querySelectorAll('#cf-form input, #cf-form select').forEach(function(inp) { inp.style.cssText = inputStyle; });

  var m = document.getElementById('contribute-modal');
  m.style.display = 'flex';
  requestAnimationFrame(function() { requestAnimationFrame(function() {
    m.classList.add('open');
    m.classList.add('show');
  }); });
  document.body.style.overflow = 'hidden';
}

function closeContribute() {
  var m = document.getElementById('contribute-modal');
  m.classList.remove('show');
  setTimeout(function() {
    m.classList.remove('open');
    m.style.display = 'none';
    document.body.style.overflow = '';
  }, 500);
}

function showContributeSuccess(msg) {
  document.getElementById('cf-form').parentElement.innerHTML =
    '<div style="text-align:center;padding:1.5rem"><div style="font-size:32px;margin-bottom:8px">&#9989;</div>' +
    '<div style="font-size:16px;font-weight:500;margin-bottom:4px">Thanks!</div>' +
    '<div style="font-size:13px;color:#57534e;line-height:1.6">' + msg + '</div></div>';
}

async function submitContributePlace() {
  var name = document.getElementById('cf-name').value.trim();
  var type = document.getElementById('cf-type').value;
  var city = document.getElementById('cf-city').value;
  var why = document.getElementById('cf-why').value.trim();
  if (!name || !type || !city || !why) { alert('Please fill in name, type, city, and why you recommend it.'); return; }
  try {
    await fetch(SB_URL + '/rest/v1/local_businesses', {
      method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: name, type: type, city: city, area: document.getElementById('cf-area').value.trim(), reason: why, url: document.getElementById('cf-url').value.trim(), emoji: '📍', status: 'pending', price_range: 'rating:0|reviews:0' })
    });
    showContributeSuccess('We\'ll review and publish your recommendation within 24 hours.');
  } catch(e) { alert('Something went wrong. Please try again.'); }
}

async function submitContributeEvent() {
  var name = document.getElementById('cf-ename').value.trim();
  var date = document.getElementById('cf-edate').value;
  var cat = document.getElementById('cf-ecat').value;
  var city = document.getElementById('cf-ecity').value;
  var desc = document.getElementById('cf-edesc').value.trim();
  if (!name || !date || !cat || !city || !desc) { alert('Please fill in event name, date, category, city, and description.'); return; }
  try {
    await fetch(SB_URL + '/rest/v1/events', {
      method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ title: name, event_date: date, event_time: document.getElementById('cf-etime').value || null, category: cat, city: city, venue: document.getElementById('cf-evenue').value.trim(), description: desc, url: document.getElementById('cf-eurl').value.trim(), source: document.getElementById('cf-eemail').value.trim() || 'community-submit', status: 'pending' })
    });
    showContributeSuccess('We\'ll review and add your event to the calendar within 24 hours.');
  } catch(e) { alert('Something went wrong. Please try again.'); }
}

async function submitContributeCommunity() {
  var name = document.getElementById('cf-cname').value.trim();
  var type = document.getElementById('cf-ctype').value;
  var city = document.getElementById('cf-ccity').value;
  var platform = document.getElementById('cf-cplatform').value;
  var url = document.getElementById('cf-curl').value.trim();
  if (!name || !type || !city || !platform || !url) { alert('Please fill in all required fields.'); return; }
  try {
    await fetch(SB_URL + '/rest/v1/local_businesses', {
      method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: name, type: 'community', city: city, area: type, reason: document.getElementById('cf-cdesc').value.trim(), url: url, emoji: platform, price_range: 'members:' + (document.getElementById('cf-cmembers').value || '?'), status: 'pending' })
    });
    showContributeSuccess('We\'ll review and list your community within 24 hours.');
  } catch(e) { alert('Something went wrong. Please try again.'); }
}

/* ── HOUSING PREVIEW (homepage) ── */
async function loadHomeHousing() {
  var el = document.getElementById('home-housing');
  if (!el) return;
  try {
    var hRes = fetch(SB_URL + '/rest/v1/local_businesses?type=eq.housing&status=eq.active&order=created_at.desc&limit=6', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    var cfgRes = fetch(SB_URL + '/rest/v1/events?id=eq.300&select=description', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    var items = await (await hRes).json();
    var pinnedHousingIds = new Set();
    try {
      var cfgData = await (await cfgRes).json();
      if (cfgData && cfgData.length && cfgData[0].description) {
        var hpCfg = JSON.parse(cfgData[0].description);
        (hpCfg.pinned_housing || []).forEach(function(id) { pinnedHousingIds.add(id); });
      }
    } catch(e) {}

    if (pinnedHousingIds.size > 0) {
      items.sort(function(a, b) {
        var aPin = pinnedHousingIds.has(a.id) ? 0 : 1;
        var bPin = pinnedHousingIds.has(b.id) ? 0 : 1;
        return aPin - bPin;
      });
    }
    if (!items.length) {
      el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;background:var(--card);border-radius:var(--rl)"><div style="font-size:24px;margin-bottom:6px">&#127968;</div><div style="font-size:14px;font-weight:500;margin-bottom:4px">Housing board launching soon</div><div style="font-size:12px;color:var(--ink3)">List your place or find your next home.</div></div>';
      return;
    }
    /* Split: available listings as cards, looking posts as compact list */
    var available = [];
    var looking = [];
    items.forEach(function(h) {
      var pr = {};
      (h.price_range || '').split('|').forEach(function(p) { var idx = p.indexOf(':'); if (idx > 0) pr[p.slice(0, idx)] = p.slice(idx + 1); });
      var item = { name: h.name, city: h.city, rent: parseInt(pr.rent) || 0, type: pr.type || '', kind: pr.kind || 'available', tier: pr.tier || 'free', img: h.address || '' };
      if (item.kind === 'looking') looking.push(item);
      else available.push(item);
    });

    var html = '';
    available.slice(0, 3).forEach(function(l) {
      var photo = l.img ? l.img.split(',')[0] : '';
      var isFeat = l.tier === 'featured';
      html += '<a href="housing.html" style="background:var(--card);border:0.5px solid var(--border);border-radius:var(--rl);overflow:hidden;display:block;transition:all .2s' + (isFeat ? ';border-color:var(--amber)' : '') + '">' +
        (photo ? '<div style="height:120px;background:url(' + photo + ') center/cover"></div>' : '<div style="height:60px;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:24px">&#127968;</div>') +
        '<div style="padding:12px">' +
        (isFeat ? '<div style="font-size:9px;background:var(--amber-l);color:var(--amber);padding:2px 6px;border-radius:10px;display:inline-block;margin-bottom:4px">Featured</div>' : '') +
        '<div style="font-family:Playfair Display,serif;font-size:16px;margin-bottom:2px">&euro;' + l.rent.toLocaleString() + '<span style="font-size:11px;font-family:Outfit,sans-serif;color:var(--ink3)"> /mo</span></div>' +
        '<div style="font-size:12px;font-weight:500;margin-bottom:2px">' + l.name + '</div>' +
        '<div style="font-size:11px;color:var(--ink3)">&#128205; ' + l.city + ' &middot; ' + l.type + '</div>' +
        '</div></a>';
    });



    el.innerHTML = html;
  } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', function() {
  loadLiveNews();
  loadHero();
  loadWeather('all');
  loadHolidays();
  loadEvents();
  loadHomeHousing();
});
