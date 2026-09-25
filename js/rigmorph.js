/* 02 · the setup rig, built out of light. Two moments use js/morph.js's points:

   - Step 01, "give it a body": as the rig comes up the screen, dust gathers and
     pours into the skeleton - the drawing itself arrives under the points as they
     settle, and they fade into it. Done by the time the rig is level with step 01.
   - 02 → 03, the armour: dust in the colours of Telegram, Gmail and GitHub gathers
     onto exactly what changes between the two stages - the face over the skull,
     the chest plate, the belt with its badges - and the new stage lands under it,
     hot, and cools. The parts are the difference between the two drawings,
     measured pixel by pixel, so nothing that stays the same is touched.

   The body is scroll-driven here; the armour is handed its window by paint() in
   motion.js (`suit(f)`, 0..1 over the 02 → 03 window), which also owns the stage
   layers. This file owns only the skeleton image's opacity (`--build` on the rig),
   and only the image inside its layer: the layer is paint()'s. */
(() => {
  const rig = document.querySelector(".rig");
  if (!rig || !window.APEXMorph || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const grid = document.querySelector(".setup__grid");
  const small = matchMedia("(max-width: 900px)").matches;
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  // The art is 900×1125 and sampled at 320×400: 400px is 2 world units, so the
  // image spans x ±0.8, y ±1. His axis is 46.2% across (see rigfx.js).
  const AXIS = (0.462 - 0.5) * 1.6;

  const canvas = (mod) => { const c = document.createElement("canvas"); c.className = `rig__morph rig__morph--${mod}`; c.setAttribute("aria-hidden", "true"); rig.appendChild(c); return c; };
  // the drawing's own box inside the rig (object-fit: contain), in canvas px
  const frame = (c) => () => {
    const r = rig.getBoundingClientRect(), b = c.getBoundingClientRect(), h = Math.min(r.height, r.width * 1.25);
    return { s: h / 2, cx: r.left + r.width / 2 - b.left, cy: r.top + r.height / 2 - b.top };
  };
  const lift = (p, k = 1.15, add = 0.05) => ({ ...p, r: Math.min(1, p.r * k + add), g: Math.min(1, p.g * k + add), b: Math.min(1, p.b * k + add) });
  const flatten = (p) => ({ ...p, z: p.z * 0.3 });   // near-flat, so the points register on the drawing

  // ---------- step 01: the body ----------
  const bodyGl = canvas("body");
  const body = APEXMorph.create({
    canvas: bodyGl, n: small ? 3000 : 5200, sway: false, pointer: false, rate: 6, size: 0.9, seed: 7,
    frame: frame(bodyGl),
    forms: [
      (K, n) => K.scatter(n, { w: 2.1, h: 2.4, d: 1.6, col: [0.95, 0.9, 0.8], a: 0.45 }).map((p) => ({ ...p, x: p.x + AXIS })),
      async (K, n) => { try { return (await K.image("img/apex-rig-1-body.webp", n, 320, 400, 1)).map((p) => flatten(lift(p))); } catch { return []; } },
    ],
    // the points form by 1; past it (to 1.3) the drawing comes up under them and
    // they fade into it
    onFrame: (S) => {
      S.alpha = smooth(S.p / 0.08) * (1 - smooth((S.p - 1) / 0.28));
      rig.style.setProperty("--build", smooth((S.p - 0.86) / 0.3).toFixed(3));
    },
  });
  if (body.gl) {
    // from the rig's top entering the bottom of the screen (95%) to 42% of it,
    // which is where it stands at the setup heading's presenter beat
    let top = 0;
    const follow = () => body.to(Math.min(1.3, Math.max(0, (0.95 * innerHeight - (top - scrollY)) / (0.53 * innerHeight)) * 1.3));
    ScrollTrigger.create({ trigger: grid, start: "top bottom", end: "bottom top", onUpdate: follow,
      onRefresh: () => { top = grid.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(rig).marginTop || 0); follow(); } });
    // until it's built the drawing shows as it always did; once it is, start where
    // the page is (a page opened deep shouldn't replay the assembly on the way back)
    body.built.then(() => { follow(); body.set(body.target); });
  }

  // ---------- 02 → 03: the armour ----------
  // the pixels that differ between stage 2 and stage 3, in stage 3's colours
  const load = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  async function parts(K, n) {
    const [a, b] = await Promise.all([load("img/apex-rig-2-brain.webp"), load("img/apex-rig-3-face.webp")]);
    const W = 320, H = 400, px = (im) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, W, H); return x.getImageData(0, 0, W, H); };
    const A = px(a).data, B = px(b);
    const d = B.data;
    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.abs(d[i] - A[i]) + Math.abs(d[i + 1] - A[i + 1]) + Math.abs(d[i + 2] - A[i + 2]) + Math.abs(d[i + 3] - A[i + 3]);
      if (diff < 90 || d[i + 3] < 128) d[i + 3] = 0;
    }
    return K.sample(n, (x) => x.putImageData(B, 0, 0), W, H, 1).map((p) => ({ ...flatten(lift(p, 1.3, 0.08)), a: 0.95, m: 4 }));
  }
  const suitGl = canvas("suit");
  const BRANDS = ["#2aabee", "#2aabee", "#ea4335", "#fbbc04", "#34a853", "#4285f4", "#eceff1"];
  const suit = APEXMorph.create({
    canvas: suitGl, n: small ? 2600 : 4400, sway: false, pointer: false, rate: 7, size: 0.9, seed: 11,
    frame: frame(suitGl),
    forms: [
      (K, n) => K.scatter(n, { w: 1.9, h: 1.8, d: 1.6, a: 0.6 }).map((p) => { const [r, g, b] = K.hex(BRANDS[Math.floor(K.rnd() * BRANDS.length)]); return { ...p, x: p.x + AXIS, y: p.y + 0.2, r, g, b }; }),
      async (K, n) => { try { return await parts(K, n); } catch { return []; } },
    ],
    onFrame: (S) => { S.alpha = smooth(S.p / 0.1) * (1 - smooth((S.p - 1) / 0.3)); },
  });
  suit.alpha = 0;

  // paint() hands over the 02 → 03 window: 0 before it, 1 once it has closed. The
  // points form by 0.75 of it; the stage lands under them from 0.5 (see paint()).
  window.apexRigMorph = { suit: (f) => suit.gl && suit.to(Math.min(1, Math.max(0, f)) * 1.35) };
})();
