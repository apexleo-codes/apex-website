# APEX website

A scrolling story of the APEX build. **The sections follow deck v6 (the final deck)**, with two deliberate departures: section 01 is *the frontend* — a live Telegram phone that replaced the deck's "the idea" slide — and the build loop is an extra, kept late in the page. It's a static site with no build step, and everything is local (fonts, GSAP, Lenis, images), so it works offline.

Page order: hero · the frontend · where everything lives · the journey flow · brains and tools · how they work together · recipe → cart · a day with APEX · the build loop (extra) · thank you.

Repo: <https://github.com/apexleo-codes/apex-website> (public) · Live: <https://apexleo-codes.github.io/apex-website/>

## Run it

```bash
./serve.sh          # http://localhost:8080, opens the browser
./serve.sh 9000     # another port
```

Or use any static server from this folder (`python3 -m http.server 8080`). Opening `index.html` straight from Finder also mostly works, but a server is closer to real hosting.

## Files

| Path | What |
|---|---|
| `index.html` | Page skeleton: one `<section data-chapter>` per chapter, plus the static copy |
| `js/content.js` | Repeated content (agents, the frontend chat, rhythm, models, tools, dashboard steps); edit words here |
| `js/render.js` | Turns `content.js` into markup |
| `js/hero.js` | The hero cast: the bubble that types itself out, and the lion loop (restarted per message, paused off screen) |
| `js/motion.js` | Smooth scroll, loader, cursor, menu, and each section's scroll animation |
| `css/base.css` | Colours, type, loader, cursor, nav, menu, hero layout, marquee |
| `css/hero.css` | The hero cast: the lion video (square, floor line, no masks) and the Telegram bubble |
| `css/sections.css` | the frontend (the Telegram phone) · where everything lives · the journey flow |
| `css/sections-2.css` | brains & tools · how they work together · recipe → cart · daily rhythm · build loop · thank you |
| `img/` | WebP copies of `tutorial/assets` (agents, framed Telegram crops, dashboard shots, Zepto cart) |
| `media/` | `apex-wave.webm` (alpha) + `apex-wave.mp4` (fallback) — the hero lion loop, silent — and its poster frame |
| `vendor/`, `fonts/` | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Bricolage Grotesque / Instrument Serif / JetBrains Mono |

## How sections move

- **Pinned** (desktop only, above 900px): how they work together (messages travel along the wires), daily rhythm (a clock dial, day turns to night), the build-loop ring.
- **Sticky**: recipe → cart — the phone stays put while the steps scroll past and its screen changes. This needs `overflow-x: clip` (not `hidden`) on `body`; `hidden` makes body a scroll container and sticky silently breaks.
- **Phones and reduced motion**: the same content with no pinning. Screenshots sit inline and every step is shown.

Gotcha: ScrollTriggers are created in code order, not page order. `refreshAll()` sorts them, and chapter triggers use `refreshPriority: -1`, so pin spacing is counted. Keep that when adding pinned sections.

Gotcha: never point GSAP `autoAlpha` at an element that also has a CSS `transition: opacity`. The hero bubble has one, and a `from({ autoAlpha: 0 })` on it left it stranded at `opacity: 0; visibility: hidden` — the transform half of the very same tween finished normally, the opacity half never reverted, and nothing threw, so the bubble simply never appeared while every other animation looked fine. (The lion uses `autoAlpha` happily; it carries no opacity transition.) So each property has one owner: CSS fades the bubble — `opacity: 0` until `js/hero.js` adds `is-live`, then `is-out` between messages — and the intro tween animates transform only. `.bubble-wrap` splits the GSAP owners too: `motion.js` parallaxes the wrapper, the intro tween moves the bubble.

Same rule for initial hidden states: keep them in CSS, not JS. The reduced-motion path takes an early return out of `hero.js`, so anything hidden only on the normal path shows up wrongly for reduced-motion visitors. (An earlier SVG lion left his mouth hanging open exactly this way.)

## The frontend (section 01)

The phone is a **real DOM chat, not a recording**. Six chapters, one per job, in the order they happen across one day: it opens with "good morning APEX", plays itself through while the section is on screen, and hovering a job jumps the thread straight to that chapter. A chapter taller than the screen drifts slowly through the rest of its dwell, which is where the "self-scrolling" feel comes from.

Why not the GIF that was first considered:

- **A clip has no seek.** Hovering a job has to land on that job's messages. One clip plays a single fixed timeline, and six separate clips each restart at frame 0 on every swap, which loses the continuous scroll — the exact effect that was wanted.
- **Weight.** A readable phone-screen GIF (~390×844, ~20s) runs 8–25 MB in 256 colours, with fringing on the text. The whole `media/` folder is under 900 KB.
- **Privacy.** The real crops in `tutorial/assets/telegram/crops/` carry the child's name and DOB (t03, t05) and a live map pin (t13), and this repo is public. Markup means every word is chosen. The text is still the real message text from the 14–15 Sep runs (sources in `tutorial/assets/`), with "baby" in place of the name.

Gotcha: **there are two phones in the page now** — this one and recipe → cart. `render.js` fills the task one through `$(".task .phone__screen")`, scoped on purpose. Unscoped, `querySelector` takes the *first* `.phone__screen` in the DOM, which is now this section's: the recipe screenshots get injected over the Telegram chrome, `.tgthread` stops existing, and `setCase` throws on an empty chapter list. The symptom is a phone showing the Ragi porridge crop under the "Six jobs, one chat" heading.

Same property-ownership rule as the hero: **GSAP owns only the thread's `translateY`; CSS owns every fade** — the bubbles' staggered reveal and the day pills, both driven by `data-state` ("on" / "past" / "idle") on each chapter. Never animate a bubble with `autoAlpha`. The day pill fades with its chapter too; left always-on it hangs over an empty screen, because the messages beneath it are still idle.

The lion is a muted loop generated with Veo from the APEX avatar, shipped twice: `media/apex-wave.webm` (VP9, real alpha channel) as the first `<source>`, and `media/apex-wave.mp4` (h264, background keyed to the page ink) as the fallback for anything that can't take alpha. Words he says live in `js/content.js` under `hero`.

Why a video and not frames — measured on this exact clip, same crop, same quality target:

| | size | resolution |
|---|---|---|
| **VP9 WebM, alpha (shipped first)** | **544 KB** | 720×720, 24fps |
| **h264 mp4 (fallback source)** | **282 KB** | 720×720, 24fps |
| animated WebP | 889 KB | 700×720, 12fps |
| sprite sheet WebP | 427 KB | 14000×720 |
| sprite sheet, half size | 263 KB | 8400×432 |

h264 stores only what changes between frames, and this clip is a still character with one moving arm — its best case. Frames also cost far more memory: a 14000×720 sheet decodes to a ~40 MB bitmap, against one ~2 MB hardware-decoded frame buffer for the video. It stays cheap because `hero.js` pauses it whenever the hero leaves the viewport, and never starts it at all under reduced motion.

Alpha is what fixed the background, after masking failed twice. The clip's flat `#0d1614` backing **painted as `#0e1717`** in the browser — the levels shift happens in YUV decode, so no stored hex would ever have matched the page's `#0b1312`, and every vignette tuned to hide it either left a grey panel or ate his legs. With no background at all there is nothing to match, and both `mask-image` fades are gone.

The crop is square (720×720), centred on **x=640** of the source — where the mane and the feet independently measure their centre. Centring on the full bounding box instead pulls him off-axis, because the raised paw and the tail inflate it to the right; that was the visible lopsidedness.

Veo crops its input still to the output aspect ratio, so the source is cut flat across the mane crown and through the feet. Standing him on the floor line hides the feet; the crown cut sits above the visible framing. If the clip is ever re-shot from a **padded 9:16 still**, both go away.

No agent ring in the hero. It was tried twice — a flat rotating circle (they read as smudges on the lion) and electron-style orbits round him as a nucleus (rings invisible, agents shrunk to illegible specks). The stats already say "8 AI agents" inches away, and the team gets proper room further down the page.
