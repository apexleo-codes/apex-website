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
  const chapterAgent = { "Intro": "apex", "The frontend": "tusk", "Setup": "forge", "Under the hood": "colony", "The magic": "nyx",
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
      <div class="term__bar"><span class="term__av">BF</span><span class="term__name">${f.chrome}</span></div>
      <div class="term__body">${f.lines.map((l) =>
        `<p class="bmsg${l.by === "me" ? " bmsg--me" : ""}">${l.html}</p>`).join("")}</div>
    </div>`;
  const shotFrame = (f) => `
    <figure class="shot2">
      <div class="shot2__box">
        <img src="img/${f.img}.webp" alt="${f.alt}" loading="lazy">
        ${f.zones.map((z) => `<span class="hlz" style="--t:${z.t};--l:${z.l};--w:${z.w};--h:${z.h}"><b>${z.n}</b></span>`).join("")}
      </div>
      <figcaption>${f.legend.map((t, i) => `<span><b>${i + 1}</b>${t}</span>`).join("")}</figcaption>
    </figure>`;
  const frame = (f) => (f.kind === "tg" ? tgFrame(f) : f.kind === "shot" ? shotFrame(f) : termFrame(f));

  $(".steps").innerHTML = `<span class="spine" aria-hidden="true"><i class="spine__fill"></i></span>` +
    D.setup.map((s) => `
      <article class="step" data-key="${s.key}">
        <div class="step__n"><span class="step__dot">${s.n}</span></div>
        <div class="step__body">
          <p class="step__tag">${s.tag}</p>
          <h3 class="step__title">${s.title}</h3>
          <p class="step__lede">${s.lede}</p>
          <div class="step__frames${s.frames.length > 1 && !s.frames.some((f) => f.kind === "shot") ? " step__frames--two" : ""}">${s.frames.map(frame).join("")}</div>
        </div>
      </article>`).join("");

  // the rig: stacked transparent layers that assemble APEX as the steps go by.
  // onerror removes a layer whose art isn't in img/ yet, so the column degrades
  // to whatever exists instead of showing broken-image icons.
  const rig = $(".rig");
  if (rig) {
    rig.innerHTML = D.setupRig.map((p) =>
      `<img class="rig__part" data-at="${p.at}" src="img/${p.img}.webp" alt="" onerror="this.remove()">`).join("");
    // The art is generated separately. Until at least one layer really loads the
    // grid stays single-column - otherwise the steps give up 400px to an empty
    // sticky box on desktop, and a blank opaque 30vh band on phones.
    $$(".rig__part", rig).forEach((im) =>
      im.addEventListener("load", () => $(".setup__grid").classList.add("has-rig"), { once: true }));
  }

  // 03 · where everything lives
  $(".dash__parts").innerHTML = D.dashboard.map((p) => `
    <li><b>${p.name}</b><span>${p.tab}</span><em>${p.what}</em></li>`).join("");

  // 03 · the journey flow
  $(".flow__nodes").innerHTML = D.journey.map((n, i) => `
    <div class="fnode" data-i="${i}">
      <div class="fnode__icon">${icon(n.icon)}</div>
      <span class="fnode__n">${pad(i + 1)}</span>
      <h3>${n.head}</h3><p>${n.body}</p>
    </div>`).join("");

  // 05 · brains and tools
  $(".models").innerHTML = D.models.map((m) => `
    <li class="model"><b>${m.name}</b><span>${m.why}</span><i>${m.agents.map((k) => av(k)).join("")}</i></li>`).join("");
  $(".backups__chain").innerHTML = D.backups.map((b) => `<span>${b}</span>`).join(icon("arrow"));
  $(".tools").innerHTML = D.tools.map((t) => `
    <li class="tool" tabindex="0">${icon(t.icon)}<b>${t.need}</b><span class="tool__uses">${t.uses}</span><span class="tool__alt">${t.alt}</span></li>`).join("");

  // 06 · musicians on an arc to the right of APEX (stage units: 1200 × 700)
  const arc = [["tusk", 895, 70], ["bolt", 991, 115], ["bullseye", 1057, 196], ["miso", 1080, 290], ["nyx", 1057, 396], ["kitsune", 991, 478], ["forge", 895, 522]];
  $(".stage__musicians").innerHTML = arc.map(([k, x, y]) => {
    const t = D.team.find((m) => m.key === k);
    return `<div class="node node--m" data-key="${k}" style="--x:${x};--y:${y};--c:${t.color}">${av(k)}<span>${t.name}</span></div>`;
  }).join("");

  // 07 · recipe → cart: phone screens + steps
  const screen = (v) => `<img src="img/${v}.webp" alt="" class="${v === "zepto-cart" ? "is-wide" : ""}">`;
  // scoped to .task: the frontend section has a phone too, and it comes first in the DOM
  $(".task .phone__screen").innerHTML = D.task.map((s, i) => `<div class="screen${i ? "" : " is-on"}" data-i="${i}">${screen(s.visual)}</div>`).join("");
  $(".task__steps").innerHTML = D.task.map((s, i) => `
    <li class="tstep${i ? "" : " is-on"}" data-i="${i}">
      <span class="tstep__n">${pad(i + 1)}</span>
      <h3>${s.head}</h3><p>${s.body}</p>
      <div class="tstep__inline">${screen(s.visual)}</div>
    </li>`).join("");

  // 08 · daily rhythm dial
  const svg = $(".dial__svg");
  const pt = (h, r) => { const a = (h / 24) * 2 * Math.PI - Math.PI / 2; return [300 + r * Math.cos(a), 300 + r * Math.sin(a)]; };
  let ticks = "";
  for (let h = 0; h < 24; h++) {
    const [x1, y1] = pt(h, h % 6 ? 262 : 250), [x2, y2] = pt(h, 276);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${h % 6 ? "tick" : "tick tick--major"}"/>`;
    if (h % 6 === 0) { const [hx, hy] = pt(h, 222); ticks += `<text x="${hx}" y="${hy}" class="hour">${pad(h)}</text>`; }
  }
  const [nx1, ny1] = pt(21, 269), [nx2, ny2] = pt(30, 269);
  ticks += `<path class="dial__night" d="M${nx1} ${ny1} A269 269 0 0 1 ${nx2} ${ny2}"/>`;
  D.rhythm.forEach((st, i) => { const [x, y] = pt(st.h % 24, 269); ticks += `<circle class="stopdot" data-i="${i}" cx="${x}" cy="${y}" r="9"/>`; });
  svg.innerHTML = `<circle class="dial__ring" cx="300" cy="300" r="269"/>${ticks}`;
  $(".rhythm__list").innerHTML = D.rhythm.map((st, i) => `
    <li data-i="${i}" class="${i ? "" : "is-on"}"><b>${st.t}</b>${av(st.key)}<span>${st.label}</span></li>`).join("");

  // 09 · build loop nodes around the ring
  $(".cycle__nodes").innerHTML = D.loop.map((s, i) => `
    <div class="cnode${s.me ? " cnode--me" : ""}" style="--a:${-90 + i * 72}deg" data-i="${i}">
      <span class="cnode__n">${s.n}</span><b>${s.head}</b><em>${s.who}</em>
    </div>`).join("");
})();
