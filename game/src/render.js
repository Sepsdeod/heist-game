// The Velvet Vault — every pixel the game draws: the rooms, the people,
// the cones of sight, the loot and the HUD. No game logic here.
import { TILE, VIEW_W, VIEW_H, ALARM_MAX, ALARM_WARNING_AT } from './config.js';
import { tileCenter } from './world.js';

const GOLD = '#e8b64c';
const GOLD_DIM = '#8a6d2f';
const MARBLE = '#2b3245';
const MARBLE_DARK = '#232839';
const WALL_TOP = '#4a5470';
const CARPET = '#6e1f2a';
const CARPET_DARK = '#571824';
const SHADOW = '#1a2033';
const SHADOW_EDGE = '#141a29';

function drawFloor(ctx, room) {
  for (let y = 0; y < room.rows; y++) {
    for (let x = 0; x < room.cols; x++) {
      const ch = room.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = MARBLE_DARK;
        ctx.fillRect(px, py + TILE - 8, TILE, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(px, py, TILE, 3);
      } else if (ch === 'C') {
        ctx.fillStyle = '#3a2f22';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#54432e';
        ctx.fillRect(px + 3, py + 3, TILE - 6, 8);
        ctx.strokeStyle = GOLD_DIM;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, py + 8, TILE - 16, TILE - 16);
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === ',') {
        ctx.fillStyle = SHADOW;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = SHADOW_EDGE;
        ctx.fillRect(px, py, TILE, 2);
        ctx.fillRect(px, py, 2, TILE);
      } else if (ch === 'r') {
        ctx.fillStyle = (x + y) % 2 === 0 ? CARPET : CARPET_DARK;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = GOLD_DIM;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? MARBLE : MARBLE_DARK;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(px + 2, py + 2, TILE - 4, 2);
      }
    }
  }
}

function drawCone(ctx, x, y, angle, range, halfAngle, color, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard, now) {
  // Vision cone first, so the guard stands on top of it.
  const coneColor = guard.state === 'chase'
    ? 'rgba(255,64,64,0.30)'
    : guard.suspicion > 0.4
      ? 'rgba(255,170,40,0.28)'
      : 'rgba(255,214,90,0.20)';
  const coneEdge = guard.state === 'chase' ? 'rgba(255,80,80,0.55)' : 'rgba(255,214,90,0.45)';
  drawCone(ctx, guard.x, guard.y, guard.angle, 195, 0.61, coneColor, coneEdge);
  // Body: a navy-uniformed guard with a brass badge and a cap.
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = '#1d2f57';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1830';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e4d8';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.angle) * 8, Math.sin(guard.angle) * 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Suspicion: a '?' that grows into a '!' over the guard's head.
  if (guard.suspicion > 0.08) {
    const mark = guard.suspicion > 0.7 ? '!' : '?';
    const size = 13 + guard.suspicion * 9;
    ctx.font = `bold ${Math.round(size)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.suspicion > 0.7 ? '#ff5252' : '#ffd65a';
    ctx.fillText(mark, guard.x, guard.y - 20 - Math.sin(now / 180) * 2);
  }
}

function drawCamera(ctx, camera, now) {
  const color = camera.blind > 0 || camera.seeing === false
    ? 'rgba(255,90,90,0.16)'
    : 'rgba(255,90,90,0.30)';
  drawCone(ctx, camera.x, camera.y, camera.angle, 235, 0.5, color, 'rgba(255,90,90,0.5)');
  // The camera dome on its wall mount (mx, my); the cone starts at its eye.
  ctx.save();
  ctx.translate(camera.mx, camera.my);
  ctx.rotate(camera.angle);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(-4, -7, 18, 14);
  ctx.fillStyle = camera.seeing ? '#ff4040' : '#ff7070';
  ctx.beginPath();
  ctx.arc(14, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(15, -1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (camera.seeing) {
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5252';
    ctx.fillText('REC', camera.x, camera.y - 16 - Math.sin(now / 150) * 2);
  }
}

function drawLoot(ctx, room, now) {
  for (const item of room.loot) {
    if (item.taken) continue;
    const pos = tileCenter(item);
    const bob = Math.sin(now / 320 + item.x) * 2;
    ctx.save();
    ctx.translate(pos.x, pos.y + bob);
    ctx.fillStyle = 'rgba(232,182,76,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 14 + Math.sin(now / 300) * 2, 0, Math.PI * 2);
    ctx.fill();
    // A cut jewel: a little diamond that catches the light.
    ctx.fillStyle = '#7ee7ff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(4, -2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-4, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // The prize piece: bigger, golden, ringed, impossible to miss.
  const prize = room.prize;
  if (prize && !prize.taken) {
    const pos = tileCenter(prize);
    const pulse = 1 + Math.sin(now / 280) * 0.08;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(232,182,76,0.30)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(9, 6);
    ctx.lineTo(0, 13);
    ctx.lineTo(-9, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, -2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.fillText('PRIZE', pos.x, pos.y - 30);
  }
}

function drawThief(ctx, thief, now) {
  // A soft shadow-pool under the thief, then Vesper in dark teal and a mask.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 9, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = thief.moving ? Math.sin(thief.stepPhase) * 1.5 : 0;
  ctx.save();
  ctx.translate(thief.x, thief.y + bob);
  ctx.fillStyle = thief.sneaking ? '#14424a' : '#1d6a72';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a2e33';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The mask: a dark band across the eyes.
  ctx.fillStyle = '#0e1a22';
  ctx.fillRect(-9, -4, 18, 6);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-4, -1, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (thief.sneaking) {
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fd8de';
    ctx.fillText('sneaking', thief.x, thief.y - 20);
  }
}

function drawExit(ctx, room, now) {
  const pos = room.exitPos;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.fillStyle = room.exitOpen ? '#2f7d4f' : '#3a3f4d';
  ctx.fillRect(-19, -19, 38, 38);
  ctx.strokeStyle = room.exitOpen ? GOLD : '#6a7086';
  ctx.lineWidth = 3;
  ctx.strokeRect(-19, -19, 38, 38);
  ctx.fillStyle = room.exitOpen ? '#ffe9a8' : '#8a90a5';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(room.exitOpen ? 'EXIT' : 'LOCKED', 0, 4);
  if (room.exitOpen) {
    ctx.strokeStyle = `rgba(232,182,76,${0.5 + Math.sin(now / 250) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-24, -24, 48, 48);
  }
  ctx.restore();
}

function drawCoins(ctx, room) {
  for (const coin of room.coins) {
    const x = coin.landed ? coin.tx : coin.sx + (coin.tx - coin.sx) * coin.t;
    const y = coin.landed ? coin.ty : coin.sy + (coin.ty - coin.sy) * coin.t - Math.sin(coin.t * Math.PI) * 26;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD_DIM;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (!coin.landed) {
      ctx.strokeStyle = 'rgba(232,182,76,0.4)';
      ctx.beginPath();
      ctx.moveTo(coin.sx, coin.sy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}

function drawSmoke(ctx, room) {
  if (room.smokeTime <= 0) return;
  ctx.fillStyle = `rgba(200,205,215,${Math.min(0.45, room.smokeTime * 0.12)})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2b3245';
  ctx.fillText('SMOKE — they cannot see you', VIEW_W / 2, 120);
}

// --- the HUD: alarm meter, loot, tools, room and time, always on screen.
function drawHud(ctx, game) {
  const room = game.room;
  const pad = 14;
  // Top bar: a dark ribbon the HUD sits on.
  ctx.fillStyle = 'rgba(10,12,20,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = GOLD_DIM;
  ctx.fillRect(0, 64, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(room.name, pad, 22);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#b9c0d4';
  ctx.fillText(`Score ${game.score}   •   Loot ${game.totalLoot}   •   Room ${game.levelIndex + 1}/3`, pad, 46);

  // The alarm meter: centre top, labelled, impossible to miss.
  const meterW = 320;
  const meterX = VIEW_W / 2 - meterW / 2;
  const meterY = 14;
  const alarm = room.alarm / ALARM_MAX;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = alarm >= ALARM_WARNING_AT / ALARM_MAX ? '#ff6b6b' : '#f2ead8';
  ctx.fillText('ALARM', VIEW_W / 2, meterY - 2);
  ctx.fillStyle = '#1a1e2c';
  ctx.fillRect(meterX, meterY + 8, meterW, 18);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY + 8, meterW, 18);
  const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  grad.addColorStop(0, '#e8b64c');
  grad.addColorStop(0.55, '#e07b39');
  grad.addColorStop(1, '#d93838');
  ctx.fillStyle = grad;
  ctx.fillRect(meterX + 1, meterY + 9, Math.max(0, (meterW - 2) * alarm), 16);
  if (alarm >= ALARM_WARNING_AT / ALARM_MAX) {
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('THEY ARE ONTO YOU', VIEW_W / 2, meterY + 40);
  }

  // Right side: tools and the clock.
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = '#f2ead8';
  const mm = Math.floor(room.roomTime / 60);
  const ss = Math.floor(room.roomTime % 60).toString().padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, VIEW_W - pad, 20);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#b9c0d4';
  ctx.fillText(`Coins ${room.coinsLeft} (click to throw)`, VIEW_W - pad, 40);
  ctx.fillText(`Smoke ${room.smokeLeft} (Space)`, VIEW_W - pad, 56);

  // A flash message under the top bar, when the game has news.
  if (game.message && game.messageTime > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(game.message, VIEW_W / 2, 96);
  }

  // Bottom hint ribbon.
  ctx.fillStyle = 'rgba(10,12,20,0.7)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.textAlign = 'center';
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#b9c0d4';
  ctx.fillText('WASD / arrows move  •  Shift sneak  •  Click throws a coin  •  Space smoke bomb  •  P pause  •  M mute', VIEW_W / 2, VIEW_H - 13);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8,10,18,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || GOLD;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.font = '19px Georgia, serif';
  ctx.fillStyle = '#e8e4d8';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 310 + i * 32));
}

export function renderGame(ctx, game, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.textBaseline = 'alphabetic';
  if (!game.room) {
    overlay(ctx, 'THE VELVET VAULT', ['A heist in three rooms.', 'Press Enter to slip inside.'], GOLD);
    return;
  }
  const room = game.room;
  const shakeX = room.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
  const shakeY = room.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawFloor(ctx, room);
  drawExit(ctx, room, now);
  drawLoot(ctx, room, now);
  for (const camera of room.cameras) drawCamera(ctx, camera, now);
  for (const guard of room.guards) drawGuard(ctx, guard, now);
  drawThief(ctx, room.thief, now);
  drawCoins(ctx, room);
  drawSmoke(ctx, room);
  ctx.restore();

  if (game.screen === 'playing' || game.screen === 'paused') drawHud(ctx, game);

  if (game.screen === 'title') {
    overlay(ctx, 'THE VELVET VAULT', [
      'Vesper the thief slips into the Gilded Gallery tonight.',
      'Steal the prize in each room, then reach the getaway door.',
      'Guards patrol with cones of sight. Cameras sweep. Stay out of both.',
      'Coins distract a guard. Smoke blinds the room. The alarm ends the run.',
      '',
      'Press Enter to begin the heist.',
    ], GOLD);
  } else if (game.screen === 'paused') {
    overlay(ctx, 'PAUSED', ['The crew waits in the dark.', 'Press P to keep moving.'], '#b9c0d4');
  } else if (game.screen === 'roomclear') {
    const bonus = game.roomClearBonus || { room: 0, time: 0 };
    overlay(ctx, 'ROOM CLEARED', [
      `${room.prizeName} is yours. The crew is already counting it.`,
      `Room bonus +${bonus.room}   •   Speed bonus +${bonus.time}`,
      `Score so far: ${game.score}`,
      '',
      'Press Enter for the next room.',
    ], '#7ee7a0');
  } else if (game.screen === 'caught') {
    const by = room.caughtBy === 'alarm'
      ? 'The alarm hit 100 — the whole building woke up.'
      : 'A guard laid hands on Vesper.';
    overlay(ctx, 'CAUGHT!', [
      by,
      `The ${room.prizeName} stays in its case. This time.`,
      `Score so far: ${game.score}`,
      '',
      'Press Enter to try the room again.',
    ], '#ff6b6b');
  } else if (game.screen === 'win') {
    const mins = Math.floor(game.runTime / 60);
    const secs = Math.floor(game.runTime % 60).toString().padStart(2, '0');
    overlay(ctx, 'THE PERFECT HEIST', [
      'Three rooms. Three prizes. Nobody saw a thing.',
      `Final score: ${game.score}   •   Loot pocketed: ${game.totalLoot}   •   Time: ${mins}:${secs}`,
      '',
      'Press Enter to run it back.',
    ], GOLD);
  }
}
