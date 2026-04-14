import * as THREE from 'three';

// ===================== Config =====================
const LANES = [-2.2, 0, 2.2];
const ROAD_WIDTH = 7;
const ROAD_LEN = 20;
const ROAD_COUNT = 8;
const BASE_SPEED = 14;
const SPEED_RAMP = 0.25;
const GRAVITY = 34;
const JUMP_V = 12;
const SLIDE_TIME = 0.7;
const PLAYER_Z = 0;

// ===================== Scene =====================
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const SKY = new THREE.Color(0xffb8d0);
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 28, 85);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
camera.position.set(0, 4.8, 7.5);
camera.lookAt(0, 1.4, -6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

// ===================== Lights =====================
scene.add(new THREE.HemisphereLight(0xffe4f1, 0x442a5c, 0.95));
const sun = new THREE.DirectionalLight(0xfff2d0, 1.05);
sun.position.set(8, 18, 4);
scene.add(sun);

// ===================== Road =====================
const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2038, roughness: 0.9 });
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffd760 });
const sideMat = new THREE.MeshStandardMaterial({ color: 0x5c3674, roughness: 0.85 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x6b3f88, roughness: 1 });

const roadSegments = [];
function buildRoadSegment() {
    const g = new THREE.Group();

    const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.2, ROAD_LEN), roadMat);
    road.position.y = -0.1;
    g.add(road);

    // Dashed lane divider stripes
    for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 4; k++) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 2.5), stripeMat);
            stripe.position.set(s * 1.1, 0.01, -ROAD_LEN/2 + 3 + k * 5);
            g.add(stripe);
        }
    }

    // Sidewalks
    for (let s = -1; s <= 1; s += 2) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, ROAD_LEN), sideMat);
        side.position.set(s * (ROAD_WIDTH/2 + 0.8), 0.1, 0);
        g.add(side);
    }

    // Far planters
    for (let s = -1; s <= 1; s += 2) {
        const planter = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, ROAD_LEN), grassMat);
        planter.position.set(s * (ROAD_WIDTH/2 + 4.6), 0.1, 0);
        g.add(planter);
    }

    // Distant silhouetted buildings (simple blocks)
    const bldMatA = new THREE.MeshStandardMaterial({ color: 0x382248, roughness: 1 });
    const bldMatB = new THREE.MeshStandardMaterial({ color: 0x4a2a5e, roughness: 1 });
    for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 3; k++) {
            const h = 3 + Math.random() * 6;
            const w = 2 + Math.random() * 2;
            const mat = Math.random() < 0.5 ? bldMatA : bldMatB;
            const bld = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
            bld.position.set(s * (ROAD_WIDTH/2 + 6 + Math.random() * 4), h/2, -ROAD_LEN/2 + 2 + k * 6);
            g.add(bld);
            // Window row (emissive)
            const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.7, 0.55) });
            const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.4, 0.05), winMat);
            win.position.set(bld.position.x, h * 0.7, bld.position.z + w/2 + 0.01);
            g.add(win);
        }
    }

    return g;
}

for (let i = 0; i < ROAD_COUNT; i++) {
    const seg = buildRoadSegment();
    seg.position.z = -i * ROAD_LEN + ROAD_LEN;
    scene.add(seg);
    roadSegments.push(seg);
}

// ===================== Player (Maltipoo) =====================
const FUR = new THREE.MeshStandardMaterial({ color: 0xfff6ec, roughness: 0.88 });
const BLK = new THREE.MeshStandardMaterial({ color: 0x181015, roughness: 0.5 });
const PNK = new THREE.MeshStandardMaterial({ color: 0xff9ac2, roughness: 0.5 });

function buildPuppy() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), FUR);
    body.scale.set(1.05, 0.88, 1.25);
    body.position.y = 0.62;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), FUR);
    head.position.set(0, 1.05, 0.55);
    g.add(head);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), FUR);
    snout.position.set(0, 0.92, 0.88);
    snout.scale.z = 1.2;
    g.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), BLK);
    nose.position.set(0, 0.97, 1.05);
    g.add(nose);

    for (let s = -1; s <= 1; s += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), BLK);
        eye.position.set(s * 0.16, 1.18, 0.82);
        g.add(eye);
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        glint.position.set(s * 0.18, 1.21, 0.87);
        g.add(glint);
    }

    // Floppy ears
    for (let s = -1; s <= 1; s += 2) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), FUR);
        ear.scale.set(0.55, 1.15, 0.75);
        ear.position.set(s * 0.3, 1.2, 0.4);
        ear.rotation.z = s * 0.35;
        g.add(ear);
    }

    // Pink bow for Katya
    const bow = new THREE.Group();
    const bowL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), PNK);
    bowL.scale.set(1.2, 0.7, 0.5);
    bowL.position.x = -0.1;
    bow.add(bowL);
    const bowR = bowL.clone();
    bowR.position.x = 0.1;
    bow.add(bowR);
    const bowC = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), PNK);
    bow.add(bowC);
    bow.position.set(0, 1.4, 0.4);
    g.add(bow);

    const legs = [];
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 8), FUR);
        const x = (i % 2 === 0 ? -1 : 1) * 0.3;
        const z = (i < 2 ? 0.28 : -0.28);
        leg.position.set(x, 0.22, z);
        g.add(leg);
        legs.push(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), FUR);
    tail.scale.set(0.8, 0.8, 1.2);
    tail.position.set(0, 0.85, -0.55);
    g.add(tail);

    g.userData = { legs, tail, bow };
    return g;
}

const player = buildPuppy();
scene.add(player);

const P = {
    laneIdx: 1,
    x: 0, targetX: 0,
    y: 0, vy: 0,
    sliding: false, slideT: 0,
    alive: true,
    invuln: 0,
};

// ===================== Obstacles =====================
const obstacles = [];

function makeTorii() {
    const g = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xd13a2a, roughness: 0.7 });
    const blk = new THREE.MeshStandardMaterial({ color: 0x1a1516, roughness: 0.5 });
    for (let s = -1; s <= 1; s += 2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.6, 10), red);
        post.position.set(s * 0.85, 1.3, 0);
        g.add(post);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 0.35), blk);
    top.position.y = 2.55;
    g.add(top);
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 0.22), red);
    top2.position.y = 2.25;
    g.add(top2);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.18), red);
    beam.position.y = 1.9;
    g.add(beam);
    return { mesh: g, kind: 'torii' };
}

function makeLantern() {
    const g = new THREE.Group();
    const paper = new THREE.MeshStandardMaterial({ color: 0xfff2b8, emissive: 0xffb060, emissiveIntensity: 0.55, roughness: 0.7 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), wood);
    base.position.y = 0.12;
    g.add(base);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.95, 12), paper);
    lantern.position.y = 0.72;
    g.add(lantern);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 12), wood);
    cap.position.y = 1.34;
    g.add(cap);
    return { mesh: g, kind: 'lantern' };
}

function makeCrate() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0xa06b3c, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 0.9 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), wood);
    box.position.y = 0.55;
    g.add(box);
    // Cross beams
    for (let ax = 0; ax < 2; ax++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.1), dark);
        beam.position.set(0, 0.55, 0.56);
        beam.rotation.z = ax === 0 ? 0.78 : -0.78;
        g.add(beam);
    }
    return { mesh: g, kind: 'crate' };
}

function spawnObstacle(z) {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const roll = Math.random();
    let o;
    if (roll < 0.4) o = makeTorii();       // slide
    else if (roll < 0.75) o = makeLantern(); // jump
    else o = makeCrate();                   // jump
    o.mesh.position.set(lane, 0, z);
    o.mesh.rotation.y = (Math.random() - 0.5) * 0.1;
    o.lane = lane;
    o.hit = false;
    scene.add(o.mesh);
    obstacles.push(o);
}

// ===================== Controls =====================
let touchStart = null;
const SWIPE_TH = 28;

canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, t: performance.now() };
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (!touchStart || state !== 'play') return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > SWIPE_TH || Math.abs(dy) > SWIPE_TH) {
        handleSwipe(dx, dy);
        touchStart = null;
    }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dt = performance.now() - touchStart.t;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < SWIPE_TH && Math.abs(dy) < SWIPE_TH && dt < 280) {
        tryJump();
    }
    touchStart = null;
}, { passive: true });

function handleSwipe(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        moveLane(dx > 0 ? 1 : -1);
    } else {
        if (dy > 0) slide();
        else tryJump();
    }
}

window.addEventListener('keydown', (e) => {
    if (state !== 'play') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLane(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') moveLane(1);
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') tryJump();
    else if (e.key === 'ArrowDown' || e.key === 's') slide();
});

function moveLane(dir) {
    if (!P.alive) return;
    P.laneIdx = Math.max(0, Math.min(LANES.length - 1, P.laneIdx + dir));
    P.targetX = LANES[P.laneIdx];
}

function tryJump() {
    if (!P.alive) return;
    if (P.y <= 0.01 && !P.sliding) {
        P.vy = JUMP_V;
    }
}

function slide() {
    if (!P.alive) return;
    if (P.y <= 0.01 && !P.sliding) {
        P.sliding = true;
        P.slideT = SLIDE_TIME;
    }
}

// ===================== Game state =====================
let speed = BASE_SPEED;
let distance = 0;
let lives = 3;
let nextSpawnZ = -30;
let state = 'menu'; // 'menu' | 'play' | 'dead'

const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const welcome = document.getElementById('welcome');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('retryBtn').addEventListener('click', startGame);

function startGame() {
    welcome.classList.add('hidden');
    gameover.classList.add('hidden');
    hud.classList.remove('hidden');
    P.laneIdx = 1;
    P.x = 0; P.targetX = 0;
    P.y = 0; P.vy = 0;
    P.sliding = false; P.slideT = 0;
    P.alive = true;
    P.invuln = 0;
    for (const o of obstacles) scene.remove(o.mesh);
    obstacles.length = 0;
    speed = BASE_SPEED;
    distance = 0;
    lives = 3;
    nextSpawnZ = -30;
    updateHud();
    state = 'play';
}

function updateHud() {
    scoreEl.textContent = Math.floor(distance) + ' м';
    livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives));
}

function gameOver() {
    state = 'dead';
    P.alive = false;
    hud.classList.add('hidden');
    finalScore.textContent = Math.floor(distance) + ' м';
    gameover.classList.remove('hidden');
}

// ===================== Collisions =====================
function checkCollisions() {
    if (P.invuln > 0) return;
    for (const o of obstacles) {
        if (o.hit) continue;
        const dz = o.mesh.position.z - PLAYER_Z;
        if (dz > -0.8 && dz < 0.8) {
            if (Math.abs(o.lane - P.x) < 1.0) {
                let hit = false;
                if (o.kind === 'torii') {
                    // Must be sliding to go under; running/jumping hits the top beam
                    const top = P.y + (P.sliding ? 0.55 : 1.55);
                    if (top > 1.7) hit = true;
                } else {
                    // lantern/crate — must jump over
                    if (P.y < 1.3) hit = true;
                }
                if (hit) {
                    o.hit = true;
                    loseLife();
                }
            }
        }
    }
}

function loseLife() {
    lives--;
    P.invuln = 1.2;
    updateHud();
    if (lives <= 0) gameOver();
}

// ===================== Loop =====================
let lastT = performance.now();
function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = now * 0.001;

    if (state === 'play') {
        speed += dt * SPEED_RAMP;
        distance += speed * dt;

        // Lane smoothing
        P.x += (P.targetX - P.x) * Math.min(1, dt * 16);

        // Jump physics
        P.vy -= GRAVITY * dt;
        P.y += P.vy * dt;
        if (P.y < 0) { P.y = 0; P.vy = 0; }

        // Slide timer
        if (P.sliding) {
            P.slideT -= dt;
            if (P.slideT <= 0) P.sliding = false;
        }

        if (P.invuln > 0) P.invuln -= dt;

        // Player transform + run animation
        const bob = P.y === 0 && !P.sliding ? Math.abs(Math.sin(t * 16)) * 0.08 : 0;
        player.position.set(P.x, P.y + bob, PLAYER_Z);
        player.rotation.y = Math.PI + (P.targetX - P.x) * 0.25;
        player.scale.y = P.sliding ? 0.45 : 1;
        player.scale.z = P.sliding ? 1.5 : 1;
        player.userData.legs.forEach((leg, i) => {
            leg.rotation.x = P.y === 0 && !P.sliding ? Math.sin(t * 16 + i * Math.PI/2) * 0.7 : 0.3;
        });
        player.userData.tail.rotation.z = Math.sin(t * 12) * 0.5;
        // Invuln blink
        player.visible = !(P.invuln > 0 && Math.floor(t * 12) % 2 === 0);

        // Scroll world
        const dz = speed * dt;
        for (const seg of roadSegments) {
            seg.position.z += dz;
            if (seg.position.z > ROAD_LEN) {
                seg.position.z -= ROAD_LEN * ROAD_COUNT;
            }
        }
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.mesh.position.z += dz;
            if (o.mesh.position.z > 12) {
                scene.remove(o.mesh);
                obstacles.splice(i, 1);
            }
        }

        // Spawning
        nextSpawnZ += dz;
        if (nextSpawnZ > -14) {
            spawnObstacle(-70);
            nextSpawnZ = -(16 + Math.random() * 10);
        }

        checkCollisions();
        updateHud();
    } else {
        // Gentle idle camera sway in menus
        player.rotation.y = Math.PI + Math.sin(t * 0.6) * 0.15;
        player.userData.tail.rotation.z = Math.sin(t * 4) * 0.4;
    }

    renderer.render(scene, camera);
}
requestAnimationFrame((t) => { lastT = t; tick(t); });
