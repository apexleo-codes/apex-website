# APEX website

A scrolling story of the APEX build. **The sections mirror deck v6 (the final deck), slide for slide** — the only extra is the build loop, kept late in the page. It's a static site with no build step, and everything is local (fonts, GSAP, Lenis, images), so it works offline.

Page order: hero · the idea · where everything lives · the journey flow · put it on autopilot · brains and tools · how they work together · recipe → cart · a day with APEX · the build loop (extra) · thank you.

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
| `js/content.js` | Repeated content (agents, features, rhythm, models, tools, dashboard steps, next up); edit words here |
| `js/render.js` | Turns `content.js` into markup |
| `js/motion.js` | Smooth scroll, loader, cursor, menu, and each section's scroll animation |
| `css/base.css` | Colours, type, loader, cursor, nav, menu, hero, marquee |
| `css/sections.css` | the idea · where everything lives · the journey flow · autopilot |
| `css/sections-2.css` | brains & tools · how they work together · recipe → cart · daily rhythm · build loop · thank you |
| `img/` | WebP copies of `tutorial/assets` (agents, framed Telegram crops, dashboard shots, Zepto cart) |
| `vendor/`, `fonts/` | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Bricolage Grotesque / Instrument Serif / JetBrains Mono |

## How sections move

- **Pinned** (desktop only, above 900px): how they work together (messages travel along the wires), daily rhythm (a clock dial, day turns to night), the build-loop ring.
- **Sticky**: recipe → cart — the phone stays put while the steps scroll past and its screen changes. This needs `overflow-x: clip` (not `hidden`) on `body`; `hidden` makes body a scroll container and sticky silently breaks.
- **Phones and reduced motion**: the same content with no pinning. Screenshots sit inline and every step is shown.

Gotcha: ScrollTriggers are created in code order, not page order. `refreshAll()` sorts them, and chapter triggers use `refreshPriority: -1`, so pin spacing is counted. Keep that when adding pinned sections.
