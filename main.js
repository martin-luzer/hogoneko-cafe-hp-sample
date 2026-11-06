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
  const heroPaws = makePaws($('.paws--hero'), 9);
  const adoptPaws = makePaws($('.paws--adopt'), 12);

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
    // 足あとが、ぽん、ぽん、と歩いてくる
    .fromTo(heroPaws, { opacity: 0, scale: 0.3 }, { opacity: 0.85, scale: 1, duration: 0.3, ease: 'back.out(3)', stagger: 0.12 }, 2.8);

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

  // 里親の流れ：スクロールに合わせて足あとが1つずつ増えていく
  gsap.fromTo(adoptPaws, { opacity: 0, scale: 0.3 }, { opacity: 0.8, scale: 1, ease: 'none', stagger: 0.5, scrollTrigger: { trigger: '.adopt', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 } });

  // 数字：数え上げ
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count), o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  // 寝ている猫の「zzz」と、フッターの猫のしっぽ
  $$('.sleeper span').forEach((z, i) => gsap.fromTo(z, { opacity: 0, y: 0, x: 0 }, { opacity: 1, y: -34, x: 14, duration: 2.4, ease: 'sine.out', repeat: -1, delay: i * 0.8, keyframes: { opacity: [0, 1, 0] } }));
  gsap.to('.sitter_tail', { rotate: 18, transformOrigin: '8% 92%', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
