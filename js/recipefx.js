/* 04 · Sunday recipe → grocery cart, as it happens: beside the steps, a few thousand
   points of light hold the shape of the step you are reading and pour into the next
   one as it arrives - a steaming bowl (MISO writes the recipe) → a full cart (a
   script shops) → Telegram (you get the result) → a shield (the guardrail: AI
   never checks out). The heading's arrow, made literal.

   The points are js/morph.js. The canvas is sticky in the steps' column, level with
   the phone, and takes no room (a negative margin), so nothing above the pins
   changes height. It is desktop only: it needs the room to the right of the words,
   and on a phone the steps are the whole width. */
(() => {
  const sec = document.querySelector(".task"), canvas = sec && sec.querySelector(".task__gl");
  if (!canvas || !window.APEXMorph || !matchMedia("(min-width: 1180px)").matches) return;
  const CREAM = [0.925, 0.898, 0.839], GOLD = [0.914, 0.678, 0.31], MINT = [0.447, 0.82, 0.682];
  const steps = [...sec.querySelectorAll(".tstep")], anchors = [...steps.slice(1), sec.querySelector(".guardcard")];

  // how far the words reach, so the emblem stands in the room to their right
  const textRight = () => {
    const c = canvas.getBoundingClientRect();
    let r = 0;
    sec.querySelectorAll(".tstep h3, .tstep p").forEach((el) => { const g = document.createRange(); g.selectNodeContents(el); r = Math.max(r, g.getBoundingClientRect().right - c.left); });
    sec.querySelectorAll(".task__notes > *").forEach((el) => { r = Math.max(r, el.getBoundingClientRect().right - c.left); });
    return r;
  };
  const scene = APEXMorph.create({
    canvas, n: 5200, burst: 0.8,
    frame: (W, H) => {
      const x0 = textRight() + 40, s = Math.max(10, Math.min(H * 0.2, (W - x0) / 2.1));
      // too little room beside the words, and it stays out rather than crowd them
      canvas.classList.toggle("is-on", s >= 70);
      return { s, cx: (x0 + W) / 2, cy: H / 2 };
    },
    forms: [
      // 0 · the recipe: a bowl of porridge, steaming
      (K, n) => {
        const bowl = K.sample(Math.round(n * 0.42), (x) => {
          x.strokeStyle = "#fff"; x.lineWidth = 7; x.lineCap = "round";
          x.beginPath(); x.ellipse(300, 215, 165, 34, 0, 0, Math.PI * 2); x.stroke();
          x.beginPath(); x.ellipse(300, 215, 165, 125, 0, 0, Math.PI); x.stroke();
          x.beginPath(); x.moveTo(250, 352); x.lineTo(350, 352); x.stroke();
        });
        const food = K.sample(Math.round(n * 0.3), (x) => {
          x.fillStyle = "#f08a3c"; x.beginPath(); x.ellipse(300, 219, 150, 25, 0, 0, Math.PI * 2); x.fill();
          x.fillStyle = "#e9ad4f"; [[250, 214], [320, 222], [362, 212], [292, 208]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 9, 0, 7); x.fill(); });
        });
        // steam: each point rises a little way off the bowl and fades, over and over
        const steam = K.sample(n - bowl.length - food.length, (x) => {
          x.strokeStyle = "#fff"; x.lineWidth = 8; x.lineCap = "round";
          [240, 300, 360].forEach((a, i) => { x.beginPath(); x.moveTo(a, 180); x.bezierCurveTo(a - 30, 140 - i * 6, a + 30, 100, a, 40 + i * 8); x.stroke(); });
        });
        return [...K.paint(bowl, CREAM, { a: 0.85 }), ...food.map((p) => ({ ...p, a: 0.95, m: 3 })),
                ...K.paint(steam, CREAM, { a: 0.55 }).map((p) => ({ ...p, m: 2, o1: p.x, o2: p.y - 0.45 }))];
      },
      // 1 · the cart, filled: the page's own cart icon with the groceries in it
      (K, n) => {
        const at = (x) => { x.translate(300 - 11.75 * 21, 200 - 12.4 * 21); x.scale(21, 21); x.lineJoin = x.lineCap = "round"; };
        const cart = K.sample(Math.round(n * 0.55), (x) => {
          at(x); x.strokeStyle = "#fff"; x.lineWidth = 1.05;
          x.stroke(new Path2D("M3 4h2.5l2.2 11h10.6L20.5 8H7")); x.stroke(new Path2D("M8.2 15l-.9 2.4h11"));
          x.fillStyle = "#fff"; [9.5, 17].forEach((c) => { x.beginPath(); x.arc(c, 19.5, 1.3, 0, 7); x.fill(); });
        });
        const items = K.sample(n - cart.length, (x) => {
          at(x);
          x.fillStyle = "#72d1ae"; x.beginPath(); x.ellipse(10.2, 8.2, 1.7, 2.8, -0.5, 0, 7); x.fill();      // greens
          x.fillStyle = "#f08a3c"; x.beginPath(); x.arc(13.6, 8.6, 2.1, 0, 7); x.fill();                  // fruit
          x.fillStyle = "#e9ad4f"; x.fillRect(15.9, 5.6, 2.6, 5.4);                                        // a pack
          x.fillStyle = "#ece5d6"; x.beginPath(); x.arc(12, 11.8, 1.3, 0, 7); x.fill();
        });
        return [...K.paint(cart, CREAM, { a: 0.9 }), ...items.map((p) => ({ ...p, a: 0.95, m: 3 }))];
      },
      // 2 · the result, on Telegram: its plane inside its ring
      (K, n) => {
        const at = (x) => { x.translate(300 - 12 * 15, 200 - 12 * 15); x.scale(15, 15); };
        const ring = K.sample(Math.round(n * 0.4), (x) => { at(x); x.strokeStyle = "#fff"; x.lineWidth = 0.7; x.beginPath(); x.arc(12, 12, 11.4, 0, 7); x.stroke(); });
        const plane = K.sample(n - ring.length, (x) => {
          at(x); x.translate(12, 12); x.scale(0.78, 0.78); x.translate(-12, -12); x.fillStyle = "#fff";
          x.fill(new Path2D("M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"));
        });
        return [...K.paint(ring, K.hex("#2aabee"), { a: 0.9, m: 3 }), ...K.paint(plane, CREAM, { a: 0.75 })];
      },
      // 3 · the guardrail: the page's shield, with its tick, a ripple going out from it
      (K, n) => {
        const at = (x, W, H) => { const k = (H * 0.8) / 18; x.translate(W / 2 - 12 * k, H / 2 - 12 * k); x.scale(k, k); x.lineJoin = x.lineCap = "round"; };
        const P = "M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z";
        const rim = K.sample(Math.round(n * 0.52), (x, W, H) => { at(x, W, H); x.strokeStyle = "#fff"; x.lineWidth = 0.95; x.stroke(new Path2D(P)); });
        const tick = K.sample(Math.round(n * 0.24), (x, W, H) => { at(x, W, H); x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke(new Path2D("M9 12l2 2 4-4")); });
        const body = K.sample(n - rim.length - tick.length, (x, W, H) => { at(x, W, H); x.fillStyle = "#fff"; x.fill(new Path2D(P)); });
        return [...K.paint(rim, MINT, { a: 0.95, m: 6 }), ...K.paint(tick, GOLD, { a: 0.95, m: 6 }), ...K.paint(body, MINT, { a: 0.16, m: 6 })];
      },
    ],
  });
  if (!scene.gl) return;

  // Scroll picks the shape: each one pours into the next while the step that brings
  // it climbs from 80% to 50% of the screen - across the line (62%) where the step
  // lights up and the phone changes screen - and holds in between. Page positions
  // from the layout, not the box: the guard card rises in on a GSAP transform.
  const top = (el) => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
  let tops = [];
  const follow = () => {
    const vh = innerHeight;
    scene.to(tops.reduce((p, t) => p + Math.min(1, Math.max(0, (scrollY + 0.8 * vh - t) / (0.3 * vh))), 0));
  };
  ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onUpdate: follow,
    onRefresh: () => { tops = anchors.map(top); follow(); } });
})();
