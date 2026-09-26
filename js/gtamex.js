/* 06 · GTAmex: everything that moves in the section. Loaded after motion.js, so
   its ScrollTriggers come after the pins above in creation order as well as on
   the page.

   The clips and the flight play only while on screen; the flight's progress bar
   and its glow (the video drawn onto a 32×16 canvas that CSS blurs into light
   behind the screen); the logo drops in and the words slam in beside it; the HUD
   slides on and fills as the grid scrolls past; the tiles deal in like a mission
   select; "mission passed" lands last.

   A second look - the clips and stills as GTA box art, assembling on scroll - was
   tried here and taken out on the user's note: fourteen moving panels in one view
   was too much for the eye at once. It's in git history (5d0612c). */
(() => {
  const sec = document.querySelector(".gta");
  if (!sec || !window.gsap) return;
  const $ = (s, r = sec) => r.querySelector(s), $$ = (s, r = sec) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger);

  const grid = $(".gta__grid");

  // ---------- footage: plays only while on screen ----------
  // The clips are preload="none", so they cost nothing until you reach them. Under
  // reduced motion none plays by itself: hovering one plays it.
  const vids = $$("video");
  if (!reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { rootMargin: "100px 0px" });
    vids.forEach((v) => io.observe(v));
  } else vids.forEach((v) => {
    const t = v.closest(".tile, .gta__flight");
    t.addEventListener("pointerenter", () => v.play().catch(() => {}));
    t.addEventListener("pointerleave", () => v.pause());
  });
  // the flight's progress bar follows the video, and its glow is the video itself:
  // each timeupdate (~4 a second) draws the frame onto the tiny canvas. The poster
  // stands in until it plays.
  const drone = $(".gta__drone"), bar = $(".gta__bar"), glow = $(".gta__glow"), gx = glow.getContext("2d");
  const paint = (src) => { try { gx.drawImage(src, 0, 0, glow.width, glow.height); } catch {} };
  const poster = new Image(); poster.onload = () => paint(poster); poster.src = drone.poster;
  drone.addEventListener("timeupdate", () => {
    bar.style.setProperty("--p", drone.duration ? drone.currentTime / drone.duration : 0);
    if (drone.readyState >= 2) paint(drone);
  });

  // ---------- the HUD: a star per fifth, cash up to a million, sirens at five ----------
  const stars = $$(".gta__stars i"), starRow = $(".gta__stars"), cash = $(".gta__cash span");
  const setHud = (p) => {
    p = Math.min(1, Math.max(0, p));
    const n = Math.min(5, Math.floor(p * 6));
    stars.forEach((st, i) => st.classList.toggle("is-on", i < n));
    starRow.classList.toggle("is-max", n === 5);
    cash.textContent = String(Math.round(p * 1e6)).padStart(8, "0");
  };
  ScrollTrigger.create({ trigger: grid, start: "top 80%", end: "bottom 70%", onUpdate: (s) => setHud(s.progress), onRefresh: (s) => setHud(s.progress) });

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // the flight's screen rises in softly once, and its glow warms up behind it
    gsap.timeline({ scrollTrigger: { trigger: ".gta__flight", start: "top 85%" } })
      .from(".gta__screen", { y: 50, scale: 0.97, autoAlpha: 0, duration: 1.3, ease: "expo.out" })
      .fromTo(".gta__glow", { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 1.6, ease: "power2.out" }, 0.2);
    gsap.from(".gta__passed > *", { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: "back.out(1.8)", stagger: 0.18, scrollTrigger: { trigger: ".gta__passed", start: "top 88%" } });
    // the A drops in, the words slam in beside it, the HUD slides on, and the
    // tiles deal in like a mission select. Tiles move on transform; their hover
    // lift is on `translate`, so the two never fight.
    gsap.timeline({ scrollTrigger: { trigger: ".gta__top", start: "top 78%" } })
      .from(".gta__A", { yPercent: -50, scale: 1.4, autoAlpha: 0, duration: 1.1, ease: "expo.out" })
      .from(".gta__words > span", { xPercent: -40, autoAlpha: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.08 }, "-=.75")
      .from(".gta__hud > *", { x: 30, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=.6");
    const tiles = $$(".tile", grid);
    gsap.set(tiles, { autoAlpha: 0, y: 70, rotateX: -14, transformPerspective: 900, transformOrigin: "50% 100%" });
    ScrollTrigger.batch(tiles, { start: "top 92%", once: true,
      onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1, ease: "expo.out", stagger: 0.09, overwrite: true }) });
  });

  // presenter mode (motion.js asks at the moment of the press): the heading, the
  // flight, the grid, mission passed
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const mid = (el) => top(el) + el.offsetHeight / 2 - innerHeight / 2;
  window.apexGta = { beats: () => [top($(".shead")) - 90, mid($(".gta__screen")), top(grid) - 90, mid($(".gta__passed"))] };
  // created after motion.js's refresh: sort, so they're measured after the pins above
  ScrollTrigger.sort(); ScrollTrigger.refresh();
})();
