// ====================== DRIFT KING — main.js ======================
// Klaviaturada boshqariladigan drift o'yini: Menyu, Topshiriqlar, Erkin yo'l
 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
 
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
 
// ---------------------- UI elementlari ----------------------
const screens = {
  main: document.getElementById('mainMenu'),
  missions: document.getElementById('missionMenu'),
  controls: document.getElementById('controlsMenu'),
  pause: document.getElementById('pauseMenu'),
  result: document.getElementById('resultMenu'),
};
const hud = document.getElementById('hud');
const missionInfoEl = document.getElementById('missionInfo');
const speedEl = document.getElementById('speed');
const driftScoreEl = document.getElementById('driftScore');
const totalScoreEl = document.getElementById('totalScore');
 
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  if (name) screens[name].classList.remove('hidden');
}
 
if (/Mobi|Android/i.test(navigator.userAgent)) {
  document.getElementById('touchHint').classList.remove('hidden');
}
 
// ---------------------- Topshiriqlar ro'yxati ----------------------
const MISSIONS = [
  {
    id: 'm1',
    title: '1. Issiq motor',
    desc: '45 soniyada 800 ball drift to\'plang.',
    type: 'driftScore',
    target: 800,
    timeLimit: 45,
  },
  {
    id: 'm2',
    title: '2. Halqa bo\'ylab',
    desc: '5 ta nuqtadan ketma-ket o\'ting (checkpoint).',
    type: 'checkpoints',
    target: 5,
    timeLimit: 60,
  },
  {
    id: 'm3',
    title: '3. Drift usta',
    desc: '60 soniyada 1500 ball drift to\'plang.',
    type: 'driftScore',
    target: 1500,
    timeLimit: 60,
  },
  {
    id: 'm4',
    title: '4. Konuslar orasida',
    desc: 'Konuslarga urilmasdan 8 nuqtadan o\'ting.',
    type: 'checkpoints',
    target: 8,
    timeLimit: 75,
  },
];
 
const missionListEl = document.getElementById('missionList');
function renderMissionList() {
  missionListEl.innerHTML = '';
  MISSIONS.forEach(m => {
    const div = document.createElement('div');
    div.className = 'mission-card';
    div.innerHTML = `<div class="m-title">${m.title}</div>
      <div class="m-desc">${m.desc}</div>
      <div class="m-stars">⏱ ${m.timeLimit}s</div>`;
    div.onclick = () => startGame('mission', m);
    missionListEl.appendChild(div);
  });
}
renderMissionList();
 
// ---------------------- Dunyo / xarita ----------------------
const WORLD_W = 3000;
const WORLD_H = 3000;
 
// Konuslar (to'siqlar) - tasodifiy joylashgan
let cones = [];
function generateCones(count) {
  cones = [];
  for (let i = 0; i < count; i++) {
    cones.push({
      x: (Math.random() - 0.5) * WORLD_W * 0.85,
      y: (Math.random() - 0.5) * WORLD_H * 0.85,
      r: 14,
      hit: false,
    });
  }
}
 
// Checkpointlar (topshiriq uchun halqalar)
let checkpoints = [];
function generateCheckpoints(count) {
  checkpoints = [];
  const radius = 900;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = radius * (0.6 + Math.random() * 0.4);
    checkpoints.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      r: 60,
      reached: false,
    });
  }
}
 
// ---------------------- Mashina ----------------------
const car = {
  x: 0, y: 0,
  angle: 0,        // yo'nalish (radian)
  vx: 0, vy: 0,    // tezlik vektori (dunyo koordinatasida)
  steer: 0,        // joriy burilish burchagi
  enginePower: 900,
  maxSpeed: 620,
  drag: 0.985,
  width: 22,
  length: 42,
};
 
function resetCar() {
  car.x = 0; car.y = 0;
  car.angle = -Math.PI / 2;
  car.vx = 0; car.vy = 0;
  car.steer = 0;
}
 
// ---------------------- Klaviatura ----------------------
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') togglePause();
  if (e.code === 'KeyR' && state.mode) resetCar();
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
 
function isDown(...codes) { return codes.some(c => keys[c]); }
 
// ---------------------- O'yin holati ----------------------
const state = {
  mode: null,        // 'free' | 'mission'
  mission: null,
  running: false,
  paused: false,
  driftScore: 0,
  totalScore: 0,
  timeLeft: 0,
  checkpointIndex: 0,
  driftCombo: 0,
  lastTime: 0,
};
 
function startGame(mode, mission = null) {
  state.mode = mode;
  state.mission = mission;
  state.driftScore = 0;
  state.totalScore = 0;
  state.checkpointIndex = 0;
  state.driftCombo = 0;
  state.paused = false;
  resetCar();
  generateCones(mode === 'free' ? 60 : 30);
 
  if (mode === 'mission') {
    state.timeLeft = mission.timeLimit;
    if (mission.type === 'checkpoints') {
      generateCheckpoints(mission.target);
    } else {
      checkpoints = [];
    }
    missionInfoEl.classList.remove('hidden');
  } else {
    checkpoints = [];
    missionInfoEl.classList.add('hidden');
    state.timeLeft = Infinity;
  }
 
  showScreen(null);
  hud.classList.remove('hidden');
  state.running = true;
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
}
 
function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) {
    showScreen('pause');
  } else {
    showScreen(null);
    state.lastTime = performance.now();
  }
}
 
function endGame(success) {
  state.running = false;
  hud.classList.add('hidden');
  const title = document.getElementById('resultTitle');
  const text = document.getElementById('resultText');
  if (state.mode === 'mission') {
    title.textContent = success ? '🏆 Topshiriq bajarildi!' : '❌ Vaqt tugadi';
    text.textContent =
      `${state.mission.title}\nDrift ball: ${Math.floor(state.driftScore)}\nJami ball: ${Math.floor(state.totalScore)}`;
  } else {
    title.textContent = '🌆 Erkin yo\'l tugadi';
    text.textContent = `Drift ball: ${Math.floor(state.driftScore)}\nJami ball: ${Math.floor(state.totalScore)}`;
  }
  showScreen('result');
}
 
// ---------------------- Tugmalar ----------------------
document.getElementById('btnFreeRoam').onclick = () => startGame('free');
document.getElementById('btnMissions').onclick = () => showScreen('missions');
document.getElementById('btnControls').onclick = () => showScreen('controls');
document.getElementById('backFromMissions').onclick = () => showScreen('main');
document.getElementById('backFromControls').onclick = () => showScreen('main');
 
document.getElementById('pauseBtn').onclick = togglePause;
document.getElementById('resumeBtn').onclick = togglePause;
document.getElementById('restartBtn').onclick = () => startGame(state.mode, state.mission);
document.getElementById('toMenuBtn').onclick = () => { state.running = false; hud.classList.add('hidden'); showScreen('main'); };
 
document.getElementById('resultRetry').onclick = () => startGame(state.mode, state.mission);
document.getElementById('resultToMenu').onclick = () => showScreen('main');
 
// ---------------------- Fizika / yangilash ----------------------
function update(dt) {
  // --- Boshqarish kirishlari ---
  const throttle = isDown('KeyW', 'ArrowUp') ? 1 : (isDown('KeyS', 'ArrowDown') ? -1 : 0);
  const steerInput = (isDown('KeyA', 'ArrowLeft') ? -1 : 0) + (isDown('KeyD', 'ArrowRight') ? 1 : 0);
  const handbrake = isDown('Space');
 
  // Mashina yo'nalishidagi tezlik kattaligi (forward speed)
  const heading = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
  const forwardSpeed = car.vx * heading.x + car.vy * heading.y;
  const speed = Math.hypot(car.vx, car.vy);
 
  // --- Burilish: tezlikka bog'liq, sekin yurganda sekin buriladi, to'xtagan bo'lsa burilmaydi ---
  const speedFactor = Math.min(1, Math.abs(forwardSpeed) / 120);
  const steerStrength = 2.6 * (0.35 + 0.65 * speedFactor);
  car.steer += (steerInput * 0.85 - car.steer) * 0.18;
  if (speed > 4) {
    car.angle += car.steer * steerStrength * dt * Math.sign(forwardSpeed || 1);
  }
 
  // --- Tezlanish ---
  const accel = throttle * car.enginePower;
  car.vx += heading.x * accel * dt;
  car.vy += heading.y * accel * dt;
 
  // --- Lateral (yon) tezlik komponenti — drift uchun asosiy narsa ---
  const right = { x: -heading.y, y: heading.x };
  const lateralSpeed = car.vx * right.x + car.vy * right.y;
 
  // grip: qo'l tormoz bosilganda yon ushlash kuchi kamayadi -> drift kuchayadi
  // tezlik qancha katta bo'lsa, drift shuncha uzoqroq davom etadi (realistik)
  const baseGrip = handbrake ? 0.985 : 0.22;
  const grip = handbrake ? baseGrip : Math.min(0.30, baseGrip + speed * 0.00015);
  const newLateral = lateralSpeed * (1 - grip);
  car.vx += right.x * (newLateral - lateralSpeed);
  car.vy += right.y * (newLateral - lateralSpeed);
 
  // umumiy ishqalanish (havo qarshiligi)
  car.vx *= car.drag;
  car.vy *= car.drag;
 
  // Gaz/tormoz bosilmaganda mashina o'zidan-o'zi yurmasligi uchun
  // past tezlikda qo'shimcha to'xtatuvchi ishqalanish (faqat to'g'ri yo'nalishda, drift buzilmasin)
  if (throttle === 0 && !handbrake) {
    const idleFriction = 0.92;
    car.vx *= idleFriction;
    car.vy *= idleFriction;
  }
 
  // Juda past tezlikda butunlay to'xtatish (sudralib yurishni oldini olish)
  const minSpeedThreshold = 6;
  if (Math.hypot(car.vx, car.vy) < minSpeedThreshold && throttle === 0) {
    car.vx = 0;
    car.vy = 0;
  }
 
  // maksimal tezlik chegarasi
  const curSpeed = Math.hypot(car.vx, car.vy);
  if (curSpeed > car.maxSpeed) {
    const k = car.maxSpeed / curSpeed;
    car.vx *= k; car.vy *= k;
  }
 
  // --- Pozitsiyani yangilash ---
  car.x += car.vx * dt;
  car.y += car.vy * dt;
 
  // Dunyo chegarasi
  const half = WORLD_W / 2 - 40;
  car.x = Math.max(-half, Math.min(half, car.x));
  car.y = Math.max(-half, Math.min(half, car.y));
 
  // --- Drift ball hisoblash ---
  const slipAngle = Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed) + 1);
  const isDrifting = speed > 80 && slipAngle > 0.28;
  if (isDrifting) {
    state.driftCombo += dt;
    const gain = (slipAngle * 60 + speed * 0.05) * (1 + Math.min(2, state.driftCombo * 0.15)) * dt;
    state.driftScore += gain;
    state.totalScore += gain;
  } else {
    state.driftCombo = Math.max(0, state.driftCombo - dt * 2);
  }
 
  // --- Konuslar bilan to'qnashish ---
  for (const cone of cones) {
    const dx = car.x - cone.x, dy = car.y - cone.y;
    const dist = Math.hypot(dx, dy);
    if (dist < cone.r + 16 && !cone.hit) {
      cone.hit = true;
      // tepkisini bering — sekin pasayadi keyin qaytadan faollashadi
      car.vx *= 0.6; car.vy *= 0.6;
      state.totalScore = Math.max(0, state.totalScore - 50);
      setTimeout(() => { cone.hit = false; }, 1500);
    }
  }
 
  // --- Checkpointlar (topshiriq) ---
  if (state.mode === 'mission' && state.mission.type === 'checkpoints' && checkpoints.length) {
    const cp = checkpoints[state.checkpointIndex];
    if (cp) {
      const d = Math.hypot(car.x - cp.x, car.y - cp.y);
      if (d < cp.r) {
        cp.reached = true;
        state.checkpointIndex++;
        state.totalScore += 200;
        if (state.checkpointIndex >= checkpoints.length) {
          endGame(true);
        }
      }
    }
  }
 
  // --- Vaqt va missiya holati ---
  if (state.mode === 'mission') {
    state.timeLeft -= dt;
    if (state.mission.type === 'driftScore') {
      if (state.driftScore >= state.mission.target) {
        endGame(true);
      } else if (state.timeLeft <= 0) {
        endGame(false);
      }
    } else if (state.mission.type === 'checkpoints') {
      if (state.timeLeft <= 0) endGame(false);
    }
  }
}
 
// ---------------------- Chizish (render) ----------------------
function worldToScreen(wx, wy, camX, camY) {
  return {
    x: canvas.width / 2 + (wx - camX),
    y: canvas.height / 2 + (wy - camY),
  };
}
 
function drawGround(camX, camY) {
  ctx.fillStyle = '#33424f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
 
  // asfalt panjarasi (grid)
  const grid = 140;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  const startX = -((camX - canvas.width / 2) % grid);
  const startY = -((camY - canvas.height / 2) % grid);
  for (let x = startX; x < canvas.width; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = startY; y < canvas.height; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
 
  // dunyo chegarasi
  const half = WORLD_W / 2;
  const corners = [[-half,-half],[half,-half],[half,half],[-half,half]];
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  corners.forEach((c, i) => {
    const p = worldToScreen(c[0], c[1], camX, camY);
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.stroke();
}
 
function drawCones(camX, camY) {
  for (const cone of cones) {
    const p = worldToScreen(cone.x, cone.y, camX, camY);
    if (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) continue;
    ctx.beginPath();
    ctx.fillStyle = cone.hit ? '#888' : '#ff9f1c';
    ctx.arc(p.x, p.y, cone.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
 
function drawCheckpoints(camX, camY) {
  checkpoints.forEach((cp, i) => {
    const p = worldToScreen(cp.x, cp.y, camX, camY);
    const isCurrent = i === state.checkpointIndex;
    ctx.beginPath();
    ctx.arc(p.x, p.y, cp.r, 0, Math.PI * 2);
    ctx.strokeStyle = cp.reached ? 'rgba(107,212,255,0.3)' : (isCurrent ? '#6bd4ff' : 'rgba(255,255,255,0.25)');
    ctx.lineWidth = isCurrent ? 6 : 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, p.x, p.y + 5);
  });
}
 
function drawCar(camX, camY) {
  const p = worldToScreen(car.x, car.y, camX, camY);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(car.angle);
 
  // tayyor izlar (drift bo'lsa)
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-car.length / 2, -car.width / 2, car.length, car.width);
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(car.length / 2 - 10, -car.width / 2, 10, car.width);
  // g'ildiraklar
  ctx.fillStyle = '#111';
  ctx.fillRect(-car.length / 2 + 4, -car.width / 2 - 3, 10, 5);
  ctx.fillRect(-car.length / 2 + 4, car.width / 2 - 2, 10, 5);
  ctx.fillRect(car.length / 2 - 14, -car.width / 2 - 3, 10, 5);
  ctx.fillRect(car.length / 2 - 14, car.width / 2 - 2, 10, 5);
 
  ctx.restore();
}
 
function drawDriftTrail() {
  // oddiy iz effekti
  const speed = Math.hypot(car.vx, car.vy);
  if (speed > 80) {
    const heading = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    const right = { x: -heading.y, y: heading.x };
    const lateralSpeed = car.vx * right.x + car.vy * right.y;
    if (Math.abs(lateralSpeed) > 60) {
      trails.push({ x: car.x, y: car.y, life: 1 });
    }
  }
}
 
let trails = [];
function drawTrails(camX, camY) {
  ctx.fillStyle = 'rgba(20,20,20,0.5)';
  trails.forEach(t => {
    const p = worldToScreen(t.x, t.y, camX, camY);
    ctx.globalAlpha = t.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  trails.forEach(t => t.life -= 0.01);
  trails = trails.filter(t => t.life > 0 && trails.length < 400);
}
 
function render() {
  const camX = car.x, camY = car.y;
  drawGround(camX, camY);
  drawTrails(camX, camY);
  drawCheckpoints(camX, camY);
  drawCones(camX, camY);
  drawCar(camX, camY);
}
 
// ---------------------- HUD yangilash ----------------------
function updateHUD() {
  const speed = Math.hypot(car.vx, car.vy);
  speedEl.textContent = `${Math.floor(speed * 0.5)} km/h`;
  driftScoreEl.textContent = `Drift: ${Math.floor(state.driftScore)}`;
  totalScoreEl.textContent = `Jami: ${Math.floor(state.totalScore)}`;
 
  if (state.mode === 'mission') {
    const m = state.mission;
    const t = Math.max(0, Math.ceil(state.timeLeft));
    if (m.type === 'driftScore') {
      missionInfoEl.textContent = `${m.title} — Maqsad: ${m.target} drift ball | Qoldi: ${t}s`;
    } else {
      missionInfoEl.textContent = `${m.title} — Nuqta: ${state.checkpointIndex}/${m.target} | Qoldi: ${t}s`;
    }
  }
}
 
// ---------------------- Asosiy sikl ----------------------
function loop(now) {
  if (!state.running) return;
  if (state.paused) { requestAnimationFrame(loop); return; }
 
  let dt = (now - state.lastTime) / 1000;
  dt = Math.min(dt, 0.05);
  state.lastTime = now;
 
  update(dt);
  drawDriftTrail();
  render();
  updateHUD();
 
  requestAnimationFrame(loop);
}
 
// Boshlanishda asosiy menyu ko'rinadi
showScreen('main');
 