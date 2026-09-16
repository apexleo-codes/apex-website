/* All site copy that repeats in lists. Source: APEX deck v6 (the final deck) — same order, same words.
   The build loop is the one extra section, kept late in the page. */
window.APEX = {
  jobs: [
    { key: "tusk", name: "TUSK", title: "Never miss baby's vaccine", sub: "Reminder, clinic message, voice note" },
    { key: "bullseye", name: "BULLSEYE", title: "Markets before 9:15", sub: "What moved overnight, and the India angle" },
    { key: "bolt", name: "BOLT", title: "Help in an emergency", sub: "112 / 108 first, nearest hospitals next" },
    { key: "miso", name: "MISO", title: "A gut-healthy Sunday", sub: "Recipe picked, grocery cart filled" },
    { key: "kitsune", name: "KITSUNE", title: "Ideas from GitHub trends", sub: "Researched overnight, ready by morning" },
    { key: "nyx", name: "NYX", title: "Bedtime thoughts", sub: "Two questions at night, a sharper idea by 7:30" }
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

  // slide 3 · where everything lives
  dashboard: [
    { name: "SKILLS", tab: "Skills tab", what: "Plain-English instructions that give the AI know-how for one task or tool" },
    { name: "SCRIPTS", tab: "Files tab", what: "Small programs for exact, repeatable work, like searching a shop or sending a message" },
    { name: "SCHEDULE", tab: "Cron tab", what: "An alarm clock that wakes an agent with a task at a set time" },
    { name: "BRAIN", tab: "Models tab", what: "The AI model that thinks, decides and writes, in chat and in every job" },
    { name: "SETTINGS", tab: "Config tab", what: "House rules: a backup brain if one is busy, the voice for voice notes, what needs my OK" },
    { name: "LOGS", tab: "Logs tab", what: "Why something didn't work" }
  ],
  flowstrip: ["Request", "Soul", "Skill", "Script", "Schedule / Send"],

  // slide 4 · the journey flow
  journey: [
    { head: "Request", body: "A message from me on Telegram, or a scheduled job.", icon: "message" },
    { head: "Soul", body: "Who APEX is and its ground rules. The parent brain reads it first, every time.", icon: "spark" },
    { head: "Skill", body: "Plain-English instructions that give the AI know-how for one task or tool.", icon: "book" },
    { head: "Script", body: "A small program for the exact action: search, fill the cart, send. Same result every time.", icon: "gear" }
  ],

  // slide 5 · one scheduled job, explained (markers sit on the cron screenshot, in % from its top)
  autopilot: [
    { head: "What to do", body: "“Create this Sunday's gut-health recipe”: the instruction for this run", y: 24.7 },
    { head: "When", body: "Every Sunday at 9:30 AM", y: 42 },
    { head: "Where the result goes", body: "Kept inside Hermes for now. At 9:45 a second job picks it up, fills the cart and sends it all to Telegram", y: 61 },
    { head: "Which skill", body: "The gut-health-chef skill", y: 76 },
    { head: "Which brain", body: "A nutrition-tuned model, just for this job", y: 95 }
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
