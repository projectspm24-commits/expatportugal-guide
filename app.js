var SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
var SB_KEY = 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';
var activeRegion = 'all';
var activeNewsCat = 'all';

/* ── OG Image fetching with category fallbacks ── */
var ogCache = {};
var categoryImages = {
  'bureaucracy': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
  'housing': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'lifestyle': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop',
  'transport': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop',
  'food': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  'economy': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
  'community': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
  'news': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop'
};

function getCategoryImage(cat) {
  return categoryImages[cat] || categoryImages['news'];
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
    var sorted = ptArts.slice(0, 2).concat(enArts).slice(0, 5);
    list.innerHTML = sorted.map(function(a) {
      var date = a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today';
      var src = a.source_name || 'Google News';
      var hasImg = !!a.image_url;
      var thumbId = 'ni-thumb-' + a.id;
      var fb = getCategoryImage(a.category);
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
    var res = await fetch(SB_URL + '/rest/v1/articles?status=in.(approved,auto_approved)&order=published_at.desc&limit=5', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    var arts = await res.json();
    if (!arts || !arts.length) return;
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
      applyHeroBg(getCategoryImage(main.category));
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
          var sideFb = getCategoryImage(a.category);
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
      var sideBg = a.image_url || getCategoryImage(a.category);
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
  'culture': 'tcu', 'food': 'tfo', 'art': 'tar', 'family': 'tfa'
};

var eventCatImageSets = {
  'music': [
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'
  ],
  'social': [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=200&h=200&fit=crop'
  ],
  'sport': [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=200&h=200&fit=crop'
  ],
  'market': [
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1504711331672-5aba867562b0?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&h=200&fit=crop'
  ],
  'culture': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=200&h=200&fit=crop'
  ],
  'food': [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop'
  ],
  'art': [
    'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1531913764164-f85c3e01b2aa?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&h=200&fit=crop'
  ],
  'family': [
    'https://images.unsplash.com/photo-1536640712-4d998f60b42c?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1484665754804-74b091211472?w=200&h=200&fit=crop'
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
    var q = SB_URL + '/rest/v1/events?status=eq.approved&event_date=gte.' + today + '&event_date=lte.' + endDate + '&order=event_date.asc&limit=50';
    if (activeRegion !== 'all') {
      var cities = regionCities[activeRegion] || [activeRegion];
      var orParts = cities.map(function(c) { return 'city.ilike.*' + c + '*'; });
      orParts.push('city.eq.All Portugal');
      q += '&or=(' + orParts.join(',') + ')';
    }
    var res = await fetch(q, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    var events = await res.json();
    var list = document.getElementById('events-list');
    if (!events || !events.length) {
      var region = activeRegion === 'all' ? 'Portugal' : activeRegion;
      list.innerHTML = '<div style="text-align:center;padding:2rem 1.5rem;background:var(--card);border:0.5px solid var(--border);border-radius:var(--rl)">' +
        '<div style="font-size:13px;color:var(--ink2);margin-bottom:10px">No known upcoming events in ' + region + ' this week.</div>' +
        '<div style="font-size:12px;color:var(--ink3);margin-bottom:14px">Know about an event? Help the community!</div>' +
        '<a href="#" onclick="document.getElementById(\'submit-event-form\').style.display=\'block\';this.style.display=\'none\';return false" style="display:inline-block;padding:8px 18px;background:var(--warm);border:0.5px solid var(--border);border-radius:var(--r);font-size:12px;font-weight:500;color:var(--ink2)">&#128197; Submit an event &rarr;</a>' +
        '</div>';
      return;
    }

    // Pick one highlight event per day (prefer non-culture, non-public-holiday categories)
    var catPriority = { music: 5, art: 4, food: 4, market: 3, social: 3, sport: 3, family: 2, culture: 1 };
    var byDay = {};
    events.forEach(function(e) {
      var dateKey = e.event_date;
      if (!byDay[dateKey]) byDay[dateKey] = [];
      byDay[dateKey].push(e);
    });

    var highlights = [];
    Object.keys(byDay).sort().forEach(function(dateKey) {
      var dayEvents = byDay[dateKey];
      // Sort by priority: prefer interesting categories over public holidays
      dayEvents.sort(function(a, b) {
        return (catPriority[b.category] || 1) - (catPriority[a.category] || 1);
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
      return '<a class="ev"' + link + '>' +
        '<img class="ev-img" src="' + img + '" alt="" />' +
        '<div class="ev-date"><div class="ev-day">' + day + '</div><div class="ev-mon">' + mon + '</div></div>' +
        '<div style="flex:1"><div class="ev-title">' + e.title + '</div>' +
        '<div class="ev-loc">' + loc + time + price + '</div>' +
        '<span class="ev-tag ' + tagClass + '">' + (e.category || 'social') + '</span></div></a>';
    }).join('');
  } catch (err) { console.error('Events error:', err); }
}

async function submitEvent() {
  var title = document.getElementById('se-title').value.trim();
  var city = document.getElementById('se-city').value.trim();
  var date = document.getElementById('se-date').value;
  var url = document.getElementById('se-url').value.trim();
  var email = document.getElementById('se-email').value.trim();

  if (!title || !city) {
    alert('Please fill in at least the event name and city.');
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
        event_date: date || new Date().toISOString().slice(0, 10),
        url: url || null,
        description: email ? 'Submitted by: ' + email : 'User submitted',
        category: 'social',
        source: 'User submission',
        status: 'pending'
      })
    });

    if (res.ok) {
      document.getElementById('submit-event-form').innerHTML =
        '<div style="text-align:center;padding:1rem">' +
        '<div style="font-size:20px;margin-bottom:8px">&#9989;</div>' +
        '<div style="font-size:13px;font-weight:500;margin-bottom:4px">Event submitted!</div>' +
        '<div style="font-size:11px;color:var(--ink3)">We\'ll review it and add it to the calendar. Thanks for helping the community!</div>' +
        '</div>';
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch (err) {
    alert('Could not submit. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadLiveNews();
  loadHero();
  loadWeather('all');
  loadHolidays();
  loadEvents();
});
