const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coinCounter = document.getElementById('coinCounter');
const statusText = document.getElementById('status');
const restartButton = document.getElementById('restartButton');

const GRAVITY = 0.6;
const PLAYER_SPEED = 4.5;
const JUMP_FORCE = -12.5;

const level = {
  width: 2200,
  height: canvas.height,
  platforms: [
    { x: 0, y: 500, w: 700, h: 40 },
    { x: 760, y: 450, w: 180, h: 30 },
    { x: 1000, y: 390, w: 170, h: 30 },
    { x: 1230, y: 330, w: 160, h: 30 },
    { x: 1480, y: 400, w: 220, h: 30 },
    { x: 1740, y: 470, w: 460, h: 40 },
    { x: 1580, y: 280, w: 120, h: 24 },
  ],
  coins: [
    { x: 835, y: 405, collected: false },
    { x: 1080, y: 345, collected: false },
    { x: 1280, y: 285, collected: false },
    { x: 1610, y: 235, collected: false },
    { x: 1860, y: 425, collected: false },
  ],
  goal: { x: 2100, y: 405, w: 42, h: 65 },
};

const playerTemplate = {
  x: 60,
  y: 420,
  w: 36,
  h: 52,
  vx: 0,
  vy: 0,
  onGround: false,
};

let player = { ...playerTemplate };
let keys = new Set();
let cameraX = 0;
let gameWon = false;
let totalCoins = level.coins.length;

function resetGame() {
  player = { ...playerTemplate };
  level.coins.forEach((coin) => {
    coin.collected = false;
  });
  gameWon = false;
  statusText.textContent = 'Durum: Hazır';
}

function updateStats() {
  const collected = level.coins.filter((coin) => coin.collected).length;
  coinCounter.textContent = `Kristaller: ${collected}/${totalCoins}`;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updatePlayer() {
  if (gameWon) return;

  player.vx = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) player.vx = -PLAYER_SPEED;
  if (keys.has('ArrowRight') || keys.has('d')) player.vx = PLAYER_SPEED;

  player.x += player.vx;

  player.onGround = false;
  player.vy += GRAVITY;
  player.y += player.vy;

  for (const platform of level.platforms) {
    if (rectsOverlap(player, platform)) {
      if (player.vy > 0 && player.y + player.h - player.vy <= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && player.y - player.vy >= platform.y + platform.h) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      } else if (player.vx > 0) {
        player.x = platform.x - player.w;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.w;
      }
    }
  }

  if (player.y > canvas.height + 120) {
    statusText.textContent = 'Durum: Düştün! Tekrar başlatılıyor...';
    resetGame();
  }

  for (const coin of level.coins) {
    if (!coin.collected && rectsOverlap(player, { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 })) {
      coin.collected = true;
    }
  }

  const allCollected = level.coins.every((coin) => coin.collected);
  if (allCollected && rectsOverlap(player, level.goal)) {
    gameWon = true;
    statusText.textContent = 'Durum: Kazandın! 🎉';
  } else if (allCollected) {
    statusText.textContent = 'Durum: Portal açık, hedefe git!';
  }

  player.x = Math.max(0, Math.min(level.width - player.w, player.x));
  cameraX = Math.max(0, Math.min(level.width - canvas.width, player.x - canvas.width * 0.35));
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#63b5ff');
  gradient.addColorStop(1, '#84d0ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 280 - cameraX * 0.3) % (canvas.width + 350)) - 120;
    const y = 70 + (i % 4) * 45;
    ctx.beginPath();
    ctx.ellipse(x, y, 60, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 40, y - 8, 50, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 35, y - 2, 45, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const platform of level.platforms) {
    ctx.fillStyle = '#2d3a73';
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#6073cc';
    ctx.fillRect(platform.x + 4, platform.y + 4, platform.w - 8, 8);
  }

  for (const coin of level.coins) {
    if (coin.collected) continue;
    ctx.fillStyle = '#9df8ff';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f2ffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = level.coins.every((coin) => coin.collected) ? '#79ffdb' : '#4f5d94';
  ctx.fillRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(level.goal.x + 6, level.goal.y + 6, level.goal.w - 12, level.goal.h - 12);

  ctx.fillStyle = '#ffcb7e';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#1e243d';
  ctx.fillRect(player.x + 7, player.y + 12, 7, 7);
  ctx.fillRect(player.x + 22, player.y + 12, 7, 7);

  ctx.restore();
}

function gameLoop() {
  updatePlayer();
  updateStats();
  drawBackground();
  drawWorld();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);

  const jumpPressed = key === 'ArrowUp' || key === 'w' || key === ' ';
  if (jumpPressed && player.onGround && !gameWon) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

restartButton.addEventListener('click', resetGame);

resetGame();
updateStats();
gameLoop();
