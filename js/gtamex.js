/* 06 · GTAmex: everything that moves in the section, for both looks.

   The look is data-look on the section ("cover" or "classic"); ?gta=classic or
   ?gta=cover in the URL overrides it, from an inline script in the section, before
   anything is laid out. Loaded after motion.js, so its ScrollTriggers come after
   the pins above in creation order as well as on the page.

   - Shared: the clips and the flight play only while on screen; the flight's
     progress bar and its glow (the video drawn onto a 32×16 canvas that CSS blurs
     into light behind the screen); "mission passed" landing last.
   - Cover: the clips and stills assemble into GTA box art as you scroll (desktop,
     with motion): each panel flies in from outside the box and locks with a flash,
     the logo slams into the middle, the box shakes once and a gloss crosses it, and
     the wanted stars and the cash fill as it comes together. Phones and reduced
     motion get the cover as a still picture, the HUD filling as it scrolls past.
   - Classic: the mission-select grid, exactly as it was - the logo drops in, the
     tiles deal in, the HUD fills over the grid. */
(() => {
  const sec = document.querySelector(".gta");
  if (!sec || !window.gsap) return;
  const $ = (s, r = sec) => r.querySelector(s), $$ = (s, r = sec) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const look = sec.dataset.look === "classic" ? "classic" : "cover";
  gsap.registerPlugin(ScrollTrigger);

  // ---------- the cover's parts, moved into place ----------
  // The logo and its floor become the middle panel; the HUD rides on the stage.
  // Done once, before any trigger here measures.
  const grid = $(".gta__grid"), run = $(".gta__run"), stage = $(".gta__stage");
  if (look === "cover") {
    $(".tile--logo").append($(".gta__floor"), $(".gta__logo"));
    stage.prepend($(".gta__hud"));
    sec.classList.add("gta--built");
  }

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
  const hudOver = (el) => ScrollTrigger.create({ trigger: el, start: "top 80%", end: "bottom 70%", onUpdate: (s) => setHud(s.progress), onRefresh: (s) => setHud(s.progress) });

  // ---------- the cover's assembly ----------
  // Seeded, so the box assembles the same way on every load.
  let seed = 6; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let beatY = null;                       // where the assembled box holds, for presenter mode
  function assemble() {
    const logo = $(".tile--logo"), panels = $$(".tile", grid).filter((t) => t !== logo), gloss = $(".gta__gloss");
    // from the box's centre to each panel's, off the layout (never the box, which
    // GSAP is moving): the grid is the panels' offsetParent
    const off = (t) => [t.offsetLeft + t.offsetWidth / 2 - grid.clientWidth / 2, t.offsetTop + t.offsetHeight / 2 - grid.clientHeight / 2];
    const order = panels.map((_, i) => i).sort(() => rnd() - 0.5);
    const spin = panels.map(() => (rnd() - 0.5) * 28), far = panels.map(() => 1.15 + rnd() * 0.6);
    // start as the stage is about to stick (the run's top at 25% of the screen, so
    // the section's heading still shows an empty stage); done 80% of a screen after
    // it sticks, which leaves the rest of the run to hold the finished box
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: run, start: "top 25%", end: () => `+=${innerHeight * 1.05}`, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (s) => setHud(s.progress * 1.12), onRefresh: (s) => { setHud(s.progress * 1.12); beatY = s.end + innerHeight * 0.08; },
      },
    });
    const gap = 0.1, fly = 1;
    // the box itself (black, its shadow) comes up as the panels land in it
    tl.fromTo(grid, { "--box": 0 }, { "--box": 1, duration: 1.6, ease: "none" }, fly * 0.7);
    panels.forEach((t, i) => {
      const at = order.indexOf(i) * gap;
      tl.fromTo(t, { x: () => off(t)[0] * far[i], y: () => off(t)[1] * far[i], rotation: spin[i], scale: 1.3, autoAlpha: 0 },
                   { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: fly }, at)
        // the lock: a flash as it lands, gone in half a beat
        .to(t, { keyframes: { "--flash": [0, 0.7, 0] }, duration: 0.45, ease: "none" }, at + fly * 0.82);
    });
    const land = (panels.length - 1) * gap + fly;
    tl.fromTo(logo, { scale: 2.6, rotation: -9, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.55, ease: "power4.in" }, land)
      .to(logo, { keyframes: { "--flash": [0, 1, 0] }, duration: 0.7, ease: "none" }, ">")
      .to(grid, { keyframes: { x: [0, -9, 7, -4, 2, 0], y: [0, 6, -5, 3, -1, 0] }, duration: 0.5, ease: "none" }, "<")
      .fromTo(gloss, { "--gx": "160%" }, { "--gx": "-60%", duration: 1.3, ease: "power1.inOut" }, "<0.1");
    // a box you can hold: it tilts a little towards the pointer
    if (matchMedia("(pointer: fine)").matches) {
      gsap.set(grid, { transformPerspective: 1600 });
      const rx = gsap.quickTo(grid, "rotationX", { duration: 0.8, ease: "power3.out" }), ry = gsap.quickTo(grid, "rotationY", { duration: 0.8, ease: "power3.out" });
      const move = (e) => { const r = stage.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return; ry((e.clientX / innerWidth - 0.5) * 5); rx((0.5 - e.clientY / innerHeight) * 3.5); };
      addEventListener("pointermove", move);
      return () => { removeEventListener("pointermove", move); gsap.set(grid, { clearProps: "transform" }); };
    }
  }

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 701px)" }, (ctx) => {
    const { motion, wide } = ctx.conditions;
    beatY = null;
    if (motion) {
      // the flight's screen rises in softly once, and its glow warms up behind it
      gsap.timeline({ scrollTrigger: { trigger: ".gta__flight", start: "top 85%" } })
        .from(".gta__screen", { y: 50, scale: 0.97, autoAlpha: 0, duration: 1.3, ease: "expo.out" })
        .fromTo(".gta__glow", { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 1.6, ease: "power2.out" }, 0.2);
      gsap.from(".gta__passed > *", { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: "back.out(1.8)", stagger: 0.18, scrollTrigger: { trigger: ".gta__passed", start: "top 88%" } });
    }
    if (look === "classic") {
      // the A drops in, the words slam in beside it, the HUD slides on, and the
      // tiles deal in like a mission select. Tiles move on transform; their hover
      // lift is on `translate`, so the two never fight.
      if (motion) {
        gsap.timeline({ scrollTrigger: { trigger: ".gta__top", start: "top 78%" } })
          .from(".gta__A", { yPercent: -50, scale: 1.4, autoAlpha: 0, duration: 1.1, ease: "expo.out" })
          .from(".gta__words > span", { xPercent: -40, autoAlpha: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.08 }, "-=.75")
          .from(".gta__hud > *", { x: 30, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=.6");
        const tiles = $$(".tile:not(.tile--logo)", grid);
        gsap.set(tiles, { autoAlpha: 0, y: 70, rotateX: -14, transformPerspective: 900, transformOrigin: "50% 100%" });
        ScrollTrigger.batch(tiles, { start: "top 92%", once: true,
          onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1, ease: "expo.out", stagger: 0.09, overwrite: true }) });
      }
      hudOver(grid);
      return;
    }
    if (motion && wide) return assemble();
    hudOver(grid);
  });

  // presenter mode (motion.js asks at the moment of the press): the assembled box
  // (a click glides through the assembly, so it plays on the way) or the classic
  // heading and grid, then the flight and mission passed
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const mid = (el) => top(el) + el.offsetHeight / 2 - innerHeight / 2;
  window.apexGta = {
    look,
    beats: () => {
      const out = look === "cover" ? [beatY ?? top(grid) - 80] : [top($(".shead")) - 90, top(grid) - 90];
      out.push(mid($(".gta__screen")), mid($(".gta__passed")));
      return out;
    },
  };
  // created after motion.js's refresh: sort, so they're measured after the pins above
  ScrollTrigger.sort(); ScrollTrigger.refresh();
})();
