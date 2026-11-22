// The Velvet Vault — the entry point: the loop, the screens, the wiring
// between input, world, render and sound. Nothing else starts the game.
import { VIEW_W, VIEW_H } from './config.js';
import { LEVELS } from './levels.js';
import {
  newGame, startRoom, updateGame, throwCoin, useSmoke, advanceGame, pauseGame,
} from './world.js';
import { renderGame } from './render.js';
import { installInput, readMovement } from './input.js';
import { playEvents, setMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = newGame(LEVELS);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

// The staged screenshot scenes freeze a live game state and render it once.
if (shotName) {
  const screen = applyShot(game, shotName);
  renderGame(ctx, game, 1200);
  window.__shotReady = true;
  window.__shotScreen = screen;
} else {
  startRoom(game);
  game.screen = 'title';
  installInput(canvas, {
    onConfirm: () => {
      if (game.screen === 'title' || game.screen === 'roomclear' || game.screen === 'caught' || game.screen === 'win') {
        advanceGame(game);
      }
    },
    onSmoke: () => useSmoke(game),
    onPause: () => pauseGame(game),
    onMute: () => {
      game.muted = !game.muted;
      setMuted(game.muted);
    },
    onThrowCoin: (x, y) => throwCoin(game, x, y),
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.screen === 'playing') {
      updateGame(game, readMovement(), dt);
    }
    playEvents(game.events);
    renderGame(ctx, game, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// A tiny handle for play-tests and the screenshot driver.
window.__velvetVault = game;
