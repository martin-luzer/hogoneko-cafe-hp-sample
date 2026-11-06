// ひだまりのいえ 専用の動き。猫がのぞく・耳が動く・肉球が歩く・しっぽが揺れる
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 猫のカード：押すと性格が開き、「にゃ」と鳴く
  $$('.cat').forEach((c) => c.addEventListener('click', () => {
    const open = c.getAttribute('aria-expanded') !== 'true';
    c.setAttribute('aria-expanded', open);
    if (open && !reduced) { c.classList.remove('is-nya'); void c.offsetWidth; c.classList.add('is-nya'); }
  }));

  // 肉球の足あとを並べる（左右交互に、少しずつ角度を変えて）
  const makePaws = (box, n) => {
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'paw'); s.innerHTML = '<use href="#i-paw"/>';
      s.style.left = `${(i / (n - 1)) * 100}%`;
      s.style.top = i % 2 ? '58%' : '12%';
      s.style.rotate = `${90 + (i % 2 ? 12 : -12)}deg`;
      box.appendChild(s);
    }
    return $$('.paw', box);
  };

  const loader = $('.loader');
  const hideLoader = () => loader && loader.classList.add('is-done');

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    document.documentElement.classList.remove('js'); hideLoader(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // なめらかなスクロール（少しゆったりめ）
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -64, duration: 1.3 });
    }));
  }

  const header = $('.header');
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80px', onEnter: () => header.classList.add('is-solid'), onLeaveBack: () => header.classList.remove('is-solid') });
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', endTrigger: '.contact', end: 'top bottom', onToggle: (s) => $('.spBar').classList.toggle('is-on', s.isActive) });

  // ---------- 開くとき：猫が画面を歩いて横切る → 写真がぽよんと出る ----------
  const open = gsap.timeline();
  open.fromTo('.loader_cat', { xPercent: -160 }, { xPercent: 260, duration: 1.5, ease: 'none' })
    .to('.loader_cat', { y: -6, duration: 0.19, ease: 'sine.inOut', yoyo: true, repeat: 7 }, 0)
    .to('.loader', { clipPath: 'circle(0% at 50% 50%)', duration: 0.7, ease: 'power3.in', onComplete: hideLoader }, 1.3)
    .fromTo('.hero_photo', { scale: 0.86, borderRadius: '50%' }, { scale: 1, borderRadius: '40px', duration: 1.1, ease: 'back.out(1.4)' }, 1.75)
    .fromTo('[data-open]', { opacity: 0, y: 30, rotate: -2 }, { opacity: 1, y: 0, rotate: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.1 }, 2.1)
    .to('.header', { opacity: 1, duration: 0.6 }, 2.2)
    // 写真のふちから猫がのぞく
    .fromTo('.peek--hero', { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'back.out(2)' }, 2.6)
;

  // のぞく猫は、ときどきまばたき
  $$('.peek .eyes').forEach((e) => gsap.to(e, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.08, yoyo: true, repeat: 1, repeatDelay: 0, delay: 4, ease: 'none', onComplete() { this.delay(2 + Math.random() * 3).restart(true); } }));

  // ---------- 出てくる動き：ぴょこっと跳ねて出る ----------
  const hop = (els) => gsap.fromTo(els, { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.09, overwrite: true });
  $$('[data-each]').forEach((g) => ScrollTrigger.create({ trigger: g, start: 'top 85%', once: true, onEnter: () => hop(g.querySelectorAll(':scope > [data-up]')) }));
  $$('[data-up]').forEach((el) => { if (!el.parentElement.hasAttribute('data-each')) ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => hop(el) }); });

  // 見出しの上から猫がのぞく
  ScrollTrigger.create({ trigger: '.peek--head', start: 'top 85%', once: true, onEnter: () => gsap.fromTo('.peek--head', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'back.out(2.2)' }) });

  // 写真：丸から広がる（猫の瞳がひらくように）
  $$('[data-reveal]').forEach((el) => gsap.fromTo(el, { clipPath: 'circle(8% at 50% 60%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.4, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: el, start: 'top 80%', once: true } }));


  // 数字：数え上げ
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count), o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  // 寝ている猫の「zzz」と、フッターの猫のしっぽ
  $$('.sleeper span').forEach((z, i) => gsap.fromTo(z, { opacity: 0, y: 0, x: 0 }, { opacity: 1, y: -34, x: 14, duration: 2.4, ease: 'sine.out', repeat: -1, delay: i * 0.8, keyframes: { opacity: [0, 1, 0] } }));
  gsap.fromTo('.sitter_tail', { rotate: -6 }, { rotate: 14, transformOrigin: '10% 95%', duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.sit_eyes', { scaleY: 0.12, transformOrigin: '50% 60px', duration: 0.09, yoyo: true, repeat: 1, repeatDelay: 0, delay: 2.5, onComplete() { this.delay(2.5 + Math.random() * 2.5).restart(true); } });

  // ---------- スクロールに合わせて、肉球がペタペタ歩く ----------
  // 下へスクロールすると下向き、上へ戻すと上向きに、ページの右側へ足あとを付けていく
  const trail = document.createElement('div'); trail.className = 'trail'; trail.setAttribute('aria-hidden', 'true');
  document.body.appendChild(trail);
  let lastY = scrollY, acc = 0, step = 0;
  const STRIDE = 120;
  const stamp = (dir) => {
    const mobile = innerWidth < 760;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    p.setAttribute('class', 'tpaw'); p.innerHTML = '<use href="#i-paw"/>';
    const side = step++ % 2 ? 1 : -1;                       // 右足・左足を交互に
    const x = innerWidth - (mobile ? 22 : 48) + side * (mobile ? 7 : 14);
    const y = scrollY + innerHeight * (dir > 0 ? 0.68 : 0.32);
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    p.style.rotate = `${(dir > 0 ? 180 : 0) + side * -10}deg`;
    trail.appendChild(p);
    gsap.timeline({ onComplete: () => p.remove() })
      .fromTo(p, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.18, ease: 'power3.out' })
      .to(p, { opacity: 0, duration: 1.2, ease: 'power1.in' }, 1.4);
  };
  addEventListener('scroll', () => {
    const y = scrollY, d = y - lastY; lastY = y;
    if (Math.sign(d) !== Math.sign(acc)) acc = 0;           // 向きが変わったら歩幅をリセット
    acc += d;
    while (Math.abs(acc) >= STRIDE) { stamp(Math.sign(acc)); acc -= Math.sign(acc) * STRIDE; }
  }, { passive: true });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
