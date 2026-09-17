# APEX website

A scrolling story of the APEX build. **The sections follow deck v6 (the final deck)**, with two deliberate departures: section 01 is *the frontend* — a live Telegram phone that replaced the deck's "the idea" slide — and section 02 is *the setup*, which the deck never covered. It's a static site with no build step, and everything is local (fonts, GSAP, Lenis, images), so it works offline.

Page order: hero · the frontend · the setup · how they work together · recipe → cart · a day with APEX · thank you.

**Parked sections** live in `depricated_for_now.html`, out of the page on the user's note because section 03 and recipe → cart already cover the same ground: *the journey flow*, *brains and tools*, and *the build loop*. Their words, markup, motion and styles all stay in the repo, so putting one back means moving its `<section>` into `index.html` and renumbering — the render and motion blocks ask for their container first and skip while it's parked. That file is a holding pen, not a working page: it loads the CSS but not the scripts, so the lists inside it stay empty.

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
| `depricated_for_now.html` | Parked sections, kept whole and out of the page: the journey flow · brains and tools · the build loop |
| `js/content.js` | Repeated content (agents, the frontend chat, rhythm, models, tools, setup steps); edit words here |
| `js/render.js` | Turns `content.js` into markup |
| `js/hero.js` | The hero cast: the bubble that types itself out, and the lion loop (restarted per message, paused off screen) |
| `js/motion.js` | Smooth scroll, loader, cursor, menu, and each section's scroll animation |
| `css/base.css` | Colours, type, loader, cursor, nav, menu, hero layout, marquee |
| `css/hero.css` | The hero cast: the lion video (square, floor line, no masks) and the Telegram bubble |
| `css/sections.css` | the frontend (the Telegram phone) · the setup · the journey flow |
| `css/sections-2.css` | brains & tools · how they work together · recipe → cart · daily rhythm · build loop · thank you |
| `img/` | WebP copies of `tutorial/assets` (agents, framed Telegram crops, dashboard shots, Zepto cart) |
| `media/` | `apex-wave.webm` (alpha) + `apex-wave.mp4` (fallback) — the hero lion loop, silent — and its poster frame |
| `vendor/`, `fonts/` | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Bricolage Grotesque / Instrument Serif / JetBrains Mono |

## How sections move

- **Pinned** (desktop only, above 900px): how they work together (a request travels the wires), daily rhythm (a clock dial, day turns to night). The build-loop ring pinned the same way, and still would if it came back.
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

## The setup (section 02)

Five steps, in the order they have to happen, told as **building a being**: give it a body (install Hermes Agent) → bring it to life (the brain, a model) → ability to chat & store (Telegram, plus Gmail and GitHub to keep things in) → awakening consciousness (the soul, `SOUL.md`) → teach it the work (skills). The brief was explicitly *not* "go here, paste this" — the audience is CXOs, so each step is **one line** and the reasoning is his to say out loud.

An earlier round put that reasoning in hover "?" readouts on marked words. **They were removed**: they made the section verbose, and this audience skims rather than hunts. Don't reintroduce them.

The commands and prompt text are **real**, read off the Hermes 0.21.2 install on this Mac (`hermes_cli/setup.py`), not invented.

Changed on the user's note, and not to be walked back:

- **No "BotFather" and no "mouth".** Nobody outside Telegram knows the name, so the chat frame wears Telegram's own mark, and "Give it a mouth" read wrong. Step 03 is the chat alone, 10% narrower than its old half-width, with Gmail and GitHub marks beside it for storage. The terminal frames that sat beside the chat and above the skills shot are gone.
- **"Then let it run" is cut** — always-on goes without saying. Its slot went to **the soul**.
- **The soul frame quotes the real `SOUL.md`, trimmed**: who APEX is, how it talks, the hard rules. Its "Who you serve" block names the child and his date of birth, so it is **never** shown — same rule as the phone in section 01.
- **The skills shot is just the list**, `img/dash-skills-list.webp`, cropped from `dash-skills-personal.webp` at (488, 134)–(1340, 603). The numbered boxes and legend went with the rest of the tab.
- **Its "SKILLS" header is typeset, not captured** (`head` on the frame, `.shot2__head`), so it has to pass as part of the shot: the panel ink `#031c1d` and divider `#152e2c` sampled off the capture, a box icon, and wide-tracked capitals like the tab's own "PERSONAL" title. It sizes in `cqw` against the shot box, so it scales with the image rather than the page.
- **The setup ends on the skills step.** The "Every step also has a screen in the dashboard" note and the section it pointed to ("Where everything lives", the Hermes dashboard tour) were cut, and the sections after it moved up a number: the journey flow is now 03. `dash-skills-personal.webp` stays only as the crop source.
- The brand marks (`i-telegram`, `i-gmail`, `i-github`) are filled symbols in the sprite at the top of `index.html`. Use them as `.term__logo` / `.store__logo`, never `.ic`, which strokes.

Why the frames are markup and not screenshots, even though screenshots were asked for:

- **There are none to take.** The official docs ship no screenshots of the install or the wizard (checked: quickstart, messaging, telegram pages). Third-party BotFather tutorials have them, but they're someone else's phone and someone else's copyright, on a public repo.
- **A bitmap can't do what this section needs.** The highlights have to hold their place at every width, and the hotspots have to be hoverable and focusable. Both are free in markup and brittle-to-impossible in a PNG.
- Same privacy and weight argument as the phone in section 01.

The token is shown the way the wizard actually shows it — **hidden**. Hermes prompts for it with `password=True` and writes it to `~/.hermes/.env`, which is the only reason this step can appear on a public page at all (RULES 6).

**The Models-tab dashboard shot is deliberately not used.** Its "Mixture of Agents" row displays `openrouter/claude-opus-4.8`. The live `config.yaml` and `auth.json` are clean — it's a stale default in the capture, not a real setting — but the repo is public and the page says "never Anthropic" a few sections later. The Skills-tab shot is used instead; it was checked before shipping.

The **progress bar is the spine down the step-number gutter**. The brief said it must not take extra space, so it isn't a new element: the numbers were already sitting in that column, and the spine just runs through them and fills with scroll. Below 900px the gutter is gone, so it becomes a 3px five-segment rail that sticks under the nav.

Traps found building it, all of them live:

- **A hotspot must be `display: inline`, never `inline-flex`.** An inline-flex button is an atomic box, so the words after it break to a new line — `hermes skills browse` rendered as `hermes skills` / `browse` inside the terminal frame. Same reason `.ln` uses `overflow-wrap: break-word` and not `anywhere`, which splits mid-token.
- **The HUD must stay `position: relative` on mobile, not `static`.** Its scan lines and corner brackets are absolutely positioned children; against a static parent they resolve their inset against `.step` and draw two stray teal rules down the entire step.
- **The HUD needs its own `font-family`.** It lives inside `.term__body`, so it inherits the terminal's monospace and the prose comes out as code.
- **Box-drawing corners spill.** `┌─ … ─┐` put the `┐` alone on the next line; horizontal rules only.
- `.step`'s dimming is a CSS opacity transition, so **no GSAP tween may touch its opacity** — the same one-owner-per-property rule as the hero and the phone. GSAP owns only the spine's `scaleY`.
- A step with a screenshot never goes two-up: at half column width the dashboard capture is unreadable, which defeats the point of showing it. `render.js` only adds `--two` when every frame in the step is a text frame.
- **Scripted scrolling lies here.** `window.scrollTo` bypasses Lenis, so ScrollTrigger never updates and every step looks inactive. When checking with agent-browser, call `ScrollTrigger.update()` after the jump, or scroll with real wheel events.

### The assembly rig (the lion on the right)

As the five steps scroll past, APEX builds himself in the right-hand column: bare chassis → skull with the AI brain lit → armoured with the Google and GitHub badges → the same stage with a soul glowing round him → fully awake for the skills. Art is `img/apex-rig-{1-body,2-brain,3-face,5-alive}.webp`. **`4-limbs` is not shown**: its "skill.md" lettering over the arms and legs read as noise, so the skills step uses the calm, awake stage instead.

- **The soul is not new art.** The armoured stage lists two steps (`at: [2, 3]`, rendered as `data-at="2 3"`), so it holds instead of fading out and back in, and `fx: "soul"` adds two layers round it: a gold copy of him blurred into a halo behind (`z-index: 0`), and motes rising in front (`z-index: 2`). The halo breathes and the motes rise only while that step is on, and neither moves under reduced motion. The originals and the exporter that normalises them live in **`apex_leo/tutorial/assets/rig-src/`** (outside this public repo, since they're large) — `export_rig.py` there regenerates all five, and its `SRC` table holds the hand-tuned scale and offset per image.

- **Each file is a complete STAGE, not a single part**, so exactly one shows at a time and they cross-fade. `motion.js` tests whether the layer's `data-at` list includes the step, never `<= i`. Stacking them would show the skeleton's splayed arms poking out from behind the finished lion, because the art is transparent.
- **They share no source framing** and never will: feet sat at 92.0% / 98.2% / 98.0% of three different canvases, one of them 912×1171 rather than square. They're normalised onto one 900×1125 canvas — feet on a common baseline, centred, **scale hand-tuned per image**.
- **Four automatic scale landmarks were tried and all failed**: total height (oversizes the headless skeleton), figure width (the skeleton's splayed arms vs the lion's tail and aura), leg span (contaminated by hanging hands in some frames and not others), leg length (armour lowers the visible crotch, giving 313/287/**195**), and hip width (skeletal bodies are open, so the run at the midline is a thin strut — 58/152/233/**21**/88, i.e. scale factors up to 14×). These drawings have different anatomy; stop trying to derive it and tune five numbers by eye against drawn guides.
- **Backgrounds are transparent, never a filled panel.** Filling them with the page ink and saving lossy WebP drifted the flat field off `#0b1312` and drew a visible rectangle — faint on desktop, obvious behind the sticky mobile rig. With alpha there is no flat field to drift, and lossy is then fine: 172.6 KB for all five, against ~900 KB lossless.
- **Keying is "near background AND reachable from the edge"**, the second test done by flood-filling a quarter-scale copy. Enclosed darks — the lion's black eyes and nose, the skull cage interior, joint shadows — are near-background but *not* edge-reachable, so they stay opaque; the colour test keeps the edge pixel-sharp. A plain colour threshold would have eaten the eyes. Verified by compositing the exports over magenta (`alpha-check.png`), which also shows a dark halo retained around the glow in stages 3–5 — invisible on this page, since it is near-black on near-black.
- **On phones every column in this section is `minmax(0, 1fr)`, never a bare `1fr`** (`.setup__grid`, `.step`, `.step__frames`). A bare `1fr` floors at min-content, and the unbreakable install command in step 01 pushed every frame 31px past the screen edge.
- **The grid stays single-column until a layer actually loads** (`.setup__grid.has-rig`, set from an `img` load event). Without it the steps give up 400px to an empty sticky box on desktop and a blank opaque 30vh band on phones.
- Step triggers fire at `top 55%`, not `70%`: a step is only ~520px tall, so at 70% the *next* step crossed the line while the current one still filled the screen and the rig ran a beat ahead of the copy.
- Pure-Python per-pixel loops over a 900×1125 canvas time out. Use `ImageChops` + `point` + `getbbox` (C speed) and confine the flood fill to the quarter-scale copy. And **macOS has no `timeout`** (RULES 20) — a `timeout 110 python …` line fails as "command not found" and the heredoc silently never runs, which looks exactly like a successful no-op.

## How they work together (section 03)

Moved above the journey flow, so the layers come before the deep dive into a skill. Four layers, one per caption: **you** (or a schedule) → **the soul** (APEX, the LLM) → **skills** → **scripts** (COLONY), plus an optional tools layer. The stage walks **one real job, MISO's Sunday recipe**, leg by leg:

1. you (or the schedule) → the soul
2. the soul → the skills arc. The seven specialists sit small and close on an arc; MISO, on the wire line, is picked and **grows where she stands**, on top of her neighbours (`z-index`), showing her skill (`gut-health-chef`)
3. MISO → the script, carrying `{ shopping list }`, the fenced JSON her cron prompt asks her to end with
4. the script → the browser tool (**Browser → Zepto**), straight up, to fill the cart
5. the tool → the script, carrying `{ cart · nothing ordered }`
6. the script → you, on Telegram (the gold wire)

Why this route and not "the skill calls the tool and hands its answer back to APEX": the Sunday job (`dash-cron-edit-recipe.webp`) runs on the health-tuned model with the skill loaded and **delivers to Local**, not to a chat. The shopping is a script's job ("A script shops" in section 06), the result reaches Telegram without passing through APEX's chat (SOUL.md's context-recovery rule exists because of exactly that), and the SOUL.md rules say carts are filled but **never ordered**.

- **The heading is "The Journey Flow"**, which came over from the section this one replaced. It sits beside the eyebrow (`.shead--row`), not above it, because the pinned screen has no height to spare.
- **Pinning has to arrive and leave gently.** Three things do that together, and all three were added after it felt like the page "jumped to full screen and stuck": `anticipatePin: 1` (pins a touch early, which is what smooth scrolling needs), padding on `.orch` itself (the section scrolls normally through it before the pin catches and after it lets go), and a **short pin** — 300% over six legs, about 380px of scroll each. It was 420%, which froze the page for more than four screens. The daily rhythm pin got the same padding and `anticipatePin`.
- **The tools layer hangs off the scripts alone**, by one straight drop at x 1000; the dashed links up to the soul and the skills are gone. The band ends at x 1060 so its last chip, browser → Zepto, always sits over that drop however wide the chip's text runs.
- **The wires stop at the size MISO grows to** (radius ~42 units), not at her arc size, so the line never crosses her. Her label goes out to the **left**, into the gap between the soul and the arc: above and below are the next skills along, and to the right the shopping-list tag rides the wire into the scripts' own label. Labels are px while the diagram is `cqw`, so below an 820px stage she keeps her name and drops the skill under it, which would otherwise reach the soul.
- **`legs` in `motion.js` sets when each packet leaves**, in timeline seconds. The caption step, MISO's pick (`data-pick`) and the lit tool chip (`data-tool`) all read the **timeline's own clock** in its `onUpdate`, not the ScrollTrigger's progress. Scroll progress runs ahead of a scrubbed timeline, so MISO stepped forward before the packet reached her.
- **What a packet carries rides with it**: `data-tag` on the `.packet` becomes a label (`::after`), above it on flat wires and beside it (`data-side="left"`) on the climb to the tool.
- **You and the schedule share one circle.** The phone is you; the ticks round its rim are the clock, and its hand only runs on the scripts step.
- **The tools layer is optional**, but the walk-through's tool is not: switched off, the band and its sample chips go, and **Browser → Zepto** stays as a pill on its own, so the script still has somewhere to send the list. `flow` marks that chip in `layerTools`, and it goes **last**, because the script's wire rises to the band's right end.
- **Skill names and skills show on hover** (`skill` on each `team` entry, as named in SOUL.md); only the picked skill keeps its label on. On phones and under reduced motion the stage is static, with MISO already picked.
- **The stage is a query container** (`container: orch / inline-size`), so avatars size in `cqw` and the diagram scales as one picture. Chips drop their icons below a 760px stage and their names below 520px.
- **A node's box is its art alone**, centred on (x, y), and `.node__label` hangs below it; a label in the flow lifts the art off the wires. Labels carry the page ink as a background, so where the return wire passes one on a narrow stage it goes behind.
- The soul's wire reaches MISO through the gap between BULLSEYE and NYX. Move a skill on the arc and you move the gap.
