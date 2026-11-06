// ひだまりのいえ 専用の動き（軽量版）
// 主役：歩く猫（最初だけ短く）・のぞく猫・スクロールの足あと・「にゃ」。それ以外は静かに。
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 猫のカード：押すと性格が開き、「にゃ」と鳴く（CSSのアニメーション）
  $$('.cat').forEach((c) => c.addEventListener('click', () => {
    const open = c.getAttribute('aria-expanded') !== 'true';
    c.setAttribute('aria-expanded', open);
    if (open && !reduced) { c.classList.remove('is-nya'); void c.offsetWidth; c.classList.add('is-nya'); }
  }));

  // 読み込み画面：同じタブで2回目以降は出さない
  const loader = $('.loader');
  let seen = false;
  try { seen = sessionStorage.getItem('hidamari-seen') === '1'; sessionStorage.setItem('hidamari-seen', '1'); } catch (e) {}
  if (seen && loader) loader.remove();

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    document.documentElement.classList.remove('js'); loader && loader.remove(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const header = $('.header');
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80px', onEnter: () => header.classList.add('is-solid'), onLeaveBack: () => header.classList.remove('is-solid') });
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', endTrigger: '.contact', end: 'top bottom', onToggle: (s) => $('.spBar').classList.toggle('is-on', s.isActive) });

  // ---------- 開くとき：猫がさっと横切る（1秒弱）→ 中身が出る ----------
  const open = gsap.timeline();
  let t = 0;
  if (!seen && loader) {
    open.fromTo('.loader_cat', { xPercent: -160 }, { xPercent: 240, duration: 0.9, ease: 'none' })
      .to('.loader_cat', { y: -5, duration: 0.15, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0)
      .to('.loader', { opacity: 0, duration: 0.3, onComplete: () => loader.remove() }, 0.75);
    t = 0.9;
  }
  open.fromTo('.hero_photo', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, t)
    .fromTo('[data-open]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07 }, t + 0.15)
    .to('.header', { opacity: 1, duration: 0.4 }, t + 0.2)
    .fromTo('.peek--hero', { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'back.out(2)' }, t + 0.6);

  // ---------- 出てくる動き：ふわっと（跳ねさせない） ----------
  const soft = (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06, overwrite: true });
  $$('[data-each]').forEach((g) => ScrollTrigger.create({ trigger: g, start: 'top 88%', once: true, onEnter: () => soft(g.querySelectorAll(':scope > [data-up]')) }));
  $$('[data-up]').forEach((el) => { if (!el.parentElement.hasAttribute('data-each')) ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => soft(el) }); });

  // 見出しの上から猫がのぞく（主役なので、ここだけ少し弾ませる）
  ScrollTrigger.create({ trigger: '.peek--head', start: 'top 85%', once: true, onEnter: () => gsap.fromTo('.peek--head', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'back.out(2)' }) });

  // 数字：数え上げ
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count), o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  // まばたき・しっぽ・zzz は CSS で動かし、画面に見えている間だけ再生する
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)), { rootMargin: '80px' });
  $$('.peek, .sleeper, .sitter').forEach((el) => io.observe(el));

  // ---------- スクロールに合わせて、肉球がペタペタ歩く ----------
  // 6個の足あとを使い回す。歩幅は広め。下へは下向き、上へは上向き
  const trail = document.createElement('div'); trail.className = 'trail'; trail.setAttribute('aria-hidden', 'true');
  const pool = Array.from({ length: 6 }, () => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    p.setAttribute('class', 'tpaw'); p.innerHTML = '<use href="#i-paw"/>'; trail.appendChild(p); return p;
  });
  document.body.appendChild(trail);
  let lastY = scrollY, acc = 0, step = 0, ticking = false;
  const STRIDE = 190;
  const stamp = (dir) => {
    const mobile = innerWidth < 760;
    const p = pool[step % pool.length];
    const side = step++ % 2 ? 1 : -1;
    p.style.left = `${innerWidth - (mobile ? 22 : 48) + side * (mobile ? 7 : 14)}px`;
    p.style.top = `${scrollY + innerHeight * (dir > 0 ? 0.68 : 0.32)}px`;
    p.style.rotate = `${(dir > 0 ? 180 : 0) + side * -10}deg`;
    p.classList.remove('is-on'); void p.getBBox; requestAnimationFrame(() => p.classList.add('is-on'));
  };
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, d = y - lastY; lastY = y;
      if (Math.sign(d) !== Math.sign(acc)) acc = 0;
      acc += d;
      if (Math.abs(acc) >= STRIDE) { stamp(Math.sign(acc)); acc = 0; }
    });
  }, { passive: true });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
