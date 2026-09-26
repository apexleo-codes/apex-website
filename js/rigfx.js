/* The setup rig's big moments, in WebGL: the soul awakening (step 04) and the
   ascent (step 05). The CSS layers in the rig drew them before; they are still
   there, and still what reduced motion and a browser without WebGL get.

   Two canvases wrap the figure: one BEHIND him (god rays, the aura, the fire, the
   floor, the lightning, and the particles on the far side of their orbits) and one
   IN FRONT (the light that lands on him, and the particles on the near side). One
   fragment shader draws both, told which side it is.

   Everything radiates from his STOMACH, not the middle of the picture. The figure's
   axis is x 46.2% (head, torso and legs all agree), and the tail pushes the art's
   bounding box - and anything centred on it - towards his left. So the back
   effects read a copy of his silhouette with the tail cut away; only the flashes
   that land on his body see the whole of him.

   motion.js hands over the rig's position every time it paints (set(p): 2 is step
   03, 3 the soul, 4 the ascent, fractions are the scroll between them), and this
   eases towards it on its own clock, so a scrubbed ignition still moves like light. */
window.apexRigFx = (() => {
  const rig = document.querySelector(".rig");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const off = { set() {} };
  if (!rig || reduce) return off;

  const back = document.createElement("canvas"), front = document.createElement("canvas");
  back.className = "rig__gl rig__gl--back"; front.className = "rig__gl rig__gl--front";
  back.setAttribute("aria-hidden", "true"); front.setAttribute("aria-hidden", "true");
  const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: "low-power" };
  const gB = back.getContext("webgl", opts), gF = front.getContext("webgl", opts);
  if (!gB || !gF) return off;

  // ---------- landmarks, as fractions of the shared 900x1125 canvas ----------
  const STOMACH = [0.462, 0.6], FLOOR = 0.907, TAIL_X = 0.715;   // the right arm ends at 70.8%, the tail starts past it

  // ---------- shaders ----------
  const HEAD = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  `;
  // smoothstep is only defined with its edges in order, so every falloff below is
  // written 1. - smoothstep(lo, hi, x), never smoothstep(hi, lo, x)
  const QUAD_VS = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0., 1.); }`;
  const FX_FS = HEAD + `
  uniform vec2 uRes;          // canvas, css px
  uniform float uScale;       // device px per css px
  uniform vec4 uArt;          // the art's box inside the canvas, css px: x, y (from the top), w, h
  uniform sampler2D uM3, uM5; // r sharp · g soft · b wide (all tail-less) · a sharp, whole
  uniform float uTime, uSoulIn, uSoul, uAscIn, uAsc, uFront;
  const vec2 C = vec2(${STOMACH[0]}, ${STOMACH[1]});
  const vec3 GOLD = vec3(1., .74, .32), WARM = vec3(1., .88, .62);
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
  // lub-dub, once a second
  float beat(float t) { float h = fract(t * .9); return exp(-h * h * 260.) + exp(-(h - 1.) * (h - 1.) * 260.) + .6 * exp(-(h - .2) * (h - .2) * 260.); }
  vec4 M(sampler2D s, vec2 a) { return (a.x < 0. || a.y < 0. || a.x > 1. || a.y > 1.) ? vec4(0.) : texture2D(s, a); }

  void main() {
    vec2 css = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;
    vec2 a = (css - uArt.xy) / uArt.zw;               // 0..1 across his canvas, y down
    vec2 q = (a - C) * vec2(1., 1.25);                // square units round the stomach
    float d = length(q), th = atan(q.y, q.x), t = uTime;
    vec4 m3 = M(uM3, a), m5 = M(uM5, a);
    vec4 m = mix(m3, m5, uAsc);
    vec3 col = vec3(0.);
    float hb = beat(t);

    // ---------- the soul ----------
    // uSoulIn runs 0..1 over the scroll from 03 to 04: the light converges on him
    // until .45, ignites, and blooms out from there
    float e = smoothstep(.45, 1., uSoulIn);           // how far the bloom has spread
    float flash = exp(-pow((uSoulIn - .47) * 10., 2.)) * step(uSoulIn, .999);
    if (uSoul > .001) {
      if (uFront < .5) {
        // god rays: two fans turning opposite ways, each ray its own length, frayed
        // along it, so it reads as light through dust and not as a drawn sunburst
        float r1 = .5 + .5 * sin(th * 11. + t * .3 + 2.2 * sin(th * 3. - t * .21));
        float r2 = .5 + .5 * sin(th * 19. - t * .43 + 1.3 * sin(th * 5. + t * .3));
        float rays = pow(r1, 5.) * .7 + pow(r2, 9.) * .45;
        float len = .45 + .55 * noise(vec2(th * 3.2 + 40., t * .25));
        float reach = mix(.05, 1.05, e) * len;
        rays *= smoothstep(.03, .22, d) * exp(-d * 1.9) * (1. - smoothstep(reach * .4, reach, d));
        rays *= .55 + .7 * noise(vec2(th * 8., d * 10. - t * 1.4));
        col += GOLD * rays * 1.55 * (.8 + .4 * hb);
        // and a soft volume of light behind all of it, so the rays sit in a glow
        col += GOLD * exp(-d * 4.2) * .42 * e * (.8 + .3 * hb);
        // the core behind his belly, beating
        col += WARM * exp(-d * 6.5) * (.35 + .75 * hb) * e;
        col += vec3(1., .9, .7) * exp(-d * 7.) * flash * 1.8;
        // an aura that hugs him, tail and all excluded, shimmering upwards
        float shimmer = .75 + .5 * noise(a * vec2(11., 6.) + vec2(0., t * .9));
        col += GOLD * (m.b * 1.05 + m.g * .9) * (1. - m.r) * e * shimmer * (.85 + .3 * hb);
        // the shockwave at ignition, then a slow ring every few seconds
        float R = (uSoulIn - .45) * 2.4;
        float ring = R > 0. && uSoulIn < .999 ? exp(-pow((d - R) * 26., 2.)) * (1. - smoothstep(.15, .85, R)) * 2. : 0.;
        float pr = fract(t * .3), ring2 = exp(-pow((d - pr * 1.2) * 32., 2.)) * (1. - pr) * .55 * e;
        col += WARM * (ring + ring2);
      } else {
        // the light that lands ON him: the flash as it ignites, a band sweeping up
        // his body while it spreads, and the soul beating inside his belly after
        col += vec3(1., .86, .56) * m.a * flash * .5;
        float band = mix(.95, .12, e);
        col += GOLD * m.a * exp(-pow((a.y - band) * 13., 2.)) * .6 * step(.001, e) * (1. - e);
        col += WARM * m.r * exp(-d * 9.) * (.18 + .4 * hb) * e;
      }
      col *= uSoul;
    }

    // ---------- the ascent ----------
    if (uAsc > .001) {
      vec3 up = vec3(0.);
      float burst = sin(clamp(uAscIn, 0., 1.) * 3.14159);        // peaks halfway through 04 -> 05
      vec2 fq = (a - vec2(C.x, ${FLOOR} - .005)) * vec2(1., 4.2);
      float fd = length(fq);
      if (uFront < .5) {
        // Tongues: noise stretched tall and climbing, which both sways the outline
        // sideways and eats into it, over a smooth reach up from his (tail-less)
        // silhouette - the wide mask, never the sharp one, so nothing steps.
        float tongue = fbm(vec2(a.x * 7., a.y * 2.2 + t * 2.4));
        float lick = fbm(vec2(a.x * 15., a.y * 4.6 + t * 3.6));
        float flare = .85 + .3 * noise(vec2(t * 2.1, 5.));              // the whole blaze breathes
        vec2 w = vec2((tongue - .5) * .15, 0.);
        // His outline stretched upwards from his feet, a little more each sample,
        // and AVERAGED: a max of shifted copies left a stair at every copy's edge.
        // A per-pixel jitter on the stretch turns what's left into grain.
        float jit = hash(gl_FragCoord.xy + fract(t) * 37.), body = 0., wsum = 0.;
        for (int k = 0; k < 8; k++) {
          // taller AND narrower each time, so the flames close into tips instead
          // of extruding his arms into walls; the reach stays inside the canvas
          float fk = float(k), fj = fk + jit, st = 1. - fj * .028, wt = 1. - fk * .09;
          vec2 b = vec2(C.x + (a.x - C.x) * (1. + fj * .075), ${FLOOR} - (${FLOOR} - a.y) * st) + w * (.25 + fk * .2);
          body += M(uM5, b).b * wt; wsum += wt;
        }
        body = body / wsum * 1.35;
        float heat = body * (.5 + tongue * .8 + lick * .5) * flare;
        float fl = smoothstep(.3, .85, heat);                             // the flames
        float outer = smoothstep(.12, .45, heat) * (1. - fl);             // a deeper fringe round them
        vec3 fire = mix(vec3(.95, .3, .05), vec3(1., .7, .2), smoothstep(.1, .5, fl));
        fire = mix(fire, vec3(1., .97, .86), smoothstep(.72, 1., fl));
        up += fire * fl * 1.6 * (1. - m5.r * .6);
        up += vec3(.85, .22, .04) * outer * .55;
        up += vec3(1., .66, .26) * m5.b * (1. - m5.r) * .7;
        // the floor: a pool of light, and shockwaves rolling out from his feet
        up += vec3(1., .6, .18) * exp(-fd * 3.6) * .9;
        float pr = fract(t * .62);
        up += WARM * exp(-pow((fd - pr * 1.1) * 16., 2.)) * (1. - pr) * 1.1;
        // lightning: now and then a crackle runs up one side of him
        for (int s = 0; s < 2; s++) {
          float side = float(s) * 2. - 1., clk = t * .55 + float(s) * .41, seed = floor(clk);
          float on = step(fract(clk), .1) * step(.35, hash(vec2(seed, side)));
          if (on < .5) continue;                                     // the noise only when a bolt is up
          float x = C.x + side * (.26 + .05 * hash(vec2(seed, 2.))) + (fbm(vec2(a.y * 13., seed * 7.3)) - .5) * .16;
          float span = smoothstep(.18, .3, a.y) * (1. - smoothstep(.7, .86, a.y));
          float bolt = exp(-abs(a.x - x) * 300.) * 1.8 + exp(-abs(a.x - x) * 34.) * .3;
          up += vec3(.72, .84, 1.) * bolt * span * on * (.6 + .4 * hash(vec2(floor(t * 30.), side)));
        }
        // the power-up itself: a column of light and a ring from his feet
        up += vec3(1., .95, .82) * exp(-abs(q.x) * 11.) * (1. - smoothstep(.05, ${FLOOR} + .02, a.y)) * burst * 1.4;
        up += WARM * exp(-pow((fd - uAscIn * 1.6) * 12., 2.)) * burst * 1.5;
      } else {
        // on him: a hot, flickering rim, and the flash as the power lands
        float flick = .75 + .5 * noise(vec2(a.y * 20. - t * 6., a.x * 8.));
        up += vec3(1., .62, .22) * m5.r * (1. - m5.g) * 1.1 * flick;
        up += vec3(1., .82, .5) * m5.a * burst * .38;
      }
      col = col * (1. - uAsc * .55) + up * uAsc;
    }
    // nothing may reach the canvas's own edge: fade out over its last tenth
    vec2 cu = css / uRes;
    col *= smoothstep(0., .1, min(min(cu.x, 1. - cu.x), min(cu.y, 1. - cu.y)));
    col = clamp(col, 0., 1.);
    gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
  }`;

  // Particles: soul-wisps that converge on him, burst out, and orbit his stomach
  // on tilted rings; motes rising off him; and the ascent's sparks. Each lives on
  // both canvases and shows on the one matching its side of him (z).
  const PT_VS = `
  precision highp float;
  attribute vec4 aSeed;       // x phase, y radius, z tilt, w kind (0 wisp, 1 mote, 2 spark)
  uniform vec2 uRes; uniform vec4 uArt; uniform float uTime, uSoulIn, uSoul, uAscIn, uAsc, uSide, uScale;
  varying vec3 vCol; varying float vA;
  const vec2 C = vec2(${STOMACH[0]}, ${STOMACH[1]});
  float h(float x) { return fract(sin(x * 91.7) * 43758.5); }
  void main() {
    float ph = aSeed.x, r = aSeed.y, tilt = aSeed.z, kind = aSeed.w, t = uTime;
    vec3 p = vec3(0.); float a = 0.; vec3 col = vec3(1., .85, .55); float size = 2.5;
    if (kind < .5) {
      // gather (to .45), then burst out onto an orbit
      float g = clamp(uSoulIn / .45, 0., 1.), o = smoothstep(.45, .8, uSoulIn);
      float ang = ph * 6.2832 + t * (.55 + h(ph) * .5) + (1. - g) * 5.;
      float rr = uSoulIn < .45 ? mix(1.05 + h(ph + 1.) * .5, .02, g * g) : r * o;
      vec3 o3 = vec3(cos(ang) * rr, sin(ang) * rr * .32, sin(ang) * rr);
      float c = cos(tilt), s = sin(tilt);
      p = vec3(o3.x * c - o3.y * s, o3.x * s + o3.y * c, o3.z);
      a = uSoul * (uSoulIn < .45 ? smoothstep(0., .15, uSoulIn) : .55 + .45 * sin(t * 3. + ph * 20.));
      col = mix(vec3(1., .82, .5), vec3(1.), h(ph + 3.) * .6); size = 2. + h(ph + 5.) * 3.;
      if (uSoulIn < .45) { size *= 1.6 + g; a *= 1.6; }
    } else if (kind < 1.5) {
      float life = fract(t * (.16 + h(ph) * .12) + ph);
      p = vec3((h(ph + 2.) - .5) * .5 + sin(t + ph * 30.) * .03, .25 - life * .75, (h(ph + 4.) - .5) * .6);
      a = uSoul * smoothstep(0., .15, life) * (1. - life) * smoothstep(.5, 1., uSoulIn);
      size = 1.6 + h(ph + 6.) * 2.4;
    } else {
      // sparks off the ascent: up fast, swaying, flung wide when the power lands
      float life = fract(t * (.5 + h(ph) * .6) + ph);
      float x0 = (h(ph + 2.) - .5) * .56, fling = sin(clamp(uAscIn, 0., 1.) * 3.14159);
      p = vec3(x0 * (1. + fling * 1.4) + sin(t * 4. + ph * 40.) * .02, .32 - life * (1. + fling * .6), (h(ph + 4.) - .5) * .7);
      a = uAsc * (1. - life) * smoothstep(0., .08, life);
      a *= 1.5;
      col = mix(vec3(1., .6, .15), vec3(1., .95, .8), h(ph + 7.)); size = 2.2 + h(ph + 8.) * 4.;
    }
    // this canvas draws only its own side of him
    a *= step(0., p.z * uSide);
    vec2 art = C + vec2(p.x, p.y * .8);
    vec2 px = uArt.xy + art * uArt.zw;
    float persp = 1. + p.z * .35;
    gl_Position = vec4(px / uRes * 2. - 1., 0., 1.); gl_Position.y = -gl_Position.y;
    gl_PointSize = size * persp * uScale * clamp(uArt.z / 380., .55, 1.3);
    vCol = col; vA = a;
  }`;
  const PT_FS = HEAD + `
  varying vec3 vCol; varying float vA;
  void main() { float k = 1. - smoothstep(0., .5, length(gl_PointCoord - .5)); k *= k; gl_FragColor = vec4(vCol * vA * k, vA * k); }`;

  // ---------- GL plumbing, once per canvas ----------
  const make = (gl) => {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    const fx = prog(QUAD_VS, FX_FS), pt = prog(PT_VS, PT_FS);
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pts = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pts); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const tex = masks.map((data) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MW, MH, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
      return t;
    });
    const loc = (p) => new Proxy({}, { get: (c, n) => (n in c ? c[n] : (c[n] = gl.getUniformLocation(p, n))) });
    return { gl, fx, pt, quad, pts, tex, Ufx: loc(fx), Upt: loc(pt), aPos: gl.getAttribLocation(fx, "aPos"), aSeed: gl.getAttribLocation(pt, "aSeed") };
  };

  // ---------- his silhouette, tail cut away, soft and wide ----------
  const MW = 180, MH = 225;
  let masks = null, seeds = null;
  const blur = (src, r) => {               // three box passes each way: close enough to a gaussian
    let a = Float32Array.from(src), b = new Float32Array(a.length);
    for (let pass = 0; pass < 3; pass++) for (const [w, h, sx, sy] of [[MW, MH, 1, MW], [MH, MW, MW, 1]]) {
      for (let j = 0; j < h; j++) {
        let acc = 0; const row = j * sy, n = 2 * r + 1;
        for (let i = -r; i <= r; i++) acc += a[row + Math.min(w - 1, Math.max(0, i)) * sx];
        for (let i = 0; i < w; i++) {
          b[row + i * sx] = acc / n;
          acc += a[row + Math.min(w - 1, i + r + 1) * sx] - a[row + Math.max(0, i - r) * sx];
        }
      }
      [a, b] = [b, a];
    }
    return a;
  };
  const silhouette = (img) => {
    const c = document.createElement("canvas"); c.width = MW; c.height = MH;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, MW, MH);
    const px = x.getImageData(0, 0, MW, MH).data, whole = new Float32Array(MW * MH), cut = new Float32Array(MW * MH);
    for (let i = 0; i < MW * MH; i++) { whole[i] = px[i * 4 + 3] / 255; cut[i] = (i % MW) / MW > TAIL_X ? 0 : whole[i]; }
    const soft = blur(cut, 3), wide = blur(cut, 10), out = new Uint8Array(MW * MH * 4);
    for (let i = 0; i < MW * MH; i++) {
      out[i * 4] = cut[i] * 255; out[i * 4 + 1] = Math.min(255, soft[i] * 330); out[i * 4 + 2] = Math.min(255, wide[i] * 380); out[i * 4 + 3] = whole[i] * 255;
    }
    return out;
  };
  const load = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });

  // ---------- state ----------
  let ctx = [], target = 0, cur = 0, clock = 0, last = 0, raf = 0, visible = false, ready = false, art = [0, 0, 1, 1];
  const drive = (p) => ({
    soulIn: Math.min(1, Math.max(0, p - 2)),
    soul: p <= 3 ? Math.min(1, Math.max(0, (p - 2) * 3)) : 1 - (p - 3) * 0.6,
    ascIn: Math.min(1, Math.max(0, p - 3)),
    asc: Math.min(1, Math.max(0, (p - 3) * 1.4))
  });
  const size = () => {
    const r = rig.getBoundingClientRect(), b = back.getBoundingClientRect();
    // the art is contain-fitted in the rig's box (on phones the box is a wide band)
    const k = Math.min(r.width / 900, r.height / 1125), w = 900 * k, h = 1125 * k;
    art = [r.left + (r.width - w) / 2 - b.left, r.top + (r.height - h) / 2 - b.top, w, h];
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    for (const [cv, c] of [[back, ctx[0]], [front, ctx[1]]]) {
      // the glow is soft, so the back renders at 0.75x (the most shader work, and
      // nobody can tell on a glow); the front carries the
      // sparks and the rim that sits on him, so it gets the screen's density
      const s = cv === back ? Math.min(dpr, 0.75) : dpr, rr = cv.getBoundingClientRect();
      cv.width = Math.max(1, Math.round(rr.width * s)); cv.height = Math.max(1, Math.round(rr.height * s));
      c.scale = s; c.w = rr.width; c.h = rr.height;
      c.gl.viewport(0, 0, cv.width, cv.height);
    }
  };
  const draw = () => {
    const v = drive(cur);
    const live = v.soul > 0.001 || v.asc > 0.001;
    back.style.opacity = front.style.opacity = live ? 1 : 0;
    if (!live) return false;
    ctx.forEach((c, i) => {
      const { gl } = c;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(c.fx);
      gl.bindBuffer(gl.ARRAY_BUFFER, c.quad); gl.enableVertexAttribArray(c.aPos); gl.vertexAttribPointer(c.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, c.tex[0]); gl.uniform1i(c.Ufx.uM3, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, c.tex[1]); gl.uniform1i(c.Ufx.uM5, 1);
      gl.uniform2f(c.Ufx.uRes, c.w, c.h); gl.uniform1f(c.Ufx.uScale, c.scale); gl.uniform4f(c.Ufx.uArt, ...art);
      gl.uniform1f(c.Ufx.uTime, clock % 1000); gl.uniform1f(c.Ufx.uFront, i);
      gl.uniform1f(c.Ufx.uSoulIn, v.soulIn); gl.uniform1f(c.Ufx.uSoul, v.soul); gl.uniform1f(c.Ufx.uAscIn, v.ascIn); gl.uniform1f(c.Ufx.uAsc, v.asc);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(c.aPos);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(c.pt);
      gl.bindBuffer(gl.ARRAY_BUFFER, c.pts); gl.enableVertexAttribArray(c.aSeed); gl.vertexAttribPointer(c.aSeed, 4, gl.FLOAT, false, 0, 0);
      gl.uniform2f(c.Upt.uRes, c.w, c.h); gl.uniform4f(c.Upt.uArt, ...art); gl.uniform1f(c.Upt.uScale, c.scale);
      gl.uniform1f(c.Upt.uTime, clock % 1000); gl.uniform1f(c.Upt.uSide, i ? 1 : -1);
      gl.uniform1f(c.Upt.uSoulIn, v.soulIn); gl.uniform1f(c.Upt.uSoul, v.soul); gl.uniform1f(c.Upt.uAscIn, v.ascIn); gl.uniform1f(c.Upt.uAsc, v.asc);
      gl.drawArrays(gl.POINTS, 0, seeds.length / 4);
      gl.disableVertexAttribArray(c.aSeed);
    });
    return true;
  };
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    clock += dt;
    cur += (target - cur) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const live = draw();
    // keep going while anything is lit or still easing; sleep otherwise
    if (visible && (live || cur !== target)) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (ready && visible && !raf) { last = 0; raf = requestAnimationFrame(frame); } };

  (async () => {
    try {
      const [i3, i5] = await Promise.all([load("img/apex-rig-3-face.webp"), load("img/apex-rig-5-alive.webp")]);
      masks = [silhouette(i3), silhouette(i5)];
      // 150 wisps, 70 motes, 140 sparks
      const list = [];
      let s = 7;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 150; i++) list.push(rnd(), 0.2 + rnd() * 0.3, (rnd() - 0.5) * 1.3, 0);
      for (let i = 0; i < 70; i++) list.push(rnd(), 0, 0, 1);
      for (let i = 0; i < 140; i++) list.push(rnd(), 0, 0, 2);
      seeds = new Float32Array(list);
      rig.prepend(back); rig.append(front);
      ctx = [make(gB), make(gF)];
    } catch (e) { back.remove(); front.remove(); console.warn("rig fx: staying with the CSS effects", e); return; }
    rig.classList.add("has-gl");
    ready = true;
    size();
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; wake(); }, { rootMargin: "120px 0px" }).observe(rig);
    new ResizeObserver(() => { size(); if (!raf) draw(); }).observe(rig);
    // a GPU switch (a projector plugged in) loses both contexts; rebuild on return
    [[back, gB, 0], [front, gF, 1]].forEach(([cv, gl, i]) => {
      cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); ready = false; });
      cv.addEventListener("webglcontextrestored", () => { try { ctx[i] = make(gl); size(); ready = true; wake(); } catch {} });
    });
    wake();
  })();

  return { set(p) { target = p; wake(); } };
})();
