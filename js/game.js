const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const COLORS = {
  I: "#22d3ee",
  O: "#facc15",
  T: "#a78bfa",
  S: "#4ade80",
  Z: "#f87171",
  J: "#60a5fa",
  L: "#fb923c",
};

const PIECES = Object.keys(SHAPES);
const BASE_DROP_MS = 800;
const SOFT_DROP_MS = 50;
const LINES_PER_LEVEL = 5;

/** Tetris Guideline line-clear multipliers (× current level). */
const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };

const boardCanvas = document.getElementById("board");
const previewCanvas = document.getElementById("preview");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const restartBtn = document.getElementById("restart");

const ctx = boardCanvas.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");

let grid;
let current;
let next;
let dropTimer = 0;
let lastTime = 0;
let paused = false;
let gameOver = false;
let score = 0;
let level = 1;
let linesCleared = 0;

function getDropInterval() {
  return Math.max(80, BASE_DROP_MS - (level - 1) * 70);
}

function updateStats() {
  scoreEl.textContent = score.toLocaleString();
  levelEl.textContent = String(level);
  linesEl.textContent = String(linesCleared);
}

function addLineClearScore(count) {
  if (count < 1 || count > 4) return;
  score += LINE_SCORES[count] * level;
  linesCleared += count;
  const newLevel = Math.floor(linesCleared / LINES_PER_LEVEL) + 1;
  if (newLevel > level) {
    level = newLevel;
  }
  updateStats();
}

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const type = PIECES[(Math.random() * PIECES.length) | 0];
  const matrix = SHAPES[type].map((row) => [...row]);
  return { type, matrix, row: 0, col: ((COLS - matrix[0].length) / 2) | 0 };
}

function collide(piece, offsetRow = 0, offsetCol = 0, matrix = piece.matrix) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const nr = piece.row + r + offsetRow;
      const nc = piece.col + c + offsetCol;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && grid[nr][nc]) return true;
    }
  }
  return false;
}

function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

function tryRotate() {
  if (!current || gameOver || paused) return;
  const rotated = rotate(current.matrix);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(current, 0, kick, rotated)) {
      current.matrix = rotated;
      current.col += kick;
      return;
    }
  }
}

function lockPiece() {
  for (let r = 0; r < current.matrix.length; r++) {
    for (let c = 0; c < current.matrix[r].length; c++) {
      if (!current.matrix[r][c]) continue;
      const nr = current.row + r;
      const nc = current.col + c;
      if (nr < 0) {
        endGame();
        return;
      }
      grid[nr][nc] = current.type;
    }
  }
  clearLines();
  spawn();
}

function clearLines() {
  let cleared = 0;
  outer: for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c]) continue outer;
    }
    grid.splice(r, 1);
    grid.unshift(Array(COLS).fill(0));
    cleared++;
    r++;
  }
  if (cleared > 0) {
    addLineClearScore(cleared);
  }
}

function spawn() {
  current = next || randomPiece();
  next = randomPiece();
  current.row = 0;
  current.col = ((COLS - current.matrix[0].length) / 2) | 0;
  if (collide(current)) {
    endGame();
  }
  drawPreview();
}

function move(dir) {
  if (!current || gameOver || paused) return false;
  if (!collide(current, 0, dir)) {
    current.col += dir;
    return true;
  }
  return false;
}

function softDrop(manual = false) {
  if (!current || gameOver || paused) return;
  if (!collide(current, 1, 0)) {
    current.row++;
    if (manual) {
      score += 1;
      updateStats();
    }
    dropTimer = 0;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (!current || gameOver || paused) return;
  let cells = 0;
  while (!collide(current, 1, 0)) {
    current.row++;
    cells++;
  }
  if (cells > 0) {
    score += cells * 2;
    updateStats();
  }
  lockPiece();
}

function endGame() {
  gameOver = true;
  statusEl.textContent = "Game over";
}

function setStatus(text) {
  statusEl.textContent = text;
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  setStatus(paused ? "Paused" : "Playing");
}

function reset() {
  grid = createGrid();
  next = null;
  dropTimer = 0;
  lastTime = 0;
  paused = false;
  gameOver = false;
  score = 0;
  level = 1;
  linesCleared = 0;
  updateStats();
  setStatus("Playing");
  spawn();
  draw();
}

function drawCell(context, x, y, color, size, pad = 1) {
  context.fillStyle = color;
  context.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);
}

function drawBoard() {
  ctx.fillStyle = "#1a1a24";
  ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell) {
        drawCell(ctx, c, r, COLORS[cell], BLOCK);
      }
    }
  }

  if (current && !gameOver) {
    const color = COLORS[current.type];
    for (let r = 0; r < current.matrix.length; r++) {
      for (let c = 0; c < current.matrix[r].length; c++) {
        if (!current.matrix[r][c]) continue;
        const yr = current.row + r;
        const xc = current.col + c;
        if (yr >= 0) {
          drawCell(ctx, xc, yr, color, BLOCK);
        }
      }
    }
  }

  ctx.strokeStyle = "#2e2e42";
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    const x = c * BLOCK;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, boardCanvas.height);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    const y = r * BLOCK;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(boardCanvas.width, y);
    ctx.stroke();
  }
}

function drawPreview() {
  previewCtx.fillStyle = "#1a1a24";
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  if (!next) return;

  const matrix = next.matrix;
  const color = COLORS[next.type];
  const cell = 24;
  const offsetX = ((previewCanvas.width - matrix[0].length * cell) / 2) | 0;
  const offsetY = ((previewCanvas.height - matrix.length * cell) / 2) | 0;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      previewCtx.fillStyle = color;
      previewCtx.fillRect(
        offsetX + c * cell + 1,
        offsetY + r * cell + 1,
        cell - 2,
        cell - 2
      );
    }
  }
}

function draw() {
  drawBoard();
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!paused && !gameOver) {
    dropTimer += delta;
    const holdingSoftDrop = keysDown.has("ArrowDown");
    const interval = holdingSoftDrop ? SOFT_DROP_MS : getDropInterval();
    if (dropTimer >= interval) {
      softDrop(holdingSoftDrop);
      dropTimer = 0;
    }
  }

  draw();
  requestAnimationFrame(update);
}

const keysDown = new Set();

document.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "p" || e.key === "P") {
    togglePause();
    return;
  }

  if (gameOver) return;

  keysDown.add(e.key);

  switch (e.key) {
    case "ArrowLeft":
      move(-1);
      break;
    case "ArrowRight":
      move(1);
      break;
    case "ArrowDown":
      break;
    case "ArrowUp":
      tryRotate();
      break;
    case " ":
      hardDrop();
      break;
  }
});

document.addEventListener("keyup", (e) => {
  keysDown.delete(e.key);
});

restartBtn.addEventListener("click", reset);

document.querySelectorAll(".touch-btn").forEach((btn) => {
  const action = btn.dataset.action;
  const handler = (e) => {
    e.preventDefault();
    if (gameOver) return;
    switch (action) {
      case "left":
        move(-1);
        break;
      case "right":
        move(1);
        break;
      case "down":
        softDrop(true);
        break;
      case "rotate":
        tryRotate();
        break;
      case "drop":
        hardDrop();
        break;
    }
    draw();
  };
  btn.addEventListener("click", handler);
});

reset();
requestAnimationFrame(update);
