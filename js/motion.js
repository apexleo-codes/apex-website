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
      .from(".hero__lion", { scale: 0.55, autoAlpha: 0, duration: 1.3, ease: "expo.out" }, "-=1.2")
      .from(".orbit__item", { autoAlpha: 0, duration: 0.6, stagger: 0.07 }, "-=1")
      .from(".nav, .hero__scroll, .hero__handle", { autoAlpha: 0, duration: 0.8 }, "-=.9")
      .add(countUp, "-=1");
  }
  const finishLoad = () => { document.body.classList.remove("is-loading"); lenis && lenis.start(); refreshAll(); };
  const loader = $(".loader");
  if (reduce) { loader.remove(); finishLoad(); countUp(true); }
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
  const screens = $$(".phone__screen .screen"), tsteps = $$(".tstep");
  tsteps.forEach((st, i) => ScrollTrigger.create({
    trigger: st, start: "top 62%", end: "bottom 62%",
    onToggle: (s) => { if (!s.isActive) return; tsteps.forEach((x, k) => x.classList.toggle("is-on", k === i)); screens.forEach((x, k) => x.classList.toggle("is-on", k === i)); }
  }));
  const shotBox = $(".skillx__shot");
  shotBox.dataset.hl = "1";
  $$(".skillnote").forEach((b) => {
    const on = () => { $$(".skillnote").forEach((x) => x.classList.toggle("is-on", x === b)); shotBox.dataset.hl = b.dataset.hl; };
    ["pointerenter", "focus", "click"].forEach((ev) => b.addEventListener(ev, on));
  });
  // autopilot: a row and its marker on the screenshot light up together
  const autoRows = $$(".auto__rows li"), autoMarks = $$(".auto__marks .mk");
  const setAuto = (i) => { autoRows.forEach((r, k) => r.classList.toggle("is-on", k === i)); autoMarks.forEach((m, k) => m.classList.toggle("is-on", k === i)); };
  autoRows.forEach((r, i) => { ["pointerenter", "focus"].forEach((ev) => r.addEventListener(ev, () => setAuto(i))); });
  autoMarks.forEach((m, i) => m.addEventListener("pointerenter", () => setAuto(i)));
  setAuto(0);

  // rhythm stop display (the dial on desktop, the list on small screens)
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
    const hv = $(".hero__visual");
    const hx = gsap.quickTo(hv, "x", { duration: 1.2, ease: "power3" }), hy = gsap.quickTo(hv, "y", { duration: 1.2, ease: "power3" });
    const onMove = (e) => { hx((e.clientX / innerWidth - 0.5) * 40); hy((e.clientY / innerHeight - 0.5) * 40); };
    $(".hero").addEventListener("pointermove", onMove);
    gsap.to(".hero__copy", { yPercent: -14, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__lion", { scale: 1.18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // marquee speeds up and leans with scroll velocity
    const loopTween = gsap.to(".marquee__track", { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    const skewTo = gsap.quickTo(".marquee__track span", "skewX", { duration: 0.4, ease: "power3" });
    ScrollTrigger.create({ onUpdate: (s) => { const v = s.getVelocity(); gsap.to(loopTween, { timeScale: 1 + Math.min(Math.abs(v) / 500, 5), duration: 0.3, overwrite: true }); skewTo(gsap.utils.clamp(-14, 14, -v / 140)); } });
    const settle = () => { gsap.to(loopTween, { timeScale: 1, duration: 0.8 }); skewTo(0); };
    ScrollTrigger.addEventListener("scrollEnd", settle);

    // the idea: the line lights up as you read
    const words = $(".words");
    words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.fromTo(".words .w", { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: words, start: "top 85%", end: "bottom 55%", scrub: true } });

    // headings and blocks rise in
    const risers = $$(".section .big, .roles .role, .job, .dash__shot, .dash__parts li, .flowstrip, .skillx, .auto__shot, .auto__rows li, .auto__why, .model, .tool, .backups, .task__notes > *");
    gsap.set(risers, { y: 60, autoAlpha: 0 });
    ScrollTrigger.batch(risers, { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }) });

    // job list: avatar follows the pointer
    const float = $(".jobs__float");
    if (fine) {
      const fx = gsap.quickTo(float, "x", { duration: 0.6, ease: "power3" }), fy = gsap.quickTo(float, "y", { duration: 0.6, ease: "power3" });
      const list = $(".jobs");
      list.addEventListener("pointermove", (e) => { fx(e.clientX); fy(e.clientY); });
      $$(".job").forEach((j) => j.addEventListener("pointerenter", () => { float.src = `img/agent-${j.dataset.img}.webp`; gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power3.out" }); }));
      list.addEventListener("pointerleave", () => gsap.to(float, { autoAlpha: 0, scale: 0.5, duration: 0.35 }));
    }

    // journey flow: the line draws, nodes arrive in order
    const flowPath = $(".flow__line path");
    gsap.fromTo(flowPath, { strokeDasharray: 960, strokeDashoffset: 960 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".flow", start: "top 80%", end: "bottom 50%", scrub: true } });
    gsap.from(".fnode", { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.14, scrollTrigger: { trigger: ".flow", start: "top 78%" } });

    // autopilot: markers pop onto the screenshot one by one
    gsap.from(".auto__marks .mk", { scale: 0, autoAlpha: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.12, scrollTrigger: { trigger: ".auto__shot", start: "top 70%" } });

    // thank you
    gsap.from(".thanks__word > *", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".thanks", start: "top 75%" } });
    gsap.from(".thanks__lion", { rotate: -25, scale: 0.4, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".thanks", start: "top 70%" } });

    return () => { $(".hero").removeEventListener("pointermove", onMove); ScrollTrigger.removeEventListener("scrollEnd", settle); };
  });

  // ---------- pinned scroll stories (desktop) ----------
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    // orchestra: messages travel along the wires
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
  });

  // ---------- small screens or reduced motion: same stories, no pinning ----------
  mm.add("(max-width: 900px), (prefers-reduced-motion: reduce)", () => {
    $$(".cnode").forEach((n) => n.classList.add("is-on"));
    $$(".orch__captions li").forEach((c) => c.classList.add("is-on"));
    $(".stage").dataset.step = "all";
    rItems.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: "top 70%", end: "bottom 70%", onToggle: (s) => s.isActive && setStop(i) }));
    autoRows.forEach((r, i) => ScrollTrigger.create({ trigger: r, start: "top 70%", end: "bottom 70%", onToggle: (s) => s.isActive && setAuto(i) }));
  });

  refreshAll();
  addEventListener("load", refreshAll);
})();
