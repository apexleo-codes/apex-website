/* The big idea: what makes APEX an agent and not a chatbot, in four beats, told by
   a few thousand points of light that re-form for each one — a question waiting in
   a chat bubble, APEX himself, the team round him, and the shield that keeps the
   big calls with me.

   Raw WebGL, no library. Every point carries its place in ALL FOUR formations, and
   the vertex shader moves it between them, so a frame costs the CPU a handful of
   uniforms however many points there are. Scroll says which formation; time does
   the rest (the drift, the halos orbiting each agent, the work streaming out of
   APEX along the spokes).

   The scene is a sticky stage inside a tall section, not a ScrollTrigger pin: sticky
   adds no pin-spacer and never changes the page's height after ScrollTrigger has
   measured it, so the pins further down (03, 05) can't be knocked off by it (see
   "How sections move" in the README). It is the same on a phone as on a desktop. */
(() => {
  const sec = document.querySelector(".idea");
  if (!sec) return;
  const $ = (s, r = sec) => r.querySelector(s);
  const $$ = (s, r = sec) => [...r.querySelectorAll(s)];
  const D = window.APEX;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = $(".idea__stage"), canvas = $(".idea__gl"), beats = $$(".idea__beat"), ticks = $$(".idea__ticks i");
  const agents = $$(".idea__agent");

  // ---------- the story's clock ----------
  // Scroll progress through the section -> which formation (0..3). Each formation
  // HOLDS long enough to read its line, and the morphs sit between the holds.
  // Exported as `holds` so presenter mode can stop on each one.
  const KEYS = [[0, 0], [0.12, 0], [0.29, 1], [0.41, 1], [0.59, 2], [0.71, 2], [0.88, 3], [1, 3]];
  const toBeat = (u) => {
    for (let i = 1; i < KEYS.length; i++) {
      const [u0, b0] = KEYS[i - 1], [u1, b1] = KEYS[i];
      if (u <= u1) return b0 + (b1 - b0) * ((u - u0) / (u1 - u0 || 1));
    }
    return 3;
  };
  const holds = [0.06, 0.35, 0.65, 0.94];

  let target = 0, cur = 0, shown = -1;
  const setBeat = (k) => {
    if (k === shown) return;
    shown = k;
    beats.forEach((b, i) => { b.classList.toggle("is-on", i === k); b.classList.toggle("is-past", i < k); });
    ticks.forEach((t, i) => t.classList.toggle("is-on", i <= k));
    stage.dataset.beat = k;
  };
  setBeat(0);

  // ---------- where the agents sit (formation 2) ----------
  // APEX at the centre, the seven specialists on a ring round him, top first and
  // clockwise in the team's own order. World units: the stage is 2 units tall.
  const ring = D.team.filter((t) => t.key !== "apex" && t.key !== "colony");
  const R = 0.84;
  const spots = { apex: [0, 0] };
  ring.forEach((t, i) => { const a = -Math.PI / 2 + (i / ring.length) * Math.PI * 2; spots[t.key] = [Math.cos(a) * R, -Math.sin(a) * R]; });

  // ---------- no WebGL: the lines and the team still work ----------
  const flat = () => {
    sec.classList.add("idea--flat");
    let u = 0;
    ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom",
      onUpdate: (s) => { u = s.progress; setBeat(Math.round(toBeat(u))); } });
  };

  // low-power: a few thousand points need nothing more, and on a MacBook with two
  // GPUs asking for the big one switches GPUs, which is exactly what drops contexts
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) { flat(); return; }

  // seeded, so the scene looks the same on every load
  let seed = 20260924;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const small = matchMedia("(max-width: 700px)").matches;
  const N = small ? 4200 : 7000;

  // Draw a shape on a scratch canvas and take n points off its painted pixels, with
  // the pixel's colour. H px of the scratch canvas is 2 world units, so y runs -1..1.
  // getImageData throws on a tainted canvas (a file:// page drawing an image), so a
  // caller that draws an image has a fallback.
  function sample(n, draw, W = 600, H = 400, scale = 1) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true });
    draw(x, W, H);
    const px = x.getImageData(0, 0, W, H).data, hits = [];
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) if (px[(y * W + i) * 4 + 3] > 120) hits.push(y * W + i);
    const out = [];
    if (!hits.length) return out;
    for (let j = 0; j < n; j++) {
      const k = hits[Math.floor(rnd() * hits.length)], i = k % W, y = (k / W) | 0;
      out.push({ x: ((i + rnd() - W / 2) / (H / 2)) * scale, y: (-(y + rnd() - H / 2) / (H / 2)) * scale, z: (rnd() - 0.5) * 0.14,
                 r: px[k * 4] / 255, g: px[k * 4 + 1] / 255, b: px[k * 4 + 2] / 255 });
    }
    return out;
  }
  const fill = (list, n, make) => { while (list.length < n) list.push(make()); return list.slice(0, n); };

  // 0 · "Most AI waits for a question": a chat bubble with a question mark in it
  function bubble() {
    const rim = sample(Math.round(N * 0.6), (x, W, H) => {
      const w = W * 0.74, h = H * 0.56, l = (W - w) / 2, t = H * 0.16, r = H * 0.11;
      x.strokeStyle = "#fff"; x.lineWidth = H * 0.02; x.lineJoin = "round";
      x.beginPath();
      x.moveTo(l + r, t); x.lineTo(l + w - r, t); x.quadraticCurveTo(l + w, t, l + w, t + r);
      x.lineTo(l + w, t + h - r); x.quadraticCurveTo(l + w, t + h, l + w - r, t + h);
      x.lineTo(l + w * 0.3, t + h); x.lineTo(l + w * 0.16, t + h + H * 0.13); x.lineTo(l + w * 0.18, t + h);
      x.lineTo(l + r, t + h); x.quadraticCurveTo(l, t + h, l, t + h - r);
      x.lineTo(l, t + r); x.quadraticCurveTo(l, t, l + r, t); x.closePath(); x.stroke();
    });
    const mark = sample(N - rim.length, (x, W, H) => {
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = `italic 400 ${H * 0.5}px "Instrument Serif", Georgia, serif`;
      x.fillText("?", W / 2, H * 0.45);
    });
    return [...rim.map((p) => ({ ...p, k: 0 })), ...mark.map((p) => ({ ...p, k: 1 }))];
  }

  // 1 · "APEX doesn't wait": APEX himself, off the setup rig's last stage, in his
  // own colours. Falls back to the wordmark if the image can't be read.
  async function lion() {
    const im = new Image(); im.src = "img/apex-rig-5-alive.webp";
    try {
      // the load event, not im.decode(): decode() never settles while the page is
      // hidden, so a link opened in a background tab would sit unbuilt until viewed
      await new Promise((ok, no) => (im.complete && im.naturalWidth ? ok() : ((im.onload = ok), (im.onerror = no))));
      // the art's alpha is the silhouette; points land on it, coloured by the art
      const pts = sample(N, (x, W, H) => x.drawImage(im, 0, 0, W, H), 320, 400, 1.3);
      if (pts.length) return pts;
    } catch {}
    return sample(N, (x, W, H) => {
      x.fillStyle = "#e9ad4f"; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = `800 ${H * 0.34}px "Bricolage Grotesque", sans-serif`; x.fillText("APEX", W / 2, H / 2);
    });
  }

  // 2 · "One lead, seven specialists": a halo of points orbiting each agent, and
  // spokes from APEX out to every one of them that the work streams along
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  function team() {
    const out = [];
    const apexN = Math.round(N * 0.17), spokeN = Math.round(N * 0.2), each = Math.floor((N - apexN - spokeN) / ring.length);
    const halo = (key, n, r0, r1) => {
      const [cx, cy] = spots[key], [r, g, b] = hex(D.team.find((t) => t.key === key).color);
      for (let i = 0; i < n; i++) out.push({ x: cx, y: cy, z: 0, r, g, b, s: 0, orb: [r0 + (r1 - r0) * Math.sqrt(rnd()), rnd() * Math.PI * 2] });
    };
    halo("apex", apexN, 0.19, 0.34);
    ring.forEach((t) => halo(t.key, each, 0.1, 0.17));
    const gold = hex("#e9ad4f");
    while (out.length < N) {
      const t = ring[out.length % ring.length], [x, y] = spots[t.key];
      out.push({ x, y, z: 0, r: gold[0], g: gold[1], b: gold[2], s: 1, orb: [0, 0] });
    }
    return out;
  }

  // 3 · "The big calls stay mine": the page's own shield icon, with its tick
  function shield() {
    const s = (H) => (H * 0.84) / 18;                    // the path spans y 3..21 of its 24 grid
    const at = (x, W, H) => { const k = s(H); x.translate(W / 2 - 12 * k, H / 2 - 12 * k); x.scale(k, k); x.lineJoin = x.lineCap = "round"; };
    const rim = sample(Math.round(N * 0.52), (x, W, H) => { at(x, W, H); x.strokeStyle = "#fff"; x.lineWidth = 0.95; x.stroke(new Path2D("M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z")); });
    const tick = sample(Math.round(N * 0.24), (x, W, H) => { at(x, W, H); x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke(new Path2D("M9 12l2 2 4-4")); });
    const body = sample(N - rim.length - tick.length, (x, W, H) => { at(x, W, H); x.fillStyle = "#fff"; x.fill(new Path2D("M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z")); });
    return [...rim.map((p) => ({ ...p, k: 0 })), ...tick.map((p) => ({ ...p, k: 1 })), ...body.map((p) => ({ ...p, k: 2 }))];
  }

  // ---------- shaders ----------
  const VS = `
  precision highp float;
  attribute vec3 aP0, aP1, aP2, aP3, aCol1, aCol2;
  attribute vec4 aMeta;   // x: the "?" (1) or the bubble (0) · y: a spoke · z: shield rim/tick/body (0/1/2) · w: seed
  attribute vec2 aOrb;    // formation 2: orbit radius and phase round the agent's centre
  uniform float uP, uTime, uDpr, uS, uCam;
  uniform vec2 uRes, uCenter, uRot;
  varying vec3 vCol; varying float vA;
  const vec3 CREAM = vec3(.925, .898, .839), GOLD = vec3(.914, .678, .31), MINT = vec3(.447, .82, .682);
  vec3 pick(float s, vec3 a, vec3 b, vec3 c, vec3 d) { return s < .5 ? a : s < 1.5 ? b : s < 2.5 ? c : d; }
  float pickf(float s, float a, float b, float c, float d) { return s < .5 ? a : s < 1.5 ? b : s < 2.5 ? c : d; }
  void main() {
    float seed = aMeta.w;
    float p = clamp(uP, 0., 3.);
    float seg = min(floor(p), 2.), f = p - seg;
    // staggered: each point sets off at its own moment, so a morph pours rather than jumps
    float t = smoothstep(0., 1., clamp((f - fract(seed * 7.31) * .38) / .62, 0., 1.));

    // formation 2 is alive: halos orbit their agent, spoke points stream out of APEX
    vec3 q2 = aP2;
    float sf = fract(uTime * .14 + seed * 5.3);
    if (aMeta.y > .5) q2 = aP2 * sf;
    else { float a = aOrb.y + uTime * (.22 + fract(seed * 3.3) * .4); q2 += vec3(cos(a) * aOrb.x, sin(a) * aOrb.x * .92, sin(a * 1.7) * aOrb.x * .6); }

    vec3 pos = mix(pick(seg, aP0, aP1, q2, aP3), pick(seg + 1., aP0, aP1, q2, aP3), t);
    // mid-morph the points swirl out and towards you, then settle: a burst, not a slide
    float burst = sin(t * 3.14159);
    float ang = burst * (fract(seed * 5.7) - .5) * 2.4, c = cos(ang), s = sin(ang);
    pos.xy = mat2(c, s, -s, c) * pos.xy;
    pos += normalize(pos + vec3(0., 0., .7)) * burst * (.16 + fract(seed * 11.3) * .55);
    pos += .011 * vec3(sin(uTime * 1.3 + seed * 40.), cos(uTime * 1.1 + seed * 31.), sin(uTime * .9 + seed * 17.));

    float w0 = 1. - clamp(p, 0., 1.), w1 = 1. - min(abs(p - 1.), 1.), w2 = 1. - min(abs(p - 2.), 1.), w3 = clamp(p - 2., 0., 1.);
    vec3 c0 = aMeta.x > .5 ? GOLD : CREAM;
    vec3 c1 = aCol1 * 1.25 + .06;
    vec3 c2 = aCol2;
    vec3 c3 = aMeta.z > .5 && aMeta.z < 1.5 ? GOLD : MINT;
    float a0 = aMeta.x > .5 ? .95 : .5, a1 = .8, a2 = aMeta.y > .5 ? .6 : .95, a3 = aMeta.z > 1.5 ? .16 : .95;
    vCol = mix(pick(seg, c0, c1, c2, c3), pick(seg + 1., c0, c1, c2, c3), t);
    vA = mix(pickf(seg, a0, a1, a2, a3), pickf(seg + 1., a0, a1, a2, a3), t);
    // the question mark breathes while it waits
    vA *= 1. - w0 * aMeta.x * .45 * (.5 + .5 * sin(uTime * 2.2));
    // a band of light climbs APEX, like power coming on
    float band = exp(-pow((pos.y - (mod(uTime * .45, 2.8) - 1.4)) * 5., 2.));
    vCol += w1 * band * .55;
    // the spokes glow brightest halfway out, where the work is in flight
    vA *= mix(1., sin(sf * 3.14159), w2 * aMeta.y);
    // and the shield sends a slow ripple outwards from its tick
    vA *= 1. + w3 * .5 * sin(length(pos.xy) * 9. - uTime * 2.6);

    float cy = cos(uRot.y), sy = sin(uRot.y), cx = cos(uRot.x), sx = sin(uRot.x);
    vec3 r = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
    r = vec3(r.x, r.y * cx - r.z * sx, r.y * sx + r.z * cx);
    float persp = uCam / (uCam - r.z);
    vec2 px = uCenter + vec2(r.x, -r.y) * persp * uS;
    gl_Position = vec4(px / uRes * 2. - 1., 0., 1.);
    gl_Position.y = -gl_Position.y;
    gl_PointSize = (1.6 + fract(seed * 17.9) * 2.6) * persp * uDpr * clamp(uS / 250., .7, 1.25);
  }`;
  const FS = `
  precision mediump float;
  varying vec3 vCol; varying float vA;
  void main() {
    float k = smoothstep(.5, .05, length(gl_PointCoord - .5));
    float a = vA * k;
    gl_FragColor = vec4(vCol * a, a);
  }`;
  // Everything that lives on the GPU is made here and in upload(), and both run
  // again if the context is lost and comes back - which happens when a MacBook
  // switches GPUs, e.g. on plugging in a projector: the points stay in `data` on
  // the CPU side, so a restore is a re-upload, not a rebuild.
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog, U;
  const program = () => {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    U = Object.fromEntries(["uP", "uTime", "uDpr", "uS", "uCam", "uRes", "uCenter", "uRot"].map((n) => [n, gl.getUniformLocation(prog, n)]));
  };
  try { program(); } catch (e) { console.warn("idea: no WebGL scene", e); flat(); return; }
  const STRIDE = 24;
  let data = null;
  const upload = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    [["aP0", 3, 0], ["aP1", 3, 3], ["aP2", 3, 6], ["aP3", 3, 9], ["aCol1", 3, 12], ["aCol2", 3, 15], ["aMeta", 4, 18], ["aOrb", 2, 22]].forEach(([n, size, off]) => {
      const loc = gl.getAttribLocation(prog, n);
      if (loc < 0) return;
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    });
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);   // additive: dense places burn bright
  };

  // ---------- size and framing ----------
  let W = 0, H = 0, dpr = 1, S = 250, CX = 0, CY = 0;
  const CAM = 4.2;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // one world unit in px; the formations run about ±1.2 wide and ±1 tall. The
    // lines sit under the scene, so it centres a little above the middle.
    S = Math.min(H * 0.27, W * (W < 700 ? 0.37 : 0.3));
    CX = W / 2; CY = H * (W < 700 ? 0.4 : 0.42);
    sec.style.setProperty("--u", S + "px");
    gl.uniform2f(U.uRes, W, H); gl.uniform2f(U.uCenter, CX, CY); gl.uniform1f(U.uS, S); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uCam, CAM);
  };

  // The same projection as the vertex shader, for the agents' faces and names
  // that ride on formation 2: the points are GL, the faces are DOM.
  const project = (x, y, rx, ry) => {
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const X = x * cy, Z0 = -x * sy, Y = y * cx - Z0 * sx, Z = y * sx + Z0 * cx;
    const k = CAM / (CAM - Z);
    return [CX + X * k * S, CY - Y * k * S, k];
  };

  // ---------- the loop ----------
  let rot = [0, 0], aim = [0, 0], raf = 0, last = 0, clock = 0, running = false;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    clock += dt;
    cur += (target - cur) * (1 - Math.exp(-dt * 5));
    if (Math.abs(target - cur) < 0.0005) cur = target;
    // a slow sway of its own, plus a little of the pointer: enough to show it's a
    // space and not a picture
    const sway = reduce ? 0 : Math.sin(clock * 0.23) * 0.16;
    rot[0] += (aim[0] - rot[0]) * (1 - Math.exp(-dt * 3));
    rot[1] += (aim[1] + sway - rot[1]) * (1 - Math.exp(-dt * 3));
    draw();
  };
  let lost = false;
  const draw = () => {
    if (lost || !data) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uP, cur); gl.uniform1f(U.uTime, clock); gl.uniform2f(U.uRot, rot[0], rot[1]);
    gl.drawArrays(gl.POINTS, 0, N);
    setBeat(Math.round(cur));
    // the faces arrive with the formation and leave with it
    const on = Math.max(0, 1 - Math.abs(cur - 2) * 2.4);
    sec.style.setProperty("--team", on.toFixed(3));
    if (on > 0) agents.forEach((el) => {
      const [x, y] = spots[el.dataset.key], [px, py, k] = project(x, y, rot[0], rot[1]);
      el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) scale(${(k * (0.7 + on * 0.3)).toFixed(3)})`;
    });
  };
  const start = () => { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  // ---------- build ----------
  async function build() {
    await Promise.all([document.fonts.load(`italic 400 200px "Instrument Serif"`), document.fonts.load(`800 120px "Bricolage Grotesque"`)]).catch(() => {});
    const F = [bubble(), await lion(), team(), shield()];
    F[0] = fill(F[0], N, () => F[0][0]); F[1] = fill(F[1], N, () => F[1][0]); F[3] = fill(F[3], N, () => F[3][0]);
    // Shuffle which point plays which part in each formation, or the points that
    // drew the bubble's rim would all become the lion's feet and the morph would
    // read as one shape sliding into another instead of pouring apart and back.
    for (const f of F) for (let i = f.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [f[i], f[j]] = [f[j], f[i]]; }

    data = new Float32Array(N * STRIDE);
    for (let i = 0; i < N; i++) {
      const o = i * STRIDE, a = F[0][i], b = F[1][i], c = F[2][i], d = F[3][i];
      data.set([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z, b.r, b.g, b.b, c.r, c.g, c.b,
                a.k, c.s, d.k, rnd(), c.orb[0], c.orb[1]], o);
    }
    upload();
    resize();
    sec.classList.add("is-ready");
    draw();
  }

  // Reduced motion: no morph and no drift. The formation simply changes with the
  // line, one still frame each time.
  const follow = (s) => {
    target = toBeat(s.progress);
    if (reduce) { cur = Math.round(target); draw(); }
  };
  const go = () => build().then(() => {
    ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", onUpdate: follow, onRefresh: follow });
    // only runs while any of it is on screen
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: "80px 0px" }).observe(stage);
  });
  // Sampling the shapes is main-thread work, so it waits for the page to load and
  // then for a quiet moment, and never costs the loader or the hero intro a frame.
  // The lines are markup and are there from the start either way.
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  if (document.readyState === "complete") idle(go, { timeout: 1500 });
  else addEventListener("load", () => idle(go, { timeout: 1500 }), { once: true });
  addEventListener("resize", () => { if (W && !lost) { resize(); if (!running) draw(); } });
  // preventDefault is what asks the browser to give the context back at all
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
  canvas.addEventListener("webglcontextrestored", () => {
    try { program(); if (data) { upload(); resize(); } lost = false; draw(); } catch (e) { console.warn("idea: context not restored", e); }
  });
  if (matchMedia("(pointer: fine)").matches && !reduce) {
    addEventListener("pointermove", (e) => { aim = [(e.clientY / innerHeight - 0.5) * 0.22, (e.clientX / innerWidth - 0.5) * 0.4]; });
  }

  window.apexIdea = { holds };
})();
