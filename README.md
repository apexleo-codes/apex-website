# APEX website

A scrolling story of the APEX build. **The sections follow deck v6 (the final deck)**, with two deliberate departures: section 01 is *the frontend* — a live Telegram phone that replaced the deck's "the idea" slide — and section 02 is *the setup*, which the deck never covered. It's a static site with no build step, and everything is local (fonts, GSAP, Lenis, images), so it works offline.

Page order: hero · the big idea · the frontend · the setup · how they work together · recipe → cart · a day with APEX · GTAmex · thank you.

**Presenting it to a room?** → or PageDown (what a clicker sends) steps to the next beat of the story, ← or PageUp goes back. See Presenter mode, below.

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
| `js/herofx.js` | The hero's stage light in WebGL: the lion drawn from the video under a spotlight that strikes on at the intro, dust in the beam, rims, a floor, and the spark that carries each message to the bubble |
| `js/rigfx.js` | The setup rig's soul (step 04) and ascent (step 05) in WebGL: a canvas behind the lion and one in front, centred on his stomach, with the tail masked out |
| `js/idea.js` | The big idea: the WebGL scene of points that re-form for each of its four lines, and the agents' faces that ride on it |
| `js/motion.js` | Smooth scroll, loader, cursor, menu, presenter mode, and each section's scroll animation |
| `css/base.css` | Colours, type, loader, cursor, nav, menu, hero layout, marquee |
| `css/hero.css` | The hero cast: the lion video (square, floor line, no masks) and the Telegram bubble |
| `css/idea.css` | The big idea: the sticky stage, its four lines, the team's faces and names |
| `css/sections.css` | the frontend (the Telegram phone) · the setup · the journey flow |
| `css/sections-2.css` | brains & tools · how they work together · recipe → cart · daily rhythm · build loop · thank you |
| `css/gtamex.css` | GTAmex (section 06): the side-quest game. The title and HUD, the drone flight on a framed screen with a glow sampled from the video, then a mission-select grid of clips and stills with a HUD that fills on scroll |
| `tools/build-rig.py` | Generated stage PNGs → the rig's cut-out, aligned WebPs (see the assembly rig, below) |
| `tools/og.html` | The link-preview card, `img/og.jpg` (1200×630, the site's own fonts and art); how to regenerate it is at the top of the file. The `og:` tags name the live site's URL, absolute, since most apps won't resolve a relative one |
| `tools/check-pins.mjs` | Headless check that the pinned sections arrive and leave without a snap — run it after touching anything above a pin (see How sections move) |
| `img/` | WebP copies of `tutorial/assets` (agents, framed Telegram crops, dashboard shots, Zepto cart) |
| `media/` | `apex-wave.webm` (alpha) + `apex-wave.mp4` (fallback) — the hero lion loop, silent — and its poster frame |
| `media/gtamex/` | Muted clips (h264 mp4, each with a first-frame WebP poster) and stills cut from the GTAmex gameplay reel. `drone.mp4` is a separate 720p60 recording used exactly as recorded (~53 real frames a second, nothing cropped or trimmed, so the game's letterbox bars and boot screens are part of it; the screen that holds it is 16:9). `dining`/`corridor` are sped up 2.5×/2× with the recorder's repeated frames dropped first. Motion interpolation (ffmpeg minterpolate) was tried to smooth the recordings and dropped: it garbles the game's fixed captions and smears thin poles |
| `vendor/`, `fonts/` | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Bricolage Grotesque / Instrument Serif / JetBrains Mono |

## How sections move

- **Pinned** (desktop only, above 900px): how they work together (a request travels the wires), daily rhythm (a clock dial, day turns to night). The build-loop ring pinned the same way, and still would if it came back.
- **Sticky**: recipe → cart — the phone stays put while the steps scroll past and its screen changes. This needs `overflow-x: clip` (not `hidden`) on `body`; `hidden` makes body a scroll container and sticky silently breaks. The big idea is sticky too, on every screen size (see its section).
- **Phones and reduced motion**: the same content with no pinning. Screenshots sit inline and every step is shown.

## The nav

- **The brand belongs to the hero, and goes with it** (`body.past-hero`). The nav blends with `mix-blend-mode: difference`, so past the hero the lion and the wordmark invert over whatever is behind them — a different picture in every section — and they read as debris sitting on the view. The chapter readout beside it already says where you are.
- **Faded, not removed.** The nav is a `1fr auto 1fr` grid; leaving the column in place keeps the chapter centred on the page and the menu button where it was.
- **Its trigger sets the class on `onRefresh` as well as `onToggle`.** A page opened deep — a `#hash`, or a browser restoring last time's scroll position — never crosses the line, so the toggle never fires and the brand sits there over a section it doesn't belong to.
- **The brand stays gone to the very last pixel.** The gate reads its trigger's *start* alone (`scroll() >= start`), never `isActive`: an end measured by that trigger is measured before the pins below add their scroll, so it landed around the daily rhythm and the brand came back over GTAmex and the thank-you on desktop (phones, with no pins, never showed it). A phone check can't catch this one — check at desktop width.
- **There is no scroll-progress bar under the nav.** There was; it read as a second, competing progress indicator next to the chapter readout and the setup section's own spine, and it was the one nobody needed. Don't re-add it without deciding what it says that those don't.

Gotcha: **nothing above a pin may change height after ScrollTrigger has measured the page.** It measures once and trusts it, so anything that grows later pushes the pinned sections down while their starts stay put — and the panel snaps on the way in, because the pin engages against a layout that no longer exists. This is what made sections 03 and 05 "jump to full screen": the setup's Skills screenshot was `loading="lazy"` with no reserved size, 0px tall when ScrollTrigger measured and ~400px once it loaded, which happens just before 03. Every pin below it started ~400px off. So:

- **Every lazy image in the flow reserves its box** — `width`/`height` attributes plus `height: auto`, or a CSS `aspect-ratio` (`.tgphoto`). Fixed-size avatars are fine as they are.
- **`motion.js` refreshes ScrollTrigger when the page's height really changes** (a `ResizeObserver` on `main`, compared against the height of the last refresh, so a refresh can't set off another). That catches the next image someone forgets, and a font that swaps in late. It does not fire during ordinary scrolling — the check below counts.
- **`node tools/check-pins.mjs`** (dev server running) proves it: it measures each pin's start against the real layout at load, after reading down like a person, and after injecting 300px of late growth; then wheels through every pin boundary via Lenis and compares the panel's position on every frame with a perfect pin. Before the fix: 384px stale, 384px snap. After: 0px stale, ≤0.4px, at 1024×768 through 1920×1080.

Gotcha: ScrollTriggers are created in code order, not page order. `refreshAll()` sorts them, and chapter triggers use `refreshPriority: -1`, so pin spacing is counted. Keep that when adding pinned sections.

Gotcha: never point GSAP `autoAlpha` at an element that also has a CSS `transition: opacity`. The hero bubble has one, and a `from({ autoAlpha: 0 })` on it left it stranded at `opacity: 0; visibility: hidden` — the transform half of the very same tween finished normally, the opacity half never reverted, and nothing threw, so the bubble simply never appeared while every other animation looked fine. (The lion uses `autoAlpha` happily; it carries no opacity transition.) So each property has one owner: CSS fades the bubble — `opacity: 0` until `js/hero.js` adds `is-live`, then `is-out` between messages — and the intro tween animates transform only. `.bubble-wrap` splits the GSAP owners too: `motion.js` parallaxes the wrapper, the intro tween moves the bubble.

Same rule for initial hidden states: keep them in CSS, not JS. The reduced-motion path takes an early return out of `hero.js`, so anything hidden only on the normal path shows up wrongly for reduced-motion visitors. (An earlier SVG lion left his mouth hanging open exactly this way.)

## The hero's stage light

The hero used to be a lion standing in empty dark, and nothing happened when he spoke. Now he is **on a stage**: after the loader he stands in the dark, a spotlight strikes on him — two false starts, then it catches — lands on his face alone, holds there, and opens out to his whole body and the floor. After that the light stays alive: dust drifting in the beam, a warm rim on the edges that face the lamp and a cool one on his far side, his reflection on a glossy floor. Each message he sends **leaves his chest as a spark**, curves round his side and lands on the bubble, which catches the light. Keynote-reveal, in the site's own art.

- **The canvas draws HIM, not just the light behind him.** The video is uploaded as a texture every new frame (`requestVideoFrameCallback`), and lit in the shader — the pool on him, the rims following the wave frame by frame. A glow behind a figure reads as a sticker; light on him makes it one scene. The `<video>` stays in the page, playing, at `opacity: 0` (`.hero.has-gl`), as the source.
- **The clip's matting keyed out every dark detail** — eyes, brows, nose, mouth, paw pads, joints are *holes*; the page showed through them. A light behind him shone through his eyes and a rim ringed them. So each new frame is read back at 256², the transparent pixels flooded in from the border, and whatever transparent is left (enclosed by him) is a hole, drawn as the page's ink. 1.5 ms a frame, 24 frames a second. The rims test against this filled outline, never the raw alpha.
- **He has a crown again.** The clip cuts straight across the top of his mane (x 29%–71% of the frame); under a spotlight that edge read as a cut. The shader mirrors the mane's own top rows upwards inside a low faceted roof that continues the mane's slopes. Reduced motion and the no-WebGL fallback still show the plain clip.
- **The pool lands on him as a disc, not the cone's stripe.** A 2D cone crossing him draws a hard vertical band; a spot on a subject is round. The disc sits on his face while the light is narrow and on his middle once open.
- **The floor light is centred on his feet and runs back behind him**, so there is no line where it starts. The old *gold pool behind him* (base.css) was removed because a pool at mid-height with no source read as an odd elliptical light; this one sits under a beam you can see hitting it.
- **It takes over only at the intro, and only if it can.** `motion.js` calls `claim()` as the intro starts: no frame yet, a video without real alpha (a browser that played the keyed mp4), a tainted read (`file://`), reduced motion or no WebGL — any of these, and the hero is exactly as it was, with the old fade-in. A stage that took over later would swap him under the reader's eyes.
- **The intro waits for the light**: the strike is his entrance, so the bubble comes in at 2.1 s instead of with him, and the first message at 2.45 s. `reveal(at)` takes seconds-in, for shooting a phase on a frame sheet.
- **The lights go down as the hero scrolls away** (to ~45%), and the canvas only runs while the hero is on screen. 60 fps on the 2019 Intel MacBook at 1.5× on a 2× screen. A GPU switch (a projector) loses the context; it is rebuilt on restore — tested with `WEBGL_lose_context`.
- **The canvas sits under the copy and the bubble** (JS sizes it round the stage, the hero's full height); `.hero__visual` carries `z-index: 1` so the bubble stays above it. It is absolutely placed and never changes the page's height, so the pins are untouched — `check-pins` GREEN at 1440×900 and 1024×768.

## The big idea (between the hero and 01)

The one thing the rest of the page shows but never says: **what makes this an agent and not a chatbot.** Four lines, one at a time, each over a formation of a few thousand points of light: a question waiting in a chat bubble ("Most AI waits for a question") → APEX himself ("APEX doesn't wait") → the team, APEX in the middle and the seven specialists round him with the work streaming out along the spokes ("One lead, seven specialists") → the shield with its tick ("The big calls stay mine"). The thank-you's three things to remember are the same three claims, turned into advice. It is part of the intro, so it has no number and no chapter: the nav keeps saying 00 Intro, and nothing below it was renumbered.

- **Every point carries its place in all four formations**, and the vertex shader moves it between them, so a frame costs the CPU a handful of uniforms however many points there are (7,000; 4,200 on a phone). Measured at a flat 60 fps. Raw WebGL, no library: nothing to vendor, and the scene is one file.
- **Sticky, not pinned.** The stage is `position: sticky` inside a 380svh section, and a plain ScrollTrigger reads its progress. Sticky adds no pin-spacer and never changes the page's height after ScrollTrigger has measured it, so the two pins below can't be knocked off by it — `tools/check-pins.mjs` stays GREEN at 1440×900 and 1024×768. Because it isn't a pin, it runs the same on a phone. `svh`, so a phone's address bar showing and hiding doesn't resize the section under the reader.
- **Scroll picks the formation; `KEYS` in `js/idea.js` lays it out** — a hold long enough to read each line, and the morphs between the holds. `holds` (the middle of each hold) is exported for presenter mode; move one and move the other.
- **The points are shuffled between formations.** Without it the points that drew the bubble's rim would all become the lion's feet, and a morph would read as one shape sliding into another instead of pouring apart and back. Mid-morph each point swirls out and towards you on its own delay, which is what makes it look poured.
- **The shapes are sampled, not modelled**: each is drawn on a scratch canvas and points are taken off its painted pixels. The lion is `img/apex-rig-5-alive.webp`, the setup rig's last stage, in his own colours — the same figure the setup builds a few screens later. If that image can't be read (a `file://` page taints the canvas) the formation falls back to the APEX wordmark.
- **`img.decode()` never settles while the page is hidden.** Waiting on it meant a link opened in a background tab sat unbuilt until someone looked at it; the scene waits on the image's load event instead.
- **The build waits for the page to load and then for an idle moment.** Sampling is main-thread work, and it must never cost the loader or the hero intro a frame. The lines are markup and are there from the start regardless.
- **The faces are DOM, the points are GL.** `render.js` builds one face and name per agent (not COLONY: scripts, not an agent), and `idea.js` places them every frame with the same projection as the shader, so they sit in the middle of their own halo as the scene sways. One owner per property, as everywhere else: JS owns their `transform` and the `--team` fade; CSS owns the lines' swap, and nothing animates those from JS.
- **The names hang below the halo, not inside it**: additive light behind small text washes it out.
- **It survives the GPU changing under it.** On a MacBook with two GPUs, plugging in a projector can switch GPUs, which loses every WebGL context. The context asks for `low-power` (a few thousand points need nothing more, and asking for the big GPU is what triggers the switch), and on `webglcontextrestored` the program and the buffer are rebuilt from the points kept on the CPU side. Tested with `WEBGL_lose_context`.
- **Reduced motion**: no morph and no drift; the formation changes with the line, one still frame each time. **No WebGL**: `.idea--flat` hides the canvas, the lines still swap, and the team shows as a plain row on its beat.
- Words: the four lines are in `index.html`; the agents' plain-word jobs are `role` on each `team` entry in `content.js`, shared with the curtain call.

## Presenter mode

For showing the page to a room from a laptop: **→ or PageDown** glides to the next beat, **← or PageUp** to the one before. PageDown/PageUp are what a presentation clicker sends, so a clicker just works. The menu says so, in one line, where only someone looking for it will read it; a small counter (`12 / 35`) shows for a moment after each press.

- **A beat is a place where something has just finished happening**: each formation of the big idea, each setup step once its stage has landed on the rig, the moment each packet arrives in the journey, each hour on the clock, each recipe step, the GTAmex flight and grid, the takeaways, the thank-you. Every press stops on a settled frame, never halfway through a morph.
- **Built at the moment of the press, from the live layout and the live pins** — never a list made at load, which would go stale the way the pins' starts once did.
- **Setup steps stop just past the rig's window** (the incoming heading's travel from `START` 25% to `END` 3% of the screen), so the picture has converged when you land. Step 01 needs no stop of its own: the section's heading beat shows it whole.
- **The journey stops where each packet arrives**, as fractions of the pin: `legs` are timeline seconds on a 5.7 s timeline, nudged a little late because the scrub trails the scroll. Change `legs` and change these.
- **Quick presses count from where the glide is headed**, not from where the page is, so three clicks go three beats.
- Ignored while the menu is open, while the loader runs, and in form fields; ← and → are free to take because the page never scrolls sideways.

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

As the five steps scroll past, APEX builds himself in the right-hand column: bare skeleton → skull with the AI brain lit → armoured with the Google and GitHub badges → the same stage with a soul burning round him → ascended for the skills. Art is `img/apex-rig-{1-body,2-brain,3-face,5-alive}.webp`, cut and placed by `tools/build-rig.py` from the generated PNGs in `art/` (gitignored — they are ~12 MB and the WebPs are the deliverable). **`4-limbs` is not shown**: its "skill.md" lettering over the arms and legs read as noise, so the skills step uses the ascended stage instead.

**The four stages are one drawing.** They were generated as the same figure with one thing changed each time, so below the neck they superimpose to the pixel — the right foot's inner toe starts on the same column in all four. Everything else in this section is built on that, and it is worth checking (`--check`) before trusting it.

- **Align on the FEET, never the canvas and never the head.** The canvas is whatever size that generation run exported at (the current four came back 1844×2304 and 1122×1402); the head is *meant* to disagree, since stage 2's mane is drawn larger than stage 1's skull. The feet are the same drawing in all four, so the anchor is the floor line plus the centre between the feet, measured off the silhouette. On the current art that is a **whole-pixel translation of 3px at most and no scaling at all** — all four land on floor `y=1020`, feet centre `x≈412.5`.
- **Don't fit the scale by silhouette overlap.** It was tried: a coarse-to-fine search maximising body IoU wanted to shrink `5-alive` by 0.8%, because its armour is genuinely beefier than the skeleton — the optimiser reads "more pixels" as "too big" and squashes real art. Landmarks that exist identically in every stage are the only safe input.
- **The generator's watermark comes off for free.** After the flat field is flooded from the border, only the blob holding the figure is kept, so a corner mark is dropped with no mask to maintain and no coordinates to update when the next run puts it somewhere else. It cost 3.3k px on stages 1 and 2; stages 3 and 5 came back clean.
- **Flood the background, don't threshold it.** The field is near-black and so are the eyes, the nose, the skull cage and the joint shadows. Flooding from the border reaches the first and not the second; a colour threshold eats the eyes.
- **Resampling premultiplies alpha** first. Straight RGBA drags the transparent pixels' black into every edge, and this art is all edges.
- **Backgrounds are transparent, never a filled panel.** Filling them with the page ink and saving lossy WebP drifted the flat field off `#0b1312` and drew a visible rectangle — faint on desktop, obvious behind the sticky mobile rig. With alpha there is no flat field to drift, and lossy is then fine: 267 KB for all four.

**The convergence.** Because the stages superimpose, a plain cross-fade between them looks like nothing happening. They implode instead: the stage you are scrolling towards starts at `scale(1.3)` and out of focus and collapses onto the one in place, which shrinks into it at `scale(0.86)` as it goes. The lion never travels; the change arrives on him.

- **Anchor each change to the INCOMING step's own heading — never to the gap between step tops.** That gap is the *previous* step's height, so measuring across it made a tall step stretch its change and a short one rush it, and every one of them ran early: the picture swapped while its words were still arriving at the middle of the screen. A step's picture now changes over the travel of that step's heading, from `START` (a quarter of the way down the screen — by then the heading has climbed three quarters of it and the body fills what's under it) to `END` (the very top). Same window on every step whatever it carries: measured across steps 340–600px tall, all four windows come out at the same 169px, with 273–509px of plateau between them where nothing moves at all.
- **The window trails the latch by design.** The step lights up at `top 55%`; its picture changes about 230px later, while you're reading the body. Both are deliberate and they are not the same instant.
- **`position()` clamps each window to the last one's end.** A step shorter than the window would open its window before the previous one closed, and the stage between them — the one you are reading about — would never be reached.
- **A boundary can opt out of the implosion** (`FLAT`, a set of the step it leaves *from*). 01→02 does: the brain lighting up is the event there, and a zoom on top of it fought the pulse for the same attention, so those two stages plainly cross-fade and the mane just grows in place. Note it writes `transform: "none"`, never `""` — an empty inline transform hands the layer back to the stylesheet's parked `translateY(16px)` and the figure drops 16px mid-fade.
- **`paint()` owns `is-on`, not the latch** — they have to agree. Every effect hangs off that class (so none of them burn a frame while their stage is off screen), and the picture now lands well after the step lights up; left on the latch, **the brain would glow over a skull that hasn't grown one yet**. Under reduced motion there is no `paint()`, so `setStep` sets it instead — hence the `rigScrubbed` flag.
- **`paint()` also owns `opacity`, `transform` and `filter` outright**, which is why `.rig.is-converging` kills the CSS transition on those properties. Left on, the transition smears each frame into the next and the figure arrives a beat after its step. Same one-owner-per-property rule as the hero and the phone.
- **Under reduced motion none of this runs** and the layers fall back to the plain `.is-on` cross-fade, which is why that rule is still in the stylesheet.
- Measured at **0.65 ms per scroll update** for all nine layers, so it needs no throttling.

**The effects** are `fx` entries in `setupRig`, positioned in percentages of the shared 900×1125 canvas — the landmarks are the brain at **46.9% × 29.1%**, the head top at **14.7%**, the floor at **90.7%**, and the figure spanning **20.4%–80.8%** across. `build-rig.py --check` prints the frame if new art moves them.

- **The image is always INSIDE the layer, never the layer itself.** The convergence owns the layer's transform, so anything that needs a transform of its own — the ascent's shake — has to sit a level down or the two fight.
- **An effect that wraps round him is two layers, not one**, because one layer cannot be both behind him and in front. `rig__fx--back` and `rig__fx--front` carry the depth; the stage images sit between them.
- **The brain glow is screened** (`mix-blend-mode: screen`), so it lights the gold art underneath instead of laying a grey disc on top of it. It carries the 01→02 transition on its own (see `FLAT` above), so it is a pulse *and* a shine: a specular band travelling across the core, clipped to the core's own ellipse so it never runs out onto the skull. It goes **across, holds, and comes back** — one sweep every few seconds is easy to scroll straight past — but it still rests at each end rather than oscillating without pause, which reads as a scanner rather than a shine.
- **The soul and the ascent both light HIM, not the space around him** — a second copy of the stage image, filtered to gold (`brightness(0) invert(1) sepia(1) saturate(…) hue-rotate(…)`) and blurred. Blurred wide it is a bloom; blurred tight it stays a rim on his outline. The ascent's version flickering on that rim is what makes it read as a power-up rather than a bonfire, which free-standing flame shapes did not: at the widths they needed they read as two light columns standing beside him.
- **The plume is two gradients on one element**, one at the body and one above the mane, so the energy reads as going up rather than as a lamp behind him.

**The soul and the ascent are WebGL** (`js/rigfx.js`), because at their size CSS could only fade a halo in: nothing *happened*. Two canvases wrap the figure — one behind him, one in front — and one fragment shader draws both, told which side it is. `motion.js`'s `paint()` hands over the rig's position every frame (2 is step 03, 3 the soul, 4 the ascent, fractions are the scroll between), and the effects ease towards it on their own clock, so a scrubbed ignition still moves like light.

- **03 → 04, the awakening**: motes gather in from all round and converge on his stomach; at the ignition (45% of the scroll) he flashes gold, a shockwave rings out, and the god rays burst from behind him, a band of light sweeping up his body as they spread.
- **04, the soul**: two fans of rays turning opposite ways, each ray its own length and frayed along it, over a soft volume of light; a heartbeat (lub-dub, about once a second) in the core behind his belly and faintly on it; a slow ring every few seconds; wisps orbiting his stomach on tilted rings, passing in front of him and behind.
- **04 → 05, the power-up**: a column of light, a shockwave rolling out from his feet, the sparks flung wide.
- **05, the ascent**: a flame aura hugging his body and closing into a crown over the mane, a pool of light and rings at his feet, sparks, and now and then lightning up one side. The shake on the image is still the CSS one.
- **Everything is centred on his STOMACH (46.2% × 60%), not the middle of the picture.** The head, torso and legs all agree on x 46.2%; the tail drags the art's bounding box - and anything centred on it - towards his left, which is exactly what made the old halo lean that way. So the back effects read a copy of his silhouette with the tail cut off (`TAIL_X`, 71.5%: the right arm ends at 70.8%, the tail starts past it); only the flashes that land on his body see the whole of him. The masks are built once from the stage art at 180×225: sharp, soft and wide (box-blurred three times each way), plus the whole outline.
- **The fire is his outline stretched upwards from his feet, narrower at each step, and averaged.** A max of copies shifted up stacked a stair at every copy's edge; stretching straight up extruded his arms into walls. Stretched *and* tapered, it closes into tips, and a per-pixel jitter on the stretch turns what's left into grain. The reach stays inside the canvas: fire that ran off its top got its crown sheared flat by the edge fade.
- **Nothing reaches a canvas edge**: the last tenth of each canvas fades out. The back canvas renders at 0.75× (it is glow; nobody can tell) and the lightning's noise only runs while a bolt is up — this is the most shader work on the page, and it only runs while steps 03–05 are lit and the rig is on screen.
- **smoothstep's edges are always in order** (`1. - smoothstep(lo, hi, x)`): reversed edges are undefined in GLSL, and fine in Chrome is not fine everywhere.
- **The CSS soul and fire are still in the stylesheet**, and still what reduced motion and a browser without WebGL get; `.rig.has-gl` hides them when the WebGL runs. A shader that fails to compile falls back to them, with a console warning, so a typo looks like "the old effects" rather than a blank — check `has-gl` on `.rig` before judging a change.
- A GPU switch (a projector plugged in) loses both contexts; they are rebuilt on restore, like the big idea's.

**Regenerating a stage so it drops straight in:** generate **from the existing art**, not from a text prompt alone — ask for the one change and nothing else, so the pose, the framing and the feet come back untouched. Feed the stage you are replacing (or `art/apex-rig-3-face.png`, the reference) as the input image. Then run `python3 tools/build-rig.py --check`: it prints the translation each stage needs, its feet span against the reference, and its body overlap, and warns on anything that drifted. A stage that wants real scaling is art that drifted — regenerate it rather than letting a resize paper over it.

- **On phones every column in this section is `minmax(0, 1fr)`, never a bare `1fr`** (`.setup__grid`, `.step`, `.step__frames`). A bare `1fr` floors at min-content, and the unbreakable install command in step 01 pushed every frame 31px past the screen edge.
- **The rig's negative `margin-top` only ever shows on step 01.** Everywhere below it the rig is stuck at `top`, so the margin moves its *unstuck* position and nothing else — and step 01 is the one step where that is where it sits. It was starting level with the step number, and the art carries 17% headroom above the mane, so the lion hung low beside his own heading; the margin is in `vw` because that headroom scales with the column.
- **The grid stays single-column until a layer actually loads** (`.setup__grid.has-rig`, set from an `img` load event). Without it the steps give up 400px to an empty sticky box on desktop and a blank opaque 30vh band on phones.
- Step triggers fire at `top 55%`, not `70%`: a step is only ~520px tall, so at 70% the *next* step crossed the line while the current one still filled the screen and the rig ran a beat ahead of the copy.
- Pure-Python per-pixel loops over these canvases time out — the source PNGs are up to 4.2M pixels. Use PIL's `ImageDraw.floodfill` (C speed) and numpy for the masks. **`Image.fromarray` hands back a read-only view of the numpy buffer**, and `floodfill` then writes into it silently doing nothing and reporting success; `.copy()` it first. And **macOS has no `timeout`** (RULES 20) — a `timeout 110 python …` line fails as "command not found" and the heredoc silently never runs, which looks exactly like a successful no-op.

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
- **Pinning has to arrive and leave gently.** Padding on `.orch` itself (the section scrolls normally through it before the pin catches and after it lets go), and a **short pin** — 300% over six legs, about 380px of scroll each. It was 420%, which froze the page for more than four screens. The daily rhythm pin has the same padding.
- **No `anticipatePin`, on either pin.** It was added when the page "jumped to full screen and stuck", but that jump was the pins' starts gone stale under a lazy image (see How sections move) — something `anticipatePin` can't reach. What it does do is pin *on purpose* a frame or two early, so every entry into a pinned range, down into the top or back up into the bottom, snapped the panel 60–100px. It exists for native scroll, where the compositor moves the page a frame before ScrollTrigger hears about it; Lenis scrolls from JS in the same tick that calls `ScrollTrigger.update`, so there is no frame to cover.
- **The tools layer hangs off the scripts alone**, by one straight drop at x 1000; the dashed links up to the soul and the skills are gone. The band ends at x 1060 so its last chip, browser → Zepto, always sits over that drop however wide the chip's text runs.
- **The wires stop at the size MISO grows to** (radius ~42 units), not at her arc size, so the line never crosses her. Her label goes out to the **left**, into the gap between the soul and the arc: above and below are the next skills along, and to the right the shopping-list tag rides the wire into the scripts' own label. Labels are px while the diagram is `cqw`, so below an 820px stage she keeps her name and drops the skill under it, which would otherwise reach the soul.
- **`legs` in `motion.js` sets when each packet leaves**, in timeline seconds. The caption step, MISO's pick (`data-pick`) and the lit tool chip (`data-tool`) all read the **timeline's own clock** in its `onUpdate`, not the ScrollTrigger's progress. Scroll progress runs ahead of a scrubbed timeline, so MISO stepped forward before the packet reached her.
- **What travels is a dot, with a small tag for what it carries** (`data-tag` on the `.packet` becomes a label, `::after`), above it on flat wires and beside it (`data-side="left"`) on the climb to the tool. **Cards were tried in its place and taken back out on the user's note — the dot was better.** A card per leg, saying what each layer adds, crowded the diagram; the dot keeps the stage a picture. The cards live on in the phone strip (below).
- **A comet rides behind the dot**: two dashes of a copy of each wire (`.comet`, a soft wide tail and a short hot core), slid along it with the dot, then drained into the stop it reaches. It is whiter than the wire under it — mint on mint showed nothing. The copies carry no `wire` class, so the dash-drawing and the gold ending never touch them.
- **The dot's halo breathes on its own clock** (`.packet::before`), so a dot the reader has stopped on is still alive. A pseudo-element, because GSAP owns the dot's transform and opacity.
- **Each stop sends out a ring as the dot lands** (`.ping`, one per arrival, placed like a node).
- **Once the last dot is home the whole route turns gold** (`data-done`) — the circle is closed. That is the section's final presenter beat.
- **The timeline is still exactly 5.7 s** (`legs` untouched; the rings and the drain fit inside the old padding), so presenter mode's arrival fractions still land on each arrival. Change the length and change those.
- **The captions column is 220–250px** (was 240–300px), which gives the stage ~8% more width at 1440×900. It can't grow much further: the screen's height caps it (`100vh - 310px`, at 1200:700).
- **Phones get the journey as a strip of cards to swipe** (`.jstrip`, from `route` in `content.js`): one per leg, saying what that leg carries — *Sunday, 9:30 AM* → *a job for MISO* → the shopping list → *fill the Zepto cart* → *3 items · ₹117 · nothing ordered* → the Telegram message. The card in view lights its leg gold on the stage above (`data-leg`) and dims the rest. It bleeds to the screen's edges so the next card peeks in, which is what says "swipe". Not on desktop, where the pin plays the journey, nor under reduced motion there.
- **`route`, not `journey`**: `APEX.journey` is the parked journey flow section's. A second `journey` key silently overrode it (the later key wins in an object literal, and nothing throws).
- **`.orch__body` is `minmax(0, 1fr)` on phones, never a bare `1fr`** — the strip's six cards floored the column at their combined width and blew the stage up past the screen.
- **You and the schedule share one circle.** The phone is you; the ticks round its rim are the clock, and its hand only runs on the scripts step.
- **The tools layer is optional**, but the walk-through's tool is not: switched off, the band and its sample chips go, and **Browser → Zepto** stays as a pill on its own, so the script still has somewhere to send the list. `flow` marks that chip in `layerTools`, and it goes **last**, because the script's wire rises to the band's right end.
- **The route is on the stage before anything travels it**: `render.js` lays a faint dotted ghost under every wire (one for the climb to the tool and the drop back, which share a line), so you see the whole circuit on arrival and each drawn wire reads as "it went this way". The ghosts carry no id and no `wire` class, so the pin's dash-drawing never touches them.
- **Skill names and skills show on hover** (`skill` on each `team` entry, as named in SOUL.md); only the picked skill keeps its label on. On phones and under reduced motion the stage is static, with MISO already picked.
- **The stage is a query container** (`container: orch / inline-size`), so avatars size in `cqw` and the diagram scales as one picture. Chips drop their icons below a 760px stage and their names below 520px.
- **A node's box is its art alone**, centred on (x, y), and `.node__label` hangs below it; a label in the flow lifts the art off the wires. Labels carry the page ink as a background, so where the return wire passes one on a narrow stage it goes behind.
- The soul's wire reaches MISO through the gap between BULLSEYE and NYX. Move a skill on the arc and you move the gap.

## The daily rhythm (section 05)

A **12-hour clock face**, so it reads like a clock on a wall rather than an instrument. Seven stops through one day, from the 7:30 AM brief to the 2:30 AM idea.

- **`h` counts straight through the day and past 24** — 01:00 is `25` — and the two consumers use it differently on purpose. Position takes `h % 12`, so the stops land where a real clock would put them and the day's two halves share the face. Rotation takes the raw `h / 12 × 360`, which just keeps climbing past 360° and round again: **taking the modulo there would send the hand spinning backwards** across the face every time the day crossed noon or midnight. From 9 AM to 9:30 PM it makes a full extra turn, which is what a real hand does over those twelve hours.
- **Times are written down once**, as 24h `t` in `content.js`. `clock12(t)` formats the 12h display for both the dial and the list, so the two can never drift apart, and it returns the time and the AM/PM separately so the meridiem can be set smaller than the digits it follows.
- **The night band on the rim is gone.** It ran 21:00–06:00, which is one arc only on a 24-hour face; on a 12-hour one it would cross both halves. The sun and the moon say it instead, which is also the thing the face itself cannot: **9 o'clock is two different times of day**. There are two of them, doing different jobs — a small one over the readout, stacked in one box so day↔night is a cross-fade in place and the centre's grid never reflows, and a big one over the top-left corner throwing light across the section.
- **The corner sky lives inside `.rhythm__pin`, not in the section.** The pin is what stays on screen while the day plays through; anything outside it scrolls away after the first stop. `isolation` on the pin keeps the sky's `z-index: -1` inside the pin — above the section's background, below the dial and the list — without needing to raise anything else.
- **At night it is moonlight, not an absence of light.** A dark gradient over a dark field shows nothing at all; the darkness is the section's own background, which was already switching. The wash only has to give that switch a source.
- **The orb is clear of both edges.** Hung over the corner it lost about a fifth of itself to the crop, and a cut-off circle reads as a mistake rather than as a body in the sky — there is no horizon here for it to be rising behind. Its inset is px and vh, never a percentage of the sky: the pin is a screen tall on desktop and half as tall again on a phone, and a percentage pushed the sun most of the way off the top down there.
- **The wash's origin follows the orb's centre**, so the light still reads as coming off it. Move one and move the other.
- **The hand swings in `setStop`, not in the pinned desktop story.** A phone never reaches that story, so the hand sat at midnight all the way down the page while the readout beside it said 10:45 PM.
- The stops' 12h positions (7:30, 8:15, 9:00, 9:30, 10:45, 1:00, 2:30) are all distinct, so no two dots land on top of each other. A new stop 12 hours from an existing one would collide — the fix is to move the stop, not the dial.
- **The list's time column is 78px, not 64.** "10:45 PM" is three characters longer than the "22:45" it replaced, and at 64px it wrapped.
- **"Right now" reads the same schedule against the real clock in India** (`.rhythm__now`, `js/motion.js`): the time, and which agent is up next and when — so the day on the dial is also today, and the room sees it isn't a mock-up. BULLSEYE counts only Mon–Fri, and MISO's Sunday job, which the dial leaves to the note, is counted too. It's information, not decoration, so it keeps updating under reduced motion; one line of fixed height inside the pin, so it can't move anything below.

## Thank you (section 07)

Three things to remember, then the curtain call, then questions.

- **The three takeaways are the big idea's three claims, turned into advice** a leader can act on: agents act, not just answer · give each agent one job · keep a human on the big calls. Same order as the big idea, so the page ends where it began.
- **The curtain call is the whole team in a line, APEX in the middle** (built in `render.js` from `team`). They come out from the middle and take a bow: GSAP owns the figure for the entrance and the image for the bow, and a hover lifts the figure on `translate`, so no two of them share a property. It replaced the lone lion that stood here. Below 560px the names go and the faces shrink so all nine still fit one line on a 375px phone.

## Working on it

Python's `http.server` sends no cache headers, so a browser happily keeps serving yesterday's `js/render.js` next to today's `index.html` — which looks exactly like a bug in the new code. Hard-reload, or serve with `Cache-Control: no-store` while iterating.
