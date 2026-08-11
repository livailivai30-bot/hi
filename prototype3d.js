import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080c);
scene.fog = new THREE.FogExp2(0x07080c, 0.028);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x8a91aa, 0x17120d, 1.35));
const moon = new THREE.DirectionalLight(0xd4dcff, 2.0);
moon.position.set(-18, 24, 12);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -45; moon.shadow.camera.right = 45;
moon.shadow.camera.top = 45; moon.shadow.camera.bottom = -45;
scene.add(moon);

const playerLight = new THREE.PointLight(0xd9b65a, 2.0, 10);
scene.add(playerLight);

const matWall = new THREE.MeshStandardMaterial({ color: 0x29282d, roughness: 0.95 });
const matFloor = new THREE.MeshStandardMaterial({ color: 0x111217, roughness: 1 });
const matDoor = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.72, metalness: 0.08, emissive: 0x211506 });
const matGold = new THREE.MeshStandardMaterial({ color: 0xd3ad4c, emissive: 0x4a3508, emissiveIntensity: 1.3 });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), matFloor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const colliders = [];
function addWall(x, z, w, d, h = 3) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matWall);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  colliders.push({ x, z, w, d });
}

// Clear, connected maze: every starting and door area has a reachable route.
addWall(0, -30, 60, 1); addWall(0, 30, 60, 1);
addWall(-30, 0, 1, 60); addWall(30, 0, 1, 60);
[
  [0, -20, 40, 1], [20, -10, 1, 20], [0, 0, 40, 1],
  [-20, 10, 1, 20], [0, 20, 40, 1], [10, 10, 1, 18],
  [-10, -10, 1, 18], [-20, -20, 18, 1], [20, 20, 18, 1],
  [-10, 10, 10, 1], [10, -10, 10, 1]
].forEach(a => addWall(...a));

function blocked(x, z) {
  const r = 0.52;
  return colliders.some(c =>
    x > c.x - c.w / 2 - r && x < c.x + c.w / 2 + r &&
    z > c.z - c.d / 2 - r && z < c.z + c.d / 2 + r
  );
}

// Simple third-person player.
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.38, 1.0, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xaaa7a0, roughness: 0.82 })
);
body.position.y = 1.05; body.castShadow = true; player.add(body);
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.29, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xb9a58c, roughness: 0.9 })
);
head.position.y = 1.85; head.castShadow = true; player.add(head);
scene.add(player);
player.position.set(-24, 0, -24);

const doorData = [
  { pos: [24, 0, -27.5], title: 'THE GATE OF TRUTH', text: 'A stranger offers you a perfect memory. You know it never happened. Do you keep it?', choices: ['Keep it. A meaningful memory does not need to be true.', 'Destroy it. A beautiful lie is still a lie.', 'Study it first. The truth can wait.'] },
  { pos: [27.5, 0, 24], title: 'THE GATE OF SACRIFICE', text: 'One person can be saved. Five others can be saved if you make the first person pay the price. You have one minute.', choices: ['Save the five.', 'Save the one.', 'Refuse the choice and search for another way.'] },
  { pos: [-24, 0, 27.5], title: 'THE GATE OF FREEDOM', text: 'A door opens only if you surrender something you value. What do you give?', choices: ['Safety.', 'The truth.', 'Someone else’s trust.'] }
];

const doors = [];
for (const data of doorData) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, 0.45), matDoor);
  frame.position.y = 2.2; frame.castShadow = true; group.add(frame);
  const rune = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 8, 32), matGold);
  rune.rotation.y = Math.PI / 2; rune.position.set(0, 2.2, -0.25); group.add(rune);
  group.position.set(...data.pos); scene.add(group);
  doors.push({ data, mesh: group, used: false });
}

const keys = Object.create(null);
let yaw = Math.PI / 4;
let pitch = 0.18;
let dialogOpen = false;
let score = { truth: 0, freedom: 0, sacrifice: 0 };

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e' && !e.repeat) interact();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

addEventListener('mousemove', e => {
  if (dialogOpen || document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0016, -0.25, 0.7);
});
renderer.domElement.addEventListener('click', () => {
  if (!dialogOpen && document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
});

function move(dt) {
  let forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
  let side = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  if (!forward && !side) return;
  const len = Math.hypot(forward, side); forward /= len; side /= len;
  const speed = keys.shift ? 7.2 : 5.2;
  const dx = (Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed * dt;
  const dz = (Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed * dt;
  const nx = player.position.x + dx;
  const nz = player.position.z + dz;
  if (!blocked(nx, player.position.z)) player.position.x = nx;
  if (!blocked(player.position.x, nz)) player.position.z = nz;
  player.rotation.y = yaw + Math.PI;
  playerLight.position.set(player.position.x, 2.0, player.position.z);
}

function nearestDoor() {
  let best = null, bestDist = Infinity;
  for (const d of doors) {
    if (d.used) continue;
    const dist = Math.hypot(player.position.x - d.mesh.position.x, player.position.z - d.mesh.position.z);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return bestDist < 4.2 ? best : null;
}

function interact() {
  if (dialogOpen) return;
  const d = nearestDoor();
  if (d) openDialog(d);
}

function openDialog(d) {
  dialogOpen = true;
  document.exitPointerLock?.();
  document.getElementById('dialog').classList.remove('hidden');
  document.getElementById('dialogTag').textContent = d.data.title;
  document.getElementById('dialogTitle').textContent = 'The maze is listening.';
  document.getElementById('dialogText').textContent = d.data.text;
  const box = document.getElementById('choices'); box.innerHTML = '';
  d.data.choices.forEach((text, i) => {
    const button = document.createElement('button');
    button.className = 'choice'; button.type = 'button'; button.textContent = text;
    button.onclick = () => choose(d, i);
    box.appendChild(button);
  });
}

function choose(d, i) {
  score.truth += i === 1 ? 2 : 0;
  score.freedom += i === 2 ? 2 : 0;
  score.sacrifice += i === 0 ? 2 : 0;
  d.used = true;
  document.getElementById('dialog').classList.add('hidden');
  dialogOpen = false;
  d.mesh.traverse(o => {
    if (o.material && 'emissive' in o.material) o.material.emissive.setHex(0x5a4210);
  });
  document.getElementById('objective').textContent = doors.every(x => x.used)
    ? 'Chapter One complete — the maze has learned something about you.'
    : 'The door remembers your answer. Find the next one.';
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!dialogOpen) move(dt);

  const target = new THREE.Vector3(player.position.x, 1.25, player.position.z);
  const distance = 6.0;
  const desired = new THREE.Vector3(
    player.position.x - Math.sin(yaw) * distance,
    2.8 + pitch * 2.0,
    player.position.z - Math.cos(yaw) * distance
  );
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.lookAt(target);

  if (!dialogOpen) {
    const d = nearestDoor();
    document.getElementById('objective').textContent = d
      ? 'Press E to enter the door'
      : 'Explore the labyrinth and find a door';
  }
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.addEventListener('error', e => console.error('Maze of Mind error:', e.error || e.message));
playerLight.position.set(player.position.x, 2, player.position.z);
loop();
