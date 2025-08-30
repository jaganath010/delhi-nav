// script.js - Enhanced with Moving Ambulance
const GRID_SIZE = 15;
const CELL_SIZE = 40;
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Delhi landmarks (x, y)
const landmarks = {
  "AIIMS": [2, 2],
  "CP": [5, 5],
  "India Gate": [7, 7],
  "Lotus": [10, 8],
  "Airport": [12, 12],
  "Station": [3, 10],
  "Jantar": [9, 3]
};

// Obstacles (disasters)
let obstacles = new Set(["5,5", "5,6", "6,5", "6,6", "7,7", "4,9", "5,9"]);

// Start and Goal
let start = [2, 2];  // AIIMS
let goal = [12, 12]; // IGI Airport

// D* Lite variables
let g = {};
let rhs = {};
let openList = [];

// Ambulance animation
let path = [];
let currentStep = 0;
let animationId = null;
let isMoving = false;

// Draw grid
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const key = `${x},${y}`;
      ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      if (obstacles.has(key)) {
        ctx.fillStyle = "red";
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Draw landmarks
  Object.entries(landmarks).forEach(([name, [x, y]]) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
  });

  // Draw goal
  ctx.fillStyle = "gold";
  ctx.fillRect(goal[0] * CELL_SIZE, goal[1] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.fillStyle = "black";
  ctx.fillText("Goal", goal[0] * CELL_SIZE + CELL_SIZE / 2, goal[1] * CELL_SIZE + 20);

  // Draw path
  if (path.length > 0) {
    ctx.beginPath();
    ctx.moveTo(path[0][0] * CELL_SIZE + CELL_SIZE / 2, path[0][1] * CELL_SIZE + CELL_SIZE / 2);
    path.forEach(([x, y]) => {
      ctx.lineTo(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
    });
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Draw ambulance
  if (isMoving && currentStep < path.length) {
    const [x, y] = path[currentStep];
    ctx.fillStyle = "green";
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "white";
    ctx.fillText("🚑", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
  } else if (!isMoving && path.length > 0) {
    const [x, y] = path[0];
    ctx.fillStyle = "green";
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "white";
    ctx.fillText("🚑", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
  }
}

// Compute path using D* Lite logic
function computePath() {
  // Reset
  g = {};
  rhs = {};

  // Initialize goal
  const goalKey = goal.join(",");
  rhs[goalKey] = 0;
  g[goalKey] = Infinity;

  // Simple BFS-like update for demo
  const queue = [goal];
  while (queue.length) {
    const u = queue.shift();
    const uKey = u.join(",");
    for (const v of getNeighbors(u)) {
      const vKey = v.join(",");
      const newCost = cost(u, v) + (g[uKey] !== undefined ? g[uKey] : Infinity);
      if (newCost < (g[vKey] || Infinity)) {
        g[vKey] = newCost;
        queue.push(v);
      }
    }
  }

  // Extract path
  path = extractPath();
  currentStep = 0;
  drawMap();
}

function getNeighbors(u) {
  const [x, y] = Array.isArray(u) ? u : u.split(",").map(Number);
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        neighbors.push([nx, ny]);
      }
    }
  }
  return neighbors;
}

function cost(u, v) {
  const vKey = v.join(",");
  return obstacles.has(vKey) ? Infinity : Math.hypot(u[0]-v[0], u[1]-v[1]);
}

function extractPath() {
  const p = [start];
  let curr = start;
  while (!(curr[0] === goal[0] && curr[1] === goal[1])) {
    const neighbors = getNeighbors(curr).filter(n => !obstacles.has(n.join(",")));
    if (neighbors.length === 0) break;
    curr = neighbors.reduce((a, b) => {
      const ga = g[a.join(",")] || Infinity;
      const gb = g[b.join(",")] || Infinity;
      return ga < gb ? a : b;
    });
    p.push(curr);
    if (p.length > 100) break;
  }
  return p;
}

// Animation loop
function moveAmbulance() {
  if (currentStep < path.length - 1) {
    currentStep++;
    drawMap();
    animationId = setTimeout(moveAmbulance, 800); // Move every 800ms
  } else {
    isMoving = false;
    drawMap();
    alert("🚑 Ambulance reached the destination!");
  }
}

// Controls
function startAnimation() {
  if (path.length === 0) {
    computePath();
  }
  isMoving = true;
  moveAmbulance();
}

function stopAnimation() {
  if (animationId) {
    clearTimeout(animationId);
    animationId = null;
  }
  isMoving = false;
  drawMap();
}

function resetMap() {
  stopAnimation();
  g = {};
  rhs = {};
  path = [];
  currentStep = 0;
  isMoving = false;
  drawMap();
}

function addRandomDisaster() {
  const x = Math.floor(Math.random() * GRID_SIZE);
  const y = Math.floor(Math.random() * GRID_SIZE);
  const key = `${x},${y}`;
  if (!obstacles.has(key) && !(start[0] === x && start[1] === y) && !(goal[0] === x && goal[1] === y)) {
    obstacles.add(key);
    if (isMoving) {
      stopAnimation();
      computePath();
      startAnimation(); // Resume
    } else {
      computePath();
    }
  }
}

// Initialize
computePath();
drawMap();