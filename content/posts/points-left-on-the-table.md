---
title: "Points left on the table"
date: "2026-05-31"
---

*An eval bar for NBA possessions — and what it told me about decisions (and about building research with an AI).*

I watch a lot of basketball. Probably too much. And the longer I watch, the more one thing nags at me:
the box score is lying to me. Not on purpose — it just records the wrong thing. A gorgeous pass that sets
up a wide-open layup counts for nothing if the layup rims out. A brick-headed contested heave counts for
three if it happens to drop. The stat sheet rewards *outcomes*, and an outcome is three things mashed
together: the quality of the decision, whether the guy can actually shoot, and luck.

What I really wanted was the thing chess players have. If you've watched chess online, you know the eval
bar — that meter on the side that tells you who's winning *right now*, after every move. I wanted that for
a possession. At this instant, how many points is this trip down the floor worth? And when a player chooses
to shoot, pass, or drive, how good was that choice — separately from whether it happened to work?

So I built it. It's called **PLOT — Points Left On the Table**.

## What I wanted to measure

The target is the *decision*, not the outcome. So I score every choice by what it was worth **on average**,
not by what happened that one time. A pass to an open shooter is a good decision whether or not the shooter
makes it; a forced shot is a bad one even when it goes in. If I graded by the result, I'd just be measuring
luck again, with extra steps.

Concretely: at each moment a player could shoot or pass, I compare the **best option he had** to the **one
he took**, in expected points. The gap is the regret — the points left on the table. Add it up over a season
and you get a per-player number that, in theory, captures something the box score can't: decision quality.

That's the easy part to say. The hard part is earning the right to believe it.

## How I built it

Three pieces sit underneath that one number.

**The eval bar.** First I needed "expected points right now." That's a model that looks at all ten players
and the ball at once — where everyone is, who's open, how the possession has unfolded — and predicts how
many points this possession will end up scoring. The important property isn't cleverness, it's *honesty*:
when it says 0.8 points, possessions like that one really should average about 0.8. (They do; I checked,
on games the model never trained on.)

**The data grind.** This is the unglamorous half. The only NBA tracking data that's ever been public is
from 2015-16, and only about half a season of it survives in the wild. Turning raw camera coordinates into
something you can reason about means cutting the game into possessions, figuring out which direction each
team is attacking, and throwing out the games where the tracking is too garbled to trust. None of that is
in any tutorial. Most of the work was here.

**The metric.** On top of the eval bar, I value the "best available" shot with a small shot-quality model —
and, on purpose, I make that model **blind to who's shooting**. A wide-open 18-footer is worth the same
whether it's a sharpshooter or a center. That sounds like a bug; it's the whole point. It means the metric
is grading the *decision* to pass it up, not the player's jump shot. Otherwise I'd just be re-discovering
that some guys can shoot.

And I refused to trust any of it until it cleared a gauntlet. Each stage had to pass a test or I stopped and
fixed it: is the model calibrated? does the player number *repeat* across the season (a skill, not noise)?
is it actually different from the box score? and — the one that matters most — does it predict anything
**real**, or is it just a model nodding along to itself?

## Building it with Claude Code

I should be honest about how this got made, because it's part of the story. I built almost all of it in a
tight back-and-forth with **Claude Code**, Anthropic's coding agent. It wrote most of the code, ran the
experiments, did the bookkeeping, drafted the paper, and built the demo you're about to see. That's not me
being modest — it's genuinely what happened.

My job was the other half: deciding what question to ask, what to trust, and what counts as a real finding.
The most valuable things I did were *skeptical*. I made it run the one test that actually mattered (does
this predict real outcomes?), and when an earlier, fancier version of the metric looked great on every
statistic but quietly failed a reality check, I killed it. The fun of it was getting to spend my attention
on *judgment* instead of typing — to move at the speed of "what if we tried…" instead of the speed of
boilerplate.

But here's the part worth saying out loud: an AI collaborator makes it *dangerously* easy to produce
plausible-looking results. It will happily generate a beautiful chart for a metric that means nothing. So
the discipline — gating every stage, demanding outcome validity, and reporting the results that *didn't*
work as loudly as the ones that did — mattered more, not less. The speed is the gift and the trap. The
honesty has to come from you.

## Does any of this predict reality?

Everything up to here is the model checking itself, and a model that grades itself always looks brilliant.
So the real question is whether the "points left on the table" predict what actually happens on the floor.

There's one decision where I could check that cleanly. When a player is wide open, he either shoots or
passes. The ones who *shoot* hand me the answer for free — they took the shot, I see the points. So for the
ones who *passed it up*, I can ask a fair question: did their possessions score less than the players who
took that same kind of look? I don't have to guess at the road not taken. Real shooters, in the same spot,
*are* the road not taken.

They do score less. Across 208 games, passing up an average open look costs about a tenth of a point, and
passing up a *great* one costs about **a fifth of a point**. Passing up a *bad* look costs nothing — which
is correct, because declining a bad shot is the smart play. And the better the look you waved off, the more
it cost you. That last part is the tell: a statistical fluke would be flat across shot quality; a real effect
ramps up with it, and this ramps up.

I tried hard to break it and couldn't. It's not just turnovers (it holds when you only count possessions
that ended in a shot). It's not a data glitch (it holds when you throw out the ambiguous cases). And the
obvious objection — "maybe he passed because he saw something better" — points the wrong way: if that were
true, the passers would score *more* afterward. They score *less*. So on average, those passes weren't
hiding a better play.

It's a modest number, and I want to be honest about that. A fifth of a point won't headline SportsCenter.
But it's a *real* fifth of a point, on a decision nobody was measuring, and it is completely invisible to
the box score. That was the whole point.

## The surprise nobody asked for

I assumed the mirror version would work too: when a guy *shoots over* a wide-open teammate, that's a
mistake, right? Pass to the open man — it's the first thing anyone learns.

It doesn't hold up. Shooting over the open teammate actually scored *more*, not fewer, points. After
staring at it for a while the reason is almost obvious: an "open" man is often open *because the defense
doesn't respect him*. Passing to the open shooter only helps if the open shooter is a threat, and a lot of
the time he isn't. So the data quietly refuses to back the oldest instruction in the sport — at least the
version you can measure from tracking. (I can't fully separate "this is a real basketball truth" from "my
way of valuing a teammate's hypothetical shot is just too crude," and I say so in the paper.) Either way,
it's not a read I'd stand behind — and I find that more interesting than if it had simply worked.

## What I'm not claiming

Because the temptation to oversell this is real:

- It measures **one kind of decision** well — passing up your own open shot. Not drives, not the read to
  the open man.
- The effect is **modest**, as I said.
- I can rule out a lot of confounds, but I can't rule out that players see things the cameras don't. No
  observational metric can.
- And when I push it to the player level — "which players are best and worst at this?" — it gets weak and
  shaky. The *decision* is real; ranking *individuals* by it is a much harder problem, and I only get a
  faint signal.

If that list feels long, good. The fastest way to make a sports metric look impressive is to stop checking
it.

## See it yourself

The best part is that you don't have to take my word for any of this. Pick a game, hit play, and watch a
possession unfold from the real 2015-16 tracking — ten players and the ball, the eval bar rising and falling
on the left, and a chess.com-style badge (Great / Good / Inaccuracy / Mistake / Blunder) popping up every
time someone passes up an open look.

- **Demo:** [plot-nba.vercel.app](https://plot-nba.vercel.app)
- **The paper:** [read the full write-up (PDF)](/plot-paper.pdf) — every gate, number, and caveat.
- **Code:** [github.com/jparker2006/PLOT](https://github.com/jparker2006/PLOT)

The short version: decision quality in basketball is real, you can measure a slice of it from public data,
it costs real points, and the box score is blind to it. Just don't let anyone tell you the open man was
always the right call.
