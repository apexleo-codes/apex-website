/* 07 · MerchantScope and 08 · CBO Consortium: the guide clips and everything that
   follows them. Both sections are the same block (.ms, styled in merchantscope.css;
   08's colours and mirrored layout are consortium.css), so this runs once per section.

   The clip plays only while the window is on screen. The rail and the callouts
   read the clip's own clock (every frame while it plays), so the card that is lit
   is always the part on screen, and a click on a card seeks the clip there. The
   glow behind the window is the video itself, drawn onto a 32×20 canvas that CSS
   blurs into light (the GTAmex flight's trick). The window comes up out of the
   floor on scroll, and a sheen crosses its glass as it lands.
   Under reduced motion nothing plays by itself: a play button, or a card, starts it. */
(() => {
  const all = [...document.querySelectorAll(".ms")];
  if (!all.length) return;
  const beats = [];
  const setup = (sec) => {
    const $ = (s) => sec.querySelector(s), $$ = (s) => [...sec.querySelectorAll(s)];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vid = $(".ms__video"), glow = $(".ms__glow"), gx = glow.getContext("2d");
    const steps = $$(".ms__step").map((li) => ({ li, at: +li.dataset.at, end: +li.dataset.end, fill: li.querySelector(".ms__fill i") }));
    const notes = $$(".ms__note").map((el) => ({ el, from: +el.dataset.from, to: +el.dataset.to }));

    // ---------- the clip's clock drives the rail and the callouts ----------
    let lastOn = -1;
    const show = (t) => {
      let on = steps.findIndex((s) => t < s.end); if (on < 0) on = steps.length - 1;
      steps.forEach((s, i) => s.fill.style.setProperty("--p", i < on ? 1 : i > on ? 0 : Math.min(1, Math.max(0, (t - s.at) / (s.end - s.at)))));
      if (on !== lastOn) { steps.forEach((s, i) => s.li.classList.toggle("is-on", i === on)); lastOn = on; }
      notes.forEach((n) => n.el.classList.toggle("is-on", t >= n.from && t < n.to));
  };
  let raf = 0;
  const tick = () => { show(vid.currentTime); raf = vid.paused ? 0 : requestAnimationFrame(tick); };
  vid.addEventListener("play", () => { sec.classList.remove("is-still"); if (!raf) raf = requestAnimationFrame(tick); });
  vid.addEventListener("seeked", () => show(vid.currentTime));
  show(0);

  // the glow: the frame on screen, a few times a second; the poster until it plays
  const paint = (src) => { try { gx.drawImage(src, 0, 0, glow.width, glow.height); } catch {} };
  const poster = new Image(); poster.onload = () => paint(poster); poster.src = vid.poster;
  vid.addEventListener("timeupdate", () => { if (vid.readyState >= 2) paint(vid); });

  // ---------- plays only on screen ----------
  if (reduce) sec.classList.add("is-still");
  // it starts from the top each time it comes on screen: a walkthrough joined halfway reads as noise
  else new IntersectionObserver(([e]) => {
    if (e.isIntersecting) vid.play().catch(() => {});
    else { vid.pause(); if (e.boundingClientRect.top > 0 || e.intersectionRatio === 0) { vid.currentTime = 0; show(0); } }
  }, { threshold: 0.5 }).observe($(".ms__screen"));
  const start = (t) => { vid.currentTime = t; show(t); vid.play().catch(() => {}); };
  $(".ms__play").addEventListener("click", () => start(vid.ended ? 0 : vid.currentTime));
  steps.forEach((s) => s.li.querySelector("button").addEventListener("click", () => start(s.at + 0.01)));

  // ---------- entrances ----------
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ scrollTrigger: { trigger: $(".ms__title"), start: "top 82%" } })
        .from($(".ms__word"), { yPercent: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out" })
        .from($(".ms__line"), { y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out" }, "-=.8");
        // the credit lands just after the name, like a signature (07 only)
        const credit = $(".ms__credit");
        if (credit) gsap.from(credit, { scale: 0.85, y: 20, autoAlpha: 0, duration: 1.1, ease: "back.out(1.6)", scrollTrigger: { trigger: credit, start: "top 85%" } });
      // the window rises out of the floor, tilted back, and stands up as you scroll;
      // the sheen crosses the glass on the last stretch
      const glass = $(".ms__glass");
      gsap.fromTo($(".ms__win"), { rotateX: 16, y: 80, scale: 0.94 }, { rotateX: 0, y: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: $(".ms__stage"), start: "top 98%", end: "top 40%", scrub: 0.6,
          onUpdate: (st) => glass.style.setProperty("--sheen", Math.min(1, Math.max(0, (st.progress - 0.55) / 0.45))) } });
      // the cards deal in from the window's side
      const side = sec.classList.contains("ms--flip") ? -40 : 40;
      gsap.from([...$$(".ms__step"), $(".ms__visit"), $(".ms__fine")].filter(Boolean), { x: side, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: $(".ms__rail"), start: "top 85%" } });
    });
  }

  // presenter mode (motion.js asks at the moment of the press): the heading, then the window centred
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  beats.push(() => [top($(".shead")) - 90, top($(".ms__stage")) + $(".ms__stage").offsetHeight / 2 - innerHeight / 2]);
  };
  all.forEach(setup);
  window.apexMs = { beats: () => beats.flatMap((b) => b()) };
  if (window.ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
})();
