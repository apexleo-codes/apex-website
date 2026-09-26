/* The daily rhythm's sky, in WebGL: the whole day passes over the section. It is
   drawn in layers - a sky that moves through the hours (dawn, day, golden hour,
   sunset, blue hour, night), the light the sun or moon throws across it, two
   layers of cloud lit from the sun's side, stars and now and then a shooting star,
   the sun with its corona and rays, a shaded moon, and a flock
   crossing the sunset.

   The HEADLINE is the horizon. The sun comes up from behind "A day with APEX" as
   the section arrives, stands clear above it at every morning stop, and sets
   behind it on the scroll from 9 AM to 9:30 PM; the moon rises from behind it
   and stays above it through the night. Nothing ever sits on the text: the old
   sun and moon hung over "05 The daily rhythm".

   Scroll picks the hour (motion.js hands over the pin's progress, and the entry
   before it); the sky eases towards it on its own clock, and clouds, stars and
   the corona keep living when the reader stops. The sunset lands exactly where
   the stops cross from day to night, which is where setStop turns the page's
   palette over - so the text goes light just as the sky goes dark.

   Desktop only, where the section is pinned. Phones and reduced motion keep the
   CSS sun and moon (.rhythm__orb), clear of the text in the top-right corner. */
window.apexSky = (() => {
  const $ = (s) => document.querySelector(s);
  const sec = $(".rhythm"), sky = $(".rhythm__sky"), title = $(".rhythm__side .big"), em = title && title.querySelector("em");
  const off = { set() {}, enter() {} };
  const mq = matchMedia("(min-width: 901px) and (prefers-reduced-motion: no-preference)");
  if (!sec || !sky || !title || !mq.matches) return off;

  const cv = document.createElement("canvas");
  cv.className = "rhythm__gl"; cv.setAttribute("aria-hidden", "true");
  const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return off;

  const BIRDS = 7;
  const VS = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0., 1.); }`;
  // smoothstep's edges always in order: falloffs are written 1. - smoothstep(lo, hi, x)
  const FS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 uRes; uniform float uScale, uTime;
  uniform vec3 uTop, uBot, uGlow, uSunCol;
  uniform vec3 uSun, uMoon;      // x, y (css px, from the top), how much of it is up
  uniform float uR, uRm, uHz;    // sun and moon radii; the horizon (the headline's top)
  uniform float uNight, uDusk, uDay;
  uniform vec4 uBirds[${BIRDS}];  // x, y, wing phase, size
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  // quintic, not cubic: thresholded into cloud, the cubic's creases showed as facets
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  // each octave turned against the last: value noise on one axis-aligned grid,
  // stretched and thresholded into cloud, came out as stepped rectangles
  float fbm(vec2 p) { float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 4; i++) { s += a * noise(p); p = m * p + 17.1; a *= .5; } return s; }
  float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
  // cloud cover: long, thin, drifting; two layers at different heights and speeds
  float cloud(vec2 p, float k) {
    vec2 q = p / uRes.y * vec2(1.6, 5.) * (1. + k * .5) + vec2(uTime * (.01 + k * .008) + k * 7., k * 3.);
    return smoothstep(.5, .84, fbm(q));
  }

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;
    vec2 un = p / uRes;
    float t = uTime;

    // ---------- the sky, and the light the sun or the moon throws across it ----------
    vec3 col = mix(uTop, uBot, smoothstep(0., 1., un.y));
    float ds = length(p - uSun.xy) / uRes.y, dm = length(p - uMoon.xy) / uRes.y;
    // the sun's light TINTS the sky: added on top, cream clipped to lemon
    col = mix(col, uGlow, clamp((exp(-ds * 3.2) * .24 + exp(-ds * 10.) * .3) * uSun.z, 0., 1.));
    col += vec3(.5, .62, 1.) * (exp(-dm * 3.5) * .12 + exp(-dm * 14.) * .22) * uMoon.z;

    // ---------- stars, then a shooting star now and then ----------
    if (uNight > .01) {
      float st = 0.;
      for (int k = 0; k < 2; k++) {
        float cs = k == 0 ? 7. : 19.;
        vec2 g = p / cs, id = floor(g);
        float h = hash(id + float(k) * 31.);
        float thr = k == 0 ? .972 : .985;
        if (h > thr) {
          vec2 c = .25 + .5 * vec2(hash(id + 3.1), hash(id + 7.7));
          float d = length((fract(g) - c) * cs);
          float tw = .55 + .45 * sin(t * (1.2 + h * 3.) + h * 70.);
          float b = (h - thr) / (1. - thr);
          st += exp(-d * d / (k == 0 ? .5 : 1.1)) * (.35 + .9 * b) * tw;
          if (k == 1) st += (exp(-abs((fract(g).x - c.x) * cs) * 1.8) * exp(-abs((fract(g).y - c.y) * cs) * .25)
                           + exp(-abs((fract(g).y - c.y) * cs) * 1.8) * exp(-abs((fract(g).x - c.x) * cs) * .25)) * .12 * b * tw;
        }
      }
      // fewer low down, where the sky is brighter, and none in the moon's glare
      st *= (1. - smoothstep(.45, 1., un.y)) * (1. - exp(-dm * 9.) * uMoon.z);
      col += vec3(.9, .93, 1.) * st * uNight;
      float win = floor(t / 6.), ph = fract(t / 6.) * 6.;
      if (hash(vec2(win, 4.)) > .45 && ph < .7) {
        vec2 s0 = vec2(uRes.x * (.35 + .6 * hash(vec2(win, 1.))), uRes.y * (.05 + .25 * hash(vec2(win, 2.))));
        vec2 dir = normalize(vec2(-1., .42)), head = s0 + dir * ph * uRes.x * .5;
        float d = seg(p, head, head - dir * uRes.x * .09 * min(1., ph * 4.));
        float along = clamp(dot(p - head, -dir) / (uRes.x * .09), 0., 1.);
        col += vec3(.9, .95, 1.) * exp(-d * d / .9) * (1. - along) * (1. - ph / .7) * uNight * 1.2;
      }
    }

    // ---------- clouds, lit from the sun's side ----------
    // high up only: the list and the dial stay on clear sky
    float band = smoothstep(.02, .12, un.y) * (1. - smoothstep(.24, .42, un.y));
    for (int k = 0; k < 2; k++) {
      if (band < .001) break;                                   // most of the frame: no noise at all
      float fk = float(k);
      float c = cloud(p, fk) * band * (.55 + .25 * fk);
      if (c < .002) continue;
      // the side towards the light is lit; the far side is in its own shade
      vec2 toL = normalize(uSun.z > .05 ? uSun.xy - p : uMoon.xy - p) * uRes.y * .012;
      float lit = clamp((c - cloud(p + toL, fk) * band) * 2., 0., 1.);
      vec3 dayC = mix(vec3(.9, .87, .82), vec3(1., .99, .96), lit);
      vec3 duskC = mix(vec3(.72, .38, .46), vec3(1., .72, .45), lit);
      vec3 nightC = mix(vec3(.1, .13, .24), vec3(.34, .4, .58), lit * uMoon.z);
      vec3 cc = mix(mix(dayC, duskC, uDusk), nightC, uNight);
      col = mix(col, cc, c * mix(.5, .26, uNight));
    }

    // ---------- the sun: it sets behind the headline ----------
    float above = 1. - smoothstep(uHz - 1., uHz + 1., p.y);
    if (uSun.z > .001) {
      float d = length(p - uSun.xy);
      float core = 1. - smoothstep(uR - 1.2, uR + 1.2, d);
      // a gold disc, hotter in the middle: a white core on a pale morning sky read as a hollow ring
      vec3 disc = mix(vec3(1., .98, .9), mix(vec3(1., .8, .42), uSunCol, 1. - uDay), smoothstep(.3, 1., d / uR));
      col = mix(col, disc, core * uSun.z * above);
      float out1 = max(d - uR, 0.);
      col = mix(col, uSunCol, clamp((exp(-out1 / (uR * .28)) * .5 + exp(-out1 / (uR * 1.2)) * .18) * uSun.z * (1. - core), 0., 1.));
      // low down, the horizon itself catches fire: a haze along the line it sinks behind
      float hzGlow = exp(-abs(p.y - uHz) / (uR * .5)) * exp(-abs(p.x - uSun.x) / (uR * 5.));
      col += uSunCol * hzGlow * .5 * uSun.z * (1. - uDay);
      float ang = atan(p.y - uSun.y, p.x - uSun.x);
      // rays: short, and they never reach the headline under it
      float rays = pow(.5 + .5 * sin(ang * 9. + t * .15 + 2. * sin(ang * 3. - t * .1)), 6.) * exp(-out1 / (uR * 1.1));
      col = mix(col, vec3(1., .93, .78), clamp(rays * .35 * uSun.z * uDay * above, 0., 1.));
    }

    // ---------- the moon: a lit sphere with its seas, rising from behind the headline ----------
    if (uMoon.z > .001) {
      vec2 m = (p - uMoon.xy) / uRm;
      float r2 = dot(m, m);
      if (r2 < 1.1) {
        float edge = 1. - smoothstep(1. - 1.5 / uRm, 1. + 1. / uRm, sqrt(r2));
        vec3 n = vec3(m.x, -m.y, sqrt(max(0., 1. - r2)));
        float lit = smoothstep(-.06, .2, dot(n, normalize(vec3(-.62, .22, .5))));
        float seas = fbm(m * 1.6 + 5.3), pits = fbm(m * 6. + 1.7);
        vec3 face = vec3(.94, .95, .99) * (.8 + .2 * smoothstep(.4, .62, seas)) * (.95 + .05 * pits);
        vec3 mc = mix(vec3(.13, .16, .27), face, lit);      // the dark side, by earthshine
        col = mix(col, mc, edge * uMoon.z * above);
      }
    }

    // ---------- a flock crossing the sunset ----------
    if (uDusk > .01) {
      float b = 1e3;
      for (int i = 0; i < ${BIRDS}; i++) {
        vec4 B = uBirds[i];
        float s = B.w, fl = sin(B.z) * .55;
        vec2 q = p - B.xy;
        b = min(b, min(seg(q, vec2(0.), vec2(-s, -s * (.2 + fl))), seg(q, vec2(0.), vec2(s, -s * (.2 + fl)))));
      }
      col = mix(col, vec3(.16, .09, .13), (1. - smoothstep(.5, 1.3, b)) * uDusk);
    }

    // blend into the section's own background at the top and bottom of the pin
    float a = smoothstep(0., .06, un.y) * (1. - smoothstep(.94, 1., un.y));
    gl_FragColor = vec4(clamp(col, 0., 1.) * a, a);
  }`;

  // ---------- GL plumbing (rebuilt if a GPU switch loses the context) ----------
  let P = null;
  const build = () => {
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const U = new Proxy({}, { get: (c, n) => (n in c ? c[n] : (c[n] = gl.getUniformLocation(prog, n))) });
    P = { prog, quad, U, aPos: gl.getAttribLocation(prog, "aPos") };
  };
  try { build(); } catch (e) { console.warn("sky fx: staying with the CSS sun and moon", e); return off; }

  // ---------- the hour ----------
  const H = window.APEX.rhythm.map((s) => s.h);          // 7.5 … 26.5
  const SUNSET = 18.7;                                    // where the day crosses into night
  const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  let entry = 0, prog = 0;
  // The pin gives each stop an equal share; the hour holds through the middle of a
  // share and moves across its edges, so every stop is a settled sky. The day→night
  // share spends its first half on the afternoon and the sunset, its second on
  // dusk, so the sun is exactly on the horizon as the stops (and the palette) turn.
  const hourAt = () => {
    if (prog <= 0) return lerp(6.1, H[0], sm(0, 1, entry));   // sunrise as the section arrives
    const g = Math.min(H.length - 1, Math.max(0, prog * H.length - 0.5));
    const i = Math.min(H.length - 2, Math.floor(g)), w = sm(0.2, 0.8, g - i);
    if (H[i] < SUNSET && H[i + 1] > SUNSET) return w < 0.5 ? lerp(H[i], SUNSET, sm(0, 1, w / 0.5)) : lerp(SUNSET, H[i + 1], (w - 0.5) / 0.5);
    return lerp(H[i], H[i + 1], w);
  };

  // the sky's colours through the day: [hour, top, bottom, the glow round the sun]
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const KEYS = [
    [5.6, "#0d1430", "#262a4c", "#6a4a6a"],
    [6.3, "#4a4a74", "#eaa47e", "#ffb070"],
    [7.1, "#eed9b6", "#f3d7ae", "#ffb066"],
    [8.2, "#ecdfc3", "#f1e9d8", "#ffb978"],
    [16.2, "#eadcbf", "#f1e8d6", "#ffb870"],
    [17.4, "#f0d09c", "#f6c486", "#ffae4a"],
    [18.3, "#b98189", "#f49c62", "#ff8a3c"],
    [18.9, "#5a4a7e", "#c86e6e", "#e2704a"],
    [19.5, "#1d2450", "#473a68", "#6e4a78"],
    [20.4, "#080c1c", "#0f1734", "#34427a"],
    [30, "#080c1c", "#0f1734", "#34427a"]
  ].map(([h, a, b, c]) => [h, hex(a), hex(b), hex(c)]);
  const palette = (h) => {
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < h) i++;
    const [h0, a0, b0, c0] = KEYS[i], [h1, a1, b1, c1] = KEYS[i + 1], u = sm(h0, h1, h);
    return [0, 1, 2].map((k) => [a0, b0, c0][k].map((v, j) => lerp(v, [a1, b1, c1][k][j], u)));
  };

  // ---------- state ----------
  let box = null, raf = 0, visible = false, clock = 0, last = 0, cur = 6.1;
  const size = () => {
    // the sky is soft light: a pixel per css px is plenty, and at the screen's 2x the
    // Intel GPU dropped to 30 fps
    const r = cv.getBoundingClientRect(), dpr = 1;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    box = { w: r.width, h: r.height, dpr };
    gl.viewport(0, 0, cv.width, cv.height);
  };
  const draw = () => {
    if (!P || !box) return;
    const { U } = P, h = cur;
    const cr = cv.getBoundingClientRect(), tr = title.getBoundingClientRect();
    // the horizon is the headline's cap line; the bodies' path spans it, and climbs
    // no higher than the space above it allows
    const hz = tr.top - cr.top + tr.height * 0.16, x0 = tr.left - cr.left, tw = (em ? em.getBoundingClientRect().right : tr.right) - tr.left;
    const lift = Math.max(40, Math.min(hz - box.h * 0.08, box.h * 0.22));
    const R = Math.min(44, Math.max(24, box.w * 0.027)), Rm = R * 0.86;
    const path = (s) => [x0 + tw * (0.08 + 0.84 * s), hz - lift * Math.pow(Math.max(0, Math.sin(Math.PI * s)), 0.8)];
    // the sun is up from 6:00 to 18:40, the moon from 19:00 to 7:00
    const ss = (h - 6) / (SUNSET - 6), ms = (h - 19) / 12;
    const sunUp = ss > 0 && ss < 1.04 ? 1 : 0, moonUp = ms > -0.02 && ms < 1 ? sm(-0.02, 0.06, ms) : 0;
    const [sx, sy] = path(Math.min(1.04, Math.max(0, ss))), [mx, my] = path(Math.min(1, Math.max(0, ms)));
    const low = Math.pow(1 - Math.sin(Math.PI * Math.min(1, Math.max(0, ss))), 3);           // near the horizon, it reddens
    const sunCol = [lerp(1, 1, low), lerp(0.76, 0.46, low), lerp(0.3, 0.22, low)];
    const [top, bot, glow] = palette(h);
    const night = h >= 24 ? 1 : sm(19, 20.4, h), dusk = Math.max(0, 1 - Math.abs(h - 18.3) / 1.1), day = 1 - sm(17.5, 18.8, h);

    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, P.quad); gl.enableVertexAttribArray(P.aPos); gl.vertexAttribPointer(P.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(U.uRes, box.w, box.h); gl.uniform1f(U.uScale, box.dpr); gl.uniform1f(U.uTime, clock % 1000);
    gl.uniform3fv(U.uTop, top); gl.uniform3fv(U.uBot, bot); gl.uniform3fv(U.uGlow, glow); gl.uniform3fv(U.uSunCol, sunCol);
    gl.uniform3f(U.uSun, sx, sy, sunUp); gl.uniform3f(U.uMoon, mx, my, moonUp);
    gl.uniform1f(U.uR, R); gl.uniform1f(U.uRm, Rm); gl.uniform1f(U.uHz, hz);
    gl.uniform1f(U.uNight, night); gl.uniform1f(U.uDusk, dusk); gl.uniform1f(U.uDay, day);
    // the flock: crosses the sun's side of the sky, right to left, as it goes down
    const fl = sm(16.8, 19.2, h), birds = [];
    for (let i = 0; i < BIRDS; i++) {
      const row = Math.abs(i - 3), side = Math.sign(i - 3);
      birds.push(x0 + tw * lerp(1.15, -0.25, fl) + row * 17, hz - lift * 0.78 + row * 9 + side * 3, clock * (7 + i * 0.6) + i, 6 + (i % 3));
    }
    gl.uniform4fv(U["uBirds[0]"], new Float32Array(birds));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    clock += dt;
    const target = hourAt();
    cur += (target - cur) * (1 - Math.exp(-dt * 4.5));
    if (Math.abs(target - cur) < 0.002) cur = target;
    draw();
    if (visible) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (visible && !raf && P) { last = 0; raf = requestAnimationFrame(frame); } };

  sky.prepend(cv);
  sec.classList.add("has-sky");
  size(); cur = hourAt();
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); }).observe(cv);
  new ResizeObserver(() => { size(); if (!raf) draw(); }).observe(cv);
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); P = null; });
  cv.addEventListener("webglcontextrestored", () => { try { build(); size(); wake(); } catch {} });
  // resized down to a phone: the pin (and this) stop, and the CSS sky takes over
  mq.addEventListener("change", (e) => { sec.classList.toggle("has-sky", e.matches); });

  return {
    set(p) { prog = p; wake(); },            // the pin's progress
    enter(e) { entry = e; wake(); }          // the section arriving, before the pin
  };
})();
