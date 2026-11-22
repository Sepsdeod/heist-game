// The Velvet Vault — staged scenes for the screenshots.
// ?shot=play stages a rich mid-heist frame (the cover): the thief crossing
// the gallery, guards with their cones, a sweeping camera, the prize glowing
// and the alarm meter already half full. ?shot=start shows the title,
// ?shot=alarm the chase at high alarm, ?shot=clear the getaway.
// These scenes only arrange a live game state; the renders are the game's own.
import { startRoom } from './world.js';
import { TILE } from './config.js';

function place(game, tx, ty) {
  game.room.thief.x = (tx + 0.5) * TILE;
  game.room.thief.y = (ty + 0.5) * TILE;
}

function aimGuard(game, index, tx, ty, angle, suspicion, state) {
  const guard = game.room.guards[index];
  if (!guard) return;
  guard.x = (tx + 0.5) * TILE;
  guard.y = (ty + 0.5) * TILE;
  guard.angle = angle;
  guard.suspicion = suspicion;
  guard.state = state || 'patrol';
  guard.pause = 99;
}

function aimCamera(game, index, angle, seeing) {
  const camera = game.room.cameras[index];
  if (!camera) return;
  camera.angle = angle;
  camera.phase = 0;
  camera.seeing = seeing;
}

// Stage one named scene on a fresh room 1. Returns the screen name for the log.
export function applyShot(game, name) {
  game.levelIndex = 0;
  startRoom(game);
  const room = game.room;
  if (name === 'start') {
    game.screen = 'title';
    return 'title';
  }
  if (name === 'play') {
    // The thief slips along the carpet toward the prize, half the alarm up.
    place(game, 11, 7);
    game.room.thief.sneaking = true;
    aimGuard(game, 0, 8, 4, Math.PI / 2, 0.55, 'patrol');
    aimGuard(game, 1, 24, 9, -Math.PI / 2, 0.2, 'patrol');
    aimCamera(game, 0, Math.PI / 2 + 0.4, false);
    aimCamera(game, 1, 0.2, false);
    room.alarm = 46;
    room.lootTaken = 2;
    game.totalLoot = 2;
    game.score = 200;
    room.loot[0].taken = true;
    room.loot[1].taken = true;
    room.coinsLeft = 2;
    game.screen = 'playing';
    game.message = 'Stay out of the cones — the Sapphire Idol is ahead';
    game.messageTime = 99;
    return 'playing';
  }
  if (name === 'alarm') {
    // A guard has the thief dead to rights; the alarm is nearly blown.
    place(game, 14, 6);
    aimGuard(game, 0, 13, 4, 0.6, 1, 'chase');
    game.room.guards[0].lastSeen = { x: game.room.thief.x, y: game.room.thief.y };
    game.room.guards[0].chaseMemory = 3.5;
    aimGuard(game, 1, 22, 12, -Math.PI * 0.75, 0.9, 'chase');
    aimCamera(game, 0, Math.PI / 2, true);
    room.alarm = 86;
    room.alarmWarned = true;
    room.shake = 0;
    room.coinsLeft = 1;
    room.smokeLeft = 1;
    game.score = 400;
    game.screen = 'playing';
    game.message = 'SPOTTED — break line of sight!';
    game.messageTime = 99;
    return 'playing';
  }
  if (name === 'clear') {
    // The prize is taken, the door is open, the room-clear overlay shows.
    room.prize.taken = true;
    room.prizeTaken = true;
    room.exitOpen = true;
    room.loot.forEach((item) => { item.taken = true; });
    room.lootTaken = room.loot.length;
    game.totalLoot = room.loot.length;
    game.score = 1250;
    game.roomClearBonus = { room: 250, time: 180 };
    place(game, 4, 16);
    aimGuard(game, 0, 8, 10, Math.PI, 0.1, 'patrol');
    aimGuard(game, 1, 24, 14, -Math.PI / 2, 0, 'patrol');
    room.alarm = 12;
    game.screen = 'roomclear';
    return 'roomclear';
  }
  return 'playing';
}
