/* ExpatPortugal.guide — Add to Home Screen (compact banner) */
(function() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  if (window.innerWidth > 900) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }

  var deferredPrompt = null;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    /* If banner already showing, update the button behavior */
    var btn = document.getElementById('aths-btn');
    if (btn) btn.setAttribute('data-ready', 'true');
  });

  setTimeout(showBanner, 3000);

  function showBanner() {
    if (document.getElementById('aths-banner')) return;

    var s = document.createElement('style');
    s.textContent = '.aths-banner{position:fixed;bottom:0;left:0;right:0;z-index:500;background:#1c1917;color:white;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,.2);transform:translateY(100%);transition:transform .4s ease;font-family:"Outfit",sans-serif}.aths-banner.show{transform:translateY(0)}.aths-i{width:40px;height:40px;background:#c0381a;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}.aths-t{flex:1;min-width:0}.aths-t b{font-size:14px;display:block}.aths-t span{font-size:11px;color:rgba(255,255,255,.5)}.aths-btn{padding:8px 18px;background:white;color:#1c1917;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:"Outfit",sans-serif;flex-shrink:0}.aths-btn:active{background:#e5e2dd}.aths-x{background:none;border:none;color:rgba(255,255,255,.35);font-size:18px;cursor:pointer;padding:4px;flex-shrink:0;line-height:1}';
    document.head.appendChild(s);

    var b = document.createElement('div');
    b.className = 'aths-banner';
    b.id = 'aths-banner';
    b.innerHTML = '<div class="aths-i">🇵🇹</div><div class="aths-t"><b>Install ExpatPortugal</b><span>Add to home screen for quick access</span></div><button class="aths-btn" id="aths-btn">Install</button><button class="aths-x" onclick="dismissATHS()">&times;</button>';
    document.body.appendChild(b);

    requestAnimationFrame(function(){ requestAnimationFrame(function(){ b.classList.add('show'); }); });

    document.getElementById('aths-btn').onclick = function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() { deferredPrompt = null; dismissATHS(); });
      } else if (isIOS) {
        var t = b.querySelector('.aths-t');
        b.querySelector('.aths-btn').style.display = 'none';
        t.innerHTML = '<b>Tap <span style="font-size:16px">⎙</span> Share → Add to Home Screen</b>';
        setTimeout(dismissATHS, 6000);
      } else {
        /* Android — beforeinstallprompt not yet fired. Use Chrome's menu method */
        var t = b.querySelector('.aths-t');
        b.querySelector('.aths-btn').style.display = 'none';
        t.innerHTML = '<b>Tap ⋮ → Install app</b>';
        setTimeout(dismissATHS, 6000);
      }
    };
  }

  window.dismissATHS = function() {
    var b = document.getElementById('aths-banner');
    if (!b) return;
    b.classList.remove('show');
    setTimeout(function() { b.remove(); }, 400);
  };
})();
