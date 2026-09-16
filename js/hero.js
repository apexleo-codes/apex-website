/* Hero: a Telegram bubble types out one line at a time while APEX waves beside it.
   Words live in content.js.

   APEX is a muted h264 loop — not an SVG rig, and deliberately not a sprite sheet.
   h264 stores only what changes between frames, so it beat every WebP variant on
   bytes at twice the resolution, and a sprite sheet would decode to a 40 MB
   bitmap (README has the numbers). The loop is one wave played forward then
   reversed, so it seams. This file restarts it as each message lands, so his wave
   greets the message, and pauses it whenever the hero is off screen. */
window.apexHero = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LINES = window.APEX.hero;

  const bubble = $(".bubble"), lion = $("video.lion");
  const textEl = $(".bubble__text"), timeEl = $(".bubble__time"), rail = $(".bubble__rail");

  rail.innerHTML = LINES.map((_, i) => `<i${i ? "" : ' class="is-on"'}></i>`).join("");
  const dots = [...rail.children];

  // ---------- the lion ----------
  // Reduced motion: he holds still on the poster frame. Stop the autoplay here,
  // as the file parses, rather than in start() — by then it has already begun.
  if (reduce && lion) { lion.autoplay = false; lion.pause(); }

  const wave = () => {
    if (!lion || reduce) return;
    lion.currentTime = 0;                          // the wave greets the message
    lion.play().catch(() => {});                   // autoplay can be refused; harmless
  };

  // he costs nothing while you read the rest of the page
  function watchVisibility() {
    if (!lion || reduce || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? lion.play().catch(() => {}) : lion.pause())),
      { threshold: 0.01 }
    ).observe(lion);
  }

  // ---------- the bubble ----------
  let timers = [];
  const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));

  async function type(str) {
    const chars = [...str];                        // by code point, so emoji stay whole
    const step = chars.length > 90 ? 22 : 32;
    for (let i = 2; i <= chars.length; i += 2) {
      textEl.textContent = chars.slice(0, i).join("");
      await wait(step);
    }
    textEl.textContent = str;
  }

  async function play(i) {
    const line = LINES[i];
    dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
    timeEl.textContent = line.time;
    textEl.textContent = "";
    bubble.classList.remove("is-out", "is-read");

    bubble.classList.add("is-typing");
    await wait(900);
    bubble.classList.remove("is-typing");

    wave();                                        // he waves as the words start
    await type(line.text);

    bubble.classList.add("is-read");               // the second tick turns gold
    await wait(5400);
    bubble.classList.add("is-out");
    await wait(480);
    play((i + 1) % LINES.length);
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    if (reduce) {                                  // no typing, no loop: one line, plainly
      timeEl.textContent = LINES[0].time;
      textEl.textContent = LINES[0].text;
      bubble.classList.add("is-live", "is-read");
      return;
    }
    bubble.classList.add("is-live");               // CSS fades him in; see hero.css
    watchVisibility();
    play(0);
  }

  addEventListener("pagehide", () => timers.forEach(clearTimeout));
  return { start };
})();
