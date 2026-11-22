// The Velvet Vault — the three rooms of the heist.
// Each room is a tile map plus the people and machines that guard it.
// Map legend: '#' wall, '.' marble floor, ',' shadow floor (half detection),
// 'C' display case (blocks movement and sight), 'r' velvet carpet,
// 'P' thief start, 'E' getaway door, 'L' small loot, 'T' the prize piece.
// Guards walk their waypoint loops; cameras hang on walls and sweep.
export const LEVELS = [
  {
    name: 'Room 1 — The Gilded Gallery',
    prizeName: 'the Sapphire Idol',
    map: [
      '################################',
      '#.....,,,,,,.....#......L......#',
      '#..P..,,,,,,..C..#.............#',
      '#.....,,,,,,.....#......C......#',
      '#.....,,,,,,.....#.............#',
      '#.....,,,,,,.....#......T......#',
      '#..rrrrrrrrrr....#......C......#',
      '#..rrrrrrrrrr.C..#.............#',
      '#..rrrrrrrrrr....#......C......#',
      '#.....,,,,,,...................#',
      '#..C..,,,,,,.....#......L......#',
      '#.....,,,,,,.....#.............#',
      '#.....,,,,,,.....#......C......#',
      '#.....,,,,,,.....#.............#',
      '#..L..,,,,,,..C..#......L......#',
      '#.....,,,,,,.....#.............#',
      '#.....,,,,,,.....#......C......#',
      '#..E..,,,,,,.....#.............#',
      '#.....,,,,,,.....#......L......#',
      '################################',
    ],
    guards: [
      { waypoints: [[5, 3], [13, 3], [13, 15], [5, 15]] },
      { waypoints: [[21, 16], [28, 16], [28, 2], [21, 2]] },
    ],
    cameras: [
      { tile: [24, 0], facing: Math.PI / 2, sweep: 0.7 },
      { tile: [0, 13], facing: 0, sweep: 0.6 },
    ],
  },
  {
    name: 'Room 2 — The Vault Floor',
    prizeName: 'the Golden Ledger',
    map: [
      '################################',
      '#..L....,,,,,,....C......L.....#',
      '#......,,,,,,..........C.......#',
      '#..C...,,,,,,..C......T........#',
      '#......,,,,,,......#...........#',
      '#..P...,,,,,,......#.....C.....#',
      '#......,,,,,,..C...#...........#',
      '#..rrrrrrrrrr......#.....L.....#',
      '#..rrrrrrrrrr..C...#...........#',
      '#......,,,,,,..................#',
      '#..L...,,,,,,..C...#...........#',
      '#......,,,,,,......#.....L.....#',
      '#..C...,,,,,,......#...........#',
      '#......,,,,,,..C...#.....C.....#',
      '#..L...,,,,,,......#...........#',
      '#......,,,,,,......#.....L.....#',
      '#..E...,,,,,,..C...#...........#',
      '#......,,,,,,......#.....C.....#',
      '#......,,,,,,......#...........#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [14, 2], [14, 8], [4, 8]] },
      { waypoints: [[20, 17], [29, 17], [29, 11], [20, 11]] },
      { waypoints: [[24, 2], [24, 8], [29, 8], [29, 2]] },
    ],
    cameras: [
      { tile: [24, 0], facing: Math.PI / 2, sweep: 0.8 },
      { tile: [0, 9], facing: 0, sweep: 0.6 },
      { tile: [31, 15], facing: Math.PI, sweep: 0.7 },
    ],
  },
  {
    name: 'Room 3 — The Penthouse Safe',
    prizeName: 'the Crown of Vespera',
    map: [
      '################################',
      '#..L...,,,,,,.....C......L.....#',
      '#.....C,,,,,,..........C.......#',
      '#......,,,,,,..C......T........#',
      '#..C...,,,,,,......#.....C.....#',
      '#......,,,,,,..C...#...........#',
      '#..P...,,,,,,......#.....L.....#',
      '#......,,,,,,......#...........#',
      '#..rrrrrrrrrr..C...#.....C.....#',
      '#..rrrrrrrrrr......#...........#',
      '#......,,,,,,..................#',
      '#..L...,,,,,,..C...#.....L.....#',
      '#..C...,,,,,,......#...........#',
      '#......,,,,,,..C...#.....C.....#',
      '#..L...,,,,,,......#.....L.....#',
      '#......,,,,,,......#...........#',
      '#..E...,,,,,,..C...#.....C.....#',
      '#......,,,,,,......#...........#',
      '#......,,,,,,......#.....L.....#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [14, 2], [14, 8], [4, 8]] },
      { waypoints: [[20, 17], [29, 17], [29, 12], [20, 12]] },
      { waypoints: [[24, 2], [29, 2], [29, 8], [24, 8]] },
      { waypoints: [[5, 12], [13, 12], [13, 17], [5, 17]] },
    ],
    cameras: [
      { tile: [24, 0], facing: Math.PI / 2, sweep: 0.9 },
      { tile: [0, 9], facing: 0, sweep: 0.7 },
      { tile: [31, 5], facing: Math.PI, sweep: 0.7 },
      { tile: [15, 19], facing: -Math.PI / 2, sweep: 0.6 },
    ],
  },
];

// Turn a level's map strings into the room a game runs in: the tile grid,
// the thief's start, the getaway door, the loot pieces and the prize.
export function parseLevel(def) {
  const rows = def.map.length;
  const cols = def.map[0].length;
  const grid = [];
  let start = null;
  let exit = null;
  const loot = [];
  let prize = null;
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const ch = def.map[y][x];
      if (ch === 'P') { start = { x, y }; row.push('.'); }
      else if (ch === 'E') { exit = { x, y }; row.push('.'); }
      else if (ch === 'L') { loot.push({ x, y, taken: false }); row.push('.'); }
      else if (ch === 'T') { prize = { x, y, taken: false }; row.push('.'); }
      else row.push(ch);
    }
    grid.push(row);
  }
  return { name: def.name, prizeName: def.prizeName, grid, cols, rows, start, exit, loot, prize, guards: def.guards, cameras: def.cameras };
}

// A tile blocks walking and sight when it is a wall or a display case.
export function isSolidTile(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return true;
  const ch = grid[y][x];
  return ch === '#' || ch === 'C';
}

// A tile is shadow floor when it is a comma: dark, and guards see half as well.
export function isShadowTile(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
  return grid[y][x] === ',';
}
