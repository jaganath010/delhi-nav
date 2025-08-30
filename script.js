// script.js
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

let start = null;
let goal = null;
let mode = "start"; // 'start', 'goal'

// D* Lite variables
let g = {};
let rhs = {};
let openList = [];

// Draw grid
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  // Draw start and goal
  if (start) {
    ctx.fillStyle = "green";
    ctx.fillRect(start[0] * CELL_SIZE, start[1] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "white";
    ctx.fillText("Start", start[0] * CELL_SIZE + CELL_SIZE / 2, start[1] * CELL_SIZE + 20);
  }
  if (goal) {
    ctx.fillStyle = "gold";
    ctx.fillRect(goal[0] * CELL_SIZE, goal[1] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "black";
    ctx.fillText("Goal", goal[0] * CELL_SIZE + CELL_SIZE / 2, goal[1] * CELL_SIZE + 20);
  }

  // Compute and draw path
  if (start && goal) {
    computeShortestPath();
    const path = extractPath();
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
  }
}

// Mouse click
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  if (obstacles.has(`${x},${y}`)) return;

  if (mode === "start") {
    start = [x, y];
    mode = "goal";
  } else if (mode === "goal") {
    goal = [x, y];
    mode = "done";
  }
  drawMap();
});

// D* Lite Functions
function heuristic(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function updateNode(u) {
  const uKey = u.join(",");
  if (uKey !== goal.join(",")) {
    rhs[uKey] = Math.min(
      ...getNeighbors(u).map(v => {
        const vKey = v.join(",");
        return cost(u, v) + (g[vKey] !== undefined ? g[vKey] : Infinity);
      })
    );
  }

  // Remove from open list
  openList = openList.filter(([key, node]) => node !== uKey);

  const g_val = g[uKey] !== undefined ? g[uKey] : Infinity;
  const rhs_val = rhs[uKey] !== undefined ? rhs[uKey] : Infinity;

  if (g_val !== rhs_val) {
    const key = [
      min(g_val, rhs_val) + heuristic(start, u),
      min(g_val, rhs_val)
    ];
    openList.push([key, uKey]);
    openList.sort((a, b) => a[0][0] - b[0][0]);
  }
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
  return obstacles.has(vKey) ? Infinity : heuristic(u, v);
}

function computeShortestPath() {
  if (!goal) return;

  // Initialize goal
  const goalKey = goal.join(",");
  rhs[goalKey] = 0;
  g[goalKey] = Infinity;
  updateNode(goal);

  // Simple path update (for demo)
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
}

function extractPath() {
  if (!start || !goal) return [];
  const path = [start];
  let curr = start;
  while (!(curr[0] === goal[0] && curr[1] === goal[1])) {
    const neighbors = getNeighbors(curr).filter(n => !obstacles.has(n.join(",")));
    if (neighbors.length === 0) break;
    curr = neighbors.reduce((a, b) => {
      const ga = g[a.join(",")] || Infinity;
      const gb = g[b.join(",")] || Infinity;
      return ga < gb ? a : b;
    });
    path.push(curr);
    if (path.length > 100) break;
  }
  return path;
}

function resetMap() {
  start = null;
  goal = null;
  mode = "start";
  g = {};
  rhs = {};
  openList = [];
  drawMap();
}

function addRandomDisaster() {
  const x = Math.floor(Math.random() * GRID_SIZE);
  const y = Math.floor(Math.random() * GRID_SIZE);
  const key = `${x},${y}`;
  if (!obstacles.has(key) && !(start && start[0] === x && start[1] === y) && !(goal && goal[0] === x && goal[1] === y)) {
    obstacles.add(key);
    drawMap();
  }
}

// Initialize
drawMap();