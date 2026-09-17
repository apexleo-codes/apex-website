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
      <div class="shot2__box">${f.head ? `<p class="shot2__head">${icon("box")}${f.head}</p>` : ""}<img src="img/${f.img}.webp" alt="${f.alt}" loading="lazy"></div>
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
  // onerror removes a layer whose art isn't in img/ yet, so the column degrades
  // to whatever exists instead of showing broken-image icons.
  // `at` can list several steps ("2 3"): a stage that stays on across them never
  // cross-fades out and back in. The soul is two extra layers round the stage it
  // lifts: a blurred gold copy of him behind, and motes rising in front.
  const rig = $(".rig");
  if (rig) {
    const motes = [[30, 36, 5.2, 0], [66, 28, 6, 1.4], [46, 60, 4.6, 2.6], [76, 50, 5.6, .7], [22, 58, 6.4, 3.2],
      [56, 18, 5, 2], [36, 16, 5.8, 4], [70, 68, 4.8, 3.6], [52, 42, 6.2, .3], [28, 76, 5.4, 1.9], [62, 80, 4.4, 4.4], [80, 34, 6.6, 2.2]]
      .map(([x, y, d, w]) => `<i style="--x:${x}%;--y:${y}%;--d:${d}s;--w:${w}s"></i>`).join("");
    rig.innerHTML = D.setupRig.map((p) => {
      const at = [].concat(p.at).join(" ");
      return p.fx === "soul"
        ? `<div class="rig__part rig__soul" data-at="${at}"><img src="img/${p.img}.webp" alt="" onerror="this.parentNode.remove()"></div>
           <div class="rig__part rig__motes" data-at="${at}">${motes}</div>`
        : `<img class="rig__part" data-at="${at}" src="img/${p.img}.webp" alt="" onerror="this.remove()">`;
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

  // 07 · daily rhythm dial
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

  // the build loop's nodes around the ring · parked
  if ($(".cycle__nodes")) $(".cycle__nodes").innerHTML = D.loop.map((s, i) => `
    <div class="cnode${s.me ? " cnode--me" : ""}" style="--a:${-90 + i * 72}deg" data-i="${i}">
      <span class="cnode__n">${s.n}</span><b>${s.head}</b><em>${s.who}</em>
    </div>`).join("");
})();
