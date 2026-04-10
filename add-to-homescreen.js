/* ExpatPortugal.guide — Add to Home Screen prompt (compact banner) */
(function() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  if (window.innerWidth > 900) return;

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    setTimeout(showBanner, 3000);
  }

  function showBanner() {
    if (document.getElementById('aths-banner')) return;

    var style = document.createElement('style');
    style.textContent = '.aths-banner{position:fixed;bottom:0;left:0;right:0;z-index:500;background:#1c1917;color:white;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,.2);transform:translateY(100%);transition:transform .4s ease;font-family:"Outfit",sans-serif}.aths-banner.show{transform:translateY(0)}.aths-icon{width:40px;height:40px;background:#c0381a;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}.aths-info{flex:1;min-width:0}.aths-info-t{font-size:14px;font-weight:500}.aths-info-s{font-size:11px;color:rgba(255,255,255,.55)}.aths-install{padding:8px 18px;background:white;color:#1c1917;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:"Outfit",sans-serif;flex-shrink:0}.aths-install:active{background:#e5e2dd}.aths-x{background:none;border:none;color:rgba(255,255,255,.4);font-size:18px;cursor:pointer;padding:4px;flex-shrink:0;line-height:1}';
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.className = 'aths-banner';
    banner.id = 'aths-banner';
    banner.innerHTML = '<div class="aths-icon">🇵🇹</div>' +
      '<div class="aths-info"><div class="aths-info-t">Install ExpatPortugal</div><div class="aths-info-s">Add to your home screen for quick access</div></div>' +
      '<button class="aths-install" id="aths-install-btn">Install</button>' +
      '<button class="aths-x" onclick="dismissATHS()">&times;</button>';
    document.body.appendChild(banner);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        banner.classList.add('show');
      });
    });

    /* Auto-hide after 6 seconds */
    setTimeout(function() {
      var b = document.getElementById('aths-banner');
      if (b) { b.classList.remove('show'); setTimeout(function() { b.remove(); }, 400); }
    }, 6000);

    document.getElementById('aths-install-btn').addEventListener('click', function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() {
          deferredPrompt = null;
          dismissATHS();
        });
      } else if (isIOS) {
        var btn = document.getElementById('aths-install-btn');
        btn.style.display = 'none';
        var info = banner.querySelector('.aths-info');
        info.innerHTML = '<div class="aths-info-t">Tap <span style="font-size:16px">⎙</span> Share, then "Add to Home Screen"</div>';
        setTimeout(dismissATHS, 5000);
      }
    });
  }

  window.dismissATHS = function() {
    var b = document.getElementById('aths-banner');
    if (!b) return;
    b.classList.remove('show');
    setTimeout(function() { b.remove(); }, 400);
  };
})();
