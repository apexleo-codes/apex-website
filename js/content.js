/* All site copy that repeats in lists. Source: APEX deck v6 (the final deck) — same order, same words.
   The build loop is the one extra section, kept late in the page. */
window.APEX = {
  // hero · what APEX says on Telegram while you read the page. Light on the
  // surface, but each line is one of the real jobs below (APEX · BULLSEYE · TUSK · NYX).
  hero: [
    { time: "08:12", text: "Hi Gaurav 👋 Since today you have an in office-meeting and I know you well, don't forget your wallet." },
    { time: "08:15", text: "Markets open in 43 minutes. Your brief is ready, so you can sound like you read it overnight." },
    { time: "09:00", text: "Baby's vaccine is Thursday, 11 AM. I've written the message for the clinic — you just press send." },
    { time: "22:45", text: "Two questions before bed. Answer them half asleep; I'll have something sharper by 7:30." }
  ],

  // 01 · the frontend. One day in the chat, six jobs, in the order they happen.
  // The words are the real messages from the 14-15 Sep runs (sources in
  // tutorial/assets/), retyped as markup rather than shipped as screenshots:
  // the crops carry the child's name, his DOB and a live map pin, and this repo
  // is public. Retyped also means crisp at any zoom, ~0 KB, and seekable - a
  // recorded clip could never jump to the use case under the pointer.
  // "baby", never the child's name (deck rule).
  frontend: [
    {
      key: "tusk", name: "TUSK", emoji: "🐘", agents: ["apex", "tusk"],
      title: "Never miss baby's vaccine", sub: "A reminder, then a message you just forward", when: "09:00 · daily",
      msgs: [
        { by: "me", t: "07:28", html: "good morning APEX" },
        { by: "apex", t: "07:30", html: "☀️ <b>Good morning — Mon 14 Sep</b>\n\n📅 <b>Today</b>\n• Baby turns 2 on Thu 17 Sep — influenza (annual dose) + 2-year check-up due. Appointment not booked yet — slot it in today.\n• NSE closed for Ganesh Chaturthi. Next session Tue 15 Sep." },
        { by: "tusk", t: "09:00", html: "💉 <b>Vaccine reminder</b>\n\nDue Thu 17 Sep (in 3 days) 🎂\n• Influenza (annual dose)\n• 2-year well-child check-up\n\n🗂 Carry the vaccination card. Last doses: Hep A-2, Varicella-2 on 17 Mar 2026." },
        { by: "tusk", t: "09:01", html: "📝 <b>Message for the clinic — ready to forward.</b>\nYou press send, not me. I never message a clinic from your account." },
        { by: "tusk", t: "09:01", kind: "voice", html: "Voice note for the clinic · 0:18" }
      ]
    },
    {
      key: "bullseye", name: "BULLSEYE", emoji: "🐂", agents: ["bullseye"],
      title: "Markets before 9:15", sub: "What moved overnight, and the India angle", when: "08:15 · Mon–Fri",
      msgs: [
        { by: "bullseye", t: "08:15", html: "🌏 <b>Pre-market brief — Mon 14 Sep</b>\n\n<b>Bottom line:</b> Nifty likely to gap down at the open. Brent +3.9% to $107.62 on Hormuz disruption, weak US futures (−0.21%) and Asia's chip selloff override Friday's Wall Street rally." },
        { by: "bullseye", t: "08:15", html: "<b>Watch at the open</b>\n• OMCs, paints, aviation — crude above $107 squeezes input costs\n• IT majors — weak US futures + AI chip selloff\n• Banks/NBFCs — FOMC this week, 10Y at 4.97%\n\n<i>Not investment advice.</i>" }
      ]
    },
    {
      key: "bolt", name: "BOLT", emoji: "🐕", agents: ["bolt"],
      title: "Help in an emergency", sub: "112 / 108 first, nearest hospitals next", when: "any time you ask",
      msgs: [
        { by: "me", t: "01:18", html: "emergency, baby is ill" },
        { by: "bolt", t: "01:18", html: "🚨 <b>112</b> (national emergency)\n🚑 <b>108</b> (ambulance)\n\nGo now if: trouble breathing, chest pain, severe dizziness, confusion, or anything that feels life-threatening.\n\nShare your location and I'll list the nearest hospitals." },
        { by: "bolt", t: "01:18", kind: "button", html: "📍 Share location" },
        { by: "bolt", t: "01:20", html: "🏥 <b>Three hospitals within 4 km</b>, with distance and a phone number for each.\n\nI don't call them — you do." }
      ]
    },
    {
      key: "miso", name: "MISO", emoji: "🐼", agents: ["miso"],
      title: "A gut-healthy Sunday", sub: "Recipe picked, grocery cart filled", when: "Sun 09:30",
      msgs: [
        { by: "miso", t: "09:30", html: "🥣 <b>Ragi-Pear Porridge with Curd</b>\nRagi brings resistant starch and calcium, pear adds prebiotic fibre — a creamy gut feed in 15 minutes.\n\n⏱ 15 min · 🍽 Serves 2 + little one" },
        { by: "miso", t: "09:45", html: "🛒 <b>Added to the Zepto cart</b> (3 items, ≈ ₹117)\n• Daily Good Ragi / Finger Millet Flour — ₹40\n• Nutraj Flax Seeds — ₹50\n• Nandini Thick Curd Pouch — ₹27\n\nCouldn't find: pear\n\n<b>Nothing ordered</b> — review the cart and check out when you're ready." },
        { by: "miso", t: "09:45", kind: "photo", img: "zepto-cart", html: "Cart right now 👆" }
      ]
    },
    {
      key: "kitsune", name: "KITSUNE", emoji: "🦊", agents: ["kitsune"],
      title: "Ideas from GitHub trends", sub: "Researched overnight, ready by morning", when: "21:30 → 01:00",
      msgs: [
        { by: "kitsune", t: "21:30", html: "🔭 <b>Trend scout — Mon 14 Sep</b>\n\n<b>Hot on GitHub today</b>\n• colibri (+868★) — frontier MoE on your own hardware, pure C, zero deps\n• VoiceStudio (+2,632★) — local voice cloning, 646 languages\n• Agent-Reach (+640★) — agent eyes on the whole internet, no API fees" },
        { by: "kitsune", t: "21:30", html: "<b>3 ideas for the workshop</b>\n1) Local-voice Indian assistant — offline, vernacular\n2) Nifty retail trading agent — Indian market, retail UX\n3) OSINT globe + web agent — voice-controlled\n\nReply 1, 2 or 3, or 0 to skip." },
        { by: "me", t: "21:34", html: "2" },
        { by: "kitsune", t: "01:00", html: "📄 <b>Research & plan doc ready</b> — no code, just the plan. It'll come attached to your 7:30 brief." }
      ]
    },
    {
      key: "nyx", name: "NYX", emoji: "🦉", agents: ["nyx", "apex"],
      title: "Bedtime thoughts", sub: "Two questions at night, a sharper idea by 7:30", when: "22:45 → 07:30",
      msgs: [
        { by: "nyx", t: "22:45", html: "🌙 <b>Two quick ones before you sleep</b>\n\n1. Baby's about to turn 2 — what's something about this age you catch yourself explaining to your phone, that software could actually handle?\n\n2. If you could auto-generate one report from your GitHub repos every Monday — what would it tell you that you dig for by hand today?" },
        { by: "nyx", t: "22:45", html: "Reply in one message, text or voice. Answer half asleep — I'll work on it overnight and send you a sharper version at 7:30 AM." },
        { by: "me", t: "22:58", kind: "voice", html: "Voice note · 0:41" },
        { by: "apex", t: "07:30", html: "💡 <b>Overnight idea</b> — built from last night's answer. Title, a one-line pitch, and what to try this week.\n\nAnd that's how tomorrow starts. ☀️" }
      ]
    }
  ],

  // 02 · the setup, told as an assembly: each step bolts one more part onto APEX,
  // and the rig on the right builds him as the section scrolls (parts: setupRig).
  // Body = the install · brain = the model · face = Telegram, armour badges =
  // Gmail and GitHub, where it keeps things · soul = SOUL.md · fully awake =
  // the skills.
  // Real commands, read off the Hermes 0.21.2 install on this Mac
  // (hermes_cli/setup.py). Frames are markup, not screen grabs: the official docs
  // ship no screenshots of the wizard, and a bitmap can't hold a highlight that
  // stays put at every width. The token shows hidden, the way the wizard hides it.
  // ONE line per step, on the user's note - the reasoning is his to say out loud,
  // and a CXO skims the page rather than reading it. The hover readouts that used
  // to carry it were removed for the same reason.
  // No BotFather branding and no terminal beside the chat: nobody outside Telegram
  // knows the name, so the frame wears Telegram's own mark.
  // The soul is quoted from the real SOUL.md, trimmed. Its "Who you serve" block
  // names the child and his DOB, so it never appears here - this repo is public.
  // (The Models-tab shot is deliberately NOT used: its Mixture-of-Agents row
  // displays a Claude model this assistant never uses, and this repo is public.)
  setup: [
    {
      n: "01", tag: "Install Hermes Agent", key: "install",
      title: "Give it a body",
      lede: "One command puts everything on the machine.",
      frames: [{ kind: "term", chrome: "Give it a rebooted machine, or a Mac mini", lines: [
        { p: "$", big: true, html: "<mark>curl -fsSL hermes-agent.nousresearch.com/install.sh | bash</mark>" },
        { c: "out", big: true, html: "<mark>Installing</mark> uv · Python 3.11 · Node.js · ripgrep · ffmpeg" },
        { c: "ok", html: "✓ Hermes Agent v0.21.2 → ~/.hermes" }
      ] }]
    },
    {
      n: "02", tag: "The Brain", key: "brain",
      title: "Bring it to life",
      lede: "A model attaches. Now there is something in the room that understands English.",
      frames: [{ kind: "term", chrome: "Terminal — hermes setup", lines: [
        { p: "$", big: true, html: "hermes setup" },
        { c: "menu", html: "How would you like to set up Hermes?" },
        { c: "sel", html: "› Quick Setup — sign in, pick a model, done" },
        { c: "out", html: "── Inference Provider ──────────" },
        { c: "ok", big: true, html: "✓ provider <mark>nous</mark> · model <mark>longcat-2.0</mark>" }
      ] }]
    },
    {
      n: "03", tag: "The connections", key: "door",
      title: "Ability to chat & store",
      lede: "Telegram is how it speaks to me. Gmail and GitHub are where it keeps things.",
      frames: [
        { kind: "tg", chrome: "Telegram", lines: [
          { by: "me", html: "/newbot" },
          { by: "bot", html: "Alright, a new bot. Please choose a name." },
          { by: "me", html: "Apex" },
          { by: "bot", html: "Now choose a username. It must end in <b>bot</b>." },
          { by: "me", html: "Apexleo_bot" },
          { by: "bot", html: "Done! Use this token to access the HTTP API:\n<mark>••••••••:••••••••••••••••••</mark>" }
        ] },
        { kind: "store", label: "Keeps things in", items: [
          { logo: "gmail", name: "Gmail" },
          { logo: "github", name: "GitHub" }
        ] }
      ]
    },
    {
      n: "04", tag: "The soul", key: "soul",
      title: "Awakening Consciousness",
      lede: "Define the purpose of his existence and the moral compass to navigate through it.",
      frames: [{ kind: "soul", chrome: "~/.hermes/SOUL.md", lines: [
        { c: "lead", html: "You are <b>APEX</b> 🦁, the user's personal chief-of-staff. You lead a small team of specialist agents and you <mark>own the outcome.</mark>" },
        { c: "h", html: "How you talk" },
        { c: "li", html: "Lead with the answer or the action taken." },
        { c: "li", html: "Every message you send must be worth the notification." },
        { c: "li", html: "Match the language the user writes in (English or Hinglish)." },
        { c: "h", html: "Hard rules" },
        { c: "ol", html: "<b>Emergencies first</b> — always give <mark>112</mark> and <mark>108</mark> in the first reply." },
        { c: "ol", html: "<b>Human in the loop</b> — never message anyone other than the user." },
        { c: "ol", html: "<b>No spending</b> — carts may be filled; checkout is always the user's call." },
        { c: "ol", html: "<b>No medical diagnosis</b> — push towards a doctor when it's serious." },
        { c: "ol", html: "<b>Honesty</b> — never claim it's done unless the tool output confirms it." }
      ] }]
    },
    {
      n: "05", tag: "Skills", key: "skills",
      title: "Teach it the work",
      lede: "Plain-English briefs to master the execution of specific tasks.",
      frames: [
        // `head` is typeset over the capture in the dashboard's own panel style,
        // since the crop starts below the tab's real header
        { kind: "shot", img: "dash-skills-list", head: "Skills",
          alt: "The Hermes dashboard, Skills tab: the personal skills written for this assistant" }
      ]
    }
  ],

  // the rig: APEX assembling on the right as the steps go by. Each file is a
  // COMPLETE stage of the build, not a single part - skeleton, then +head, then
  // armoured, then awake - so exactly one shows at a time and they cross-fade
  // (motion.js). They were generated separately and share no framing, so they're
  // normalised here onto one 900x1125 canvas: feet on a common baseline, centred,
  // hand-tuned scale per image. Backgrounds are transparent - filling them with
  // the page ink and saving lossy WebP drifted the flat field off #0b1312 and drew
  // a visible rectangle. `at` is the step (or steps) that show it.
  // The soul is not new art: the armoured stage stays on through steps 3 and 4,
  // and `fx: "soul"` adds a golden glow behind him and motes rising in front, so
  // the lion doesn't blink out and back in between the two.
  // A layer whose file is missing removes itself, and the column then collapses.
  setupRig: [
    { at: 0, img: "apex-rig-1-body" },
    { at: 1, img: "apex-rig-2-brain" },
    { at: [2, 3], img: "apex-rig-3-face" },
    { at: 3, img: "apex-rig-3-face", fx: "soul" },
    // not 4-limbs: its "skill.md" lettering over the arms and legs read as noise
    { at: 4, img: "apex-rig-5-alive" }
  ],

  // used for avatars and colours across the page (musicians, model rows, the dial)
  team: [
    { key: "apex", name: "APEX", color: "#e8a84a" },
    { key: "tusk", name: "TUSK", color: "#35b3a1" },
    { key: "bolt", name: "BOLT", color: "#e25c50" },
    { key: "bullseye", name: "BULLSEYE", color: "#4fae68" },
    { key: "miso", name: "MISO", color: "#f08a3c" },
    { key: "nyx", name: "NYX", color: "#7d6ef0" },
    { key: "kitsune", name: "KITSUNE", color: "#4583ea" },
    { key: "forge", name: "FORGE", color: "#8c9db2" },
    { key: "colony", name: "COLONY", color: "#d6b33c" }
  ],

  // slide 4 · the journey flow
  journey: [
    { head: "Request", body: "A message from me on Telegram, or a scheduled job.", icon: "message" },
    { head: "Soul", body: "Who APEX is and its ground rules. The parent brain reads it first, every time.", icon: "spark" },
    { head: "Skill", body: "Plain-English instructions that give the AI know-how for one task or tool.", icon: "book" },
    { head: "Script", body: "A small program for the exact action: search, fill the cart, send. Same result every time.", icon: "gear" }
  ],

  // slide 6 · brains and tools
  models: [
    { name: "LongCat 2.0", why: "Fast and reliable with tools", agents: ["apex", "bolt"] },
    { name: "Solar Pro 4", why: "Ideas and structured thinking", agents: ["kitsune", "nyx"] },
    { name: "Ling-3.0 fin", why: "Finance-tuned market writing", agents: ["bullseye"] },
    { name: "Ling-3.0 santé", why: "Health- and nutrition-tuned", agents: ["miso"] },
    { name: "Laguna S 2.1", why: "Coding-tuned, on demand", agents: ["forge"] }
  ],
  backups: ["Gemini Flash", "Laguna S", "Solar Pro 4", "more"],
  tools: [
    { need: "Voice notes", uses: "Edge TTS · Indian English voice", alt: "Paid option: ElevenLabs, OpenAI TTS", icon: "mic" },
    { need: "Web search", uses: "DuckDuckGo (ddgs)", alt: "Paid option: Tavily, Firecrawl", icon: "search" },
    { need: "Market data", uses: "Yahoo Finance + Google News RSS", alt: "Paid option: market data feeds", icon: "chart" },
    { need: "Hospitals", uses: "OpenStreetMap", alt: "Paid option: Google Places", icon: "pin" },
    { need: "Browser", uses: "agent-browser + local Chrome", alt: "Paid option: Browserbase", icon: "cart" },
    { need: "Code home", uses: "Hermes's own GitHub: apexleo-codes", alt: "Kept apart from my personal repos", icon: "code" }
  ],

  // slide 8 · MISO recipe → cart
  task: [
    { head: "APEX wakes MISO", body: "A health-tuned model writes the recipe and a shopping list.", visual: "tg-t06" },
    { head: "A script shops", body: "Searches Zepto as a guest and fills the cart.", visual: "zepto-cart" },
    { head: "You get the result", body: "A summary and a cart screenshot on Telegram.", visual: "tg-t09" }
  ],

  // slide 9 · a day with APEX
  rhythm: [
    { t: "07:30", h: 7.5, key: "apex", label: "Morning brief", night: false },
    { t: "08:15", h: 8.25, key: "bullseye", label: "Pre-market brief", night: false },
    { t: "09:00", h: 9, key: "tusk", label: "Vaccine check", night: false },
    { t: "21:30", h: 21.5, key: "kitsune", label: "3 ideas from trends", night: true },
    { t: "22:45", h: 22.75, key: "nyx", label: "2 bedtime questions", night: true },
    { t: "01:00", h: 25, key: "kitsune", label: "Research doc", night: true },
    { t: "02:30", h: 26.5, key: "nyx", label: "Idea developed", night: true }
  ],

  // extra section, kept late: how the build itself ran
  loop: [
    { n: "01", head: "Decide", who: "me", me: true },
    { n: "02", head: "Build", who: "Claude Code" },
    { n: "03", head: "Test", who: "together" },
    { n: "04", head: "Ship", who: "Claude Code" },
    { n: "05", head: "Live test", who: "me, on Telegram", me: true }
  ]
};
