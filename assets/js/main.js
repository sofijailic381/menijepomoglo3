/* Meni je pomoglo · ACNE ELIMINATOR (verzija A „Klinički“) — interakcije, čist JavaScript bez biblioteka */
(function () {
  'use strict';

  /* ===== Podešavanja ===== */
  const CONFIG = {
    defaultBundle: 2,        // paket izabran na startu (hero, sticky traka, završni poziv): 1 | 2 | 3
    stickyBar: true,         // traka za kupovinu kad hero nestane sa ekrana
    freeShippingFrom: 6000,  // RSD
    checkoutUrl: '',         // npr. 'https://www.menijepomoglo.rs/placanje/' — prazno = poruka da plaćanje nije povezano
    newsletterEndpoint: '',  // npr. Formspree / MailerLite URL — prazno = samo poruka zahvalnosti
    storageKey: 'mjp-korpa'
  };

  const IMG = 'assets/img/proizvodi/';
  const PRODUCTS = {
    set1:  { name: 'ACNE ELIMINATOR Set', desc: '1 pakovanje · 90 dana', price: 3990, reg: 6250, img: IMG + 'set.webp' },
    set2:  { name: 'ACNE ELIMINATOR Set', desc: '2 pakovanja · 180 dana', price: 6990, reg: 12500, img: IMG + 'set.webp' },
    set3:  { name: 'ACNE ELIMINATOR Set', desc: '3 pakovanja · 270 dana', price: 8990, reg: 18750, img: IMG + 'set.webp' },
    sos:   { name: 'SOS formula', desc: 'Tretman preko noći · do 365 dana', price: 1990, reg: 2990, img: IMG + 'sos-formula.webp' },
    gel:   { name: 'Micelarna umivalica', desc: 'Sa aloe verom · 90 dana', price: 1290, reg: 1990, img: IMG + 'umivalica.webp' },
    mask:  { name: 'Maska sa sumporom', desc: 'Mikronizovani sumpor · 90 dana', price: 2290, reg: 3550, img: IMG + 'maska.webp' },
    cream: { name: 'Krema sa niacinamidom', desc: 'Hidratantna · 90 dana', price: 1690, reg: 2550, img: IMG + 'krema.webp' }
  };
  const FAQ = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rsd = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' RSD';
  const plural = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'artikal' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'artikla' : 'artikala'; };
  const bind = (k, v, r) => $$(`[data-bind="${k}"]`, r).forEach(el => { el.textContent = v; });
  const show = (k, on) => $$(`[data-if="${k}"]`).forEach(el => { el.hidden = !on; });

  /* ===== Izbor paketa (hero) ===== */
  let bundle = [1, 2, 3].indexOf(CONFIG.defaultBundle) >= 0 ? CONFIG.defaultBundle : 2;
  const picks = $$('[data-act^="pick.b"]');
  function renderBundle() {
    const p = PRODUCTS['set' + bundle];
    [1, 2, 3].forEach(n => show('sel.b' + n, n === bundle));
    picks.forEach(el => {
      const on = el.dataset.act === 'pick.b' + bundle;
      el.setAttribute('aria-checked', String(on));
      el.tabIndex = on ? 0 : -1;
    });
    bind('bundlePrice', rsd(p.price));
    bind('bundleReg', rsd(p.reg));
    bind('bundleLabel', p.desc);
  }
  picks.forEach((el, i) => el.addEventListener('keydown', e => {
    let j = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % picks.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i + picks.length - 1) % picks.length;
    else if (e.key === ' ' || e.key === 'Enter') j = i;
    if (j === null) return;
    e.preventDefault();
    bundle = j + 1; renderBundle(); picks[j].focus();
  }));

  /* ===== Korpa ===== */
  const cartWrap = $('[data-if="cartOpen"]'), cartEl = $('#korpa'), itemsEl = $('[data-cart-items]'), tpl = $('#cart-item-tpl');
  const closeBtn = $('[aria-label="Zatvori korpu"]', cartEl);
  let cart = load(), cartOpen = false, lastFocus = null;

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      return Array.isArray(v) ? v.filter(x => x && PRODUCTS[x.id] && x.q > 0) : [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); } catch (e) { /* privatni režim */ } }

  function add(id, open = true) {
    if (!PRODUCTS[id]) return;
    const it = cart.find(x => x.id === id);
    if (it) it.q += 1; else cart.push({ id, q: 1 });
    save(); renderCart();
    if (open) openCart();
  }
  function setQty(id, d) {
    cart = cart.map(x => (x.id === id ? { id: x.id, q: x.q + d } : x)).filter(x => x.q > 0);
    save(); renderCart();
  }

  function renderCart() {
    const sub = cart.reduce((a, x) => a + PRODUCTS[x.id].price * x.q, 0);
    const reg = cart.reduce((a, x) => a + PRODUCTS[x.id].reg * x.q, 0);
    const count = cart.reduce((a, x) => a + x.q, 0);
    const left = Math.max(0, CONFIG.freeShippingFrom - sub);
    const hasSos = cart.some(x => x.id === 'sos');
    const hasSet = cart.some(x => x.id.indexOf('set') === 0);

    bind('cartCount', String(count));
    $$('[data-act="openCart"]').forEach(el => el.setAttribute('aria-label', count ? `Korpa, ${count} ${plural(count)}` : 'Korpa, prazna'));
    bind('shipMsg', count === 0 ? `Besplatna dostava za porudžbine iznad ${rsd(CONFIG.freeShippingFrom)}` : left === 0 ? 'Dostava je besplatna ✓' : `Još ${rsd(left)} do besplatne dostave`);
    $('[data-ship-bar]').style.width = Math.min(100, Math.round(sub / CONFIG.freeShippingFrom * 100)) + '%';
    show('isEmpty', count === 0);

    // zadrži fokus na +/− dugmetu posle ponovnog iscrtavanja
    const f = document.activeElement;
    const fItem = f && f.closest ? f.closest('[data-id]') : null;
    const fId = fItem ? fItem.dataset.id : null, fAct = fItem ? f.dataset.act : null;

    itemsEl.replaceChildren(...cart.map(x => {
      const p = PRODUCTS[x.id], el = tpl.content.firstElementChild.cloneNode(true);
      el.dataset.id = x.id;
      $('img', el).src = p.img;
      bind('it.name', p.name, el);
      bind('it.desc', p.desc, el);
      bind('it.q', String(x.q), el);
      bind('it.price', rsd(p.price * x.q), el);
      bind('it.reg', rsd(p.reg * x.q), el);
      return el;
    }));
    if (fId && fAct) {
      const b = $(`[data-id="${fId}"] [data-act="${fAct}"]`, itemsEl);
      (b || closeBtn).focus();
    }

    show('upSos', hasSet && !hasSos);
    show('upSet', !hasSet && count > 0);
    bind('subtotal', rsd(sub));
    show('hasSavings', reg > sub);
    bind('savings', rsd(reg - sub));
    bind('shipLabel', count === 0 ? '—' : left === 0 ? 'Besplatna' : 'Obračunava se na plaćanju');
    $('[data-checkout]').disabled = count === 0;
    $('[data-checkout-note]').hidden = true;
    if (cartOpen && f && f.closest && f.closest('[hidden]')) closeBtn.focus();
  }

  function openCart() {
    if (cartOpen) return;
    cartOpen = true;
    lastFocus = document.activeElement;
    cartWrap.hidden = false;
    document.documentElement.classList.add('is-locked');
    closeBtn.focus();
    updateSticky();
  }
  function closeCart() {
    if (!cartOpen) return;
    cartOpen = false;
    cartWrap.hidden = true;
    document.documentElement.classList.remove('is-locked');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    updateSticky();
  }
  function checkout() {
    if (!cart.length) return;
    if (CONFIG.checkoutUrl) { window.location.href = CONFIG.checkoutUrl; return; }
    $('[data-checkout-note]').hidden = false;
  }

  // fokus ostaje unutar otvorene korpe
  cartEl.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])', cartEl).filter(el => !el.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cartOpen) closeCart(); });

  /* ===== Pitanja (jedno otvoreno u isto vreme) ===== */
  let openFaq = 'f1';
  function renderFaq() {
    FAQ.forEach(id => {
      const o = openFaq === id;
      show('faqOpen.' + id, o);
      bind('faqIcon.' + id, o ? '−' : '+');
      $$(`[data-act="faqToggle.${id}"]`).forEach(b => b.setAttribute('aria-expanded', String(o)));
    });
  }

  /* ===== Sticky traka ===== */
  const hero = $('[data-hero]');
  let pastHero = false;
  function updateSticky() { show('showSticky', CONFIG.stickyBar && pastHero && !cartOpen); }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      pastHero = !en.isIntersecting && en.boundingClientRect.bottom < 0;
      updateSticky();
    }).observe(hero);
  }

  /* ===== Klikovi ===== */
  const ACTIONS = {
    openCart, closeCart,
    addBundle: () => add('set' + bundle),
    add1: () => add('set1'), add2: () => add('set2'), add3: () => add('set3'),
    addSos: () => add('sos'), addGel: () => add('gel'), addMask: () => add('mask'), addCream: () => add('cream'),
    addSosQuiet: () => add('sos', false), addSetQuiet: () => add('set1', false)
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-checkout]');
    if (!t) return;
    if (t.hasAttribute('data-checkout')) { checkout(); return; }
    const a = t.dataset.act;
    if (a.indexOf('pick.b') === 0) { bundle = Number(a.slice(6)); renderBundle(); return; }
    if (a.indexOf('faqToggle.') === 0) { const id = a.slice(10); openFaq = openFaq === id ? null : id; renderFaq(); return; }
    if (a === 'it.inc' || a === 'it.dec') { setQty(t.closest('[data-id]').dataset.id, a === 'it.inc' ? 1 : -1); return; }
    if (ACTIONS[a]) ACTIONS[a]();
  });

  /* ===== Newsletter ===== */
  const nl = $('[data-newsletter]');
  if (nl) {
    nl.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = $('[data-newsletter-msg]', nl), btn = $('button', nl);
      const say = t => { msg.textContent = t; msg.hidden = false; };
      if (!CONFIG.newsletterEndpoint) {
        console.info('[newsletter] CONFIG.newsletterEndpoint nije podešen — prijava se nigde ne šalje.');
        nl.reset(); say('Hvala na prijavi!'); return;
      }
      btn.disabled = true;
      try {
        const r = await fetch(CONFIG.newsletterEndpoint, { method: 'POST', body: new FormData(nl), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(String(r.status));
        nl.reset(); say('Hvala na prijavi! Proveri inbox.');
      } catch (err) {
        say('Prijava nije uspela. Pokušaj ponovo za koji trenutak.');
      } finally { btn.disabled = false; }
    });
  }

  renderBundle();
  renderFaq();
  renderCart();
})();
