// The Velvet Vault — tuning constants for the whole heist.
// One place for every number the designers argue about: speeds, sight,
// alarm rates, tool costs and scoring. Nothing here draws or moves.
export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;

// The thief. Sneaking is slow and quiet: guards grow suspicious half as fast.
export const THIEF_SPEED = 178; // px per second, walking
export const THIEF_SNEAK_SPEED = 96; // px per second, holding Shift
export const THIEF_RADIUS = 13;

// Guards walk their patrol loops and run when they have spotted the thief.
export const GUARD_SPEED = 72;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_RADIUS = 14;
export const GUARD_PAUSE_SECONDS = 1.1; // wait at each waypoint
export const GUARD_CONE_RANGE = 195;
export const GUARD_CONE_HALF_ANGLE = 0.61; // radians, ~35 degrees
export const GUARD_SIGHT_PER_SECOND = 0.85; // suspicion gain, close range
export const GUARD_SUSPICION_DECAY = 0.45; // suspicion loss per second unseen
export const CHASE_MEMORY_SECONDS = 3.5; // keep chasing after losing sight

// Wall cameras sweep back and forth. Their cones are long and unforgiving.
export const CAMERA_RANGE = 235;
export const CAMERA_HALF_ANGLE = 0.5; // radians, ~29 degrees
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second
export const CAMERA_ALARM_PER_SECOND = 26;

// The alarm meter. 100 means the heist is blown and the run ends.
export const ALARM_MAX = 100;
export const ALARM_RISE_PER_SUSPICION = 30; // per second per fully-suspicious guard
export const ALARM_DECAY_PER_SECOND = 7; // falls when nobody sees the thief
export const ALARM_WARNING_AT = 55; // HUD turns red, music of dread begins

// Shadow floor halves detection; a thrown coin pulls the nearest guard.
export const SHADOW_DETECTION_FACTOR = 0.5;
export const COIN_THROW_RANGE = 270;
export const COIN_INVESTIGATE_RADIUS = 330;
export const COINS_PER_ROOM = 3;
export const SMOKE_PER_ROOM = 1;
export const SMOKE_DURATION = 4.0; // seconds guards and cameras are blind
export const SMOKE_ALARM_DROP = 30;

// Scoring: small loot, the room's prize piece, and a speed bonus.
export const SCORE_SMALL_LOOT = 100;
export const SCORE_PRIZE = 500;
export const SCORE_ROOM_CLEAR = 250;
export const SCORE_TIME_BONUS_MAX = 300;

// Room par times (seconds). Finishing under par earns the time bonus.
export const PAR_SECONDS = [95, 115, 140];
