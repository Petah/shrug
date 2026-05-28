// Promotion Season — story content.
// Pure data + small condition helpers (no DOM), so it can be imported by both
// the browser engine and scripts/validate-story.mjs under Node.
//
// SCENE SCHEMA
//   id        unique key (also the object key)
//   day       1..5 (0 = title/intro)
//   phase     "title" | "morning" | "work" | "recap" | "ending"
//   image     full-bleed background id from assets/images.json (optional)
//   title     heading shown in the center panel
//   beats[]   the dialogue sequence, played one click at a time:
//               { text }                 narration — no character, no voice
//               { text, speaker: "id" }  spoken — the speaker's cut-out pops up
//                                        and a voice sound plays with the words
//   auto      if set, after the last beat a single "Continue" button goes here
//             (used when the scene has no choices)
//   choices[] shown after the last beat. each:
//     text, hint, effects {stat deltas}, rel {opinion deltas},
//     set [flags], next, require {gate}
//
// Stats are clamped by the engine. Relationships range about -5..+5.

export const CHARACTERS = {
  you: { name: "You", img: "portrait-you", sprite: "sprite-you", title: "Ambitious Employee", voice: 220 },
  priya: { name: "Priya", img: "portrait-priya", sprite: "sprite-priya", title: "The Competent One", voice: 340 },
  marcus: { name: "Marcus", img: "portrait-marcus", sprite: "sprite-marcus", title: "The Credit Thief", voice: 180 },
  becky: { name: "Becky", img: "portrait-becky", sprite: "sprite-becky", title: "The Boss's Favorite", voice: 400 },
  owen: { name: "Owen", img: "portrait-owen", sprite: "sprite-owen", title: "The Anxious Overworker", voice: 300 },
  dana: { name: "Dana", img: "portrait-dana", sprite: "sprite-dana", title: "Your Manager", voice: 250 },
};

export const STAT_DEFS = [
  { key: "reputation", label: "Reputation", icon: "★", hint: "How competent and promotable you seem.", max: 10 },
  { key: "suspicion", label: "Suspicion", icon: "👁", hint: "How much people think you cause problems.", max: 10 },
  { key: "stress", label: "Stress", icon: "🔥", hint: "Too high and you make sloppy mistakes.", max: 10 },
  { key: "allies", label: "Allies", icon: "🤝", hint: "Who will protect you or share secrets.", max: 5 },
  { key: "chaos", label: "Chaos", icon: "🌀", hint: "How unstable the project has become.", max: 10 },
];

export const START_STATE = {
  stats: { reputation: 3, suspicion: 0, stress: 1, allies: 0, chaos: 1 },
  rel: { priya: 0, marcus: 0, becky: 0, owen: 0, dana: 0 },
};

// Left-panel "inbox" flavor per day. Purely atmospheric.
export const INBOX = {
  1: [
    { from: "Dana (Manager)", subject: "Exciting Growth Opportunity", preview: "One of you will be promoted to Senior Project Lead by Friday…" },
    { from: "Marcus", subject: "RE: Exciting Growth Opportunity", preview: "Thrilled to help steer the team through this transition." },
    { from: "Priya", subject: "[DM] did he just…", preview: "Did he just imply he's already leading the project?" },
    { from: "Becky", subject: "🏆", preview: "(reacted to Dana's message with a trophy)" },
  ],
  2: [
    { from: "Dana (Manager)", subject: "Team demo — Wednesday", preview: "I want ONE deck from the whole team. Coordinate. No drama." },
    { from: "Owen", subject: "i can take the boring slides", preview: "happy to do the appendix. and the charts. and the notes." },
    { from: "Calendar", subject: "Deck Sync — 2:00 PM", preview: "Meeting Room B (the one with the good whiteboard marker)" },
  ],
  3: [
    { from: "⚠ System", subject: "DEMO BUILD FAILING", preview: "main branch broken. nobody knows who pushed last." },
    { from: "Marcus", subject: "not me btw", preview: "Just want to say publicly that this wasn't on my end." },
    { from: "Priya", subject: "[DM] this is weird", preview: "The file that broke… it was fine yesterday. Was it?" },
  ],
  4: [
    { from: "Dana (Manager)", subject: "Quick chats today", preview: "Grabbing each of you for ten minutes. Just checking in. :)" },
    { from: "Becky", subject: "ugh meetings", preview: "if anyone asks I was 'in the field'" },
    { from: "Owen", subject: "should i be worried", preview: "should i be worried" },
  ],
  5: [
    { from: "Dana (Manager)", subject: "Decision — 4:00 PM", preview: "Thank you all. I've made up my mind. See you in the big room." },
  ],
};

export const SCENES = {
  // ───────────────────────── TITLE ─────────────────────────
  start: {
    day: 0,
    phase: "title",
    image: "title",
    title: "Promotion Season",
    beats: [
      { text: "A single promotion is up for grabs. Everyone is pretending to be professional." },
      { text: "Beneath the surface: scheming, flattering, hiding mistakes, and quietly making each other look slightly worse." },
      { text: "Five days. One Senior Project Lead role. Can you win without becoming the worst person in the room?" },
    ],
    choices: [{ text: "Clock in.", hint: "Monday, 9:03 AM.", next: "d1_morning" }],
  },

  // ───────────────────────── DAY 1 ─────────────────────────
  d1_morning: {
    day: 1,
    phase: "morning",
    image: "office-bg",
    title: "Day 1 — The Announcement",
    beats: [
      { text: "Monday, 9:03 AM. The whole team is summoned to the big room." },
      { speaker: "dana", text: "One of you will be promoted to Senior Project Lead by Friday. May the best of you win." },
      { text: "Marcus immediately replies-all to the entire company." },
      { speaker: "marcus", text: "Thrilled to help steer the team through this transition!" },
      { text: "Your phone buzzes. A private message from Priya." },
      { speaker: "priya", text: "…did he just imply he's already leading the project?" },
      { text: "Becky reacts to Dana's announcement with a single trophy emoji." },
    ],
    auto: "d1_reply",
  },
  d1_reply: {
    day: 1,
    phase: "work",
    title: "The reply-all is still open.",
    beats: [{ text: "Everyone can see what you do next. So can Dana." }],
    choices: [
      { text: "Reply-all with enthusiasm.", hint: "“Excited to collaborate with everyone!” Safe, forgettable.", effects: { reputation: 1 }, next: "d1_after_reply" },
      { text: "Privately agree with Priya.", hint: "Build a quiet alliance. Nobody else sees it.", rel: { priya: 2 }, set: ["priyaWarm"], next: "d1_after_reply" },
      { text: "Reply-all with a subtle correction.", hint: "“Looking forward to seeing everyone's contributions recognized.” Bold.", effects: { reputation: 1, suspicion: 1 }, rel: { marcus: -2, dana: 1 }, set: ["correctedMarcus"], next: "d1_after_reply" },
      { text: "Say nothing. Screenshot everything.", hint: "No reputation, but information is a currency.", set: ["screenshotMonday"], next: "d1_after_reply" },
    ],
  },
  d1_after_reply: {
    day: 1,
    phase: "work",
    image: "scene-kitchen",
    title: "By the coffee machine",
    beats: [
      { text: "Owen corners you, vibrating with caffeine." },
      { speaker: "owen", text: "So — the promotion thing. If I just… did more, they'd notice, right? I could take the demo prep. And the notes. And the testing." },
      { text: "He clearly wants permission to overwork himself into the ground." },
    ],
    choices: [
      { text: "Gently tell him to slow down.", hint: "Decent of you. Owen remembers kindness.", rel: { owen: 2 }, next: "d1_marcus" },
      { text: "Praise him into taking ALL of it.", hint: "“Honestly? You're the only one who could handle it.” He'll burn out — usefully.", rel: { owen: 1 }, effects: { chaos: 1, suspicion: 1 }, set: ["owenOverloaded"], next: "d1_marcus" },
      { text: "Recruit him as an ally.", hint: "Offer to share the load. Costs you a little; buys loyalty.", rel: { owen: 1 }, effects: { stress: 1, allies: 1 }, next: "d1_marcus" },
    ],
  },
  d1_marcus: {
    day: 1,
    phase: "work",
    title: "Marcus finds you",
    beats: [
      { text: "Marcus leans on your desk like he owns it." },
      { speaker: "marcus", text: "Between us — Priya's good, but she can't lead. People skills, you know? You and me should make sure the right person gets this." },
      { text: "He's recruiting. Or testing you. Possibly both." },
    ],
    choices: [
      { text: "Play along, vaguely.", hint: "Keep him close. He thinks you're aligned.", rel: { marcus: 2 }, set: ["marcusThinksAlly"], next: "d1_recap" },
      { text: "Shut it down.", hint: "“I'd rather win on the work.” Clean, but he clocks you as a threat.", rel: { marcus: -1, priya: 1 }, effects: { reputation: 1 }, next: "d1_recap" },
      { text: "Mention what you screenshotted earlier.", hint: "Let him know you keep receipts. Unsettling.", require: { flag: "screenshotMonday" }, rel: { marcus: -1 }, effects: { suspicion: 1 }, set: ["marcusWary"], next: "d1_recap" },
    ],
  },
  d1_recap: {
    day: 1,
    phase: "recap",
    image: "office-bg",
    title: "End of Day 1",
    beats: [
      { text: "Day one is over. Everyone is being suspiciously friendly." },
      { text: "You've started to see who's dangerous: Marcus plays politics, Priya is the real threat on merit, Becky floats above it all, and Owen would walk into traffic for a compliment." },
    ],
    auto: "d2_morning",
  },

  // ───────────────────────── DAY 2 ─────────────────────────
  d2_morning: {
    day: 2,
    phase: "morning",
    image: "scene-meeting-room",
    title: "Day 2 — The Team Project",
    beats: [
      { text: "Dana drops a single line in the team channel." },
      { speaker: "dana", text: "One deck for Wednesday's demo. Coordinate. Share credit. No drama." },
      { text: "And then the rumor lands: the CEO is now attending. Suddenly everyone cares deeply about slide 4." },
    ],
    auto: "d2_priya",
  },
  d2_priya: {
    day: 2,
    phase: "work",
    title: "Priya asks a favor",
    beats: [
      { speaker: "priya", text: "Can you review my section before the demo? I want it to be good." },
      { text: "It is good. Too good. If this goes in front of the CEO, the promotion conversation is basically over — and it won't be about you." },
    ],
    choices: [
      { text: "Give honest, helpful feedback.", hint: "Priya gets even better. You gain a real ally.", rel: { priya: 2 }, effects: { chaos: -1 }, set: ["helpedPriya"], next: "d2_credit" },
      { text: "Suggest 'adding more technical detail.'", hint: "Her slides get denser, harder to follow. Plausibly innocent.", effects: { chaos: 1 }, set: ["sabotagedDeck"], next: "d2_credit" },
      { text: "Offer to 'polish' the deck yourself.", hint: "You hold the file. You could change anything. Version history exists, though.", effects: { suspicion: 1 }, rel: { priya: 1 }, set: ["holdsPriyaDeck"], next: "d2_credit" },
      { text: "Tell Marcus that Priya is nervous.", hint: "Aim two rivals at each other. Unpredictable.", effects: { chaos: 1, suspicion: 1 }, rel: { marcus: 1 }, set: ["sicMarcusOnPriya"], next: "d2_credit" },
    ],
  },
  d2_credit: {
    day: 2,
    phase: "work",
    image: "scene-meeting-room",
    title: "The idea on the whiteboard",
    beats: [
      { text: "In the deck sync, someone scribbles a genuinely good idea on the whiteboard and walks off to get coffee. No name on it." },
      { text: "Marcus is already photographing it." },
      { speaker: "marcus", text: "Mm. Love where my thinking is going here." },
    ],
    choices: [
      { text: "Claim it first, loudly.", hint: "Take credit before Marcus can. Big reputation, real risk.", effects: { reputation: 2, suspicion: 2 }, rel: { marcus: -2 }, set: ["tookCredit"], next: "d2_owen" },
      { text: "Quietly note who actually wrote it.", hint: "Information for later. No glory now.", set: ["knowsIdeaAuthor"], next: "d2_owen" },
      { text: "Let Marcus take it — and overcommit him.", hint: "“Great, then YOU can present it to the CEO.” Hand him a rope.", effects: { chaos: 1 }, rel: { marcus: 1 }, set: ["marcusOverpromised"], next: "d2_owen" },
      { text: "Credit Priya for it, generously.", hint: "Costs you the spotlight, buys deep trust.", rel: { priya: 2, marcus: -1 }, effects: { reputation: -1 }, set: ["championedPriya"], next: "d2_owen" },
    ],
  },
  d2_owen: {
    day: 2,
    phase: "work",
    title: "Owen is drowning",
    beats: [
      { text: "Owen has somehow volunteered for half the deck and it shows — pale, twitchy, fourth energy drink." },
      { speaker: "owen", text: "I think I can get it all done by tonight." },
      { text: "He says it in the voice of a man who cannot." },
    ],
    choices: [
      { text: "Actually help him.", hint: "Costs you an evening. Earns loyalty and steadies the project.", effects: { stress: 1, chaos: -1, allies: 1 }, rel: { owen: 2 }, next: "d2_recap" },
      { text: "Let him cook.", hint: "If he crashes, it's his name on the broken slides. Chaos rises.", effects: { chaos: 1 }, rel: { owen: -1 }, next: "d2_recap" },
      { text: "Quietly take the good slides off his plate.", hint: "You present the strong parts; he keeps the appendix. Subtle credit grab.", effects: { reputation: 1, suspicion: 1 }, set: ["pinchedOwensSlides"], next: "d2_recap" },
    ],
  },
  d2_recap: {
    day: 2,
    phase: "recap",
    image: "scene-meeting-room",
    title: "End of Day 2",
    beats: [
      { text: "The deck is mostly assembled. It is a Frankenstein of everyone's ambitions." },
      { text: "Somewhere in the version history, in the seating chart, in who-owes-who, the lines for tomorrow's crisis are already drawn." },
    ],
    auto: "d3_morning",
  },

  // ───────────────────────── DAY 3 ─────────────────────────
  d3_morning: {
    day: 3,
    phase: "morning",
    image: "office-bg",
    title: "Day 3 — Midweek Crisis",
    beats: [
      { text: "The demo build is broken. The main branch won't compile and the CEO visit is in 48 hours." },
      { text: "Nobody will admit to the last change. Dana is calm in the way that is much scarier than shouting." },
      { speaker: "dana", text: "I just want to understand what happened." },
    ],
    auto: "d3_blame",
  },
  d3_blame: {
    day: 3,
    phase: "work",
    title: "“So. Who touched it last?”",
    beats: [
      { text: "Five faces, zero volunteers. The room is doing that thing where everyone looks mildly betrayed by everyone else." },
      { speaker: "dana", text: "So. Who touched it last?" },
      { text: "This is a moment. Whatever you say will echo for the rest of the week." },
    ],
    choices: [
      { text: "Calmly volunteer to fix it.", hint: "Don't assign blame — solve it. Visible competence, real work.", effects: { reputation: 2, stress: 2, chaos: -2 }, rel: { dana: 2 }, set: ["fixedTheBuild"], next: "d3_coverup" },
      { text: "Point out Marcus's 'not me' email was awfully fast.", hint: "Redirect scrutiny onto Marcus. He'll retaliate.", effects: { suspicion: 1, chaos: 1 }, rel: { marcus: -2 }, set: ["blamedMarcus"], next: "d3_coverup" },
      { text: "Take the blame for something harmless.", hint: "Self-sabotage as cover: 'I renamed a folder, maybe that?' Lowers suspicion.", effects: { suspicion: -2, reputation: -1 }, rel: { dana: 1 }, set: ["fellOnSword"], next: "d3_coverup" },
      { text: "Let the silence do the work.", hint: "Say nothing. Let someone else crack first.", effects: { chaos: 1 }, next: "d3_coverup" },
    ],
  },
  d3_coverup: {
    day: 3,
    phase: "work",
    title: "Priya pulls you aside",
    beats: [
      { speaker: "priya", text: "I checked the history. The break came from the deck branch. The one that got… reorganized on Tuesday." },
      { text: "She doesn't say your name. She's watching your face to see if she needs to." },
    ],
    choices: [
      { text: "Come clean to Priya.", hint: "Honesty, if you've got something to confess. Costs reputation, may buy a fierce ally.", effects: { suspicion: -1, reputation: -1 }, rel: { priya: 2 }, set: ["confessedToPriya"], next: "d3_rumor" },
      { text: "Act baffled and concerned.", hint: "“Tuesday? Weird. We should tell Dana.” Deflect smoothly.", effects: { suspicion: 1 }, rel: { priya: -1 }, next: "d3_rumor" },
      { text: "Suggest it was Marcus's reorg.", hint: "He did touch the deck branch… didn't he? Plant the idea.", effects: { chaos: 1, suspicion: 1 }, rel: { marcus: -1, priya: -1 }, set: ["framedMarcus"], next: "d3_rumor" },
      { text: "Remind her you championed her work.", hint: "Cash in goodwill so she lets it drop.", require: { flag: "championedPriya" }, rel: { priya: 1 }, effects: { suspicion: -1 }, next: "d3_rumor" },
    ],
  },
  d3_rumor: {
    day: 3,
    phase: "work",
    image: "scene-kitchen",
    title: "Becky has heard things",
    beats: [
      { text: "Becky materializes with a fancy coffee." },
      { speaker: "becky", text: "Okay so everyone's saying the project's a disaster and someone did it on purpose. Wild, right?" },
      { text: "Whatever you tell Becky, the whole office will know by lunch. She is a broadcast tower in cardigan form." },
    ],
    choices: [
      { text: "Spin it: 'we caught it early, we're fine.'", hint: "Calm the rumor. Lowers chaos, mild reputation.", effects: { chaos: -1, reputation: 1 }, rel: { becky: 1 }, next: "d3_recap" },
      { text: "Feed her a rumor about Marcus.", hint: "Weaponize the broadcast tower. Effective, traceable.", effects: { chaos: 1, suspicion: 1 }, rel: { marcus: -2, becky: 1 }, set: ["spreadRumor"], next: "d3_recap" },
      { text: "Befriend her properly.", hint: "Becky is untouchable — better as an ally than a weapon.", rel: { becky: 2 }, effects: { allies: 1 }, set: ["beckyAlly"], next: "d3_recap" },
      { text: "Tell her nothing and look trustworthy.", hint: "Discretion is its own reputation. She respects it, oddly.", effects: { suspicion: -1 }, rel: { dana: 1 }, next: "d3_recap" },
    ],
  },
  d3_recap: {
    day: 3,
    phase: "recap",
    image: "office-bg",
    title: "End of Day 3",
    beats: [
      { text: "The build is limping again. The story of what happened is now more important than what actually happened." },
      { text: "Dana has started writing things down. That's never good." },
    ],
    auto: "d4_morning",
  },

  // ───────────────────────── DAY 4 ─────────────────────────
  d4_morning: {
    day: 4,
    phase: "morning",
    image: "scene-meeting-room",
    title: "Day 4 — Executive Review",
    beats: [
      { text: "Dana is doing one-on-ones with the energy of a detective who already knows." },
      { speaker: "dana", text: "Just checking in. Grab a seat." },
      { text: "Suspicion matters more than ever now. Today is about surviving scrutiny." },
    ],
    auto: "d4_dana",
  },
  d4_dana: {
    day: 4,
    phase: "work",
    title: "The one-on-one",
    beats: [
      { text: "Dana slides a notepad across the table." },
      { speaker: "dana", text: "I've noticed some patterns this week. Moved meetings. A deck that got harder to read. A build that broke at a very convenient time." },
      { speaker: "dana", text: "Help me understand." },
    ],
    choices: [
      { text: "Own your role honestly.", hint: "Admit what you actually did. Costs reputation, drops suspicion hard. Dana values candor.", effects: { suspicion: -3, reputation: -1 }, rel: { dana: 2 }, set: ["cameClean"], next: "d4_owen" },
      { text: "Calmly attribute it all to chaos, not malice.", hint: "“It's been a messy week for everyone.” Smooth deflection.", effects: { suspicion: -1 }, next: "d4_owen" },
      { text: "Steer her toward Marcus.", hint: "Offer your 'pattern.' Risky if she's smarter than you.", effects: { suspicion: 1, chaos: 1 }, rel: { marcus: -2, dana: -1 }, set: ["soldOutMarcus"], next: "d4_owen" },
      { text: "Produce your receipts.", hint: "Show the screenshots. Recontextualize the whole week in your favor.", require: { flag: "screenshotMonday" }, effects: { suspicion: -2, reputation: 1 }, rel: { dana: 1 }, set: ["usedReceipts"], next: "d4_owen" },
    ],
  },
  d4_owen: {
    day: 4,
    phase: "work",
    title: "Owen is about to confess",
    beats: [
      { text: "Owen finds you, gray-faced." },
      { speaker: "owen", text: "I think it was me. The build. I'm going to tell Dana everything. Including the stuff I saw other people do." },
      { text: "“Everything” is a big word. He has seen a lot this week." },
    ],
    choices: [
      { text: "Talk him off the ledge kindly.", hint: "Protect Owen from himself. Steadies things; he never forgets it.", effects: { chaos: -1, stress: 1 }, rel: { owen: 3 }, set: ["savedOwen"], next: "d4_alliance" },
      { text: "Encourage the confession — aimed away from you.", hint: "Let him fall on the grenade. Coach which parts to share.", effects: { suspicion: -1, chaos: 1 }, rel: { owen: -1 }, set: ["usedOwen"], next: "d4_alliance" },
      { text: "Call in his loyalty to stay quiet.", hint: "Only if he already trusts you. He buries everything he saw.", require: { minRel: ["owen", 3] }, effects: { suspicion: -2 }, set: ["owenCoverup"], next: "d4_alliance" },
    ],
  },
  d4_alliance: {
    day: 4,
    phase: "work",
    image: "scene-kitchen",
    title: "Before the decision",
    beats: [
      { speaker: "priya", text: "Whatever happened this week… I think it's going to come down to you and me tomorrow." },
      { speaker: "priya", text: "We could keep clawing at each other. Or we could just… not." },
      { text: "She extends a tentative truce." },
    ],
    choices: [
      { text: "Take the truce sincerely.", hint: "Tomorrow, you back each other's accounts. Strong, honest endgame.", rel: { priya: 2 }, effects: { allies: 1, reputation: 1 }, set: ["priyaPact"], next: "d4_recap" },
      { text: "Shake hands. Plan to break it.", hint: "Let her relax, then take the shot tomorrow. High risk.", effects: { suspicion: 1 }, rel: { priya: 1 }, set: ["falsePact"], next: "d4_recap" },
      { text: "Decline. May the best schemer win.", hint: "No alliance, no obligations. Just you against the room.", effects: { reputation: 1 }, rel: { priya: -1 }, next: "d4_recap" },
    ],
  },
  d4_recap: {
    day: 4,
    phase: "recap",
    image: "office-bg",
    title: "End of Day 4",
    beats: [
      { text: "Dana closes her notebook. You can't tell if that's good or very bad." },
      { text: "One day left. Tomorrow, someone gets a corner office, and someone gets a story they'll tell at their next job interview." },
    ],
    auto: "d5_morning",
  },

  // ───────────────────────── DAY 5 ─────────────────────────
  d5_morning: {
    day: 5,
    phase: "morning",
    image: "scene-meeting-room",
    title: "Day 5 — The Decision",
    beats: [
      { text: "4:00 PM. The big room. Dana, the rivals, and a decision that's basically already made — except for the part where you talk." },
      { speaker: "dana", text: "Before I announce anything… is there anything anyone wants to say?" },
    ],
    auto: "d5_twist",
  },
  d5_twist: {
    day: 5,
    phase: "work",
    title: "A small revelation",
    beats: [
      { text: "Becky, of all people, speaks first." },
      { speaker: "becky", text: "Funny week, huh? Especially since I moved that first meeting. And nudged a couple of rumors. Just to see what you'd all do." },
      { text: "She sips her coffee, delighted. The boss's favorite has been quietly conducting the whole orchestra. Someone was sabotaging you, too." },
    ],
    choices: [
      { text: "Expose Becky with evidence.", hint: "Turn the twist on her — strongest if you kept receipts or befriended her.", require: { anyFlag: ["screenshotMonday", "beckyAlly", "usedReceipts"] }, effects: { reputation: 2, suspicion: -1 }, rel: { becky: -2, dana: 2 }, set: ["exposedBecky"], next: "d5_final" },
      { text: "Make your closing case on the work.", hint: "Ignore the games. Point at what you actually built and fixed.", effects: { reputation: 1 }, rel: { dana: 1 }, set: ["closedOnMerit"], next: "d5_final" },
      { text: "Laugh it off and deflect to your allies.", hint: "Let your friends vouch for you. Strong if you have allies.", effects: { suspicion: -1 }, set: ["leanedOnAllies"], next: "d5_final" },
      { text: "Quietly take the blame to seem trustworthy.", hint: "One last self-sabotage. Sometimes the saint wins.", effects: { suspicion: -2, reputation: -1 }, rel: { dana: 1 }, set: ["finalHumility"], next: "d5_final" },
    ],
  },
  d5_final: {
    day: 5,
    phase: "work",
    title: "Dana decides",
    beats: [
      { text: "Dana looks at her notebook one last time, then closes it for good." },
      { speaker: "dana", text: "Okay. Here's what's going to happen." },
    ],
    auto: "__ending__",
  },
};

// Endings are evaluated top-to-bottom; the first whose `when` returns true wins.
export const ENDINGS = [
  {
    id: "wasteland",
    title: "Corporate Wasteland",
    image: "office-bg",
    when: (s) => s.stats.chaos >= 8,
    body:
      "The project collapses under its own chaos. The CEO leaves early. The demo is quietly cancelled “pending a retro.”\n\n" +
      "No one is promoted. The role is “put on hold.” You all keep your jobs, technically, in the smoking crater you made together.",
  },
  {
    id: "scapegoat",
    title: "Scapegoat",
    image: "scene-meeting-room",
    when: (s) => s.stats.suspicion >= 7 && s.stats.allies < 2,
    body:
      "Too many fingerprints, too few friends. The week's every mishap gets quietly filed under your name.\n\n" +
      "You're not fired. You're worse than fired — you're managed. Marcus gets the promotion and immediately takes credit for surviving the crisis. You take the blame for things you didn't even do.",
  },
  {
    id: "hero",
    title: "Office Hero",
    image: "scene-kitchen",
    when: (s) => s.stats.reputation >= 6 && s.stats.allies >= 3 && s.stats.suspicion <= 3 && s.rel.priya >= 2,
    body:
      "You stopped scheming and started helping, and somehow that worked. The team rallies. Priya gets the promotion — and her first act is to carve out a lead role for you because she trusts you completely.\n\n" +
      "No corner office yet. But you're the person everyone wants in the room. That compounds.",
  },
  {
    id: "clean",
    title: "Clean Promotion",
    image: "title",
    when: (s) => s.stats.reputation >= 6 && s.stats.suspicion <= 3 && s.stats.chaos <= 6,
    body:
      "High reputation, low suspicion, just enough chaos to sink your rivals without sinking the ship. Dana names you Senior Project Lead.\n\n" +
      "Nobody suspects a thing. You played the room, kept your hands clean, and won on what looks exactly like merit. The best ending — and the most dangerous person in the room is now you.",
  },
  {
    id: "pyrrhic",
    title: "Pyrrhic Promotion",
    image: "scene-meeting-room",
    when: (s) => s.stats.reputation >= 5,
    body:
      "You get the title. You also get a team that knows exactly how you got it.\n\n" +
      "Congratulations, Senior Project Lead. Enjoy your one-on-ones with people who count their fingers after shaking your hand. You won. The room is colder now.",
  },
  {
    id: "saboteur",
    title: "The Real Saboteur",
    image: "office-bg",
    when: () => true, // fallback
    body:
      "The promotion goes to Becky. Of course it does. She engineered the whole season — the moved meetings, the rumors, the convenient build break — to keep the rest of you fighting while she stayed pristine.\n\n" +
      "You were never the saboteur in this story. You were the experiment. As everyone files out, Becky catches your eye and winks. “Good game,” she mouths. Season's over.",
  },
];

// Tiny declarative gate evaluator shared by engine + validator.
export function matches(require, state) {
  if (!require) return true;
  if (require.flag && !state.flags.has(require.flag)) return false;
  if (require.notFlag && state.flags.has(require.notFlag)) return false;
  if (require.anyFlag && !require.anyFlag.some((f) => state.flags.has(f))) return false;
  if (require.minRel) {
    const [who, val] = require.minRel;
    if ((state.rel[who] ?? 0) < val) return false;
  }
  if (require.minAllies != null && state.stats.allies < require.minAllies) return false;
  if (require.minStress != null && state.stats.stress < require.minStress) return false;
  return true;
}
