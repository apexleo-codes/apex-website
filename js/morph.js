/* Points of light that pour from one shape into the next: the engine behind the
   curtain call and the recipe → cart emblem (and, first, the big idea, which it was
   lifted from when that section was cut).

   Raw WebGL, no library. Each formation is a list of points, uploaded once as its
   own buffer; a frame binds the two formations either side of the current position
   and the vertex shader moves every point between them, so a frame costs the CPU a
   handful of uniforms however many points and formations there are. The caller says
   where to be (`to(p)`: 1.5 is halfway from formation 1 to formation 2), the scene
   eases there on its own clock, and time does the rest - drift, sway, and whatever
   life each point carries in the formation (`m`, below).

   A point: { x, y, z, r, g, b, a, m, o1, o2 }. World units: 1 is `s` px (from the
   caller's frame()), y up. `m` is what the point does while its formation holds:
     0 still          · 1 orbit round (x, y), radius o1, phase o2
     2 stream from (o1, o2) to (x, y), over and over (work in flight, steam)
     3 twinkle        · 4 a band of light climbs it · 5 breathe
     6 a slow ripple outwards from the centre
   Colour is 0..1, and the blending is additive, so dense places burn bright. */
(() => {
  const VS = `
  precision highp float;
  attribute vec3 aPA, aMA, aPB, aMB;
  attribute vec4 aCA, aCB;
  attribute float aSeed;
  uniform float uF, uTime, uDpr, uS, uCam, uBurst, uSize;
  uniform vec2 uRes, uCenter, uRot;
  varying vec3 vCol; varying float vA;
  // what a point does while its formation holds (see the list at the top)
  vec3 live(vec3 P, vec3 M, float seed, inout vec3 col, inout float a) {
    float m = M.x;
    if (m > .5 && m < 1.5) { float an = M.z + uTime * (.22 + fract(seed * 3.3) * .4); P += vec3(cos(an) * M.y, sin(an) * M.y * .92, sin(an * 1.7) * M.y * .6); }
    else if (m > 1.5 && m < 2.5) { float f = fract(uTime * .14 + seed * 5.3); P = mix(vec3(M.y, M.z, P.z), P, f); a *= sin(f * 3.14159); }
    else if (m > 2.5 && m < 3.5) { a *= .55 + .45 * sin(uTime * (1. + fract(seed * 9.1) * 2.) + seed * 60.); }
    else if (m > 3.5 && m < 4.5) { col += .55 * exp(-pow((P.y - (mod(uTime * .45, 2.8) - 1.4)) * 5., 2.)); }
    else if (m > 4.5 && m < 5.5) { a *= 1. - .45 * (.5 + .5 * sin(uTime * 2.2)); }
    else if (m > 5.5) { a *= 1. + .5 * sin(length(P.xy) * 9. - uTime * 2.6); }
    return P;
  }
  void main() {
    float seed = aSeed;
    // staggered: each point sets off at its own moment, so a morph pours rather than jumps
    float t = smoothstep(0., 1., clamp((uF - fract(seed * 7.31) * .38) / .62, 0., 1.));
    vec3 ca = aCA.rgb, cb = aCB.rgb; float aa = aCA.a, ab = aCB.a;
    vec3 pa = live(aPA, aMA, seed, ca, aa), pb = live(aPB, aMB, seed, cb, ab);
    vec3 pos = mix(pa, pb, t);
    // mid-morph the points swirl out and towards you, then settle: a burst, not a slide
    float burst = sin(t * 3.14159) * uBurst;
    float ang = burst * (fract(seed * 5.7) - .5) * 2.4, c = cos(ang), s = sin(ang);
    pos.xy = mat2(c, s, -s, c) * pos.xy;
    pos += normalize(pos + vec3(0., 0., .7)) * burst * (.16 + fract(seed * 11.3) * .55);
    pos += .011 * vec3(sin(uTime * 1.3 + seed * 40.), cos(uTime * 1.1 + seed * 31.), sin(uTime * .9 + seed * 17.));
    vCol = mix(ca, cb, t); vA = mix(aa, ab, t);

    float cy = cos(uRot.y), sy = sin(uRot.y), cx = cos(uRot.x), sx = sin(uRot.x);
    vec3 r = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
    r = vec3(r.x, r.y * cx - r.z * sx, r.y * sx + r.z * cx);
    float persp = uCam / (uCam - r.z);
    vec2 px = uCenter + vec2(r.x, -r.y) * persp * uS;
    gl_Position = vec4(px / uRes * 2. - 1., 0., 1.);
    gl_Position.y = -gl_Position.y;
    gl_PointSize = (1.6 + fract(seed * 17.9) * 2.6) * uSize * persp * uDpr * clamp(uS / 250., .7, 1.25);
  }`;
  const FS = `
  precision mediump float;
  varying vec3 vCol; varying float vA;
  uniform float uAlpha;
  void main() {
    float k = 1. - smoothstep(.05, .5, length(gl_PointCoord - .5));
    float a = vA * k * uAlpha;
    gl_FragColor = vec4(vCol * a, a);
  }`;
  const UNIFORMS = ["uF", "uTime", "uDpr", "uS", "uCam", "uBurst", "uSize", "uRes", "uCenter", "uRot", "uAlpha"];
  const STRIDE = 10, CAM = 4.2;

  // ---------- the kit a formation is drawn with ----------
  const kit = (seed) => {
    // seeded, so a scene looks the same on every load
    const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    // Draw a shape on a scratch canvas and take n points off its painted pixels, with
    // the pixel's colour. H px of the scratch canvas is 2 world units, so y runs -1..1
    // (times `scale`). getImageData throws on a tainted canvas (a file:// page drawing
    // an image), so a caller that draws an image has a fallback.
    const sample = (n, draw, W = 600, H = 400, scale = 1, extra = {}) => {
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
                   r: px[k * 4] / 255, g: px[k * 4 + 1] / 255, b: px[k * 4 + 2] / 255, a: 1, ...extra });
      }
      return out;
    };
    // an image, off its alpha, in its own colours. The load event, not img.decode():
    // decode() never settles while the page is hidden, so a link opened in a
    // background tab would sit unbuilt until someone looked at it.
    const image = async (src, n, W, H, scale, extra) => {
      const im = new Image(); im.src = src;
      await new Promise((ok, no) => (im.complete && im.naturalWidth ? ok() : ((im.onload = ok), (im.onerror = no))));
      return sample(n, (x, w, h) => x.drawImage(im, 0, 0, w, h), W, H, scale, extra);
    };
    // dust hanging in a box, for a formation to gather out of
    const scatter = (n, { w = 3, h = 2, d = 1.4, col = [0.93, 0.9, 0.84], a = 0.3, m = 3 } = {}) =>
      Array.from({ length: n }, () => ({ x: (rnd() - 0.5) * w, y: (rnd() - 0.5) * h, z: (rnd() - 0.5) * d, r: col[0], g: col[1], b: col[2], a: a * (0.4 + rnd() * 0.6), m }));
    // recolour a list, and set what it does while it holds
    const paint = (list, col, extra = {}) => list.map((p) => ({ ...p, r: col[0], g: col[1], b: col[2], ...extra }));
    return { rnd, hex, sample, image, scatter, paint };
  };

  // ---------- one scene ----------
  // opts: canvas · n (points) · forms: [async (kit, n, scene) => points] · frame(W, H) => {s, cx, cy}
  //       burst (mid-morph swirl, 1) · size (point size, 1) · rate (easing per second,
  //       5; Infinity = go straight there) · sway (true) · pointer (true) · seed ·
  //       onFrame(scene) after each draw
  function create(opts) {
    const { canvas, forms } = opts;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = { p: 0, target: 0, time: 0, ready: false, gl: false, W: 0, H: 0, s: 1, cx: 0, cy: 0, rot: [0, 0], alpha: 1, reduce };
    // low-power: a few thousand points need nothing more, and on a MacBook with two
    // GPUs asking for the big one switches GPUs, which is exactly what drops contexts
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "low-power" });
    const K = kit(opts.seed || 20260924);
    const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    let prog, U, A, bufs = [], seedBuf, data = [], seeds = null, bound = -1, lost = false;
    const n = opts.n;

    // Everything on the GPU is made in program() and upload(), and both run again if
    // the context is lost and comes back - a MacBook switching GPUs on plugging in a
    // projector: the points stay on the CPU side, so a restore is a re-upload.
    const program = () => {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      U = Object.fromEntries(UNIFORMS.map((k) => [k, gl.getUniformLocation(prog, k)]));
      A = Object.fromEntries(["aPA", "aCA", "aMA", "aPB", "aCB", "aMB", "aSeed"].map((k) => [k, gl.getAttribLocation(prog, k)]));
      Object.values(A).forEach((l) => l >= 0 && gl.enableVertexAttribArray(l));
    };
    const upload = () => {
      bufs = data.map((d) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return b; });
      seedBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      gl.vertexAttribPointer(A.aSeed, 1, gl.FLOAT, false, 4, 0);
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);   // additive: dense places burn bright
      bound = -1;
    };
    // point the A and B attributes at the formations either side of `seg`
    const bind = (seg) => {
      if (seg === bound) return;
      bound = seg;
      [[bufs[seg], "A"], [bufs[seg + 1], "B"]].forEach(([b, k]) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.vertexAttribPointer(A["aP" + k], 3, gl.FLOAT, false, STRIDE * 4, 0);
        gl.vertexAttribPointer(A["aC" + k], 4, gl.FLOAT, false, STRIDE * 4, 12);
        gl.vertexAttribPointer(A["aM" + k], 3, gl.FLOAT, false, STRIDE * 4, 28);
      });
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      scene.W = r.width; scene.H = r.height;
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
      Object.assign(scene, opts.frame(r.width, r.height));
      if (!gl || lost || !prog) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, scene.W, scene.H); gl.uniform2f(U.uCenter, scene.cx, scene.cy);
      gl.uniform1f(U.uS, scene.s); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uCam, CAM);
      gl.uniform1f(U.uBurst, opts.burst ?? 1); gl.uniform1f(U.uSize, opts.size ?? 1);
    };
    scene.resize = resize;

    // The same projection as the vertex shader, for DOM that rides on the points
    scene.project = (x, y) => {
      const [rx, ry] = scene.rot;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const X = x * cy, Z0 = -x * sy, Y = y * cx - Z0 * sx, Z = y * sx + Z0 * cx;
      const k = CAM / (CAM - Z);
      return [scene.cx + X * k * scene.s, scene.cy - Y * k * scene.s, k];
    };
    // ...and back: a page position (px, relative to the canvas) in world units
    scene.unproject = (px, py) => [(px - scene.cx) / scene.s, (scene.cy - py) / scene.s];

    const draw = () => {
      if (!scene.ready || lost) return;
      const last = data.length - 1, p = Math.min(Math.max(scene.p, 0), last);
      const seg = Math.min(Math.floor(p), last - 1);
      bind(seg);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uF, p - seg); gl.uniform1f(U.uTime, scene.time); gl.uniform2f(U.uRot, scene.rot[0], scene.rot[1]);
      gl.uniform1f(U.uAlpha, scene.alpha);
      gl.drawArrays(gl.POINTS, 0, n);
      opts.onFrame && opts.onFrame(scene);
    };
    scene.draw = draw;

    // ---------- the loop, only while on screen ----------
    let raf = 0, last = 0, running = false, aim = [0, 0];
    const rate = opts.rate ?? 5;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      scene.time += dt;
      scene.p = rate === Infinity ? scene.target : scene.p + (scene.target - scene.p) * (1 - Math.exp(-dt * rate));
      if (Math.abs(scene.target - scene.p) < 0.0005) scene.p = scene.target;
      // a slow sway of its own, plus a little of the pointer: enough to show it's a
      // space and not a picture
      const sway = opts.sway === false ? 0 : Math.sin(scene.time * 0.23) * 0.16;
      scene.rot[0] += (aim[0] - scene.rot[0]) * (1 - Math.exp(-dt * 3));
      scene.rot[1] += (aim[1] + sway - scene.rot[1]) * (1 - Math.exp(-dt * 3));
      draw();
    };
    const start = () => { if (running || reduce || !scene.ready) return; running = true; last = 0; raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    let visible = false;

    // Reduced motion: no morph and no drift; the formation simply changes, one still
    // frame each time.
    scene.to = (p) => { scene.target = p; if (reduce) { scene.p = Math.round(p); draw(); } };
    scene.set = (p) => { scene.target = scene.p = p; if (!running) draw(); };

    if (!gl) return scene;
    try { program(); } catch (e) { console.warn("morph: no WebGL scene", e); return scene; }
    scene.gl = true;

    // Shuffle which point plays which part in each formation, or the points that
    // drew one shape's rim would all become the next one's feet and a morph would
    // read as one shape sliding into another instead of pouring apart and back.
    const pack = (f) => {
      if (!f.length) f.push({ x: 0, y: 0, r: 0, g: 0, b: 0, a: 0 });
      while (f.length < n) f.push({ ...f[Math.floor(K.rnd() * f.length)] });
      f.length = n;
      for (let i = n - 1; i > 0; i--) { const k = Math.floor(K.rnd() * (i + 1)); [f[i], f[k]] = [f[k], f[i]]; }
      const d = new Float32Array(n * STRIDE);
      f.forEach((q, i) => d.set([q.x, q.y, q.z || 0, q.r, q.g, q.b, q.a ?? 1, q.m || 0, q.o1 || 0, q.o2 || 0], i * STRIDE));
      return d;
    };
    // Draw formation j again (one that is laid out from the page, after a resize)
    scene.reform = async (j) => {
      if (!scene.ready) return;
      data[j] = pack(await forms[j](K, n, scene));
      if (lost) return;
      gl.deleteBuffer(bufs[j]);
      bufs[j] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufs[j]); gl.bufferData(gl.ARRAY_BUFFER, data[j], gl.STATIC_DRAW);
      bound = -1;
      if (!running) draw();
    };

    // Sampling the shapes is main-thread work, so the build waits for the page to
    // load and then for a quiet moment, and never costs the loader or the hero intro
    // a frame.
    scene.built = new Promise((done) => {
      const go = async () => {
        await Promise.all([document.fonts.load(`italic 400 200px "Instrument Serif"`), document.fonts.load(`800 120px "Bricolage Grotesque"`)]).catch(() => {});
        resize();                                  // forms may read the frame (W, H, s)
        for (let j = 0; j < forms.length; j++) data[j] = pack(await forms[j](K, n, scene));
        seeds = new Float32Array(n).map(() => K.rnd());
        upload();
        scene.ready = true;
        resize();
        draw();
        if (visible) start();
        done(scene);
      };
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
      const later = () => idle(() => go().catch((e) => console.warn("morph: build failed", e)), { timeout: 1500 });
      if (document.readyState === "complete") later(); else addEventListener("load", later, { once: true });
    });

    new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; visible ? start() : stop(); }), { rootMargin: "80px 0px" }).observe(canvas);
    addEventListener("resize", () => { if (scene.ready && !lost) { resize(); if (!running) draw(); } });
    // preventDefault is what asks the browser to give the context back at all
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
    canvas.addEventListener("webglcontextrestored", () => {
      try { program(); if (scene.ready) { upload(); lost = false; resize(); draw(); } else lost = false; } catch (e) { console.warn("morph: context not restored", e); }
    });
    if (opts.pointer !== false && matchMedia("(pointer: fine)").matches && !reduce) {
      addEventListener("pointermove", (e) => { aim = [(e.clientY / innerHeight - 0.5) * 0.22, (e.clientX / innerWidth - 0.5) * 0.4]; });
    }
    return scene;
  }

  window.APEXMorph = { create };
})();
