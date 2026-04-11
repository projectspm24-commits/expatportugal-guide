/* ExpatPortugal.guide — Mobile hamburger menu (shared across all pages) */
(function() {
  var style = document.createElement('style');
  style.textContent = [
    '.ham{display:none;background:none;border:none;cursor:pointer;padding:8px;z-index:502;position:relative}',
    '.ham svg{display:block}',
    '.mob-menu{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0);transition:background .4s}',
    '.mob-menu.open{background:rgba(0,0,0,0.5)}',
    '.mob-panel{position:fixed;top:0;right:0;bottom:0;width:75vw;max-width:300px;background:#f7f5f0;transform:translateX(100%);transition:transform .4s ease;padding:0;display:flex;flex-direction:column;z-index:10000;box-shadow:-4px 0 24px rgba(0,0,0,0.15);overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '.mob-menu.open .mob-panel{transform:translateX(0)}',
    '.mob-header{padding:16px 20px;border-bottom:0.5px solid rgba(28,25,23,0.08);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '.mob-header-logo{font-family:"Playfair Display",serif;font-size:16px;color:#1c1917}',
    '.mob-close{background:none;border:none;font-size:20px;cursor:pointer;color:#a8a29e;padding:4px 8px;line-height:1}',
    '.mob-links{padding:12px 12px;flex:1}',
    '.mob-link{display:block;padding:14px 16px;font-size:15px;color:#1c1917;border-radius:10px;font-family:"Outfit",sans-serif;text-decoration:none;transition:background .15s}',
    '.mob-link:active{background:#ece7dd}',
    '.mob-link.on{background:#f5f0e8;font-weight:500}',
    '.mob-sep{height:0.5px;background:rgba(28,25,23,0.08);margin:6px 16px}',
    '@media(max-width:900px){.ham{display:block}.nav-links{display:none!important}}',
    '@media(min-width:901px){.mob-menu{display:none!important}}'
  ].join('');
  document.head.appendChild(style);

  var nav = document.querySelector('nav');
  if (!nav) return;

  var ham = document.createElement('button');
  ham.className = 'ham';
  ham.setAttribute('aria-label', 'Menu');
  ham.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  ham.onclick = function() { openMobMenu(); };
  nav.appendChild(ham);

  var mainLinks = nav.querySelectorAll('.nav-links > .nl');
  var moreLinks = nav.querySelectorAll('.more-drop .more-link');

  var menuHTML = '<div class="mob-panel">' +
    '<div class="mob-header"><span class="mob-header-logo">🇵🇹 ExpatPortugal</span><button class="mob-close" onclick="closeMobMenu()">&times;</button></div>' +
    '<div class="mob-links">';

  mainLinks.forEach(function(a) {
    var isOn = a.classList.contains('on') ? ' on' : '';
    menuHTML += '<a class="mob-link' + isOn + '" href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>';
  });

  if (moreLinks.length) {
    menuHTML += '<div class="mob-sep"></div>';
    moreLinks.forEach(function(a) {
      var isOn = a.classList.contains('on') ? ' on' : '';
      menuHTML += '<a class="mob-link' + isOn + '" href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>';
    });
  }

  menuHTML += '</div></div>';

  var overlay = document.createElement('div');
  overlay.className = 'mob-menu';
  overlay.id = 'mob-menu';
  overlay.innerHTML = menuHTML;
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeMobMenu();
  });
  document.body.appendChild(overlay);

  window.openMobMenu = function() {
    var m = document.getElementById('mob-menu');
    m.style.display = 'block';
    requestAnimationFrame(function() { requestAnimationFrame(function() {
      m.classList.add('open');
    }); });
    document.body.style.overflow = 'hidden';
  };

  window.closeMobMenu = function() {
    var m = document.getElementById('mob-menu');
    m.classList.remove('open');
    setTimeout(function() { m.style.display = 'none'; }, 400);
    document.body.style.overflow = '';
  };
})();
