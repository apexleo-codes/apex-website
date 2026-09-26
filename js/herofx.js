/* The hero's stage: APEX under a spotlight, in WebGL. After the loader he stands
   in the dark, a stage light strikes on him (it flickers, catches, and opens from
   his face out to his whole body and the floor), and from then on the light lives:
   dust drifting in the beam, a warm rim on his outline that follows the wave frame
   by frame, a cool one on his far side, his reflection on a glossy floor. Each
   message he sends leaves his chest as a spark and lands on the bubble.

   The canvas draws HIM too, from the video as a texture, so the light can land on
   him rather than sit behind him; the <video> stays in the page, playing, as the
   source (and as everything reduced motion, no WebGL, or a video without alpha
   gets - this file then never takes over, and the hero is as it was).

   The clip's matting keyed out every dark detail - eyes, brows, nose, mouth, paw
   pads, joints - so they are holes the page showed through. A light behind him
   would shine through his eyes, and a rim would ring them. So each new frame is
   read back small, the holes found (transparent pixels the outside can't reach),
   and drawn as the page's own ink.

   motion.js asks claim() at the start of the intro and calls reveal() in place of
   the lion's fade-in; hero.js calls say() as each message starts. */
window.apexHeroFx = (() => {
  const $ = (s) => document.querySelector(s);
  const hero = $(".hero"), lion = $("video.lion"), bubble = $(".bubble"), tail = $(".bubble__tail");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const off = { claim: () => false, reveal() {}, say() {} };
  if (!hero || !lion || reduce) return off;

  const cv = document.createElement("canvas");
  cv.className = "hero__gl"; cv.setAttribute("aria-hidden", "true");
  const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return off;

  // ---------- landmarks, as fractions of the 720x720 clip ----------
  // his axis is the middle of the frame (mane 0.49-0.51, feet 0.50); the clip cuts
  // through his feet at the bottom edge, which is where the floor goes. The core is
  // the panel on his belt.
  const CORE = [0.5, 0.765];

  const HEAD = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  `;
  const VS = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0., 1.); }`;
  // smoothstep's edges always in order: falloffs are written 1. - smoothstep(lo, hi, x)
  const FS = HEAD + `
  uniform vec2 uRes;            // canvas, css px
  uniform float uScale;         // device px per css px
  uniform vec3 uLion;           // his square in the canvas, css px: x, y (from the top), size
  uniform sampler2D uVid, uHole;
  uniform float uTime, uOn, uIris, uDust, uAmb, uCore, uLand;
  uniform vec2 uP0, uP1, uP2;   // the spark's path, css px
  uniform float uPulse;         // where the spark is along it, 0..1; < 0 when none
  const vec3 INK = vec3(.043, .075, .071), KEY = vec3(1., .9, .74), COOL = vec3(.62, 1., .88);
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }

  // The clip cuts his mane flat across its top (x .29-.71): under a spotlight
  // that edge reads as a cut. So he gets a low crown back - the mane's own top
  // rows mirrored upwards, inside a faceted roof that continues the mane's slopes.
  float crown(float x) {
    float roof = min(min((x - .285) * .75, (.712 - x) * .75), .046);
    float teeth = abs(fract((x - .285) / .085) - .5) * .026;  // the facets' points
    return roof - teeth;
  }
  vec4 vid(vec2 uv) {
    if (uv.y >= 0.) return texture2D(uVid, uv);
    vec4 c = texture2D(uVid, vec2(uv.x, -uv.y));
    c.a *= 1. - smoothstep(crown(uv.x) - 1. / uLion.z, crown(uv.x) + 1. / uLion.z, -uv.y);
    return c;
  }
  // his outline with the holes filled, and nothing outside his frame
  float solid(vec2 uv) {
    if (uv.x < 0. || uv.x > 1. || uv.y > 1. || uv.y < -.06) return 0.;
    return max(vid(uv).a, uv.y < 0. ? 0. : texture2D(uHole, uv).r);
  }
  // one layer of dust: at most one mote per cell, wandering inside it
  float dust(vec2 p, float cs, float r, float seed) {
    vec2 q = p / cs + vec2(sin(uTime * .11 + seed) * .4, -uTime * .035);
    vec2 id = floor(q), f = fract(q);
    float h = hash(id + seed);
    if (h < .62) return 0.;
    vec2 c = .5 + .22 * vec2(sin(uTime * (.23 + h * .3) + h * 40.), cos(uTime * (.19 + h * .25) + h * 23.));
    float d = length((f - c) * cs);
    return exp(-d * d / (r * r)) * (.55 + .45 * sin(uTime * (.7 + h * 1.6) + h * 60.));
  }

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;
    float s = uLion.z, t = uTime;
    vec2 uv = (p - uLion.xy) / s;
    float cx = uLion.x + .5 * s, fy = uLion.y + s;

    // the spotlight: a cone from above the page, up and to the left as you look
    // at him, onto the floor at his feet. uIris opens it from his face to his
    // whole body and the floor.
    vec2 S = vec2(cx - .3 * s, uLion.y - 1.35 * s), A = vec2(cx, fy);
    float L = length(A - S); vec2 dir = (A - S) / L;
    vec2 v = p - S;
    float al = dot(v, dir), side = v.x * dir.y - v.y * dir.x;
    float R = mix(.2, .78, uIris);                            // the pool's radius, in his size
    float hw = R * 1.05 * s / L;                              // tan of the beam's half-angle
    float k = abs(side) / max(al * hw, 1e-3);
    float cone = al > 0. ? 1. - smoothstep(.42, 1., k) : 0.;
    // the beam's volume fades into the floor rather than stopping on a line
    float above = 1. - smoothstep(fy - .06 * s, fy + 1., p.y);

    vec3 col = vec3(0.); float a = 0.;

    // ---------- behind him ----------
    if (cone > 0. && above > 0.) {
      float ang = side / al;                                  // rays radiate from the lamp
      float streak = .6 * noise(vec2(ang * 34., t * .09)) + .4 * noise(vec2(ang * 95., t * .16 + 3.));
      float haze = noise(p / (s * .3) + vec2(t * .03, -t * .05));
      float near = clamp(al / L, 0., 1.);
      col += KEY * cone * (.45 + .8 * streak) * (.7 + .5 * haze) * mix(1., .55, near) * .15 * uOn * above;
      float d = dust(p, s * .05, s * .0022, 1.) + dust(p, s * .085, s * .0032, 7.);
      col += KEY * d * cone * uDust * .8 * above;
    }
    // where the light lands on the floor, centred on his feet: the floor runs back
    // behind him too, so the pool does, and there is no line where it begins
    vec2 fq = vec2((p.x - A.x) / (R * s), (p.y - fy - .006 * s) / (s * .085));
    float foot = 1. - smoothstep(.15, 1.1, length(fq));
    col += KEY * foot * foot * .22 * uOn;
    // the floor: where the light lands, his reflection, and his contact shadow
    float dy = p.y - fy;
    if (dy > 0.) {
      // the reflection: him mirrored at the floor line, blurring and fading as it goes
      vec2 ru = vec2(uv.x, 2. - uv.y);
      float bl = dy / s * .06, fade = exp(-dy / (s * .11)) * (1. - smoothstep(.0, .5, abs(uv.x - .5) - .1));
      vec4 r0 = texture2D(uVid, ru), r1 = texture2D(uVid, ru + vec2(bl, 0.)), r2 = texture2D(uVid, ru - vec2(bl, 0.));
      vec3 rc = (r0.rgb * r0.a + r1.rgb * r1.a + r2.rgb * r2.a) / 3.;
      col += rc * fade * .2 * (.3 + .7 * uOn) * (.4 + .6 * foot);
      float sh = exp(-dy / (s * .012)) * (1. - smoothstep(.1, .2, abs(uv.x - .5)));
      a += sh * .6;
    }

    // ---------- him ----------
    if (uv.x >= 0. && uv.x <= 1. && uv.y >= -.06 && uv.y <= 1.) {
      vec4 vc = vid(uv);
      float h = uv.y < 0. ? 0. : texture2D(uHole, uv).r, aL = max(vc.a, h);
      if (aL > .002) {
        vec3 base = mix(INK, vc.rgb, clamp(vc.a / aL, 0., 1.));
        // the spot lands on him as a round pool, centred on his face while it is
        // narrow and on his middle once it has opened; a cone would cut a stripe
        vec2 pc = (uv - vec2(.5, mix(.36, .55, uIris))) * vec2(1., .78);
        float lit = uOn * (1. - smoothstep(R * .55, R, length(pc)));
        lit *= .9 + .2 * (.5 - uv.x);                         // the lamp is up and to the left
        vec3 lc = base * (uAmb + lit * (.8 + .34 * (1. - uv.y)));
        // a cool fill from his far side
        lc += base * COOL * .1 * uOn * smoothstep(.45, .9, uv.x);
        // rims: the edges that face the lamp catch it warm; the far edge, cool.
        // Tested against the FILLED outline, so his eyes and joints never ring.
        vec2 toL = normalize(S - p) / s;
        float rim = vc.a * (1. - solid(uv + toL * 3.)), rimW = vc.a * (1. - solid(uv + toL * 9.));
        lc += KEY * (rim * .6 + rimW * .28) * lit;
        float rimC = vc.a * (1. - solid(uv + normalize(vec2(1., -.3)) / s * 3.));
        lc += COOL * rimC * (.14 + .16 * uOn);
        // the core on his belt, as a message leaves it
        vec2 cq = (uv - vec2(${CORE[0]}, ${CORE[1]})) * vec2(1., 1.6);
        lc += KEY * exp(-dot(cq, cq) * 420.) * uCore * 1.4 * vc.a;
        col = lc * aL + col * (1. - aL); a = aL + a * (1. - aL);
      }
    }

    // ---------- in front of him ----------
    if (cone > 0.) {
      float d = dust(p, s * .16, s * .0045, 13.) * 1.2 + dust(p, s * .42, s * .014, 29.) * .18;
      col += KEY * d * cone * uDust * above;
      col += KEY * cone * .018 * uOn * above;                  // a breath of haze between us and him
    }
    // the core's halo, and the spark that carries the message to the bubble
    vec2 cp = uLion.xy + vec2(${CORE[0]}, ${CORE[1]}) * s;
    col += KEY * exp(-length(p - cp) / (s * .05)) * uCore * .5;
    if (uPulse >= 0.) {
      float g = 0.;
      for (int i = 0; i < 12; i++) {
        float fi = float(i), u = uPulse - fi * .022;
        if (u < 0.) continue;
        vec2 b = mix(mix(uP0, uP1, u), mix(uP1, uP2, u), u);
        float r = s * (.011 - fi * .0007), d = length(p - b);
        g += exp(-d * d / (r * r)) * (1. - fi / 12.) + exp(-d / (s * .03)) * .05 * (1. - fi / 12.);
      }
      col += vec3(1., .88, .62) * g * (1. - smoothstep(.9, 1., uPulse)) * 1.3;
    }
    float dl = length(p - uP2);
    col += vec3(1., .88, .62) * (exp(-dl / (s * .035)) * .9 + exp(-dl / (s * .12)) * .2) * uLand;

    // nothing reaches the canvas's sides or bottom; the top is the page's top edge
    vec2 cu = p / uRes;
    col *= smoothstep(0., .08, min(min(cu.x, 1. - cu.x), 1. - cu.y));
    col = clamp(col, 0., 1.);
    gl_FragColor = vec4(col, clamp(max(a, max(col.r, max(col.g, col.b))), 0., 1.));
  }`;

  // ---------- GL plumbing (rebuilt as a whole if a GPU switch loses the context) ----------
  let P = null;
  const build = () => {
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const tex = () => {
      const x = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, x);
      [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
      return x;
    };
    const U = new Proxy({}, { get: (c, n) => (n in c ? c[n] : (c[n] = gl.getUniformLocation(prog, n))) });
    P = { prog, quad, vid: tex(), hole: tex(), U, aPos: gl.getAttribLocation(prog, "aPos") };
    gl.bindTexture(gl.TEXTURE_2D, P.hole);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(1));
  };
  try { build(); } catch (e) { console.warn("hero fx: staying with the plain hero", e); return off; }

  // ---------- the holes in each frame ----------
  // Read back small, flood the transparent pixels in from the border; whatever
  // transparent is left is enclosed by him - an eye, a joint - so it's a hole.
  const N = 256, rc = document.createElement("canvas"); rc.width = rc.height = N;
  const rx = rc.getContext("2d", { willReadFrequently: true });
  const holes = new Uint8Array(N * N), seen = new Uint8Array(N * N), stack = new Int32Array(N * N);
  let hasAlpha = null;
  const findHoles = () => {
    rx.clearRect(0, 0, N, N); rx.drawImage(lion, 0, 0, N, N);
    const px = rx.getImageData(0, 0, N, N).data;
    // a video without alpha (a browser that played the keyed mp4) can't be lit this way
    if (hasAlpha === null) hasAlpha = px[3] < 40 && px[(N * N - 1) * 4 + 3] < 250 && px[(N - 1) * 4 + 3] < 40;
    seen.fill(0); let sp = 0;
    const push = (i) => { if (!seen[i] && px[i * 4 + 3] < 128) { seen[i] = 1; stack[sp++] = i; } };
    for (let i = 0; i < N; i++) { push(i); push((N - 1) * N + i); push(i * N); push(i * N + N - 1); }
    while (sp) {
      const i = stack[--sp], x = i % N;
      if (x > 0) push(i - 1); if (x < N - 1) push(i + 1); if (i >= N) push(i - N); if (i < N * N - N) push(i + N);
    }
    // a hole, grown by a pixel so its antialiased rim is covered too
    for (let i = 0; i < N * N; i++) holes[i] = !seen[i] && px[i * 4 + 3] < 128 ? 255 : 0;
    for (let i = N; i < N * N - N; i++) if (!holes[i] && !seen[i] && (holes[i - 1] === 255 || holes[i + 1] === 255 || holes[i - N] === 255 || holes[i + N] === 255)) holes[i] = 254;
  };

  // ---------- state ----------
  let claimed = false, visible = true, raf = 0, clock = 0, last = 0, frameDirty = true;
  let t0 = -1, sayAt = -1, landed = true, box = null;
  const env = { on: 0, iris: 0, dust: 0 };
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  // the strike: a stage light catching - two false starts, then on - and opening
  const strike = (u) => {
    if (u < 0.35) return 0;
    if (u < 0.4) return 0.6; if (u < 0.5) return 0.04; if (u < 0.54) return 0.35; if (u < 0.66) return 0.06;
    return 0.06 + 0.94 * ease((u - 0.66) / 0.16);
  };
  const size = () => {
    // the canvas covers the stage and a margin round it, the hero's full height
    const h = hero.getBoundingClientRect(), vis = $(".hero__visual").getBoundingClientRect();
    const l = Math.max(0, vis.left - h.left - vis.width * 0.8), r = Math.min(h.width, vis.right - h.left + vis.width * 0.8);
    cv.style.left = l + "px"; cv.style.width = r - l + "px";
    const dpr = Math.min(devicePixelRatio || 1, 1.5), cr = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(cr.width * dpr)); cv.height = Math.max(1, Math.round(cr.height * dpr));
    box = { w: cr.width, h: cr.height, dpr };
    gl.viewport(0, 0, cv.width, cv.height);
  };

  const draw = () => {
    if (!P || !box) return;
    const { U } = P;
    // a new video frame: upload it, and find its holes
    if (frameDirty && lion.readyState >= 2) {
      frameDirty = false;
      gl.bindTexture(gl.TEXTURE_2D, P.vid);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lion);
      findHoles();
      gl.bindTexture(gl.TEXTURE_2D, P.hole);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, N, N, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, holes);
    }
    const cr = cv.getBoundingClientRect(), lr = lion.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    // the lights go down as the hero scrolls away
    const away = Math.min(1, Math.max(0, -hr.top / hr.height));
    const u = t0 < 0 ? 0 : clock - t0;
    env.on = strike(u) * (0.965 + 0.035 * Math.sin(clock * 0.8)) * (1 - 0.55 * away);
    env.iris = ease((u - 1.05) / 1);                 // it holds on his face first
    env.dust = ease((u - 1.1) / 1.6);
    // the message: out of his core, round his side and up into the bubble
    const s = lr.width, lx = lr.left - cr.left, ly = lr.top - cr.top;
    const ps = sayAt < 0 ? -1 : (clock - sayAt) / 0.8;
    const tr = tail.getBoundingClientRect();
    const p0 = [lx + 0.5 * s, ly + 0.765 * s], p2 = [tr.left + tr.width / 2 - cr.left, tr.top + tr.height / 2 - cr.top];
    const p1 = [Math.min(p0[0], p2[0]) - 0.62 * s, (p0[1] + p2[1]) / 2 + 0.08 * s];
    const core = sayAt < 0 ? 0 : Math.exp(-Math.pow((clock - sayAt - 0.05) * 7, 2));
    if (ps >= 1 && !landed) { landed = true; bubble.classList.add("is-lit"); setTimeout(() => bubble.classList.remove("is-lit"), 650); }
    const land = sayAt < 0 ? 0 : Math.max(0, 1 - Math.abs(clock - sayAt - 0.8) / 0.35) ** 2;

    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, P.quad); gl.enableVertexAttribArray(P.aPos); gl.vertexAttribPointer(P.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.vid); gl.uniform1i(U.uVid, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, P.hole); gl.uniform1i(U.uHole, 1);
    gl.uniform2f(U.uRes, box.w, box.h); gl.uniform1f(U.uScale, box.dpr);
    gl.uniform3f(U.uLion, lx, ly, s);
    gl.uniform1f(U.uTime, clock % 1000);
    gl.uniform1f(U.uOn, env.on); gl.uniform1f(U.uIris, env.iris); gl.uniform1f(U.uDust, env.dust);
    gl.uniform1f(U.uAmb, 0.07 + 0.05 * env.on);
    gl.uniform1f(U.uCore, core); gl.uniform1f(U.uLand, land);
    gl.uniform2f(U.uP0, ...p0); gl.uniform2f(U.uP1, ...p1); gl.uniform2f(U.uP2, ...p2);
    gl.uniform1f(U.uPulse, ps >= 0 && ps <= 1 ? ps : -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    clock += dt;
    draw();
    if (visible && claimed) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (claimed && visible && !raf && P) { last = 0; raf = requestAnimationFrame(frame); } };

  // every new frame of the clip needs uploading; nothing else does
  if ("requestVideoFrameCallback" in lion) {
    const onFrame = () => { frameDirty = true; lion.requestVideoFrameCallback(onFrame); };
    lion.requestVideoFrameCallback(onFrame);
  } else {
    let lt = -1;
    setInterval(() => { if (lion.currentTime !== lt) { lt = lion.currentTime; frameDirty = true; } }, 40);
  }

  // ---------- taking over ----------
  // Only if the clip has a frame and it really carries alpha, and only at the
  // intro: a stage that took over later would swap him under the reader's eyes.
  const claim = () => {
    if (claimed) return true;
    try {
      if (lion.readyState < 2 || lion.videoWidth === 0) return false;
      findHoles();
      if (!hasAlpha) return false;
    } catch (e) { return false; }                     // a tainted read (file://) can't be lit
    hero.insertBefore(cv, hero.querySelector(".hero__copy"));
    size();
    hero.classList.add("has-gl");
    claimed = true; frameDirty = true;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); }).observe(hero);
    new ResizeObserver(() => { size(); if (!raf) draw(); }).observe(hero);
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); P = null; });
    cv.addEventListener("webglcontextrestored", () => { try { build(); frameDirty = true; wake(); } catch {} });
    draw(); wake();
    return true;
  };

  return {
    claim,
    reveal(at = 0) { t0 = clock - at; },           // at: seconds in, for checking a phase
    say() { if (!claimed) return; sayAt = clock; landed = false; }
  };
})();
