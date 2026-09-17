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

  // ---------- menu, anchors, chapter label, progress ----------
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

  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
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

  // 05 · the tools layer can be switched off when the stage feels busy
  const toolsBtn = $(".orch__toggle"), orchStage = $(".stage");
  toolsBtn.addEventListener("click", () => {
    const on = toolsBtn.getAttribute("aria-pressed") !== "true";
    toolsBtn.setAttribute("aria-pressed", on);
    orchStage.dataset.tools = on ? "on" : "off";
  });

  const shotBox = $(".skillx__shot");
  shotBox.dataset.hl = "1";
  $$(".skillnote").forEach((b) => {
    const on = () => { $$(".skillnote").forEach((x) => x.classList.toggle("is-on", x === b)); shotBox.dataset.hl = b.dataset.hl; };
    ["pointerenter", "focus", "click"].forEach((ev) => b.addEventListener(ev, on));
  });
  // 02 · the setup. The progress bar is the spine running down the step-number
  // gutter: the numbers were already sitting in that column, so the bar costs no
  // layout at all. Step state is a class toggle (kept under reduced motion too -
  // it's information, not decoration); only the fill itself is scrubbed, and CSS
  // parks it at full height when motion is reduced. GSAP owns the fill's scaleY
  // and nothing else - .step's dimming is a CSS opacity transition, so no tween
  // may ever touch its opacity.
  const setupSteps = $$(".setup .step"), setupSegs = $$(".setup__bar i"), rigParts = $$(".rig__part");
  const setStep = (i) => {
    setupSteps.forEach((x, k) => { x.classList.toggle("is-on", k === i); x.classList.toggle("is-past", k < i); });
    setupSegs.forEach((x, k) => x.classList.toggle("is-on", k <= i));
    // Exclusive, NOT cumulative. Each file is already a complete stage of the
    // build (skeleton -> +head -> armoured -> +skills) and the art is transparent,
    // so stacking them would show the skeleton's splayed arms poking out from
    // behind the finished lion. One stage at a time, cross-faded. A layer may name
    // several steps: the armoured stage holds through the soul, whose glow and
    // motes are the only layers that join it.
    rigParts.forEach((p) => p.classList.toggle("is-on", p.dataset.at.split(" ").includes(String(i))));
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

  // rhythm stop display  // rhythm stop display (the dial on desktop, the list on small screens)
  const R = D.rhythm, rhythmSec = $(".rhythm"), timeEl = $(".dial__time"), agentEl = $(".dial__agent"), labelEl = $(".dial__label");
  const rItems = $$(".rhythm__list li"), dots = $$(".stopdot");
  let curStop = -1;
  const setStop = (k, animate = true) => {
    if (k === curStop) return;
    curStop = k;
    const st = R[k];
    timeEl.textContent = st.t; agentEl.src = `img/agent-${st.key}.webp`; labelEl.textContent = st.label;
    rItems.forEach((x, i) => x.classList.toggle("is-on", i === k));
    dots.forEach((d, i) => d.classList.toggle("is-on", i <= k));
    rhythmSec.classList.toggle("is-night", st.night);
    if (animate && !reduce) gsap.fromTo([timeEl, agentEl, labelEl], { y: 16, autoAlpha: 0.2 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.04, overwrite: true });
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

    // journey flow: the line draws, nodes arrive in order
    const flowPath = $(".flow__line path");
    gsap.fromTo(flowPath, { strokeDasharray: 960, strokeDashoffset: 960 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".flow", start: "top 80%", end: "bottom 50%", scrub: true } });
    gsap.from(".fnode", { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.14, scrollTrigger: { trigger: ".flow", start: "top 78%" } });


    // thank you
    gsap.from(".thanks__word > *", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".thanks", start: "top 75%" } });
    gsap.from(".thanks__lion", { rotate: -25, scale: 0.4, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".thanks", start: "top 70%" } });

    return () => ScrollTrigger.removeEventListener("scrollEnd", settle);
  });

  // ---------- pinned scroll stories (desktop) ----------
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    // how they work together: a request travels you → soul → skills → scripts,
    // and the gold one comes back round to you (a reply, or the next schedule)
    const stage = $(".stage"), caps = $$(".orch__captions li");
    $$(".stage .wire").forEach((w) => { const L = w.getTotalLength(); w.style.strokeDasharray = L; w.style.strokeDashoffset = L; });
    const packets = $$(".packet").map((el) => ({ el, path: document.getElementById(el.dataset.path), p: { t: 0 } }));
    const place = (pk) => { const L = pk.path.getTotalLength(), pt = pk.path.getPointAtLength(pk.p.t * L), r = stage.clientWidth / 1200; gsap.set(pk.el, { x: pt.x * r, y: pt.y * r }); };
    const orch = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".orch__pin", start: "top top", end: "+=280%", pin: true, scrub: 0.6,
        onUpdate: (s) => { const k = Math.min(3, Math.floor(s.progress * 4)); caps.forEach((c, i) => c.classList.toggle("is-on", i === k)); stage.dataset.step = k; } }
    });
    packets.forEach((pk, i) => {
      orch.to(pk.path, { strokeDashoffset: 0, duration: 0.9 }, i)
        .fromTo(pk.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, i)
        .to(pk.p, { t: 1, duration: 0.9, onUpdate: () => place(pk) }, i)
        .to(pk.el, { autoAlpha: 0, duration: 0.08 }, i + 0.9);
    });
    orch.to({}, { duration: 0.1 });
    stage.dataset.step = 0;

    // daily rhythm: equal scroll per stop; the hand swings to each stop's hour
    gsap.set(".dial__hand", { rotation: (R[0].h / 24) * 360 });
    ScrollTrigger.create({
      trigger: ".rhythm__pin", start: "top top", end: "+=" + R.length * 45 + "%", pin: true,
      onUpdate: (s) => {
        const k = Math.min(R.length - 1, Math.floor(s.progress * R.length));
        if (k === curStop) return;
        setStop(k);
        gsap.to(".dial__hand", { rotation: (R[k].h / 24) * 360, duration: 0.9, ease: "expo.out", overwrite: true });
      }
    });

    // build loop: the ring fills, a runner laps it, nodes light up
    const fill = $(".cycle__fill"), C = 2 * Math.PI * 240, cnodes = $$(".cnode");
    gsap.set(fill, { strokeDasharray: C, strokeDashoffset: C });
    gsap.timeline({
      scrollTrigger: { trigger: ".cycle", start: "center center", end: "+=150%", pin: true, scrub: 0.6,
        onUpdate: (s) => cnodes.forEach((n, i) => n.classList.toggle("is-on", s.progress >= i / 5 - 0.001)) }
    }).to(fill, { strokeDashoffset: 0, ease: "none" }, 0).to(".cycle__runner", { rotation: 360, ease: "none" }, 0);

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
    rItems.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: "top 70%", end: "bottom 70%", onToggle: (s) => s.isActive && setStop(i) }));
    // no autoplay on touch or under reduced motion: each job drives the phone as it scrolls past
    stopAuto();
    cases.forEach((c, i) => ScrollTrigger.create({ trigger: c, start: "top 65%", end: "bottom 65%", onToggle: (s) => s.isActive && setCase(i) }));
  });

  refreshAll();
  addEventListener("load", refreshAll);
})();
