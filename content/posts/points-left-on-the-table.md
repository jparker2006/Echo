---
title: "Points left on the table"
date: "2026-06-03"
description: "Basketball's box score rewards results, not decisions. But can we actually measure them? I built an eval bar to find out, and here's what it found."
---

I love basketball. I've been watching it my whole life. And I'm convinced the box score is lying to us.

Not on purpose. It just records the wrong thing. The box score is the stat sheet: who scored, who
rebounded, who passed. But a beautiful pass that sets up a wide-open layup counts for nothing if the shooter
bricks it, and a wild, contested heave counts for three if it happens to drop. The stat sheet rewards
results. And a result is three things mashed together: how good the decision was, whether the
player can actually shoot, and plain luck.

The part I care about most is the first one, and it's the part you can't see. Whether a player made a good
decision is invisible. I wanted to know if you could pull it out and measure it, and whether it was even
real.

If you've ever watched chess online, you've seen the thing I wanted. There's a bar along the side of the
screen that tells you who's winning right now, after every single move. You don't have to know how to play.
You just read the bar. I wanted that bar for a basketball possession, one trip down the floor. At this
instant, what is this trip worth? And when a player shoots or passes, how good was the decision, regardless
of whether it worked?

What I ended up with is PLOT: Points Left On the Table.

## How I built it

Building the bar comes first. It's a model that takes a snapshot of the floor, where all ten players and the
ball are, and predicts how many points the possession will end up producing. The one thing it has to get
right is honesty: when it says a possession is worth 0.8 points, possessions that look like that one should
actually average about 0.8. To be sure it isn't just memorizing, I never let it grade a game it learned from.
Every game is scored by a version of the model trained only on the other games. Even then, the 0.8s come out
to about 0.8. The honesty holds up on possessions the model has never seen.

The second piece is the measurement itself. Whenever a player can shoot or pass, I compare the best option
available to him with the one he actually chose, and measure the gap in expected points. That gap is the
points left on the table. The word that matters is expected: I judge a choice by what it's worth on average,
not by how it happened to turn out that one time. A pass to an
open shooter is a good decision whether or not the shot drops. A forced shot is a bad one even when it goes
in. Grade by the result and you're just measuring luck again.

There's one trick that makes this work, and it sounds like a bug. When I value the shot a player passed up, I
use a model that doesn't know who was going to take it. A wide-open shot from the same spot is worth the same
whether it's Kobe Bryant or Robert Sacre. That's on purpose. It means I'm grading the decision to
pass up the shot, not the player's jumper. Otherwise I'd just be rediscovering that some guys can shoot.

The third piece is the least glamorous of the three, and it isn't a model at all. The only NBA tracking data
that has ever been public comes from a single season, 2015-16, and only about half of it survives out in the
wild. What you get is raw camera coordinates: the x and y of all ten players and the ball, twenty-five times
a second, and almost nothing else. The cameras don't tell you who has the ball, where one possession ends and
the next begins, or even which basket a team is attacking. I had to rebuild all of that from scratch, then
throw out the games where the tracking was too garbled to trust. About 208 survived. Cleaning the data took
longer than building the models that sit on top of it.

## Does it predict anything real?

Here's the problem with everything I've said so far. A model that grades itself always looks brilliant. Of
course the possessions my model liked scored well; it's the same model doing the liking and the scoring. The
real question, the only one that counts, is whether the points left on the table predict what actually
happens on the floor.

There's one decision where I could check that cleanly. When a player is wide open, he either shoots or
passes. The ones who shoot hand me the answer for free: they took the shot, so I see what it was worth. So
for the ones who passed it up, I can ask a fair question. Did their possessions score less than the players
who took that same kind of look? I don't have to imagine what that shot would have
been worth. The players who took it, from the same kind of look, already show me.

They do score less. Across 208 games, passing up an average open look costs about a tenth of a point.
Passing up a great one costs about a fifth. Passing up a bad look costs nothing, which is exactly right,
because turning down a bad shot is the smart play. And the better the look the player waved off, the more it
cost him. That last part is the tell. A statistical fluke would be flat: it wouldn't care how good the shot
was. A real effect grows with the quality of the shot. This one grows.

I tried hard to break it and couldn't. It holds when I count only the possessions that ended in a shot, so
it isn't just turnovers. It holds when I throw out the messy, ambiguous cases. And the obvious objection,
that the player passed because he saw something even better, points the wrong way: if that were true, the
passers would score more afterward, not less. They score less.

A fifth of a point is a small number. It won't lead SportsCenter. But it's a real fifth of a point, on a
decision nobody was measuring, and completely invisible to the box score.

## The surprise nobody asked for

I assumed the opposite rule would hold too. Picture a player with the ball and a teammate standing wide open
nearby. He takes his own shot instead of making the pass. That's a mistake, right? Pass to the open man is
the first thing anyone learns.

It doesn't hold up. When players took their own shot instead of feeding the open teammate, their possessions
scored more points, not fewer. After staring at it for a while, the reason is almost obvious: a teammate is
often open because the defense doesn't respect him. Passing to the open man only helps if the open man can
actually punish the defense, and a lot of the time he can't. I can't fully separate "this is a real truth
about basketball" from "my way of valuing the teammate's hypothetical shot is just too crude," and I say so
in the paper. Either way, the data quietly refuses to back the oldest instruction in the sport, and I find
that more interesting than if it had simply worked.

## What I'm not claiming

It's easy to oversell a result like this, so let me say plainly what it isn't.

- It measures exactly one kind of decision: whether to shoot when you're open. Not drives, not passes to
  other players.
- The effect is small.
- I can rule out many other explanations, but not the chance that players see things the cameras miss.
  Nothing built from camera data can.
- It works on the decision. It does not yet work on people. When I try to rank players, the signal nearly
  disappears.

A long list of limits isn't a bad sign. It's the difference between a number you can trust and one that
only looks good.

One more thing. I built all of this with Claude Code, an AI coding assistant, in a long, running
conversation. It wrote all of the code and ran the experiments; my job was to ask the questions and stay
skeptical. A few years ago a project like this would have taken a small research team months. It took me a
weekend. The fact that it's now within reach for one person still feels a little unreal.

## See it yourself

You don't have to take my word for any of this. Pick a game and press play: ten players and the ball move
across the floor from the real 2015-16 tracking, the eval bar climbs and drops on the side, and a chess-style
label pops up every time someone passes up an open look.

![The PLOT demo replaying a Warriors possession: the eval bar on the left, players moving across the court,
and a chess-style badge on each passed-up open look.](/plot-demo.gif)

- Demo: [plot-nba.vercel.app](https://plot-nba.vercel.app)
- The paper: [read the full write-up (PDF)](/plot-paper.pdf), with every test, number, and caveat.
- Code: [github.com/jparker2006/PLOT](https://github.com/jparker2006/PLOT)

The box score doesn't show everything. Good decisions are worth real, countable points, and bad ones leave
them on the table. That's the whole idea, and it's why you shouldn't trust anyone who says the open man was
always the right call.
