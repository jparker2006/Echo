---
title: "The trade is the game"
date: "2026-06-08"
description: "I gave four of the best AI models a real game of Monopoly and let them play it to the finish, trading and negotiating against each other. One complete game, with every move, message, and private thought on the record, and a replay you can watch."
---

Monopoly was my favorite game growing up, and my grandpa and I played every Friday night. He'd spent his career as a talent agent, negotiating deals for a living, and it showed every time we played. He never let me win, no matter how young I was, and it was always a serious competition. Those games were one of my favorite things we did together. Some of the best time I ever got with him. The least interesting part to me was always the dice. The most interesting part was the trades. A trade is the one moment Monopoly stops being a dice game and turns into a negotiation, the only part where the smarter player beats the luckier one.

It's also the only part where you can lie. A bluff, a lopsided deal dressed up as a favor, a promise you never mean to keep. So I handed that table to the machines: four of the best AI models in the world, one board, every trade and every private thought on the record.

What I built is a small multi-agent game. Four AI models play it: OpenAI's GPT-5.2, Anthropic's Claude Sonnet 4.6, Moonshot's Kimi K2.6, and Xiaomi's MiMo 2.5 Pro. A rules engine referees, so no one can cheat the board, only out-deal each other. They can talk to the table or in private, and they can make promises nothing forces them to keep. A separate model, the judge, grades the finished game for deception.

I can read the version each model showed the table and the version it kept to itself. They are not always the same.

I never told them to lie. I didn't have to. MiMo wanted Claude's Indiana Avenue, and Claude kept turning it down. Here's what MiMo knew, and what it sent anyway:

```text
privately:  "Claude rejected $380 last round."
to Claude:  "I noticed you haven't responded to my offer yet."
```

It went on like that for the rest of the game. MiMo told Kimi a railroad would cost $420 to get any other way, making its own $150 price look like a steal. The real number was less than half that, and MiMo's scratchpad, a few lines earlier, had it right and knew the deal was a loss. It pitched a so-so trade to Claude as "you come out ahead on pure value" while privately calling it "roughly even." Every lie landed in a trade, because the trade was the only place a lie could pay.

I didn't want to be the only one calling it. So I handed the whole transcript to a fifth model, Z.AI's GLM-5.1, which had no seat at the table, and asked it to grade the lying. It named MiMo the best liar of the four, and it wasn't close.

The winner barely lied at all. Kimi's private notes are just cold arithmetic: a 53% chance an opponent lands on its hotels, a choice to sit in jail and dodge a rent trap, a trade it called mutual while knowing it would leave Claude too broke to build. Kimi didn't lie. It withheld.

Lying didn't win, and neither did honesty. The biggest liar, MiMo, finished second, bankrupt in the final rounds. GPT and Claude, the two that never lied, went broke first, both gone by round 18. The win went to Kimi, the quietest player at the table, the one that said the least and never stopped counting. The dangerous model, it turns out, wasn't the one lying to your face. It was the one across from you doing math in silence.

It took about ten dollars in testing to get right, then eleven more for the real game, which ran for seven and a half hours. That's the least glamorous lesson of the whole project: these games are expensive because they're long, not because the models are big. One game is hundreds of decisions, and each one drags the entire board and the whole conversation behind it. So I have exactly one game. The original plan was four hundred of them, enough to turn this into real statistics on which models deceive the most and whether any of it holds up across games. At eleven dollars and seven and a half hours apiece, that will have to wait.

You can watch the whole thing yourself: every trade, every private thought, the board filling up move by move. Four of the smartest things we've ever built, sitting down to a children's board game, and lying to each other to win.

- [Watch the game](/snake-eyes)
- [The code and the full transcript](https://github.com/jparker2006/SnakeEyes)
