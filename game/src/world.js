// The Velvet Vault — the world: state, movement, sight, guard brains,
// the alarm meter, the thief's tools and the score. No drawing here.
import {
  TILE, THIEF_SPEED, THIEF_SNEAK_SPEED, THIEF_RADIUS,
  GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_RADIUS, GUARD_PAUSE_SECONDS,
  GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, GUARD_SIGHT_PER_SECOND,
  GUARD_SUSPICION_DECAY, CHASE_MEMORY_SECONDS,
  CAMERA_RANGE, CAMERA_HALF_ANGLE, CAMERA_SWEEP_SPEED, CAMERA_ALARM_PER_SECOND,
  ALARM_MAX, ALARM_RISE_PER_SUSPICION, ALARM_DECAY_PER_SECOND,
  SHADOW_DETECTION_FACTOR, COIN_THROW_RANGE, COIN_INVESTIGATE_RADIUS,
  COINS_PER_ROOM, SMOKE_PER_ROOM, SMOKE_DURATION, SMOKE_ALARM_DROP,
  SCORE_SMALL_LOOT, SCORE_PRIZE, SCORE_ROOM_CLEAR, SCORE_TIME_BONUS_MAX,
  PAR_SECONDS,
} from './config.js';
import { parseLevel, isSolidTile, isShadowTile } from './levels.js';

export function tileCenter(tile) {
  return { x: (tile.x + 0.5) * TILE, y: (tile.y + 0.5) * TILE };
}

// A fresh run: room 1, full alarm at zero, the thief Vesper at the door.
export function newGame(levelDefs) {
  return {
    levelDefs,
    levelIndex: 0,
    screen: 'title', // title | playing | roomclear | caught | win | paused
    score: 0,
    totalLoot: 0,
    roomsCleared: 0,
    runTime: 0,
    room: null,
    message: '',
    messageTime: 0,
    muted: false,
    events: [], // sound cues the audio layer drains: 'step' | 'coin' | 'loot' | 'prize' | 'alarm' | 'caught' | 'clear' | 'win' | 'smoke' | 'camera'
  };
}

// Build the live state of one room from its definition.
export function startRoom(game) {
  const def = game.levelDefs[game.levelIndex];
  const room = parseLevel(def);
  const start = tileCenter(room.start);
  const exit = tileCenter(room.exit);
  room.thief = {
    x: start.x, y: start.y, r: THIEF_RADIUS,
    sneaking: false, moving: false, stepPhase: 0,
  };
  room.exitPos = exit;
  room.exitOpen = false;
  room.guards = room.guards.map((g) => {
    const first = tileCenter({ x: g.waypoints[0][0], y: g.waypoints[0][1] });
    return {
      waypoints: g.waypoints.map(([x, y]) => tileCenter({ x, y })),
      wpIndex: 1,
      x: first.x, y: first.y,
      angle: 0, pause: 0, suspicion: 0,
      state: 'patrol', // patrol | investigate | chase
      investigate: null, chaseMemory: 0,
      lastSeen: null, blind: 0,
    };
  });
  room.cameras = room.cameras.map((c) => {
    const pos = tileCenter({ x: c.tile[0], y: c.tile[1] });
    return {
      x: pos.x, y: pos.y, baseAngle: c.facing, sweep: c.sweep,
      angle: c.facing, phase: Math.random() * Math.PI * 2,
      seeing: false, blind: 0, beeped: false,
    };
  });
  room.coins = [];
  room.coinsLeft = COINS_PER_ROOM;
  room.smokeLeft = SMOKE_PER_ROOM;
  room.smokeTime = 0;
  room.alarm = 0;
  room.roomTime = 0;
  room.prizeTaken = false;
  room.lootTaken = 0;
  room.caughtBy = null;
  room.shake = 0;
  game.room = room;
  game.screen = 'playing';
  game.message = '';
  return room;
}

function tileAt(room, px, py) {
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}

// A circle may stand here when none of the tiles its edge touches is solid.
function circleFree(room, x, y, r) {
  const spots = [
    [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
    [x, y - r], [x, y + r], [x - r, y], [x + r, y],
  ];
  return spots.every(([sx, sy]) => {
    const t = tileAt(room, sx, sy);
    return !isSolidTile(room.grid, t.x, t.y);
  });
}

// Walk a ray in small steps; a wall or display case anywhere along it blocks sight.
export function lineOfSight(room, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tile = tileAt(room, x0 + dx * t, y0 + dy * t);
    if (isSolidTile(room.grid, tile.x, tile.y)) return false;
  }
  return true;
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the thief inside this watcher's cone, with a clear line of sight?
function inCone(room, watcher, range, halfAngle) {
  const thief = room.thief;
  const dist = Math.hypot(thief.x - watcher.x, thief.y - watcher.y);
  if (dist > range) return 0;
  const toThief = angleTo(watcher.x, watcher.y, thief.x, thief.y);
  if (Math.abs(angleDiff(toThief, watcher.angle)) > halfAngle) return 0;
  if (!lineOfSight(room, watcher.x, watcher.y, thief.x, thief.y)) return 0;
  // Closer is easier to spot; sneaking in shadow is hardest of all.
  let strength = 1 - (dist / range) * 0.55;
  if (thief.sneaking) strength *= 0.55;
  const tile = tileAt(room, thief.x, thief.y);
  if (isShadowTile(room.grid, tile.x, tile.y)) strength *= SHADOW_DETECTION_FACTOR;
  return Math.max(0.12, strength);
}

function moveToward(entity, tx, ty, speed, dt, room, radius) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = entity.x + (dx / dist) * step;
  const ny = entity.y + (dy / dist) * step;
  if (circleFree(room, nx, entity.y, radius)) entity.x = nx;
  if (circleFree(room, entity.x, ny, radius)) entity.y = ny;
  entity.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

function updateGuard(game, room, guard, dt) {
  const thief = room.thief;
  if (guard.blind > 0) guard.blind -= dt;
  const blinded = guard.blind > 0 || room.smokeTime > 0;

  // --- sight: how strongly does this guard see the thief right now?
  let seen = 0;
  if (!blinded) {
    seen = inCone(room, guard, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE);
    if (seen > 0) {
      guard.suspicion = Math.min(1, guard.suspicion + GUARD_SIGHT_PER_SECOND * seen * dt);
      guard.lastSeen = { x: thief.x, y: thief.y };
      guard.chaseMemory = CHASE_MEMORY_SECONDS;
    }
  }
  if (seen === 0) {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD_SUSPICION_DECAY * dt);
    guard.chaseMemory = Math.max(0, guard.chaseMemory - dt);
  }

  // --- brains: chase a thief plainly seen, investigate a noise, else patrol.
  if (guard.suspicion >= 0.85 && !blinded) {
    guard.state = 'chase';
  } else if (guard.state === 'chase' && guard.chaseMemory <= 0) {
    guard.state = guard.investigate ? 'investigate' : 'patrol';
  }
  if (guard.state === 'chase') {
    const target = guard.lastSeen || { x: thief.x, y: thief.y };
    moveToward(guard, target.x, target.y, GUARD_CHASE_SPEED, dt, room, GUARD_RADIUS);
    if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD_RADIUS + THIEF_RADIUS + 2) {
      room.caughtBy = 'guard';
      game.screen = 'caught';
      game.events.push('caught');
    }
  } else if (guard.state === 'investigate' && guard.investigate) {
    const done = moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD_SPEED * 1.25, dt, room, GUARD_RADIUS);
    if (done) {
      guard.pause = 1.6;
      guard.state = 'patrol';
      guard.investigate = null;
    }
  } else {
    guard.state = 'patrol';
    if (guard.pause > 0) {
      guard.pause -= dt;
    } else {
      const target = guard.waypoints[guard.wpIndex];
      const arrived = moveToward(guard, target.x, target.y, GUARD_SPEED, dt, room, GUARD_RADIUS);
      if (arrived) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.pause = GUARD_PAUSE_SECONDS;
      }
    }
  }
}

function updateCamera(game, room, camera, dt) {
  if (camera.blind > 0) camera.blind -= dt;
  camera.phase += dt;
  camera.angle = camera.baseAngle + Math.sin(camera.phase * CAMERA_SWEEP_SPEED) * camera.sweep;
  camera.seeing = false;
  if (camera.blind > 0 || room.smokeTime > 0) return;
  const strength = inCone(room, camera, CAMERA_RANGE, CAMERA_HALF_ANGLE);
  camera.seeing = strength > 0;
  if (camera.seeing) {
    room.alarm = Math.min(ALARM_MAX, room.alarm + CAMERA_ALARM_PER_SECOND * strength * dt);
    if (!camera.beeped) {
      camera.beeped = true;
      game.events.push('alarm');
    }
  } else {
    camera.beeped = false;
  }
}

function collectLoot(game, room) {
  const thief = room.thief;
  for (const item of room.loot) {
    if (item.taken) continue;
    const pos = tileCenter(item);
    if (Math.hypot(thief.x - pos.x, thief.y - pos.y) < TILE * 0.62) {
      item.taken = true;
      room.lootTaken++;
      game.totalLoot++;
      game.score += SCORE_SMALL_LOOT;
      game.events.push('loot');
      flashMessage(game, `+${SCORE_SMALL_LOOT}  pocketed a jewel`);
    }
  }
  const prize = room.prize;
  if (prize && !prize.taken) {
    const pos = tileCenter(prize);
    if (Math.hypot(thief.x - pos.x, thief.y - pos.y) < TILE * 0.7) {
      prize.taken = true;
      room.prizeTaken = true;
      room.exitOpen = true;
      game.score += SCORE_PRIZE;
      game.events.push('prize');
      flashMessage(game, `${room.name.split('—')[1].trim()}: ${game.levelDefs[game.levelIndex].prizeName} secured — reach the getaway door!`);
    }
  }
}

function flashMessage(game, text) {
  game.message = text;
  game.messageTime = 3.2;
}

function checkExit(game, room) {
  if (!room.exitOpen) return;
  const thief = room.thief;
  if (Math.hypot(thief.x - room.exitPos.x, thief.y - room.exitPos.y) < TILE * 0.7) {
    const par = PAR_SECONDS[game.levelIndex];
    const timeBonus = Math.max(0, Math.round(SCORE_TIME_BONUS_MAX * (1 - room.roomTime / (par * 1.6))));
    game.score += SCORE_ROOM_CLEAR + timeBonus;
    game.roomsCleared++;
    game.events.push('clear');
    game.screen = 'roomclear';
    game.roomClearBonus = { room: SCORE_ROOM_CLEAR, time: timeBonus };
  }
}

// One tick of the heist. Input is {up,down,left,right,sneak} booleans.
export function updateGame(game, input, dt) {
  if (game.screen !== 'playing' || !game.room) return;
  const room = game.room;
  const thief = room.thief;
  game.runTime += dt;
  room.roomTime += dt;
  if (game.messageTime > 0) game.messageTime -= dt;
  if (room.smokeTime > 0) room.smokeTime -= dt;
  if (room.shake > 0) room.shake -= dt;

  // --- the thief moves.
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.sneaking = !!input.sneak;
  thief.moving = dx !== 0 || dy !== 0;
  if (thief.moving) {
    const len = Math.hypot(dx, dy);
    const speed = thief.sneaking ? THIEF_SNEAK_SPEED : THIEF_SPEED;
    const nx = thief.x + (dx / len) * speed * dt;
    const ny = thief.y + (dy / len) * speed * dt;
    if (circleFree(room, nx, thief.y, thief.r)) thief.x = nx;
    if (circleFree(room, thief.x, ny, thief.r)) thief.y = ny;
    thief.stepPhase += dt * (thief.sneaking ? 5 : 9);
    if (Math.sin(thief.stepPhase) > 0.92 && !thief.sneaking) game.events.push('step');
  }

  // --- coins ring out and fall where they land.
  for (const coin of room.coins) {
    if (coin.landed) continue;
    coin.t += dt * 3;
    if (coin.t >= 1) {
      coin.landed = true;
      game.events.push('coin');
      for (const guard of room.guards) {
        if (Math.hypot(guard.x - coin.x, guard.y - coin.y) < COIN_INVESTIGATE_RADIUS) {
          guard.investigate = { x: coin.x, y: coin.y };
          if (guard.state !== 'chase') guard.state = 'investigate';
        }
      }
    }
  }

  // --- guards and cameras watch.
  for (const guard of room.guards) updateGuard(game, room, guard, dt);
  if (game.screen !== 'playing') return; // a guard caught the thief
  for (const camera of room.cameras) updateCamera(game, room, camera, dt);

  // --- the alarm climbs while anyone is suspicious, and falls when hidden.
  const maxSuspicion = Math.max(0, ...room.guards.map((g) => g.suspicion));
  const anySeeing = room.cameras.some((c) => c.seeing);
  if (maxSuspicion > 0.4 || anySeeing) {
    room.alarm = Math.min(ALARM_MAX, room.alarm + ALARM_RISE_PER_SUSPICION * Math.max(maxSuspicion, anySeeing ? 0.5 : 0) * dt);
    if (room.alarm >= 55 && !room.alarmWarned) {
      room.alarmWarned = true;
      game.events.push('alarm');
      room.shake = 0.4;
    }
  } else {
    room.alarm = Math.max(0, room.alarm - ALARM_DECAY_PER_SECOND * dt);
    if (room.alarm < 40) room.alarmWarned = false;
  }
  if (room.alarm >= ALARM_MAX) {
    room.caughtBy = 'alarm';
    game.screen = 'caught';
    game.events.push('caught');
    return;
  }

  collectLoot(game, room);
  checkExit(game, room);
}

// Throw a coin toward a point: it arcs there and rings, pulling guards over.
export function throwCoin(game, px, py) {
  const room = game.room;
  if (!room || game.screen !== 'playing') return false;
  if (room.coinsLeft <= 0) { flashMessage(game, 'No coins left — slip past them instead'); return false; }
  const thief = room.thief;
  const dist = Math.hypot(px - thief.x, py - thief.y);
  if (dist > COIN_THROW_RANGE) {
    const k = COIN_THROW_RANGE / dist;
    px = thief.x + (px - thief.x) * k;
    py = thief.y + (py - thief.y) * k;
  }
  room.coinsLeft--;
  room.coins.push({ x: thief.x, y: thief.y, tx: px, ty: py, t: 0, landed: false, sx: thief.x, sy: thief.y });
  return true;
}

// A smoke bomb blinds every guard and camera and drops the alarm.
export function useSmoke(game) {
  const room = game.room;
  if (!room || game.screen !== 'playing') return false;
  if (room.smokeLeft <= 0) { flashMessage(game, 'No smoke bombs left'); return false; }
  room.smokeLeft--;
  room.smokeTime = SMOKE_DURATION;
  room.alarm = Math.max(0, room.alarm - SMOKE_ALARM_DROP);
  for (const guard of room.guards) {
    guard.blind = SMOKE_DURATION;
    guard.suspicion = Math.max(0, guard.suspicion - 0.5);
    if (guard.state === 'chase') guard.state = 'patrol';
  }
  for (const camera of room.cameras) camera.blind = SMOKE_DURATION;
  game.events.push('smoke');
  flashMessage(game, 'Smoke! The room cannot see you — move!');
  return true;
}

// Move on after a room is cleared, or restart after being caught.
export function advanceGame(game) {
  if (game.screen === 'roomclear') {
    if (game.levelIndex + 1 < game.levelDefs.length) {
      game.levelIndex++;
      startRoom(game);
    } else {
      game.screen = 'win';
      game.events.push('win');
    }
  } else if (game.screen === 'caught') {
    startRoom(game); // the same room, fresh alarm, same loot to steal again
  } else if (game.screen === 'win' || game.screen === 'title') {
    game.levelIndex = 0;
    game.score = 0;
    game.totalLoot = 0;
    game.roomsCleared = 0;
    game.runTime = 0;
    startRoom(game);
  }
}

export function pauseGame(game) {
  if (game.screen === 'playing') game.screen = 'paused';
  else if (game.screen === 'paused') game.screen = 'playing';
}
