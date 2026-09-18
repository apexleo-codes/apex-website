#!/usr/bin/env node
// Checks the pinned sections (03 how they work together, 05 the daily rhythm)
// arrive and leave without a snap.
//
//   python3 serve.sh / any static server on :8080, then
//   node tools/check-pins.mjs [url] [width] [height]      # default http://localhost:8080/ 1440 900
//
// Exit 0 GREEN, 1 RED. Needs Google Chrome (CHROME=path to override) and Node 22+
// for the built-in WebSocket; nothing to install.
//
// What it catches, and why each check exists:
//   stale    ScrollTrigger measures the page once and trusts it. Anything that grows
//            afterwards leaves every pin below it starting in the wrong place, and the
//            panel snaps on the way in. The setup's lazy Skills shot did exactly this
//            (0 -> ~400px, just above section 03). Measured three times: at load,
//            after reading down to 03 like a person, and after injecting 300px of
//            late growth above both pins - the last one is the class, not the instance.
//   jump     Wheels through each pin boundary via Lenis - the path a real wheel or
//            trackpad takes - and compares the pinned panel's position on EVERY frame
//            with where a perfect pin puts it. anticipatePin shows up here: it pins a
//            frame or two early on purpose, so every entry jumped 60-100px.
//   refresh  Counts ScrollTrigger refreshes during ordinary reading. There should be
//            none; the page refreshes itself when its height really changes
//            (motion.js), and a refresh storm would be its own kind of rough.
//   frames   A crossing sampled in fewer than 8 frames proves nothing, so it fails
//            rather than passes.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.argv[2] || "http://localhost:8080/";
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), "check-pins-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, "--no-first-run", "--no-default-browser-check",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"
], { stdio: "ignore", detached: true });
// Chrome leads its own process group and the whole GROUP is killed: killing only the
// parent orphans its renderer and GPU helpers, which keep rendering the site's
// animations, starve the CPU, and make every later run's frame rate wander.
const killAll = () => { try { process.kill(-chrome.pid, "SIGKILL"); } catch {} };
process.on("exit", killAll);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { killAll(); process.exit(130); });
const done = (code) => { killAll(); try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); };
setTimeout(() => { console.error("TIMEOUT"); done(3); }, 150000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 150 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
  if (!target) await sleep(100);
}
if (!target) { console.error("Chrome never came up - is CHROME right?"); done(3); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const waiting = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => {
  const m = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 600));
  return m.result?.result?.value;
};

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: URL });
await run(`new Promise((r) => { const c = () => (document.body && window.ScrollTrigger && !document.body.classList.contains("is-loading")) ? r(1) : setTimeout(c, 100); c(); })`);
await sleep(600);

await run(`
window.__frames = (n) => new Promise((r) => { let c = 0; const f = () => (++c >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.__pins = () => ScrollTrigger.getAll().filter((t) => t.pin);
window.__stale = () => __pins().map((t) => {
  const box = (t.pin.parentElement && t.pin.parentElement.classList.contains("pin-spacer") ? t.pin.parentElement : t.pin).getBoundingClientRect();
  return { pin: t.pin.className.split(" ")[0], staleBy: Math.round(box.top + scrollY) - Math.round(t.start) };
});
// read like a person: small native steps, which Lenis adopts while it is idle
window.__readTo = async (y) => { const step = 160; while (Math.abs(scrollY - y) > step) { window.scrollTo(0, scrollY + Math.sign(y - scrollY) * step); await __sleep(40); } window.scrollTo(0, y); await __sleep(700); };
// one wheel event per FRAME, not per timer tick: on a timer, a slow stretch let Lenis
// cover 200px+ a frame and a crossing could go by with no frame near it at all
window.__wheel = async (sel, which, dir) => {
  const st = __pins().find((t) => t.trigger.matches(sel)), el = st.pin;
  const b = which === "entry" ? st.start : st.end, span = 500;
  await __readTo(b - dir * span);
  const S = [];
  const tick = () => { const y = scrollY, top = el.getBoundingClientRect().top; const ideal = y < st.start ? st.start - y : y <= st.end ? 0 : st.end - y; S.push([Math.round(y - b), +(top - ideal).toFixed(1)]); };
  gsap.ticker.add(tick);
  const t0 = performance.now();
  while ((dir > 0 ? scrollY < b + span : scrollY > b - span) && performance.now() - t0 < 15000) { window.dispatchEvent(new WheelEvent("wheel", { deltaY: dir * 40, bubbles: true, cancelable: true })); await __frames(1); }
  await __frames(40); gsap.ticker.remove(tick);
  const near = S.filter((s) => Math.abs(s[0]) < 300), worst = near.reduce((a, s) => (Math.abs(s[1]) > Math.abs(a[1]) ? s : a), [0, 0]);
  return { at: sel.replace(/\\W+/g, "") + " " + which + " " + (dir > 0 ? "down" : "up"), maxErr: worst[1], frames: near.length };
};
window.__refreshes = 0; ScrollTrigger.addEventListener("refresh", () => window.__refreshes++);
1`);

// stale: at load, then after reading down to section 03
const staleFresh = await run("__stale()");
const orchStart = await run(`__pins().find((t) => t.trigger.matches(".orch__pin")).start`);
await run(`__readTo(${Math.round(orchStart - 700)})`);
const staleRead = await run("__stale()");

// jump: every boundary, both directions into a pin
const wheels = [];
for (const [sel, which, dir] of [[".orch__pin", "entry", 1], [".orch__pin", "exit", 1], [".rhythm__pin", "entry", 1],
                                 [".rhythm__pin", "exit", 1], [".rhythm__pin", "exit", -1], [".orch__pin", "entry", -1]]) {
  wheels.push(await run(`__wheel(${JSON.stringify(sel)}, "${which}", ${dir})`));
}
const refreshes = await run("window.__refreshes");

// stale, the class: 300px of late growth above both pins
await run(`(() => { window.scrollTo(0, 0); const d = document.createElement("div"); d.style.height = "300px"; document.querySelector(".setup .step:last-child .step__body").appendChild(d); return 1; })()`);
await sleep(900);
const staleLate = await run("__stale()");

const staleMax = Math.max(...[...staleFresh, ...staleRead, ...staleLate].map((s) => Math.abs(s.staleBy)));
const jumpMax = Math.max(...wheels.map((w) => Math.abs(w.maxErr)));
const thin = wheels.filter((w) => w.frames < 8);
const red = staleMax > 0 || jumpMax > 2 || refreshes > 0 || thin.length > 0;
const col = (a) => a.map((x) => x.staleBy).join("/");
console.log(`${W}x${H}  stale load ${col(staleFresh)} · read ${col(staleRead)} · late ${col(staleLate)}  refreshes while reading ${refreshes}`);
for (const w of wheels) console.log(`  ${w.at.padEnd(24)} ${String(w.maxErr).padStart(7)}px  over ${w.frames} frames${w.frames < 8 ? "  <- too few to judge" : ""}`);
console.log(red ? `RED    worst stale ${staleMax}px, worst jump ${jumpMax}px` : `GREEN  worst jump ${jumpMax}px`);
done(red ? 1 : 0);
