const express = require("express");
const axios = require("axios");
const Jimp = require("jimp");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for custom images
app.use(express.static("public"));

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_CONFIGURED = Boolean(
  GROQ_KEY && !GROQ_KEY.includes("your_groq_key_here")
);

// Preload fonts for massive performance boost
const FONTS = {};
async function preloadFonts() {
  try {
    FONTS.largeWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    FONTS.mediumWhite = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    FONTS.smallWhite = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    FONTS.largeBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    FONTS.mediumBlack = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    FONTS.smallBlack = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    console.log("Fonts preloaded successfully.");
  } catch (err) {
    console.error("Failed to preload fonts:", err);
  }
}
preloadFonts();

const PREVIEW_SVG = {
  drake: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#f4f4f4'/><text x='240' y='150' font-size='26' text-anchor='middle' fill='#222'>DRAKE</text></svg>`,
  distracted: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#93c5fd'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>DISTRACTED</text></svg>`,
  two_buttons: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#ffe4bf'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>TWO BUTTONS</text></svg>`,
  brain: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#111827'/><text x='240' y='150' font-size='22' text-anchor='middle' fill='#fff'>EXPANDING BRAIN</text></svg>`,
  mocking_spongebob: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#fef08a'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>mOcKinG sPoNgEbOb</text></svg>`,
  woman_yelling_cat: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#cbd5e1'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>WOMAN YELLING</text></svg>`,
  change_my_mind: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#94a3b8'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>CHANGE MY MIND</text></svg>`,
  is_this_a_pigeon: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#bfdbfe'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>IS THIS A PIGEON?</text></svg>`,
  one_does_not_simply: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#7f1d1d'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>ONE DOES NOT SIMPLY</text></svg>`,
  success_kid: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#38bdf8'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>SUCCESS KID</text></svg>`,
  roll_safe: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#fca5a5'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>ROLL SAFE</text></svg>`,
  sad_pablo_escobar: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#a3a3a3'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>SAD PABLO</text></svg>`,
  hide_the_pain_harold: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>HIDE THE PAIN</text></svg>`,
  batman_slapping_robin: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#f87171'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>BATMAN SLAP</text></svg>`,
  disaster_girl: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#fb923c'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>DISASTER GIRL</text></svg>`,
  surprised_pikachu: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#facc15'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>SURPRISED PIKACHU</text></svg>`,
  this_is_fine: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#f97316'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>THIS IS FINE</text></svg>`,
  boardroom_meeting_suggestion: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#d8b4fe'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>BOARDROOM</text></svg>`,
  left_exit_12_off_ramp: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#34d399'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>LEFT EXIT</text></svg>`,
  epic_handshake: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#4ade80'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>EPIC HANDSHAKE</text></svg>`,
  two_spiderman: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#ef4444'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>TWO SPIDERMAN</text></svg>`,
  trade_offer: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#60a5fa'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>TRADE OFFER</text></svg>`,
  bernie_i_am_once_again_asking: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#818cf8'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#222'>BERNIE ASKING</text></svg>`,
  panik_kalm_panik: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#a78bfa'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>PANIK KALM PANIK</text></svg>`,
  always_has_been: `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><rect width='100%' height='100%' fill='#0ea5e9'/><text x='240' y='150' font-size='24' text-anchor='middle' fill='#fff'>ALWAYS HAS BEEN</text></svg>`
};

const TEMPLATE_FALLBACK_STYLE = {
  drake: { width: 900, height: 900, bg: 0xfff7edff, blocks: [0xffffffff, 0xffffffff] },
  distracted: { width: 900, height: 560, bg: 0x93c5fdff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  two_buttons: { width: 900, height: 650, bg: 0xffedd5ff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  brain: { width: 900, height: 1200, bg: 0x111827ff, blocks: [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff] },
  mocking_spongebob: { width: 900, height: 650, bg: 0xfef08aff, blocks: [0xffffffff, 0xffffffff] },
  woman_yelling_cat: { width: 900, height: 450, bg: 0xcbd5e1ff, blocks: [0xffffffff, 0xffffffff] },
  change_my_mind: { width: 900, height: 650, bg: 0x94a3b8ff, blocks: [0xffffffff] },
  is_this_a_pigeon: { width: 900, height: 650, bg: 0xbfdbfeff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  one_does_not_simply: { width: 900, height: 500, bg: 0x7f1d1dff, blocks: [0xffffffff, 0xffffffff] },
  success_kid: { width: 900, height: 650, bg: 0x38bdf8ff, blocks: [0xffffffff, 0xffffffff] },
  roll_safe: { width: 900, height: 650, bg: 0xfca5a5ff, blocks: [0xffffffff, 0xffffffff] },
  sad_pablo_escobar: { width: 900, height: 900, bg: 0xa3a3a3ff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  hide_the_pain_harold: { width: 900, height: 650, bg: 0xe5e7ebff, blocks: [0xffffffff, 0xffffffff] },
  batman_slapping_robin: { width: 900, height: 900, bg: 0xf87171ff, blocks: [0xffffffff, 0xffffffff] },
  disaster_girl: { width: 900, height: 650, bg: 0xfb923cff, blocks: [0xffffffff, 0xffffffff] },
  surprised_pikachu: { width: 900, height: 900, bg: 0xfacc15ff, blocks: [0xffffffff, 0xffffffff] },
  this_is_fine: { width: 900, height: 450, bg: 0xf97316ff, blocks: [0xffffffff, 0xffffffff] },
  boardroom_meeting_suggestion: { width: 900, height: 1200, bg: 0xd8b4feff, blocks: [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff] },
  left_exit_12_off_ramp: { width: 900, height: 900, bg: 0x34d399ff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  epic_handshake: { width: 900, height: 650, bg: 0x4ade80ff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  two_spiderman: { width: 900, height: 650, bg: 0xef4444ff, blocks: [0xffffffff, 0xffffffff] },
  trade_offer: { width: 900, height: 900, bg: 0x60a5faff, blocks: [0xffffffff, 0xffffffff] },
  bernie_i_am_once_again_asking: { width: 900, height: 650, bg: 0x818cf8ff, blocks: [0xffffffff] },
  panik_kalm_panik: { width: 900, height: 1200, bg: 0xa78bfaff, blocks: [0xffffffff, 0xffffffff, 0xffffffff] },
  always_has_been: { width: 900, height: 650, bg: 0x0ea5e9ff, blocks: [0xffffffff, 0xffffffff] }
};

const MEME_TEMPLATES = {
  custom: { url: "", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  drake: { url: "https://i.imgflip.com/30b1gx.jpg", boxes: [{ x: 0.53, y: 0.06, width: 0.42, height: 0.28 }, { x: 0.53, y: 0.58, width: 0.42, height: 0.28 }] },
  distracted: { url: "https://i.imgflip.com/1ur9b0.jpg", boxes: [{ x: 0.12, y: 0.7, width: 0.22, height: 0.2 }, { x: 0.41, y: 0.04, width: 0.22, height: 0.2 }, { x: 0.66, y: 0.7, width: 0.22, height: 0.2 }] },
  two_buttons: { url: "https://i.imgflip.com/1g8my4.jpg", boxes: [{ x: 0.05, y: 0.2, width: 0.26, height: 0.2 }, { x: 0.33, y: 0.2, width: 0.26, height: 0.2 }, { x: 0.2, y: 0.68, width: 0.35, height: 0.2 }] },
  brain: { url: "https://i.imgflip.com/2h7ezz.jpg", boxes: [{ x: 0.06, y: 0.05, width: 0.84, height: 0.16 }, { x: 0.06, y: 0.28, width: 0.84, height: 0.16 }, { x: 0.06, y: 0.51, width: 0.84, height: 0.16 }, { x: 0.06, y: 0.74, width: 0.84, height: 0.16 }] },
  mocking_spongebob: { url: "https://i.imgflip.com/1otk96.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  woman_yelling_cat: { url: "https://i.imgflip.com/345v97.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.4, height: 0.25 }, { x: 0.55, y: 0.05, width: 0.4, height: 0.25 }] },
  change_my_mind: { url: "https://i.imgflip.com/24y43o.jpg", boxes: [{ x: 0.3, y: 0.6, width: 0.45, height: 0.25 }] },
  is_this_a_pigeon: { url: "https://i.imgflip.com/1o00in.jpg", boxes: [{ x: 0.1, y: 0.1, width: 0.4, height: 0.2 }, { x: 0.6, y: 0.5, width: 0.3, height: 0.2 }, { x: 0.1, y: 0.75, width: 0.8, height: 0.2 }] },
  one_does_not_simply: { url: "https://i.imgflip.com/1bij.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  success_kid: { url: "https://i.imgflip.com/1bhk.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  roll_safe: { url: "https://i.imgflip.com/1h7in3.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  sad_pablo_escobar: { url: "https://i.imgflip.com/1c1uej.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.2 }, { x: 0.05, y: 0.4, width: 0.9, height: 0.2 }, { x: 0.05, y: 0.75, width: 0.9, height: 0.2 }] },
  hide_the_pain_harold: { url: "https://i.imgflip.com/gk5el.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  batman_slapping_robin: { url: "https://i.imgflip.com/9ehk.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.4, height: 0.25 }, { x: 0.55, y: 0.05, width: 0.4, height: 0.25 }] },
  disaster_girl: { url: "https://i.imgflip.com/23ls.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  surprised_pikachu: { url: "https://i.imgflip.com/2kbn1e.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  this_is_fine: { url: "https://i.imgflip.com/wxica.jpg", boxes: [{ x: 0.05, y: 0.05, width: 0.9, height: 0.25 }, { x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  boardroom_meeting_suggestion: { url: "https://i.imgflip.com/m78d.jpg", boxes: [{ x: 0.15, y: 0.05, width: 0.35, height: 0.15 }, { x: 0.55, y: 0.05, width: 0.35, height: 0.15 }, { x: 0.15, y: 0.55, width: 0.35, height: 0.15 }, { x: 0.55, y: 0.55, width: 0.35, height: 0.15 }] },
  left_exit_12_off_ramp: { url: "https://i.imgflip.com/22bdq6.jpg", boxes: [{ x: 0.3, y: 0.2, width: 0.3, height: 0.2 }, { x: 0.6, y: 0.2, width: 0.3, height: 0.2 }, { x: 0.4, y: 0.7, width: 0.4, height: 0.2 }] },
  epic_handshake: { url: "https://i.imgflip.com/28j0te.jpg", boxes: [{ x: 0.05, y: 0.4, width: 0.3, height: 0.2 }, { x: 0.65, y: 0.4, width: 0.3, height: 0.2 }, { x: 0.3, y: 0.6, width: 0.4, height: 0.2 }] },
  two_spiderman: { url: "https://i.imgflip.com/8p0a.jpg", boxes: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.2 }, { x: 0.6, y: 0.2, width: 0.3, height: 0.2 }] },
  trade_offer: { url: "https://i.imgflip.com/54hjww.jpg", boxes: [{ x: 0.05, y: 0.3, width: 0.4, height: 0.25 }, { x: 0.55, y: 0.3, width: 0.4, height: 0.25 }] },
  bernie_i_am_once_again_asking: { url: "https://i.imgflip.com/3oevdk.jpg", boxes: [{ x: 0.05, y: 0.7, width: 0.9, height: 0.25 }] },
  panik_kalm_panik: { url: "https://i.imgflip.com/3qqcin.jpg", boxes: [{ x: 0.5, y: 0.1, width: 0.45, height: 0.2 }, { x: 0.5, y: 0.4, width: 0.45, height: 0.2 }, { x: 0.5, y: 0.7, width: 0.45, height: 0.2 }] },
  always_has_been: { url: "https://i.imgflip.com/46e43q.png", boxes: [{ x: 0.1, y: 0.1, width: 0.4, height: 0.2 }, { x: 0.5, y: 0.1, width: 0.4, height: 0.2 }] }
};

async function getTrendingTopics() {
  return [
    "Skibidi Toilet",
    "Hawk Tuah",
    "Looking for a job in 2026",
    "AI stealing my code",
    "Debugging at 3am"
  ];
}

function fallbackLines(topic, template, boxCount) {
  const safeTopic = (topic || "this").toUpperCase();
  
  const customFallbacks = [
    [`NOBODY:`, `ME THINKING ABOUT ${safeTopic}`],
    [`WHEN YOU REALIZE ${safeTopic}`, `IS ACTUALLY HAPPENING`],
    [`I LOVE ${safeTopic}`, `SAID NO ONE EVER`],
    [`EXPECTATION: ${safeTopic}`, `REALITY: 🤡`],
    [`EXPLAINING ${safeTopic}`, `MY BRAIN AT 3AM`]
  ];
  
  const fallbacks = {
    custom: customFallbacks[Math.floor(Math.random() * customFallbacks.length)],
    drake: [`DOING ${safeTopic} NORMALLY`, `OVERCOMPLICATING ${safeTopic}`],
    distracted: ["NEW FRAMEWORK", "ME", `MY ${safeTopic} PROJECT`],
    two_buttons: [`FIX ${safeTopic} BUG`, "IGNORE IT", "SWEATING"],
    brain: [`LEARNING ${safeTopic}`, `UNDERSTANDING ${safeTopic}`, `MASTERING ${safeTopic}`, `LETTING AI DO ${safeTopic}`],
    mocking_spongebob: [`YOU CAN'T JUST MEME ${safeTopic}`, `yOu CaN't JuSt mEmE ${safeTopic}`],
    woman_yelling_cat: [`YOU SAID ${safeTopic} WAS EASY`, "ME DEBUGGING FOR 5 HOURS"],
    change_my_mind: [`${safeTopic} IS OVERRATED. CHANGE MY MIND.`],
    is_this_a_pigeon: [`ME LOOKING AT ${safeTopic}`, "IS THIS A FEATURE?", "BUGS"],
    one_does_not_simply: ["ONE DOES NOT SIMPLY", `UNDERSTAND ${safeTopic}`],
    success_kid: [`TRIED ${safeTopic}`, "IT ACTUALLY WORKED"],
    roll_safe: [`CAN'T FAIL AT ${safeTopic}`, `IF YOU NEVER TRY ${safeTopic}`],
    sad_pablo_escobar: [`WAITING FOR ${safeTopic}`, "STILL WAITING", "AND WAITING..."],
    hide_the_pain_harold: [`WHEN ${safeTopic} CRASHES`, "BUT YOU'RE ON CAMERA"],
    batman_slapping_robin: [`${safeTopic} IS AWESOME`, "NO IT IS NOT"],
    disaster_girl: [`ME DEPLOYING ${safeTopic}`, "PRODUCTION ENVIRONMENT"],
    surprised_pikachu: [`I IGNORED ${safeTopic}`, `NOW ${safeTopic} IS BROKEN`],
    this_is_fine: [`EVERYTHING IN ${safeTopic} IS ON FIRE`, "THIS IS FINE"],
    boardroom_meeting_suggestion: [`WE NEED IDEAS FOR ${safeTopic}`, "MORE MEETINGS", "WRITE DOCS", "ACTUALLY FIX IT"],
    left_exit_12_off_ramp: [`BEST PRACTICES FOR ${safeTopic}`, "HACKY WORKAROUND", "ME DOING THIS"],
    epic_handshake: [`PEOPLE WHO LOVE ${safeTopic}`, "PEOPLE WHO HATE IT", "ARGUING ONLINE"],
    two_spiderman: [`${safeTopic} DEV 1`, `${safeTopic} DEV 2`],
    trade_offer: [`I RECEIVE: YOUR FREE TIME`, `YOU RECEIVE: ${safeTopic}`],
    bernie_i_am_once_again_asking: [`I AM ONCE AGAIN ASKING FOR HELP WITH ${safeTopic}`],
    panik_kalm_panik: [`YOU START ${safeTopic}`, "IT SEEMS EASY", "THERE ARE 500 ERRORS"],
    always_has_been: [`WAIT, IT'S ALL ${safeTopic}?`, "ALWAYS HAS BEEN"]
  };

  const generic = [
    `WHEN ${safeTopic} STARTS`,
    "ME PRETENDING I GOT THIS",
    "STACK OVERFLOW OPEN",
    "IT WORKED... DON'T TOUCH"
  ];

  const lines = fallbacks[template] || generic;
  return lines.slice(0, boxCount);
}

async function generateMemeText(topic, template, apiKey) {
  const boxCount = MEME_TEMPLATES[template].boxes.length;
  const keyToUse = apiKey || GROQ_KEY;
  const isConfigured = Boolean(keyToUse && !keyToUse.includes("your_groq_key_here"));

  if (!isConfigured) {
    return fallbackLines(topic, template, boxCount);
  }

  const prompt = `Create a funny meme about "${topic}" using the ${template} template.
Generate EXACTLY ${boxCount} short, punchy text lines (max 50 chars each).
Return ONLY the lines separated by ||| with no extra text.

Examples:
Drake: Doing homework on time ||| Copying 5 mins before class
Distracted: My code working ||| Mysterious bug ||| Me ignoring it
Two Buttons: Write documentation ||| Ship broken code ||| Why is everyone confused?`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${keyToUse}`,
          "Content-Type": "application/json"
        },
        timeout: 8000 // 8-second timeout to ensure the app stays snappy
      }
    );

    const text = response.data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return fallbackLines(topic, template, boxCount);
    }
    return text.split("|||").map((t) => t.trim()).slice(0, boxCount);
  } catch (error) {
    console.error("Groq Error:", error.response?.data || error.message);
    return fallbackLines(topic, template, boxCount);
  }
}

function fillRect(image, x, y, width, height, color) {
  image.scan(x, y, width, height, function scanFn(px, py, idx) {
    const rgba = Jimp.intToRGBA(color);
    this.bitmap.data[idx + 0] = rgba.r;
    this.bitmap.data[idx + 1] = rgba.g;
    this.bitmap.data[idx + 2] = rgba.b;
    this.bitmap.data[idx + 3] = rgba.a;
  });
}

async function createFallbackTemplate(template) {
  const style = TEMPLATE_FALLBACK_STYLE[template];
  const image = new Jimp(style.width, style.height, style.bg);
  const boxes = MEME_TEMPLATES[template].boxes;

  boxes.forEach((box, idx) => {
    const x = Math.floor(style.width * box.x);
    const y = Math.floor(style.height * box.y);
    const w = Math.floor(style.width * box.width);
    const h = Math.floor(style.height * box.height);
    fillRect(image, x, y, w, h, style.blocks[idx % style.blocks.length]);
  });

  return image;
}

async function printMemeText(image, text, box) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const x = Math.floor(width * box.x);
  const y = Math.floor(height * box.y);
  const maxWidth = Math.floor(width * box.width);
  const maxHeight = Math.floor(height * box.height);
  const content = String(text).toUpperCase();

  const fontChoices = [FONTS.largeWhite, FONTS.mediumWhite, FONTS.smallWhite];
  const selected = fontChoices.find((font) => Jimp.measureTextHeight(font, content, maxWidth) <= maxHeight) || FONTS.smallWhite;
  const textHeight = Jimp.measureTextHeight(selected, content, maxWidth);
  const yCentered = y + Math.max(0, Math.floor((maxHeight - textHeight) / 2));

  const outlineOffsets = [
    [-2, 0], [2, 0], [0, -2], [0, 2],
    [-2, -2], [2, 2], [-2, 2], [2, -2]
  ];
  
  const blackFont = selected === FONTS.largeWhite
    ? FONTS.largeBlack
    : selected === FONTS.mediumWhite
      ? FONTS.mediumBlack
      : FONTS.smallBlack;

  outlineOffsets.forEach(([ox, oy]) => {
    image.print(
      blackFont, x + ox, yCentered + oy,
      { text: content, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
      maxWidth, maxHeight
    );
  });

  image.print(
    selected, x, yCentered,
    { text: content, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
    maxWidth, maxHeight
  );
}

async function createMeme(template, texts, deepFry, customImage) {
  let image;

  if (customImage) {
    const base64Data = customImage.replace(/^data:image\/\w+;base64,/, "");
    image = await Jimp.read(Buffer.from(base64Data, 'base64'));
  } else {
    const templateData = MEME_TEMPLATES[template];
    try {
      const imageResponse = await axios.get(templateData.url, { responseType: "arraybuffer" });
      image = await Jimp.read(Buffer.from(imageResponse.data));
    } catch (err) {
      image = await createFallbackTemplate(template);
    }
  }

  const templateData = MEME_TEMPLATES[template];

  for (let i = 0; i < templateData.boxes.length; i += 1) {
    const box = templateData.boxes[i];
    if (texts[i]) {
      await printMemeText(image, texts[i], box);
    }
  }

  if (deepFry) {
    image.contrast(0.6); // Massive contrast
    image.color([
      { apply: 'saturate', params: [80] }, // High saturation
      { apply: 'red', params: [20] }       // Warmer hue
    ]);
    image.posterize(5); // Limit colors for that compressed look

    // Add noise
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (Math.random() < 0.1) {
          image.setPixelColor(Math.random() > 0.5 ? 0xffffffff : 0x000000ff, x, y);
        }
      }
    }
  }

  return image.getBase64Async(Jimp.MIME_PNG);
}

app.get("/api/trending", async (_req, res) => {
  try {
    const topics = await getTrendingTopics();
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/status", (_req, res) => {
  res.json({
    mode: GROQ_CONFIGURED ? "groq" : "fallback",
    groqConfigured: GROQ_CONFIGURED
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { topic, template, apiKey, deepFry, customImage } = req.body;

    let targetTemplate = template;
    if (customImage) {
      if (typeof customImage !== "string") {
        return res.status(400).json({ error: "Custom image must be a string" });
      }
      targetTemplate = "custom";
    } else if (targetTemplate === "custom") {
      return res.status(400).json({ error: "Custom image data is required for custom template" });
    }

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required" });
    }

    if (!MEME_TEMPLATES[targetTemplate]) {
      return res.status(400).json({ error: "Invalid template" });
    }

    const texts = await generateMemeText(topic, targetTemplate, apiKey);
    const memeImage = await createMeme(targetTemplate, texts, deepFry, customImage);

    return res.json({
      success: true,
      image: memeImage,
      texts,
      topic,
      template: targetTemplate
    });
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/explain", async (req, res) => {
  try {
    const { topic, template, apiKey } = req.body;
    const keyToUse = apiKey || GROQ_KEY;
    const isConfigured = Boolean(keyToUse && !keyToUse.includes("your_groq_key_here"));

    if (!isConfigured) {
      return res.json({ 
        explanation: `This digital image, commonly referred to as a "meme," utilizes the "${template}" format to humorously address the subject of "${topic}". The juxtaposition of the recognizable image with the relatable text is intended to evoke amusement in the viewer.`
      });
    }

    const prompt = `You are a highly advanced but incredibly out-of-touch AI designed to explain youth culture to Boomers. Write a hilariously dry, clinical, 2-sentence explanation of why a meme about "${topic}" using the "${template}" format is supposedly "funny." Be overly literal and slightly confused. End the explanation with a classic, out-of-touch boomer remark (e.g., "Kids these days...").`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${keyToUse}`,
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );

    const explanation = response.data.choices?.[0]?.message?.content?.trim() || "Explanation unavailable.";
    return res.json({ explanation });
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    console.error("Explanation error:", errorDetails);
    
    return res.json({ 
      explanation: `(Fallback Mode) The Groq API call failed! Error details: ${errorDetails}. Please ensure your API key is correct and valid.`
    });
  }
});

app.get("/api/templates", (_req, res) => {
  res.json({
    templates: Object.keys(MEME_TEMPLATES).filter(k => k !== 'custom').map((key) => ({
      id: key,
      name: key.replace(/_/g, " ").toUpperCase(),
      preview: `data:image/svg+xml;utf8,${encodeURIComponent(PREVIEW_SVG[key])}`
    }))
  });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Meme Generator running on http://localhost:${PORT}`);
  });
}

module.exports = app;
