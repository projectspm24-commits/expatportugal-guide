/* ExpatPortugal.guide — Mobile hamburger menu (shared across all pages) */
(function() {
  var style = document.createElement('style');
  style.textContent = [
    '.ham{display:none;background:none;border:none;cursor:pointer;padding:6px;z-index:302;position:relative}',
    '.ham svg{display:block}',
    '.mob-menu{display:none;position:fixed;inset:0;z-index:301;background:rgba(0,0,0,0);transition:background .4s}',
    '.mob-menu.open{background:rgba(0,0,0,0.4)}',
    '.mob-panel{position:fixed;top:0;right:0;bottom:0;width:260px;background:#f7f5f0;transform:translateX(100%);transition:transform .4s ease;padding:70px 1.5rem 2rem;display:flex;flex-direction:column;gap:4px;z-index:302;box-shadow:-4px 0 24px rgba(0,0,0,0.1)}',
    '.mob-menu.open .mob-panel{transform:translateX(0)}',
    '.mob-link{display:block;padding:12px 14px;font-size:15px;color:#1c1917;border-radius:10px;font-family:"Outfit",sans-serif;text-decoration:none;transition:background .15s}',
    '.mob-link:hover,.mob-link.on{background:#f5f0e8;font-weight:500}',
    '.mob-close{position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#a8a29e;padding:4px 8px}',
    '@media(max-width:700px){.ham{display:block}.nav-links{display:none!important}}',
    '@media(min-width:701px){.mob-menu{display:none!important}}'
  ].join('');
  document.head.appendChild(style);

  /* Find nav and add hamburger button */
  var nav = document.querySelector('nav');
  if (!nav) return;

  var ham = document.createElement('button');
  ham.className = 'ham';
  ham.setAttribute('aria-label', 'Menu');
  ham.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  ham.onclick = function() { openMobMenu(); };
  nav.appendChild(ham);

  /* Build mobile menu from existing nav links */
  var links = nav.querySelectorAll('.nav-links .nl');
  var menuHTML = '<div class="mob-panel"><button class="mob-close" onclick="closeMobMenu()">&times;</button>';
  links.forEach(function(a) {
    var isOn = a.classList.contains('on') ? ' on' : '';
    menuHTML += '<a class="mob-link' + isOn + '" href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>';
  });
  menuHTML += '</div>';

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
