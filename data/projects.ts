// The project log, newest-first. Prepend new projects to the top of this array.
//   year     – the year it was built
//   name     – project name
//   description – one-liner shown beneath the name
//   url      – optional repo link (the name becomes a coral link when present)
//   paper    – optional research-paper link (e.g. a PDF in /public), shown first in the links row
//   demo     – optional live-demo link, shown in the links row
//   post     – optional related blog-post slug (content/posts/<slug>.md), shown in the links row
//   featured – show in the default `ls /projects` view (default false)
// The links row beneath a description renders present links in this order: paper · demo · blog post.

export interface Project {
  year: number;
  name: string;
  description: string;
  url?: string;
  paper?: string;
  demo?: string;
  post?: string;
  featured: boolean;
}

// set featured: true on the projects to show by default
export const projects: Project[] = [
  {
    year: 2026,
    name: "Neon City",
    description: "messing around with Fable and /goal",
    url: "https://github.com/jparker2006/NeonCity",
    featured: false,
  },
  {
    year: 2026,
    name: "Space Coaster",
    description: "testing Fable by one-shotting a rollercoaster in space",
    url: "https://github.com/jparker2006/Spacecoaster",
    featured: false,
  },
  {
    year: 2026,
    name: "Tail",
    description: "an on-chain study of how a few wallets actually move prediction market prices",
    url: "https://github.com/jparker2006/Tail",
    featured: true,
  },
  {
    year: 2026,
    name: "Snake Eyes",
    description:
      "four AI models lie, scheme, and betray their way through a full game of Monopoly — with an interactive replay that shows what each one was privately thinking",
    url: "/snake-eyes",
    demo: "/snake-eyes",
    post: "the-trade-is-the-game",
    featured: true,
  },
  {
    year: 2026,
    name: "PLOT",
    description:
      "a chess-style eval bar for the NBA that measures the points players leave on the table",
    url: "https://github.com/jparker2006/PLOT",
    paper: "/plot-paper.pdf",
    demo: "https://plot-nba.vercel.app/",
    post: "points-left-on-the-table",
    featured: true,
  },
  {
    year: 2026,
    name: "BigBotter",
    description: "AI agents lie, scheme, and backstab their way through a Big Brother house",
    url: "https://github.com/jparker2006/BigBotter",
    featured: false,
  },
  {
    year: 2026,
    name: "Get Out",
    description: "partitioned agents coordinate to get out of an escape room",
    url: "https://github.com/jparker2006/Get-Out",
    featured: false,
  },
  {
    year: 2026,
    name: "CinemaDaddy",
    description:
      "an agentic movie companion that finds what to watch, what it's rated, and where to stream it",
    url: "https://github.com/jparker2006/CinemaDaddy",
    featured: false,
  },
  {
    year: 2026,
    name: "Timeslop",
    description: "an NYT Flashback clone",
    url: "https://github.com/jparker2006/Timeslop",
    featured: false,
  },
  {
    year: 2026,
    name: "Glox",
    description:
      "a startup that automates the tedious manual work of keeping contractor safety-compliance portals up to date",
    url: "https://tryglox.com",
    featured: true,
  },
  {
    year: 2025,
    name: "Lintly",
    description: "an agentic prompting layer that sits on top of your LLMs",
    url: "https://github.com/jparker2006/Lintly",
    featured: true,
  },
  {
    year: 2025,
    name: "RustWSS",
    description:
      "rewrote my dad's old Qt websocket server in Rust to teach him Cursor, in Hawaii over summer",
    url: "https://github.com/jparker2006/RustWSS",
    featured: false,
  },
  {
    year: 2025,
    name: "WassGPT",
    description: "an AI agent that matches brands to talent at Wasserman, no SQL required",
    url: "https://github.com/jparker2006/WassGPT",
    featured: true,
  },
  {
    year: 2025,
    name: "HandleHunter",
    description:
      "automates finding talent's social handles; shipped it to kick off my Wasserman internship",
    url: "https://github.com/jparker2006/HandleHunter",
    featured: false,
  },
  {
    year: 2025,
    name: "AdmitAI",
    description: "an AI agent to help students write their college essays and apply",
    url: "https://github.com/jparker2006/AdmitAI",
    featured: false,
  },
  {
    year: 2025,
    name: "YahtzeeCarlo",
    description: "Monte Carlo Yahtzee",
    url: "https://github.com/jparker2006/YahtzeeCarlo",
    featured: false,
  },
  {
    year: 2024,
    name: "TransferAI",
    description: "an AI advising agent to help students transfer from CCCs to UCs",
    url: "https://github.com/jparker2006/TransferAI",
    featured: true,
  },
  {
    year: 2024,
    name: "6502",
    description: "an 8-bit virtual microprocessor in C",
    url: "https://github.com/jparker2006/6502",
    featured: false,
  },
  {
    year: 2023,
    name: "RapperBot",
    description:
      "a Discord bot that read AI-generated songs in an artist's voice on stream. quit it early",
    url: "https://github.com/freesampul/Rapper",
    featured: false,
  },
  {
    year: 2022,
    name: "Fat Ninjas",
    description:
      "a multiplayer combat game built in 36 hours that won the Harvard-Westlake hackathon, running on a websocket server and a Raspberry Pi LAMP stack i built",
    url: "https://github.com/jparker2006/FatNinjas",
    featured: true,
  },
  {
    year: 2022,
    name: "Miscellany",
    description:
      "the stuff i built when i got tired of a big codebase: Huffman coding, Markov chains, and more",
    url: "https://github.com/jparker2006/Miscellany",
    featured: false,
  },
  {
    year: 2022,
    name: "6lets",
    description: "a twice-daily six-letter word game with 20,000+ plays",
    url: "https://6lets.com",
    featured: true,
  },
  {
    year: 2022,
    name: "Parkerchat",
    description: "an attempt at building a social network for fun",
    url: "https://github.com/jparker2006/Parkerchat",
    featured: false,
  },
  {
    year: 2022,
    name: "NeuralNet",
    description: "a simple neural network in Rust",
    url: "https://github.com/jparker2006/NeuralNet",
    featured: false,
  },
  {
    year: 2022,
    name: "RandRTC",
    description: "messing with webrtc",
    url: "https://github.com/jparker2006/RandRTC",
    featured: false,
  },
  {
    year: 2022,
    name: "RandGL",
    description: "messing with opengl",
    url: "https://github.com/jparker2006/RandGL",
    featured: false,
  },
  {
    year: 2022,
    name: "Podcaster",
    description: "a podcast aggregator",
    url: "https://github.com/jparker2006/Podcaster",
    featured: false,
  },
  {
    year: 2022,
    name: "Reststop",
    description: "the home for all things porcelain throne",
    url: "https://github.com/jparker2006/Reststop",
    featured: false,
  },
  {
    year: 2022,
    name: "QtBackend",
    description: "websocket server plus mariadb example in qt6",
    url: "https://github.com/jparker2006/QtBackend",
    featured: false,
  },
  {
    year: 2022,
    name: "Shooter",
    description: "2d game in qt",
    url: "https://github.com/jparker2006/Shooter",
    featured: false,
  },
  {
    year: 2022,
    name: "Pool",
    description: "qt pool game",
    url: "https://github.com/jparker2006/Pool",
    featured: false,
  },
  {
    year: 2022,
    name: "ShapeRenderer",
    description: "renders 3d shapes with custom points, size, rotation",
    url: "https://github.com/jparker2006/ShapeRenderer",
    featured: false,
  },
  {
    year: 2022,
    name: "Stopwatch",
    description: "qt stopwatch app",
    url: "https://github.com/jparker2006/Stopwatch",
    featured: false,
  },
  {
    year: 2022,
    name: "TodoList",
    description: "gtk todolist app",
    url: "https://github.com/jparker2006/TodoList",
    featured: false,
  },
  {
    year: 2021,
    name: "QRayTracer",
    description:
      "a ray tracer built from scratch in Qt C++: OBJ models, phong shading, reflections, refractions, anti-aliasing",
    url: "https://github.com/jparker2006/QRayTracer",
    featured: true,
  },
  {
    year: 2021,
    name: "Encrypted Storage",
    description: "an AES-256 encrypted desktop vault with a password manager, contacts, and profiles",
    url: "https://github.com/jparker2006/EncryptedStorage/",
    featured: false,
  },
  {
    year: 2021,
    name: "Pong2",
    description: "Pong remade in Qt with cross-network multiplayer",
    url: "https://github.com/jparker2006/Pong2",
    featured: false,
  },
  {
    year: 2021,
    name: "Pong",
    description: "learned pygame and basic game dev",
    url: "https://github.com/jparker2006/Pong",
    featured: false,
  },
  {
    year: 2021,
    name: "Animations",
    description:
      "a Qt C++ animation library: steering, fireworks, inverse kinematics, rain, a water ripple, and more",
    url: "https://github.com/jparker2006/Animations",
    featured: false,
  },
  {
    year: 2021,
    name: "MessingWithC",
    description: "messing with C: vector and hash table implementations plus LZW compression",
    url: "https://github.com/jparker2006/MessingWithC",
    featured: false,
  },
  {
    year: 2021,
    name: "CircleEater",
    description: "an Agar.io-style game in Qt C++",
    url: "https://github.com/jparker2006/CircleEater",
    featured: false,
  },
  {
    year: 2021,
    name: "ServerStats",
    description: "pulled live stats off the Raspberry Pi LAMP stack in my dad's office",
    url: "https://github.com/jparker2006/ServerStats",
    featured: false,
  },
  {
    year: 2021,
    name: "PasswordStore",
    description: "a password manager webpage built with my dad to learn hashing, salting, and encryption",
    url: "https://github.com/jparker2006/PasswordStore",
    featured: false,
  },
  {
    year: 2020,
    name: "Phonebook",
    description: "a simple contacts webpage built with my dad to learn the basic web stack",
    url: "https://github.com/jparker2006/Phonebook",
    featured: false,
  },
  {
    year: 2020,
    name: "Blackjack and TicTacToe solver",
    description:
      "the one that started it. a teacher told my parents i should quit, so my dad taught me over a summer instead. a Java GUI with a betting system",
    featured: false,
  },
];
