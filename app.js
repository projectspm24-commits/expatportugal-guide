var SB_URL = 'https://waywvckvyizqkuuaecrp.supabase.co';
var SB_KEY = 'sb_publishable_vYRR5942-HlgkWNhuODLdg_eGfOFy4b';
var activeRegion = 'all';
var activeNewsCat = 'all';

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
      var thumb = a.image_url
        ? '<div class="ni-img"><img src="' + a.image_url + '" alt="" /></div>'
        : '<div class="ni-img" style="font-size:26px">' + (a.image_emoji || '&#128240;') + '</div>';
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
    document.getElementById('hero-cat').textContent = (main.category || 'news').toUpperCase() + ' - just now';
    document.getElementById('hero-title').textContent = main.title;
    document.getElementById('hero-meta').textContent = (main.source_name || '') + ' - ' + (main.region || 'All regions');
    var hm = document.getElementById('hero-main');
    if (main.image_url) {
      // Preload image to confirm it's accessible
      var testImg = new Image();
      testImg.onload = function() {
        hm.style.backgroundImage = 'url(' + main.image_url + ')';
        hm.style.backgroundSize = 'cover';
        hm.style.backgroundPosition = 'center';
        // Add gradient overlay if not already present
        if (!hm.querySelector('.hero-overlay')) {
          var overlay = document.createElement('div');
          overlay.className = 'hero-overlay';
          overlay.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.1) 100%);border-radius:inherit;z-index:0';
          hm.insertBefore(overlay, hm.firstChild);
        }
      };
      testImg.onerror = function() {
        console.warn('Hero image failed to load:', main.image_url);
        // Try next article's image as fallback
        for (var fi = 1; fi < arts.length; fi++) {
          if (arts[fi].image_url) {
            var fallback = new Image();
            fallback.onload = function() {
              hm.style.backgroundImage = 'url(' + this._src + ')';
              hm.style.backgroundSize = 'cover';
              hm.style.backgroundPosition = 'center';
              if (!hm.querySelector('.hero-overlay')) {
                var ov = document.createElement('div');
                ov.className = 'hero-overlay';
                ov.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.1) 100%);border-radius:inherit;z-index:0';
                hm.insertBefore(ov, hm.firstChild);
              }
            };
            fallback._src = arts[fi].image_url;
            fallback.src = arts[fi].image_url;
            break;
          }
        }
      };
      testImg.src = main.image_url;
    }
    var side = document.getElementById('hero-side');
    side.innerHTML = arts.slice(1).map(function(a, i) {
      var id = 'hsc' + i;
      setTimeout(function() {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', function() { window.open(a.source_url || '#', '_blank'); });
      }, 100);
      return '<div class="hsc" id="' + id + '" style="cursor:pointer">' +
        '<div class="hsc-cat">' + (a.category || 'news') + '</div>' +
        '<div class="hsc-title">' + a.title + '</div>' +
        '<div class="hsc-meta">' + (a.source_name || '') + '</div></div>';
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

document.addEventListener('DOMContentLoaded', function() {
  loadLiveNews();
  loadHero();
  loadWeather('all');
  loadHolidays();
});
