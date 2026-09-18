/* Builds the repeated markup from window.APEX. Runs before motion.js. */
(() => {
  const D = window.APEX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = (name) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const av = (key, cls = "") => `<img class="${cls}" src="img/agent-${key}.webp" alt="" loading="lazy">`;
  const pad = (n) => String(n).padStart(2, "0");
  const color = Object.fromEntries(D.team.map((t) => [t.key, t.color]));

  // menu: one entry per chapter
  const chapterAgent = { "Intro": "apex", "The frontend": "tusk", "Setup": "forge", "The magic": "nyx",
    "Brains & tools": "bullseye", "How they work": "colony", "Recipe → cart": "miso", "Daily rhythm": "kitsune", "Build loop": "forge", "Thank you": "apex" };
  $(".menu__list").innerHTML = $$("[data-chapter]").map((sec, i) =>
    `<a href="#${sec.id}" data-goto="#${sec.id}" data-img="${chapterAgent[sec.dataset.chapter] || "apex"}"><span>${pad(i)}</span>${sec.dataset.chapter}</a>`).join("");

  // marquee of codenames
  const names = D.team.map((t) => `<span>${t.name}</span>${icon("star")}`).join("");
  $(".marquee__track").innerHTML = `<div>${names}</div><div>${names}</div>`;

  // No agents in the hero. They were tried twice: a flat ring (they read as
  // smudges on the lion) and electron orbits round him as a nucleus (the rings
  // vanished and the agents shrank to illegible specks). The stats already say
  // "8 AI agents" a few lines away, and the team gets proper room further down
  // the page - the hero is stronger with just APEX and his message.

  // 01 · the frontend: the Telegram thread, and the six jobs beside it.
  // Messages are markup, not screenshots - see the note in content.js.
  const name = Object.fromEntries(D.team.map((t) => [t.key, t.name]));
  const body = (m) => {
    if (m.kind === "voice") return `<span class="tgvoice">${icon("mic")}<i class="tgwave" aria-hidden="true"></i><span>${m.html}</span></span>`;
    if (m.kind === "button") return `<span class="tgbtn">${m.html}</span>`;
    if (m.kind === "photo") return `<img class="tgphoto" src="img/${m.img}.webp" alt="" loading="lazy"><span class="tgtext">${m.html}</span>`;
    return `<span class="tgtext">${m.html}</span>`;
  };
  const bubble = (m, i) => {
    const mine = m.by === "me";
    return `<div class="tgmsg${mine ? " tgmsg--me" : ""}" style="--i:${i}">
      ${mine ? "" : `<span class="tgwho" style="--c:${color[m.by]}">${av(m.by, "tgav")}<b>${name[m.by]}</b></span>`}
      ${body(m)}
      <span class="tgtime">${m.t}</span>
    </div>`;
  };
  $(".tgthread").innerHTML = D.frontend.map((c, i) => `
    <div class="tgchapter" data-i="${i}" data-state="idle">
      <span class="tgday">${c.when}</span>
      ${c.msgs.map(bubble).join("")}
    </div>`).join("");

  $(".cases").innerHTML = D.frontend.map((c, i) => `
    <li class="case" data-i="${i}" tabindex="0" style="--c:${color[c.key]}">
      <span class="case__num">${pad(i + 1)}</span>
      <span class="case__title">${c.title}</span>
      <span class="case__sub">${c.sub}</span>
      <span class="case__agents">${c.agents.map((k) => `<i style="--c:${color[k]}">${av(k, "case__av")}<b>${name[k]}</b></i>`).join("")}</span>
      <span class="case__when">${c.when}</span>
      <span class="case__bar" aria-hidden="true"><i></i></span>
    </li>`).join("");

  // 02 · the setup. Frames are markup for the same reasons as the phone above
  // (see content.js). No hover readouts any more - they made the section verbose,
  // and this audience skims: one line per step, one highlighted command per frame.
  // `big` marks the line that carries the point, so it reads from a metre away.
  const termFrame = (f) => `
    <div class="term">
      <div class="term__bar"><i></i><i></i><i></i><span class="term__name">${f.chrome}</span></div>
      <div class="term__body">${f.lines.map((l) =>
        `<p class="ln${l.c ? ` ln--${l.c}` : ""}${l.big ? " ln--big" : ""}">${l.p ? `<span class="ps">${l.p}</span>` : ""}${l.html}</p>`).join("")}</div>
    </div>`;
  const tgFrame = (f) => `
    <div class="term term--tg">
      <div class="term__bar"><svg class="term__logo" role="img" aria-label="Telegram"><use href="#i-telegram"/></svg><span class="term__name">${f.chrome}</span></div>
      <div class="term__body">${f.lines.map((l) =>
        `<p class="bmsg${l.by === "me" ? " bmsg--me" : ""}">${l.html}</p>`).join("")}</div>
    </div>`;
  // where it keeps things: brand marks beside the chat, not another frame
  const storeFrame = (f) => `
    <div class="store">
      <p class="store__label">${f.label}</p>
      ${f.items.map((it) => `<span class="store__item"><svg class="store__logo" aria-hidden="true"><use href="#i-${it.logo}"/></svg><b>${it.name}</b></span>`).join("")}
    </div>`;
  // SOUL.md, set as the markdown it is: `##` headings, `-` bullets, numbered rules
  const soulFrame = (f) => {
    let rule = 0;
    const mark = { h: "##", li: "-" };
    return `
    <div class="term term--soul">
      <div class="term__bar"><i></i><i></i><i></i><span class="term__name">${f.chrome}</span></div>
      <div class="term__body">${f.lines.map((l) =>
        `<p class="soul__${l.c === "ol" ? "li" : l.c}">${l.c === "lead" ? "" : `<span class="ps">${l.c === "ol" ? `${++rule}.` : mark[l.c]}</span>`}${l.html}</p>`).join("")}</div>
    </div>`;
  };
  const shotFrame = (f) => `
    <figure class="shot2">
      <div class="shot2__box">${f.head ? `<p class="shot2__head">${icon("box")}${f.head}</p>` : ""}<img src="img/${f.img}.webp" alt="${f.alt}" width="${f.w}" height="${f.h}" loading="lazy"></div>
    </figure>`;
  const frames = { tg: tgFrame, store: storeFrame, soul: soulFrame, shot: shotFrame };
  const frame = (f) => (frames[f.kind] || termFrame)(f);
  const framesMod = (s) => (s.frames.some((f) => f.kind === "store") ? " step__frames--store"
    : s.frames.length > 1 && !s.frames.some((f) => f.kind === "shot") ? " step__frames--two" : "");

  $(".steps").innerHTML = `<span class="spine" aria-hidden="true"><i class="spine__fill"></i></span>` +
    D.setup.map((s) => `
      <article class="step" data-key="${s.key}">
        <div class="step__n"><span class="step__dot">${s.n}</span></div>
        <div class="step__body">
          <p class="step__tag">${s.tag}</p>
          <h3 class="step__title">${s.title}</h3>
          <p class="step__lede">${s.lede}</p>
          <div class="step__frames${framesMod(s)}">${s.frames.map(frame).join("")}</div>
        </div>
      </article>`).join("");

  // the rig: stacked transparent layers that assemble APEX as the steps go by.
  // Every layer is the same box, so a layer is either a stage (one image) or an
  // effect painted in percentages of that box - see content.js for what each
  // effect is and where the figure's landmarks are. onerror removes a layer whose
  // art isn't in img/ yet, so the column degrades to whatever exists instead of
  // showing broken-image icons. `at` can list several steps ("2 3"): a stage that
  // stays on across them never fades out and back in.
  // The image always sits INSIDE the layer, never being the layer: motion.js owns
  // the layer's transform while it converges, and the shake owns the image's.
  const rig = $(".rig");
  if (rig) {
    const dots = (list) => list.map(([x, y, d, w]) => `<i style="--x:${x}%;--y:${y}%;--d:${d}s;--w:${w}s"></i>`).join("");
    // the soul's motes: drifting up around the whole figure
    const motes = dots([[30, 36, 5.2, 0], [66, 28, 6, 1.4], [46, 60, 4.6, 2.6], [76, 50, 5.6, .7], [22, 58, 6.4, 3.2],
      [56, 18, 5, 2], [36, 16, 5.8, 4], [70, 68, 4.8, 3.6], [52, 42, 6.2, .3], [28, 76, 5.4, 1.9],
      [62, 80, 4.4, 4.4], [80, 34, 6.6, 2.2], [40, 70, 5, 1.1], [72, 14, 5.6, 2.9], [18, 44, 6.2, 3.9],
      [50, 86, 4.2, .9], [34, 52, 5.8, 2.4], [68, 44, 6.8, 1.6]]);
    // the ascent's sparks: fewer, faster, and thrown further up
    const sparks = dots([[28, 30, 1.5, 0], [44, 18, 1.8, .35], [58, 26, 1.4, .7], [70, 16, 1.7, .2],
      [22, 48, 1.6, .9], [78, 40, 1.9, .5], [36, 8, 1.5, 1.2], [64, 6, 1.7, .8],
      [50, 34, 1.3, 1.05], [16, 20, 1.8, .6], [84, 24, 1.6, 1.3], [40, 44, 1.4, .15]]);
    // flame tongues, x across the figure's own width (it spans 20%-81% of the
    // canvas) so the fire hugs him instead of standing off him in columns
    const flames = [[30, 2, 1.05, 0], [38, -2, 1.3, .28], [46, -4, 1.45, .12], [54, -3, 1.35, .5],
      [62, -1, 1.25, .34], [70, 3, 1, .2], [26, 7, .85, .55], [74, 8, .9, .36],
      [34, 1, 1.15, .64], [58, 4, 1.1, .8], [50, 9, .8, .44], [42, 6, .95, .72]]
      .map(([x, y, s, w]) => `<b style="--x:${x}%;--y:${y}%;--s:${s};--w:${w}s"></b>`).join("");

    // An effect returns its layers as [modifier, contents] pairs, because most of
    // them need one BEHIND the figure and one in FRONT of it, and a layer can't
    // straddle him. The names carry the depth (`--back` / `--front`) and the CSS
    // gives them their z-index; the stage images sit between the two.
    const fx = {
      // the brain: a lit core the size of the brain itself, inside a wider bloom
      // that spills onto the skull around it, with a highlight sweeping across the
      // core so it reads as wet and shining rather than just bright. In front and
      // screened, so it lights the gold art rather than sitting on top of it as a
      // grey disc. This step's transition carries no zoom (see FLAT in motion.js),
      // so the pulse is the whole event and has to hold the eye on its own.
      brain: () => [["brain rig__fx--front",
        `<i class="rig__core"></i><i class="rig__bloom"></i><i class="rig__shine"></i>`]],
      // the soul: no new art. The armoured stage holds while gold copies of him -
      // one bloomed wide, one tight enough to stay a rim - breathe behind him,
      // rays turn and rings travel outwards, and motes drift up in front.
      soul: (p) => [
        ["soul rig__fx--back", `<span class="rig__rays"></span><span class="rig__ring"></span><span class="rig__ring"></span>
           <img class="rig__bloomed" src="img/${p.img}.webp" alt="" onerror="this.closest('.rig__part').remove()">
           <img class="rig__rim" src="img/${p.img}.webp" alt="">`],
        ["motes rig__fx--front", motes]],
      // the ascent: a gold copy of him burns as an aura on his own outline, a
      // plume climbs behind it, flames lick round his feet, sparks come off the
      // top in front. The shake is on the stage layer itself, not here.
      fire: (p) => [
        ["fire rig__fx--back", `<span class="rig__plume"></span>
           <img class="rig__blaze" src="img/${p.img}.webp" alt="" onerror="this.closest('.rig__part').remove()">
           <span class="rig__flames">${flames}</span>`],
        ["sparks rig__fx--front", sparks]]
    };
    rig.innerHTML = D.setupRig.flatMap((p) => {
      const at = [].concat(p.at).join(" ");
      const layers = fx[p.fx] ? fx[p.fx](p)
        : [[p.fx || "", `<img src="img/${p.img}.webp" alt="" onerror="this.closest('.rig__part').remove()">`]];
      return layers.map(([mod, inner]) =>
        `<div class="rig__part${mod ? ` rig__${mod}` : ""}" data-at="${at}">${inner}</div>`);
    }).join("");
    // The art is generated separately. Until at least one layer really loads the
    // grid stays single-column - otherwise the steps give up 400px to an empty
    // sticky box on desktop, and a blank opaque 30vh band on phones.
    $$("img", rig).forEach((im) =>
      im.addEventListener("load", () => $(".setup__grid").classList.add("has-rig"), { once: true }));
  }

  // Parked sections (the journey flow, brains and tools, the build loop) live in
  // depricated_for_now.html, so their containers aren't in the page. Each block
  // below asks for its container first and skips when it isn't there - move a
  // section back into index.html and it fills itself again, no edit needed here.

  // the journey flow · parked
  if ($(".flow__nodes")) $(".flow__nodes").innerHTML = D.journey.map((n, i) => `
    <div class="fnode" data-i="${i}">
      <div class="fnode__icon">${icon(n.icon)}</div>
      <span class="fnode__n">${pad(i + 1)}</span>
      <h3>${n.head}</h3><p>${n.body}</p>
    </div>`).join("");

  // brains and tools · parked
  if ($(".models")) {
    $(".models").innerHTML = D.models.map((m) => `
      <li class="model"><b>${m.name}</b><span>${m.why}</span><i>${m.agents.map((k) => av(k)).join("")}</i></li>`).join("");
    $(".backups__chain").innerHTML = D.backups.map((b) => `<span>${b}</span>`).join(icon("arrow"));
    $(".tools").innerHTML = D.tools.map((t) => `
      <li class="tool" tabindex="0">${icon(t.icon)}<b>${t.need}</b><span class="tool__uses">${t.uses}</span><span class="tool__alt">${t.alt}</span></li>`).join("");
  }

  // 03 · the skills: seven small avatars on a tight arc (centre 500,340, radius
  // 160, 20° apart), convex towards the scripts. MISO sits at its apex, on the
  // soul's wire line, because the walk-through follows her Sunday job; when the
  // soul picks her she grows where she stands (CSS). Names and skills show on
  // hover, so the arc stays quiet (stage units: 1200 × 700).
  const arc = ["tusk", "bolt", "bullseye", "miso", "nyx", "kitsune", "forge"].map((k, i) => {
    const a = (i - 3) * 20 * Math.PI / 180;
    return [k, Math.round(500 + 160 * Math.cos(a)), Math.round(340 + 160 * Math.sin(a))];
  });
  $(".stage__musicians").innerHTML = arc.map(([k, x, y]) => {
    const t = D.team.find((m) => m.key === k);
    return `<div class="node node--m" data-key="${k}" style="--x:${x};--y:${y};--c:${t.color}">${av(k)}<span class="node__label">${t.name}<small>${t.skill}</small></span></div>`;
  }).join("");
  $(".toolsbar").insertAdjacentHTML("beforeend", D.layerTools.map((t) =>
    `<span class="toolsbar__chip${t.flow ? " toolsbar__chip--flow" : ""}">${icon(t.icon)}<span>${t.name}${t.flow ? ` → ${t.flow}` : ""}</span></span>`).join(""));

  // 06 · recipe → cart: phone screens + steps
  const screen = (v) => `<img src="img/${v}.webp" alt="" class="${v === "zepto-cart" ? "is-wide" : ""}">`;
  // scoped to .task: the frontend section has a phone too, and it comes first in the DOM
  $(".task .phone__screen").innerHTML = D.task.map((s, i) => `<div class="screen${i ? "" : " is-on"}" data-i="${i}">${screen(s.visual)}</div>`).join("");
  $(".task__steps").innerHTML = D.task.map((s, i) => `
    <li class="tstep${i ? "" : " is-on"}" data-i="${i}">
      <span class="tstep__n">${pad(i + 1)}</span>
      <h3>${s.head}</h3><p>${s.body}</p>
      <div class="tstep__inline">${screen(s.visual)}</div>
    </li>`).join("");

  // 07 · daily rhythm dial — a 12-hour face, so it reads like a clock on a wall
  // rather than a 24-hour instrument. `h` counts past 24 (see content.js), so
  // position takes it modulo 12: the two halves of the day share the face, and a
  // 9 AM and a 9:30 PM stop sit a few degrees apart rather than opposite. There is
  // no night band on the rim any more — it spanned 21:00–06:00, which is a single
  // arc only on a 24-hour face; the sun/moon in the middle says it instead.
  const svg = $(".dial__svg");
  const pt = (h, r) => { const a = ((h % 12) / 12) * 2 * Math.PI - Math.PI / 2; return [300 + r * Math.cos(a), 300 + r * Math.sin(a)]; };
  let ticks = "";
  for (let h = 0; h < 12; h++) {
    const [x1, y1] = pt(h, h % 3 ? 262 : 250), [x2, y2] = pt(h, 276);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${h % 3 ? "tick" : "tick tick--major"}"/>`;
    if (h % 3 === 0) { const [hx, hy] = pt(h, 222); ticks += `<text x="${hx}" y="${hy}" class="hour">${h || 12}</text>`; }
  }
  D.rhythm.forEach((st, i) => { const [x, y] = pt(st.h, 269); ticks += `<circle class="stopdot" data-i="${i}" cx="${x}" cy="${y}" r="9"/>`; });
  svg.innerHTML = `<circle class="dial__ring" cx="300" cy="300" r="269"/>${ticks}`;
  $(".rhythm__list").innerHTML = D.rhythm.map((st, i) => {
    const c = D.clock12(st.t);
    return `<li data-i="${i}" class="${i ? "" : "is-on"}"><b>${c.t}<small>${c.ap}</small></b>${av(st.key)}<span>${st.label}</span></li>`;
  }).join("");

  // the build loop's nodes around the ring · parked
  if ($(".cycle__nodes")) $(".cycle__nodes").innerHTML = D.loop.map((s, i) => `
    <div class="cnode${s.me ? " cnode--me" : ""}" style="--a:${-90 + i * 72}deg" data-i="${i}">
      <span class="cnode__n">${s.n}</span><b>${s.head}</b><em>${s.who}</em>
    </div>`).join("");
})();
