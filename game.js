'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// --- Skins: cada skin define su propia paleta (mismos índices 1-12 que
// las piezas/PIECES) y su función de dibujo drawBlock-compatible.
function drawRetro(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = SKINS.retro.palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawNeon(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = SKINS.neon.palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.fillStyle = color;
  context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
  // el resplandor no debe contaminar el resto del render (grid, siguiente frame...)
  context.shadowBlur = 0;
  context.shadowColor = 'transparent';
  context.fillStyle = 'rgba(255,255,255,0.25)';
  context.fillRect(x * size + 2, y * size + 2, size - 4, 3);
  context.globalAlpha = 1;
}

function drawPastel(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = SKINS.pastel.palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  const radius = 6;
  const canRound = typeof context.roundRect === 'function';
  context.fillStyle = color;
  if (canRound) {
    context.beginPath();
    context.roundRect(px, py, s, s, radius);
    context.fill();
  } else {
    context.fillRect(px, py, s, s);
  }
  context.fillStyle = 'rgba(255,255,255,0.35)';
  if (canRound) {
    context.beginPath();
    context.roundRect(px, py, s, Math.max(4, s * 0.35), radius);
    context.fill();
  } else {
    context.fillRect(px, py, s, 4);
  }
  context.globalAlpha = 1;
}

function drawPixel(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = SKINS.pixel.palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  context.fillStyle = color;
  context.fillRect(px, py, s, s);
  // borde oscuro estilo 8-bit
  context.fillStyle = 'rgba(0,0,0,0.35)';
  context.fillRect(px, py, s, 2);
  context.fillRect(px, py, 2, s);
  context.fillRect(px, py + s - 2, s, 2);
  context.fillRect(px + s - 2, py, 2, s);
  // dithering: puntos alternados tipo textura pixel-art
  context.fillStyle = 'rgba(255,255,255,0.25)';
  const dot = Math.max(2, Math.floor(s / 6));
  for (let row = 0, ri = 0; row < s; row += dot, ri++) {
    for (let col = ri % 2 === 0 ? 0 : dot; col < s; col += dot * 2) {
      context.fillRect(px + col, py + row, dot, dot);
    }
  }
  context.globalAlpha = 1;
}

const SKINS = {
  retro: {
    draw: drawRetro,
    boardBg: null,
    gridColor: null,
    palette: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - yellow
      '#ba68c8', // T - purple
      '#81c784', // S - green
      '#e57373', // Z - red
      '#90caf9', // J - pale blue
      '#ffb74d', // L - orange
      '#f06292', // + pentominó - rosa
      '#4db6ac', // U pentominó - teal
      '#9575cd', // Y pentominó - lila
      '#ffffff', // 1x1 recompensa - blanco
      '#9e9e9e', // 3x3 hueca reto - gris
    ],
  },
  neon: {
    draw: drawNeon,
    boardBg: '#000000',
    gridColor: '#161616',
    palette: [
      null,
      '#00e5ff', // I
      '#ffea00', // O
      '#e040fb', // T
      '#00e676', // S
      '#ff1744', // Z
      '#2979ff', // J
      '#ff9100', // L
      '#ff4081', // + pentominó
      '#1de9b6', // U pentominó
      '#7c4dff', // Y pentominó
      '#ffffff', // 1x1 recompensa
      '#b0bec5', // 3x3 hueca reto
    ],
  },
  pastel: {
    draw: drawPastel,
    boardBg: '#fdf6f0',
    gridColor: '#ece0d8',
    palette: [
      null,
      '#a7d8e8', // I
      '#fff2b2', // O
      '#d9b3e0', // T
      '#bfe3c0', // S
      '#f0b8b8', // Z
      '#c3dcf5', // J
      '#f5cda0', // L
      '#f7c6d9', // + pentominó
      '#b2e0da', // U pentominó
      '#cdc0ec', // Y pentominó
      '#ffffff', // 1x1 recompensa
      '#d6d6d6', // 3x3 hueca reto
    ],
  },
  pixel: {
    draw: drawPixel,
    boardBg: '#101020',
    gridColor: '#2a2a40',
    palette: [
      null,
      '#3ff0f0', // I
      '#f0e14d', // O
      '#c04ecf', // T
      '#4dcf6a', // S
      '#e0453f', // Z
      '#4f8ff0', // J
      '#f0954d', // L
      '#f04d8f', // + pentominó
      '#4dcfb0', // U pentominó
      '#8f4df0', // Y pentominó
      '#ffffff', // 1x1 recompensa
      '#8f8f8f', // 3x3 hueca reto
    ],
  },
};

const DEFAULT_SKIN = 'retro';
const SKIN_KEY = 'tetris-skin';

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[0,8,0],[8,8,8],[0,8,0]],                  // + pentominó
  [[9,0,9],[9,9,9]],                          // U pentominó
  [[0,10],[10,10],[0,10],[0,10]],             // Y pentominó
  [[11]],                                     // 1x1 recompensa
  [[12,12,12],[12,0,12],[12,12,12]],          // 3x3 hueca reto
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const SPECIAL_CHANCE = 0.12;
const SPECIAL_TYPES = [8, 9, 10, 12];
const REWARD_TYPE = 11;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeSwitch = document.getElementById('theme-switch');
const themeLabel = document.getElementById('theme-label');
const skinSelect = document.getElementById('skin-select');

const THEME_KEY = 'tetris-theme';

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, rewardPending;
let currentSkin = DEFAULT_SKIN;

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function pickType() {
  if (Math.random() < SPECIAL_CHANCE) {
    return SPECIAL_TYPES[Math.floor(Math.random() * SPECIAL_TYPES.length)];
  }
  return Math.floor(Math.random() * 7) + 1;
}

function randomPiece(forceType) {
  const type = forceType || pickType();
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    if (cleared === 4) rewardPending = true;
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece(rewardPending ? REWARD_TYPE : undefined);
  rewardPending = false;
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  SKINS[currentSkin].draw(context, x, y, colorIndex, size, alpha);
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  animId = requestAnimationFrame(loop);
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  themeSwitch.checked = theme === 'light';
  themeLabel.textContent = theme === 'light' ? 'MODO CLARO' : 'MODO OSCURO';
  if (board) draw();
  if (next) drawNext();
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'light' ? 'light' : 'dark');
}

themeSwitch.addEventListener('change', () => {
  const theme = themeSwitch.checked ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
});

function applySkin(name) {
  currentSkin = SKINS[name] ? name : DEFAULT_SKIN;
  skinSelect.value = currentSkin;
  const skin = SKINS[currentSkin];
  // El skin manda sobre el fondo/grid del tablero; al volver a "retro" se
  // elimina el override inline para que las variables del tema (applyTheme)
  // recuperen el control.
  if (skin.boardBg && skin.gridColor) {
    document.documentElement.style.setProperty('--board-bg', skin.boardBg);
    document.documentElement.style.setProperty('--grid-color', skin.gridColor);
  } else {
    document.documentElement.style.removeProperty('--board-bg');
    document.documentElement.style.removeProperty('--grid-color');
  }
  if (board) draw();
  if (next) drawNext();
}

function initSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  applySkin(SKINS[saved] ? saved : DEFAULT_SKIN);
}

skinSelect.addEventListener('change', () => {
  localStorage.setItem(SKIN_KEY, skinSelect.value);
  applySkin(skinSelect.value);
});

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  rewardPending = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

initTheme();
initSkin();
init();
