/* Motion: smooth scroll, loader, cursor, menu, and one scroll story per section. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const D = window.APEX;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- smooth scroll ----------
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const goto = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.6 }) : $(target).scrollIntoView());
  // triggers are created in code order, not page order; sort so pin spacing above a trigger is counted
  const refreshAll = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };

  // ---------- loader → hero intro ----------
  function countUp(instant) {
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      if (instant === true) { el.textContent = end; return; }
      gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
  }
  function intro() {
    gsap.timeline()
      .from(".hero__title .line > span", { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.12 })
      .from(".hero__eyebrow, .hero__lede, .hero__stats, .hero__credit", { y: 30, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, "-=.8")
      .from(".lion", { yPercent: 16, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, "-=1.25")
      .from(".bubble", { yPercent: 14, scale: 0.9, duration: 0.8, ease: "back.out(1.6)" }, "-=.7")
      .add(() => apexHero.start(), "-=.45")   // he waves as the first message lands
      .from(".nav, .hero__scroll", { autoAlpha: 0, duration: 0.8 }, "-=.9")
      .add(countUp, "-=1");
  }
  const finishLoad = () => { document.body.classList.remove("is-loading"); lenis && lenis.start(); refreshAll(); };
  const loader = $(".loader");
  if (reduce) { loader.remove(); finishLoad(); countUp(true); apexHero.start(); }
  else {
    const num = $(".loader__num"), c = { v: 0 };
    document.fonts.ready.then(() => {
      gsap.timeline({ onComplete: () => { loader.remove(); finishLoad(); } })
        .from(".loader__word span", { yPercent: 100, duration: 0.7, ease: "expo.out", stagger: 0.06 })
        .to(c, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => (num.textContent = Math.round(c.v)) }, 0)
        .to(".loader__word span", { yPercent: -105, duration: 0.5, ease: "expo.in", stagger: 0.04 }, ">-.05")
        .to(loader, { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, ">-.25")
        .add(intro, "<.3");
    });
  }

  // ---------- cursor ----------
  if (fine && !reduce) {
    const cur = $(".cursor"), label = $(".cursor__label");
    const xTo = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }), yTo = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); cur.classList.add("is-on"); });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, .tool");
      const txt = (t && t.dataset.cursor) || "";
      cur.classList.toggle("is-hover", !!t);
      cur.classList.toggle("has-label", !!txt);
      label.textContent = txt;
    });
    document.addEventListener("pointerleave", () => cur.classList.remove("is-on"));
  }

  // ---------- menu, anchors, chapter label ----------
  const menuBtn = $(".nav__menu"), menu = $("#menu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    $(".nav__menu-label").textContent = open ? "Close" : "Menu";
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  $$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); setMenu(false); goto(a.dataset.goto); }));
  $$(".menu__list a").forEach((a) => a.addEventListener("pointerenter", () => ($(".menu__preview").src = `img/agent-${a.dataset.img}.webp`)));

  // the brand is the hero's, and only the hero's (see base.css). Active from the
  // moment the hero's bottom clears the top of the screen to the end of the page,
  // so one class covers the whole way down and back up again. onRefresh as well as
  // onToggle: a page opened deep - a #hash, or a browser putting back the scroll
  // position from last time - never crosses the line, so the toggle never fires and
  // the brand would sit there over a section it doesn't belong to.
  const heroGate = (s) => document.body.classList.toggle("past-hero", s.isActive);
  ScrollTrigger.create({ trigger: ".hero", start: "bottom top", end: "max", onToggle: heroGate, onRefresh: heroGate });

  const numEl = $(".nav__num"), nameEl = $(".nav__name");
  $$("[data-chapter]").forEach((sec, i) => ScrollTrigger.create({
    trigger: sec, start: "top 50%", end: "bottom 50%", refreshPriority: -1, // after pins, so pinned sections have their full height
    onToggle: (s) => { if (s.isActive) { numEl.textContent = pad(i); nameEl.textContent = sec.dataset.chapter; } }
  }));

  // ---------- content switches (kept even with reduced motion) ----------
  const screens = $$(".task .screen"), tsteps = $$(".tstep");
  tsteps.forEach((st, i) => ScrollTrigger.create({
    trigger: st, start: "top 62%", end: "bottom 62%",
    onToggle: (s) => { if (!s.isActive) return; tsteps.forEach((x, k) => x.classList.toggle("is-on", k === i)); screens.forEach((x, k) => x.classList.toggle("is-on", k === i)); }
  }));
  // 01 · the frontend: one day in the chat, six jobs. It plays the day through on
  // its own, and hovering a job jumps the thread straight to it. That jump is the
  // whole reason the thread is markup: a recorded clip has no seek, so it could
  // never answer the pointer. GSAP owns only the thread's transform; CSS owns
  // every fade (the bubbles' staggered reveal) - one owner per property.
  const thread = $(".tgthread"), tgview = $(".tgview"), tgStatus = $(".tgbar__status");
  const chapters = $$(".tgchapter"), cases = $$(".case"), bars = $$(".case__bar i");
  let curCase = -1, autoT = 0, typeT = 0;
  const setCase = (i, instant) => {
    const ch = chapters[i];
    // a chapter taller than the screen drifts slowly through the rest of its dwell
    const over = Math.max(0, ch.offsetHeight - tgview.clientHeight + 14);
    const dwell = 4200 + Math.min(over, 420) * 7;
    if (i === curCase) return dwell;
    curCase = i;
    cases.forEach((c, k) => c.classList.toggle("is-on", k === i));
    chapters.forEach((c, k) => (c.dataset.state = k === i ? "on" : k < i ? "past" : "idle"));
    gsap.killTweensOf(thread); gsap.killTweensOf(bars); gsap.set(bars, { scaleX: 0 });
    // Reduced motion: a plain scrollable chat, never transformed. A transform here
    // fights .tgview's native scrolling - the container's scrollHeight knows
    // nothing about it, so the early chapters end up above its top edge, out of
    // reach, with the same distance left as dead space at the bottom.
    if (reduce) { tgview.scrollTop = Math.max(0, ch.offsetTop - 8); return dwell; }
    const y = -ch.offsetTop + 8;
    if (instant) { gsap.set(thread, { y }); return dwell; }
    gsap.to(thread, { y, duration: 0.8, ease: "expo.out",
      onComplete: () => { if (over > 4) gsap.to(thread, { y: y - over, duration: (dwell - 1000) / 1000, ease: "none" }); } });
    gsap.to(bars[i], { scaleX: 1, duration: dwell / 1000, ease: "none" });
    clearTimeout(typeT);
    tgStatus.textContent = "typing…"; tgStatus.classList.add("is-typing");
    typeT = setTimeout(() => { tgStatus.textContent = "bot"; tgStatus.classList.remove("is-typing"); }, 320 + ch.children.length * 140);
    return dwell;
  };
  const advance = () => { autoT = setTimeout(advance, setCase((curCase + 1) % chapters.length)); };
  const stopAuto = () => clearTimeout(autoT);
  const resumeAuto = () => { stopAuto(); autoT = setTimeout(advance, 1600); };
  // offsets are measured from the laid-out thread, so re-place the chapter after a resize
  const remeasure = () => { const k = Math.max(0, curCase); curCase = -1; setCase(k, true); };
  cases.forEach((c, i) => ["pointerenter", "focus", "click"].forEach((ev) => c.addEventListener(ev, () => { stopAuto(); setCase(i); })));
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  setCase(0, true);

  // 03 · the tools layer can be switched off when the stage feels busy
  const toolsBtn = $(".orch__toggle"), orchStage = $(".stage");
  toolsBtn.addEventListener("click", () => {
    const on = toolsBtn.getAttribute("aria-pressed") !== "true";
    toolsBtn.setAttribute("aria-pressed", on);
    orchStage.dataset.tools = on ? "on" : "off";
  });

  // inside a real skill · parked with the journey flow in depricated_for_now.html
  const shotBox = $(".skillx__shot");
  if (shotBox) {
    shotBox.dataset.hl = "1";
    $$(".skillnote").forEach((b) => {
      const on = () => { $$(".skillnote").forEach((x) => x.classList.toggle("is-on", x === b)); shotBox.dataset.hl = b.dataset.hl; };
      ["pointerenter", "focus", "click"].forEach((ev) => b.addEventListener(ev, on));
    });
  }
  // 02 · the setup. The progress bar is the spine running down the step-number
  // gutter: the numbers were already sitting in that column, so the bar costs no
  // layout at all. Step state is a class toggle (kept under reduced motion too -
  // it's information, not decoration); only the fill itself is scrubbed, and CSS
  // parks it at full height when motion is reduced. GSAP owns the fill's scaleY
  // and nothing else - .step's dimming is a CSS opacity transition, so no tween
  // may ever touch its opacity.
  const setupSteps = $$(".setup .step"), setupSegs = $$(".setup__bar i"), rigParts = $$(".rig__part");
  const rig = $(".rig");
  // Whether the rig scrubs (see below). When it does, paint() owns `is-on` as well
  // as the layers' opacity, because those two have to agree: the brain's pulse, the
  // soul's rays, the shake and the flames all hang off that class, and the rig's
  // change now lands well AFTER the step latches. Left on the latch, the brain
  // would light up over a skull that hasn't grown one yet.
  const rigScrubbed = !reduce && !!rig && rigParts.length > 0;
  const setStep = (i) => {
    setupSteps.forEach((x, k) => { x.classList.toggle("is-on", k === i); x.classList.toggle("is-past", k < i); });
    setupSegs.forEach((x, k) => x.classList.toggle("is-on", k <= i));
    // Exclusive, NOT cumulative. Each file is already a complete stage of the
    // build (skeleton -> +brain -> armoured -> awake) and the art is transparent,
    // so stacking them would show the skeleton's splayed arms poking out from
    // behind the finished lion. One stage at a time. A layer may name several
    // steps: the armoured stage holds through the soul, whose aura and motes are
    // the only layers that join it.
    // `is-on` is the layer's own state, and the only thing the effects listen to,
    // so none of them burn a frame while their stage is off screen. Under reduced
    // motion the latch is all there is, so it sets them here.
    if (!rigScrubbed) rigParts.forEach((p) => p.classList.toggle("is-on", p.dataset.at.split(" ").includes(String(i))));
  };
  // onEnter/onEnterBack, never an isActive window: a step shorter than the gap
  // between its top and the trigger line never straddles that line with both
  // edges, so an isActive test leaves a dead zone - the last and shortest step
  // sat dim with its dot unlit while it filled the screen. Entering latches.
  // 55%, not 70%: a step is only ~520px tall, so at "top 70%" the NEXT step
  // crossed the line while the current one still filled the screen - the rig
  // showed the brain while you were still reading "Give it a body". Entering
  // still latches, so the short last step keeps its dead-zone fix.
  setupSteps.forEach((st, i) => ScrollTrigger.create({
    trigger: st, start: "top 55%", end: "bottom 30%",
    onEnter: () => setStep(i), onEnterBack: () => setStep(i)
  }));
  setStep(0);

  // …and the rig converges between those latches. The four stages are the same
  // figure, cut and placed on one canvas by tools/build-rig.py, so they sit on
  // top of each other to the pixel below the neck — which means a plain fade
  // between them looks like nothing happening. So they implode instead: the stage
  // you're scrolling towards starts oversized and out of focus and collapses onto
  // the one in place, which shrinks into it as it goes. The lion never travels;
  // the change arrives on him.
  //
  // Each change is anchored to the INCOMING step's own heading, and nothing else.
  // Measuring between step TOPS was the mistake: the gap between two tops is the
  // PREVIOUS step's height, so a tall step stretched its change and a short one
  // rushed it, and every one of them ran early — the picture swapped while its
  // words were still arriving at the middle of the screen. Now a step's picture
  // changes over the travel of that step's own heading, from a quarter of the way
  // down the screen (by then the heading has climbed three quarters of it and the
  // body fills what's under it) to the very top. Same travel on every step, no
  // matter how much copy it carries, and between two windows there is a plateau
  // where nothing moves at all.
  if (rigScrubbed) {
    const IN = 0.3, OUT = 0.14, BLUR = 12;   // how far out it starts, how far in it collapses, px
    const START = 0.25, END = 0.03;          // the incoming heading's travel, as a fraction of the screen
    const at = rigParts.map((p) => p.dataset.at.split(" ").map(Number));
    // …except across a boundary listed here, which stays a flat cross-fade. 01→02
    // is the only one: the brain lighting up is the event there, and an implosion
    // on top of it fought the pulse for the same attention. The index is the step
    // it leaves FROM, so 0 is 01→02.
    const FLAT = new Set([0]);
    // Smoothstep across the window and nothing outside it. The plateau is what
    // keeps each stage sharp now, so this only has to make the swap itself gentle;
    // it is still symmetric — ease(u) + ease(1 - u) is 1 — so a pair of stages
    // cross-fades to exactly 1 and neither dips in the middle.
    const ease = (u) => u * u * (3 - 2 * u);
    let tops = [];
    const measure = () => { tops = setupSteps.map((st) => st.getBoundingClientRect().top + scrollY); };
    const position = () => {
      if (!tops.length) return 0;
      const vh = innerHeight;
      let prevEnd = -Infinity;
      for (let j = 1; j < tops.length; j++) {
        // never open a window before the last one closed: on a step shorter than
        // the window the two would overlap and the stage between them, which is
        // the one you are reading about, would never be reached
        const start = Math.max(tops[j] - START * vh, prevEnd);
        const end = Math.max(tops[j] - END * vh, start + 1);
        if (scrollY < start) return j - 1;
        if (scrollY < end) return j - 1 + (scrollY - start) / (end - start);
        prevEnd = end;
      }
      return tops.length - 1;
    };
    const paint = () => {
      const p = position();
      const flat = FLAT.has(Math.floor(p));
      rigParts.forEach((el, i) => {
        const steps = at[i], lo = steps[0], hi = steps[steps.length - 1];
        // signed distance in steps: negative while the layer is still ahead of you,
        // positive once it's behind, and exactly 0 anywhere inside its own span
        const d = p < lo ? p - lo : p > hi ? p - hi : 0;
        const k = Math.min(1, Math.abs(d));
        if (k >= 1) { el.style.visibility = "hidden"; el.style.opacity = "0"; el.classList.remove("is-on"); return; }
        const m = ease(k);                        // 0 while it's at home, 1 a full step away
        el.style.visibility = "visible";
        el.style.opacity = 1 - m;
        el.classList.toggle("is-on", m < 0.5);    // the effects follow the picture, not the latch
        // "none", never "": an empty inline transform hands the layer back to the
        // stylesheet's parked translateY(16px), and the figure drops 16px mid-fade
        el.style.transform = flat ? "none" : `scale(${1 + (d < 0 ? m * IN : -m * OUT)})`;
        el.style.filter = flat || m <= 0.002 ? "none" : `blur(${(m * m * BLUR).toFixed(2)}px)`;
      });
    };
    rig.classList.add("is-converging");
    ScrollTrigger.create({
      trigger: ".setup", start: "top bottom", end: "bottom top",
      onUpdate: paint, onRefresh: () => { measure(); paint(); }
    });
    measure(); paint();
  }

  // rhythm stop display  // rhythm stop display (the dial on desktop, the list on small screens)
  const R = D.rhythm, rhythmSec = $(".rhythm"), timeEl = $(".dial__time"), agentEl = $(".dial__agent"), labelEl = $(".dial__label");
  // The face is a 12-hour clock but `h` counts straight through the day (01:00 is
  // 25), so the rotation is h/12 and NOT (h % 12)/12: it just keeps climbing, past
  // 360° and round again, which is what a real hand does between breakfast and the
  // small hours. Taking the modulo here would send the hand spinning backwards
  // across the face every time the day crossed noon or midnight.
  const handAngle = (h) => (h / 12) * 360;
  const rItems = $$(".rhythm__list li"), dots = $$(".stopdot");
  let curStop = -1;
  const setStop = (k, animate = true) => {
    if (k === curStop) return;
    curStop = k;
    const st = R[k];
    const c = D.clock12(st.t);
    timeEl.innerHTML = `${c.t}<small>${c.ap}</small>`;
    agentEl.src = `img/agent-${st.key}.webp`; labelEl.textContent = st.label;
    rItems.forEach((x, i) => x.classList.toggle("is-on", i === k));
    dots.forEach((d, i) => d.classList.toggle("is-on", i <= k));
    rhythmSec.classList.toggle("is-night", st.night);
    // the hand swings here, not in the pinned desktop story, because a phone never
    // reaches that story - it sat at midnight all the way down the page while the
    // readout beside it said 10:45 PM
    if (animate && !reduce) {
      gsap.to(".dial__hand", { rotation: handAngle(st.h), duration: 0.9, ease: "expo.out", overwrite: true });
      gsap.fromTo([timeEl, agentEl, labelEl], { y: 16, autoAlpha: 0.2 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.04, overwrite: true });
    } else {
      gsap.set(".dial__hand", { rotation: handAngle(st.h) });
    }
  };
  setStop(0, false);

  const mm = gsap.matchMedia();

  // ---------- decorative motion ----------
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // hero: mouse parallax + scroll-out
    // No pointer parallax on the hero: APEX is already waving, and drifting the
    // stage under the cursor moved him too. (It lived on .hero__visual, which
    // holds the lion, so it could not be kept for the bubble alone.)
    gsap.to(".hero__copy", { yPercent: -14, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".lion", { scale: 1.1, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // marquee speeds up and leans with scroll velocity
    const loopTween = gsap.to(".marquee__track", { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    const skewTo = gsap.quickTo(".marquee__track span", "skewX", { duration: 0.4, ease: "power3" });
    ScrollTrigger.create({ onUpdate: (s) => { const v = s.getVelocity(); gsap.to(loopTween, { timeScale: 1 + Math.min(Math.abs(v) / 500, 5), duration: 0.3, overwrite: true }); skewTo(gsap.utils.clamp(-14, 14, -v / 140)); } });
    const settle = () => { gsap.to(loopTween, { timeScale: 1, duration: 0.8 }); skewTo(0); };
    ScrollTrigger.addEventListener("scrollEnd", settle);

    // headings and blocks rise in
    const risers = $$(".section .big, .roles .role, .case, .skillx, .model, .tool, .backups, .task__notes > *");
    gsap.set(risers, { y: 60, autoAlpha: 0 });
    ScrollTrigger.batch(risers, { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }) });

    // the setup spine fills as the five steps go past
    gsap.fromTo(".spine__fill", { scaleY: 0 }, { scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".steps", start: "top 72%", end: "bottom 72%", scrub: 0.4 } });

    // journey flow: the line draws, nodes arrive in order · parked
    const flowPath = $(".flow__line path");
    if (flowPath) {
      gsap.fromTo(flowPath, { strokeDasharray: 960, strokeDashoffset: 960 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".flow", start: "top 80%", end: "bottom 50%", scrub: true } });
      gsap.from(".fnode", { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.14, scrollTrigger: { trigger: ".flow", start: "top 78%" } });
    }


    // thank you
    gsap.from(".thanks__word > *", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".thanks", start: "top 75%" } });
    gsap.from(".thanks__lion", { rotate: -25, scale: 0.4, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".thanks", start: "top 70%" } });

    // 06 · GTAmex: the A drops in, the words slam in beside it, the HUD slides on,
    // the tiles deal in like a mission select and "mission passed" lands last.
    // Tiles move on transform; their hover lift is on `translate`, so the two never fight.
    // the flight's screen rises in softly once, and its glow warms up behind it
    gsap.timeline({ scrollTrigger: { trigger: ".gta__flight", start: "top 85%" } })
      .from(".gta__screen", { y: 50, scale: 0.97, autoAlpha: 0, duration: 1.3, ease: "expo.out" })
      .fromTo(".gta__glow", { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 1.6, ease: "power2.out" }, 0.2);
    gsap.timeline({ scrollTrigger: { trigger: ".gta__top", start: "top 78%" } })
      .from(".gta__A", { yPercent: -50, scale: 1.4, autoAlpha: 0, duration: 1.1, ease: "expo.out" })
      .from(".gta__words > span", { xPercent: -40, autoAlpha: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.08 }, "-=.75")
      .from(".gta__hud > *", { x: 30, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=.6");
    gsap.set(".gta .tile", { autoAlpha: 0, y: 70, rotateX: -14, transformPerspective: 900, transformOrigin: "50% 100%" });
    ScrollTrigger.batch(".gta .tile", { start: "top 92%", once: true,
      onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1, ease: "expo.out", stagger: 0.09, overwrite: true }) });
    gsap.from(".gta__passed > *", { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: "back.out(1.8)", stagger: 0.18, scrollTrigger: { trigger: ".gta__passed", start: "top 88%" } });

    return () => ScrollTrigger.removeEventListener("scrollEnd", settle);
  });

  // ---------- pinned scroll stories (desktop) ----------
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    // how they work together: MISO's Sunday job, leg by leg. .orch's padding gives
    // it room to arrive and leave in ordinary scrolling.
    // No anticipatePin, on either pin. It was added to stop the section "snapping
    // to full screen", but that snap was the pins' starts gone stale under a lazy
    // image (see the shot's `w`/`h` in content.js), and anticipatePin can't reach
    // that; what it does do is pin ON PURPOSE a frame or two early, so every entry
    // into a pinned range — down into the top, or back up into the bottom — jumped
    // the panel 60-100px. It exists for native scroll, where the compositor moves
    // the page a frame before ScrollTrigger hears about it. Lenis scrolls from JS in
    // the same tick that calls ScrollTrigger.update, so there is no frame to cover.
    // Keep the pin short enough that the page isn't held for screens
    // on end: 300% over six legs is ~380px of scroll each. you → soul; the soul
    // picks MISO off the arc; her JSON shopping list goes to a script; the script
    // takes it to the browser tool (Zepto) and brings the cart back; the result
    // goes to you on Telegram. `legs` is when each packet sets off, in timeline
    // seconds, and the timeline's own clock drives every state below - scroll
    // progress runs ahead of a scrubbed timeline, so MISO would step forward
    // before the packet reached her.
    const stage = $(".stage"), caps = $$(".orch__captions li");
    $$(".stage .wire").forEach((w) => { const L = w.getTotalLength(); w.style.strokeDasharray = L; w.style.strokeDashoffset = L; });
    const packets = $$(".packet").map((el) => ({ el, path: document.getElementById(el.dataset.path), p: { t: 0 } }));
    const place = (pk) => { const L = pk.path.getTotalLength(), pt = pk.path.getPointAtLength(pk.p.t * L), r = stage.clientWidth / 1200; gsap.set(pk.el, { x: pt.x * r, y: pt.y * r }); };
    const legs = [0, 1, 2, 3, 3.8, 4.6], LEG = 0.8;
    const orch = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: () => {
        const t = orch.time(), k = t < 1 ? 0 : t < 2 ? 1 : t < 3 ? 2 : 3;
        caps.forEach((c, i) => c.classList.toggle("is-on", i === k));
        stage.dataset.step = k;
        stage.dataset.pick = t >= legs[1] + LEG ? "miso" : "";
        stage.dataset.tool = t >= legs[3] && t < legs[5] ? "on" : "";
      },
      scrollTrigger: { trigger: ".orch__pin", start: "top top", end: "+=300%", pin: true, scrub: 0.5 }
    });
    packets.forEach((pk, i) => {
      const at = legs[i];
      orch.to(pk.path, { strokeDashoffset: 0, duration: LEG }, at)
        .fromTo(pk.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, at)
        .to(pk.p, { t: 1, duration: LEG, onUpdate: () => place(pk) }, at)
        .to(pk.el, { autoAlpha: 0, duration: 0.08 }, at + LEG);
    });
    orch.to({}, { duration: 0.3 });
    stage.dataset.step = 0;

    // daily rhythm: equal scroll per stop. setStop swings the hand, so this only
    // has to say which stop we are on.
    ScrollTrigger.create({
      trigger: ".rhythm__pin", start: "top top", end: "+=" + R.length * 45 + "%", pin: true,
      onUpdate: (s) => setStop(Math.min(R.length - 1, Math.floor(s.progress * R.length)))
    });

    // build loop: the ring fills, a runner laps it, nodes light up · parked
    const fill = $(".cycle__fill"), cnodes = $$(".cnode");
    if (fill) {
      const C = 2 * Math.PI * 240;
      gsap.set(fill, { strokeDasharray: C, strokeDashoffset: C });
      gsap.timeline({
        scrollTrigger: { trigger: ".cycle", start: "center center", end: "+=150%", pin: true, scrub: 0.6,
          onUpdate: (s) => cnodes.forEach((n, i) => n.classList.toggle("is-on", s.progress >= i / 5 - 0.001)) }
      }).to(fill, { strokeDashoffset: 0, ease: "none" }, 0).to(".cycle__runner", { rotation: 360, ease: "none" }, 0);
    }

    // the frontend chat plays itself, but only while the section is on screen
    ScrollTrigger.create({ trigger: ".front", start: "top 75%", end: "bottom 25%",
      onToggle: (s) => { stopAuto(); if (s.isActive) autoT = setTimeout(advance, 900); } });
    $(".cases").addEventListener("pointerleave", resumeAuto);
    return () => { $(".cases").removeEventListener("pointerleave", resumeAuto); stopAuto(); };
  });

  // ---------- small screens or reduced motion: same stories, no pinning ----------
  mm.add("(max-width: 900px), (prefers-reduced-motion: reduce)", () => {
    $$(".cnode").forEach((n) => n.classList.add("is-on"));
    $$(".orch__captions li").forEach((c) => c.classList.add("is-on"));
    $(".stage").dataset.step = "all";
    $(".stage").dataset.pick = "miso";
    rItems.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: "top 70%", end: "bottom 70%", onToggle: (s) => s.isActive && setStop(i) }));
    // no autoplay on touch or under reduced motion: each job drives the phone as it scrolls past
    stopAuto();
    cases.forEach((c, i) => ScrollTrigger.create({ trigger: c, start: "top 65%", end: "bottom 65%", onToggle: (s) => s.isActive && setCase(i) }));
  });

  // ---------- 06 · GTAmex ----------
  // The drone intro and the clips play only while on screen (the clips are
  // preload="none", so they cost nothing until you reach them). Under reduced
  // motion none plays by itself: hovering one plays it.
  const gtaVids = $$(".gta video");
  if (!reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { rootMargin: "100px 0px" });
    gtaVids.forEach((v) => io.observe(v));
  } else gtaVids.forEach((v) => {
    const t = v.closest(".tile, .gta__flight");
    t.addEventListener("pointerenter", () => v.play().catch(() => {}));
    t.addEventListener("pointerleave", () => v.pause());
  });
  // the flight's timecode and progress bar follow the video, and its glow is the
  // video itself: each timeupdate (~4 a second) draws the frame onto a 32×16 canvas
  // that CSS blurs into light behind the screen. The poster stands in until it plays.
  const drone = $(".gta__drone"), tc = $(".gta__tc"), bar = $(".gta__bar"), glow = $(".gta__glow"), gx = glow.getContext("2d");
  const paint = (src) => { try { gx.drawImage(src, 0, 0, glow.width, glow.height); } catch {} };
  const poster = new Image(); poster.onload = () => paint(poster); poster.src = drone.poster;
  drone.addEventListener("timeupdate", () => {
    const t = Math.floor(drone.currentTime);
    tc.textContent = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    bar.style.setProperty("--p", drone.duration ? drone.currentTime / drone.duration : 0);
    if (drone.readyState >= 2) paint(drone);
  });
  // the HUD fills as the grid scrolls past: a star per fifth, cash up to a million,
  // and the stars go to sirens at five
  const stars = $$(".gta__stars i"), starRow = $(".gta__stars"), cash = $(".gta__cash span");
  const setHud = (s) => {
    const n = Math.min(5, Math.floor(s.progress * 6));
    stars.forEach((st, i) => st.classList.toggle("is-on", i < n));
    starRow.classList.toggle("is-max", n === 5);
    cash.textContent = String(Math.round(s.progress * 1e6)).padStart(8, "0");
  };
  ScrollTrigger.create({ trigger: ".gta__grid", start: "top 80%", end: "bottom 70%", onUpdate: setHud, onRefresh: setHud });

  refreshAll();
  addEventListener("load", refreshAll);

  // ScrollTrigger measures the page once and then trusts it. Anything that grows
  // afterwards — a lazy image with no reserved size, a font that swaps in late —
  // pushes the pinned sections down while their starts stay where they were, and
  // the panel snaps on the way in because the pin engages against a layout that no
  // longer exists. That is exactly what the setup's Skills shot did (0 → ~400px,
  // just above section 03). The shot now reserves its box, and this catches the
  // next one: when the page's height really changes, measure again. It compares
  // against the height ScrollTrigger last settled on, so a refresh — which pulls
  // the pin spacers out and puts them back — can't set off another.
  let settled = 0, again = 0;
  ScrollTrigger.addEventListener("refresh", () => (settled = document.documentElement.scrollHeight));
  new ResizeObserver(() => {
    if (!settled || Math.abs(document.documentElement.scrollHeight - settled) < 2) return;
    clearTimeout(again); again = setTimeout(refreshAll, 150);
  }).observe($("main"));
})();
