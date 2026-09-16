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
  const chapterAgent = { "Intro": "apex", "The idea": "tusk", "Under the hood": "forge", "The magic": "nyx",
    "Brains & tools": "bullseye", "How they work": "colony", "Recipe → cart": "miso", "Daily rhythm": "kitsune", "Build loop": "forge", "Thank you": "apex" };
  $(".menu__list").innerHTML = $$("[data-chapter]").map((sec, i) =>
    `<a href="#${sec.id}" data-goto="#${sec.id}" data-img="${chapterAgent[sec.dataset.chapter] || "apex"}"><span>${pad(i)}</span>${sec.dataset.chapter}</a>`).join("");

  // marquee of codenames
  const names = D.team.map((t) => `<span>${t.name}</span>${icon("star")}`).join("");
  $(".marquee__track").innerHTML = `<div>${names}</div><div>${names}</div>`;

  // hero orbit: the eight agents around the lion
  $(".orbit").innerHTML = D.team.slice(1).map((t, i) => `<span class="orbit__item" style="--i:${i};--n:8">${av(t.key)}</span>`).join("");

  // 01 · the idea: hover-reveal list
  $(".jobs").innerHTML = D.jobs.map((j, i) => `
    <li class="job" data-img="${j.key}" data-cursor="${j.name.toLowerCase()}" style="--c:${color[j.key]}">
      <span class="job__num">${pad(i + 1)}</span>
      <span class="job__title">${j.title}</span>
      <span class="job__meta">${av(j.key, "job__av")}<b>${j.name}</b><em>${j.sub}</em></span>
      ${icon("arrow")}
    </li>`).join("");

  // 02 · where everything lives
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
  $(".phone__screen").innerHTML = D.task.map((s, i) => `<div class="screen${i ? "" : " is-on"}" data-i="${i}">${screen(s.visual)}</div>`).join("");
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
