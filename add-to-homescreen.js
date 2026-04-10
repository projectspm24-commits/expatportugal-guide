/* ExpatPortugal.guide — Add to Home Screen prompt */
(function() {
  /* Don't show if: already installed as PWA, already dismissed, or on desktop */
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  if (window.innerWidth > 900) return;
  if (localStorage.getItem('aths_dismissed')) {
    var dismissed = parseInt(localStorage.getItem('aths_dismissed'));
    /* Show again after 7 days */
    if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;
  }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var isAndroid = /Android/.test(navigator.userAgent);
  if (!isIOS && !isAndroid) return;

  /* Wait for page to settle */
  setTimeout(function() {
    var style = document.createElement('style');
    style.textContent = [
      '.aths-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0);transition:background .4s;display:flex;align-items:flex-end;justify-content:center}',
      '.aths-overlay.show{background:rgba(0,0,0,0.35)}',
      '.aths-card{background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 28px;width:100%;max-width:420px;transform:translateY(100%);transition:transform .4s ease;box-shadow:0 -8px 30px rgba(0,0,0,.12)}',
      '.aths-overlay.show .aths-card{transform:translateY(0)}',
      '.aths-handle{width:36px;height:4px;background:rgba(28,25,23,0.12);border-radius:4px;margin:0 auto 16px}',
      '.aths-icon{width:48px;height:48px;background:#f7f5f0;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px}',
      '.aths-title{font-family:"Playfair Display",serif;font-size:18px;text-align:center;margin-bottom:4px;color:#1c1917}',
      '.aths-sub{font-size:13px;color:#57534e;text-align:center;line-height:1.6;margin-bottom:20px}',
      '.aths-steps{background:#f7f5f0;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:#1c1917;line-height:1.8}',
      '.aths-step{display:flex;align-items:center;gap:10px}',
      '.aths-step-num{width:22px;height:22px;background:#c0381a;color:white;border-radius:50%;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:600}',
      '.aths-btn{width:100%;padding:14px;background:#c0381a;color:white;border:none;border-radius:12px;font-size:14px;font-weight:500;cursor:pointer;font-family:"Outfit",sans-serif;margin-bottom:8px;transition:background .15s}',
      '.aths-btn:active{background:#a83015}',
      '.aths-dismiss{width:100%;padding:10px;background:none;border:none;font-size:13px;color:#a8a29e;cursor:pointer;font-family:"Outfit",sans-serif}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'aths-overlay';
    overlay.id = 'aths-overlay';

    var stepsHTML = '';
    if (isIOS) {
      stepsHTML = '<div class="aths-steps">' +
        '<div class="aths-step"><span class="aths-step-num">1</span> Tap the <b>Share</b> button <span style="font-size:18px">&#x1F881;</span> at the bottom</div>' +
        '<div class="aths-step"><span class="aths-step-num">2</span> Scroll down and tap <b>"Add to Home Screen"</b></div>' +
        '<div class="aths-step"><span class="aths-step-num">3</span> Tap <b>Add</b> — done!</div>' +
        '</div>';
    } else {
      stepsHTML = '<div class="aths-steps">' +
        '<div class="aths-step"><span class="aths-step-num">1</span> Tap the <b>menu</b> &#8942; in your browser</div>' +
        '<div class="aths-step"><span class="aths-step-num">2</span> Tap <b>"Add to Home screen"</b> or <b>"Install app"</b></div>' +
        '<div class="aths-step"><span class="aths-step-num">3</span> Tap <b>Add</b> — done!</div>' +
        '</div>';
    }

    overlay.innerHTML = '<div class="aths-card">' +
      '<div class="aths-handle"></div>' +
      '<div class="aths-icon">🇵🇹</div>' +
      '<div class="aths-title">Add to your home screen</div>' +
      '<div class="aths-sub">Get quick access to events, services, housing, and news — just like an app.</div>' +
      stepsHTML +
      '<button class="aths-btn" onclick="closeATHS()">Got it!</button>' +
      '<button class="aths-dismiss" onclick="closeATHS()">Maybe later</button>' +
      '</div>';

    document.body.appendChild(overlay);

    /* Animate in */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('show');
      });
    });

    /* Close handler */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeATHS();
    });

    window.closeATHS = function() {
      var o = document.getElementById('aths-overlay');
      o.classList.remove('show');
      localStorage.setItem('aths_dismissed', Date.now().toString());
      setTimeout(function() { o.remove(); }, 400);
    };

  }, 4000); /* Show after 4 seconds */
})();
