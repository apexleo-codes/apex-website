/* Thank you: the curtain call as an event. Dust hangs over the empty stage; it
   gathers into APEX, standing on the line his team will stand on; he holds a
   moment, then pours apart into nine halos along that line, and the team steps out
   of the light - APEX in the middle - and takes a bow. Then "Thank you." rises.

   The points are js/morph.js. The formations are laid out from the page: the world
   is centred on APEX's face in the row and one unit is that face's width, so every
   halo lands round its own face at any size (and is laid out again on resize).
   GSAP owns the whole sequence (the scene's position, the figures' entrance, the
   bow on their images, the words) on one timeline; motion.js keeps the old
   entrance for when this can't run (no WebGL, reduced motion). */
(() => {
  const sec = document.querySelector(".outro"), canvas = sec && sec.querySelector(".thanks__gl");
  if (!canvas || !window.APEXMorph || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const D = window.APEX;
  const faces = () => [...sec.querySelectorAll(".bow__m img")];
  // layout boxes, not getBoundingClientRect: GSAP moves the figures and their
  // images, and a halo belongs where the face will stand, not where it is mid-bow
  const at = (el) => {
    let x = el.offsetWidth / 2, y = el.offsetHeight / 2;
    for (let e = el; e && e !== sec; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    return [x, y, el.offsetWidth];
  };
  const lead = () => sec.querySelector(".bow__m--lead img");

  const small = matchMedia("(max-width: 700px)").matches;
  // No sway and no pointer: the faces are DOM and stand still, so a scene turning
  // in 3D would carry the halos off them - most at the ends of the row, where the
  // turn moves points furthest (FORGE's sat low and COLONY's outside it).
  const scene = APEXMorph.create({
    canvas, n: small ? 4000 : 7600, rate: Infinity, pointer: false, sway: false, size: small ? 0.85 : 1,
    frame: () => { const [x, y, w] = at(lead()); return { s: w || 100, cx: x, cy: y }; },
    forms: [
      // 0 · dust over the empty stage
      (K, n, S) => K.scatter(n, { w: (S.W / S.s) * 0.9, h: (S.H / S.s) * 0.8, d: 2, a: 0.5 })
        .map((p) => ({ ...p, x: p.x + (S.W / 2 - S.cx) / S.s, y: p.y + (S.cy - S.H / 2) / S.s })),
      // 1 · APEX, off the setup rig's last stage in his own colours, feet on the row's
      // floor. The art's axis is 46.2% across, its feet 90.7% down, its crown 14.7%.
      async (K, n) => {
        const L = small ? 2.6 : 3, k = L / (0.814 + 0.706), base = floorY();
        let pts = [];
        try { pts = await K.image("img/apex-rig-5-alive.webp", Math.round(n * 0.9), 320, 400, 1); } catch {}
        const lion = pts.map((p) => ({ ...p, x: (p.x + 0.076) * k, y: (p.y + 0.814) * k + base, z: p.z * 2,
          ...lift(p), a: 0.95, m: 4 }));
        return [...lion, ...floor(K, n - lion.length)];
      },
      // 2 · the team: a halo round every face, in its colour, and the floor they stand on
      (K, n, S) => {
        const out = [], imgs = faces(), [cx, cy] = [S.cx, S.cy];
        const share = (i) => (imgs[i].closest(".bow__m--lead") ? 0.2 : 0.075);
        imgs.forEach((im, i) => {
          const [x, y, w] = at(im), c = K.hex(getComputedStyle(im.parentNode).getPropertyValue("--c").trim() || "#e9ad4f");
          const X = (x - cx) / S.s, Y = (cy - y) / S.s, r = w / 2 / S.s;
          for (let j = Math.round(n * share(i)); j > 0; j--)
            out.push({ x: X, y: Y, z: 0, r: c[0], g: c[1], b: c[2], a: 0.9, m: 1, o1: r * (1.06 + 0.32 * Math.sqrt(K.rnd())), o2: K.rnd() * 6.283 });
        });
        out.push(...floor(K, Math.round(n * 0.1)));
        return [...out, ...K.scatter(n - out.length, { w: (S.W / S.s) * 0.9, h: (S.H / S.s) * 0.7, d: 2, a: 0.16 })
          .map((p) => ({ ...p, x: p.x + (S.W / 2 - S.cx) / S.s, y: p.y + (S.cy - S.H / 2) / S.s }))];
      },
    ],
  });
  // the rig art's armour is near-black teal: as points of light it would vanish,
  // so every colour is lifted towards warm light, the darkest the most
  const lift = ({ r, g, b }) => { const l = 0.3 * r + 0.59 * g + 0.11 * b, k = Math.max(0, 0.5 - l);
    return { r: Math.min(1, r * 1.35 + k * 1.1 + 0.08), g: Math.min(1, g * 1.35 + k * 0.95 + 0.08), b: Math.min(1, b * 1.35 + k * 0.75 + 0.06) }; };
  const floorY = () => { const fig = lead().parentNode, [, fy] = at(fig), [, cy, w] = at(lead()); return -(fy + fig.offsetHeight / 2 - cy) / w; };
  // the stage's front edge, under the row: faint gold, twinkling, widest in the middle
  function floor(K, n) {
    const imgs = faces(), [x0] = at(imgs[0]), [x1] = at(imgs[imgs.length - 1]), [cx, cy, w] = at(lead());
    const y = floorY() - 8 / w;   // just under the names
    const half = Math.max(Math.abs(x0 - cx), Math.abs(x1 - cx)) / w + 0.9, gold = K.hex("#e9ad4f");
    return Array.from({ length: n }, () => {
      const u = (K.rnd() * 2 - 1) * Math.sqrt(K.rnd());
      return { x: u * half, y: y - K.rnd() * 0.02, z: (K.rnd() - 0.5) * 0.5, r: gold[0], g: gold[1], b: gold[2], a: 0.55 * (1 - Math.abs(u) * 0.7), m: 3 };
    });
  }
  if (!scene.gl) return;

  let t = 0;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { scene.reform(0); scene.reform(1); scene.reform(2); }, 200); });

  // the sequence, played once when the row comes up the screen
  const words = sec.querySelectorAll(".thanks__word > *");
  gsap.set(".bow__m", { autoAlpha: 0 });
  gsap.set(words, { yPercent: 110 });
  const tl = gsap.timeline({ paused: true })
    .to(scene, { target: 1, duration: 1.6, ease: "power1.inOut" })                    // the dust gathers into him
    .to(scene, { target: 2, duration: 1.4, ease: "power1.inOut" }, "+=1")             // he pours into his team
    .fromTo(".bow__m", { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(1.7)", stagger: { each: 0.06, from: "center" } }, "-=.5")
    .to(".bow__m img", { y: 9, rotation: (i) => (i < 4 ? 7 : i > 4 ? -7 : 0), duration: 0.32, ease: "power2.inOut", yoyo: true, repeat: 1, stagger: { each: 0.06, from: "center" } }, "-=.25")
    .to(words, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.1 }, "<");
  // lay the halos out from the row as it is now, whatever loaded since the build
  ScrollTrigger.create({ trigger: ".bow", start: "top 78%", once: true, onEnter: () => { scene.reform(1); scene.reform(2); tl.play(); } });

  window.apexFinale = { scene, tl };
})();
