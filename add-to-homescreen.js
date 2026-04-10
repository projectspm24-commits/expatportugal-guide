/* ExpatPortugal.guide — Add to Home Screen (simple tip banner) */
(function() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  if (window.innerWidth > 900) return;

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var tip = isIOS
    ? 'Tap <b>⎙ Share</b> then <b>"Add to Home Screen"</b>'
    : 'Tap <b>⋮</b> then <b>"Install app"</b>';

  setTimeout(function() {
    var s = document.createElement('style');
    s.textContent = '.aths{position:fixed;bottom:0;left:0;right:0;z-index:500;background:#1c1917;color:white;padding:11px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 -4px 20px rgba(0,0,0,.15);transform:translateY(100%);transition:transform .4s ease;font-family:"Outfit",sans-serif;font-size:13px}.aths.show{transform:translateY(0)}.aths-i{font-size:18px;flex-shrink:0}.aths-x{background:none;border:none;color:rgba(255,255,255,.35);font-size:16px;cursor:pointer;padding:2px 4px;flex-shrink:0;line-height:1;margin-left:auto}';
    document.head.appendChild(s);

    var b = document.createElement('div');
    b.className = 'aths';
    b.id = 'aths';
    b.innerHTML = '<span class="aths-i">🇵🇹</span><span>Save to home screen: ' + tip + '</span><button class="aths-x" onclick="this.parentElement.classList.remove(\'show\');setTimeout(function(){document.getElementById(\'aths\').remove()},400)">&times;</button>';
    document.body.appendChild(b);

    requestAnimationFrame(function(){ requestAnimationFrame(function(){ b.classList.add('show'); }); });
  }, 3000);
})();
