/* ExpatPortugal.guide — Add to Home Screen prompt (compact) */
(function() {
  /* Don't show if: already installed, already dismissed, or desktop */
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  if (window.innerWidth > 900) return;
  try {
    var dismissed = localStorage.getItem('aths_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
  } catch(e) {}

  /* Capture the native install prompt (Android Chrome) */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  setTimeout(function() {
    var style = document.createElement('style');
    style.textContent = '.aths{position:fixed;bottom:16px;left:12px;right:12px;z-index:500;background:#1c1917;color:white;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);transform:translateY(120%);transition:transform .4s ease;font-family:"Outfit",sans-serif}.aths.show{transform:translateY(0)}.aths-icon{width:40px;height:40px;background:#f7f5f0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}.aths-text{flex:1;min-width:0}.aths-title{font-size:14px;font-weight:500}.aths-sub{font-size:11px;color:rgba(255,255,255,.5);margin-top:1px}.aths-btns{display:flex;gap:6px;flex-shrink:0;align-items:center}.aths-install{padding:8px 16px;background:#c0381a;color:white;border:none;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:"Outfit",sans-serif;white-space:nowrap}.aths-install:active{background:#a83015}.aths-x{background:none;border:none;color:rgba(255,255,255,.4);font-size:18px;cursor:pointer;padding:4px}';
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'aths';
    bar.id = 'aths-bar';
    bar.innerHTML = '<div class="aths-icon">🇵🇹</div>' +
      '<div class="aths-text"><div class="aths-title">Install ExpatPortugal</div><div class="aths-sub">Add to your home screen for quick access</div></div>' +
      '<div class="aths-btns"><button class="aths-install" id="aths-install-btn">Install</button><button class="aths-x" onclick="dismissATHS()">&times;</button></div>';

    document.body.appendChild(bar);

    requestAnimationFrame(function() { requestAnimationFrame(function() {
      bar.classList.add('show');
    }); });

    document.getElementById('aths-install-btn').addEventListener('click', function() {
      if (deferredPrompt) {
        /* Android: trigger native install */
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() { dismissATHS(); });
      } else {
        /* iOS or other: show brief instruction */
        var bar = document.getElementById('aths-bar');
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          bar.querySelector('.aths-text').innerHTML = '<div class="aths-title">Tap Share then "Add to Home Screen"</div><div class="aths-sub">Use the share button ⬆ at the bottom of Safari</div>';
        } else {
          bar.querySelector('.aths-text').innerHTML = '<div class="aths-title">Tap ⋮ menu → "Add to Home screen"</div><div class="aths-sub">In your browser menu at the top right</div>';
        }
        bar.querySelector('.aths-install').textContent = 'Got it';
        bar.querySelector('.aths-install').onclick = function() { dismissATHS(); };
      }
    });

    window.dismissATHS = function() {
      var b = document.getElementById('aths-bar');
      if (b) {
        b.classList.remove('show');
        try { localStorage.setItem('aths_dismissed', Date.now().toString()); } catch(e) {}
        setTimeout(function() { b.remove(); }, 400);
      }
    };
  }, 3000);
})();
