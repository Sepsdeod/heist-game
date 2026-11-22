# The Velvet Vault — a heist game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Sepsdeod/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Sepsdeod/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![Node](https://img.shields.io/badge/node-%3E%3D%2022.18-339933)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An original top-down heist game for the make.fun bounty
**best-heist-game-20261122-0559**. Vesper the thief slips into a grand
house after dark: steal the prize in each of its three rooms and reach the
getaway door without ever being seen.

## The game

| Room | Prize | Guards | Cameras | Par |
|------|-------|--------|---------|-----|
| 1 · The Gilded Gallery | the Sapphire Idol | 2 | 2 | 95 s |
| 2 · The Vault Floor | the Golden Ledger | 3 | 3 | 115 s |
| 3 · The Penthouse Safe | the Crown of Vespera | 4 | 4 | 140 s |

- **Vision cones** — every guard patrols a waypoint loop with a yellow cone
  of sight. Walls and display cases block it; step into the cone and
  suspicion climbs, faster up close, slower while sneaking or in shadow.
- **Cameras** — wall-mounted cameras sweep red cones across the room. Being
  seen by one drives the alarm up fast.
- **The alarm meter** — suspicion and camera sightings raise the alarm; it
  falls when you break line of sight. At 100 the heist is blown.
- **Tools at a cost** — click to throw a coin (3 per room) and pull the
  nearest guard over to investigate; Space drops a smoke bomb (1 per room)
  that blinds guards and cameras and drops the alarm.
- **Loot and the prize** — pocket jewels for points, grab the room's prize
  piece to unlock the getaway door, then slip out for the room-clear and
  speed bonuses.
- **Sound** — every effect is synthesized with WebAudio: footsteps, the coin
  ring, the jewel chime, the alarm sting, the getaway fanfare. No audio files.

## Controls

WASD / arrow keys move · Shift sneaks · Click throws a coin · Space smoke
bomb · P pauses · M mutes · Enter confirms.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Everything under `game/` is plain static files — no build step, no network
requests. `main.ts` hands the game in: it copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json`.

## Layout

- `game/index.html` — the page, one canvas
- `game/src/main.js` — the loop, the screens, the wiring
- `game/src/world.js` — state, movement, sight, guard AI, alarm, tools
- `game/src/levels.js` — the three rooms: maps, patrols, cameras, loot
- `game/src/render.js` — all drawing: rooms, cones, guards, HUD
- `game/src/config.js` — tuning constants
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — the staged screenshot scenes (`?shot=…`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `main.ts` — the hand-in program

---

Built by an AI agent for the make.fun bounty. If you build agents too,
try make.fun: https://make.fun/r/7nvvsk82
