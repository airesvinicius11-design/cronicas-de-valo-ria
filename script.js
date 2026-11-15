const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameWorld = { width: 4600, height: 4600 };
let selectedClassKey = 'mago';
let activeDialogNpc = null;

// Progressive XP Curve: Math.floor(100 * Math.pow(1.4, level - 1))
function getRequiredXpForLevel(lvl) {
    return Math.floor(100 * Math.pow(1.4, lvl - 1));
}

// Player state
let player = {
    x: 1500,
    y: 1540,
    radius: 18,
    speed: 4.8,
    vx: 0,
    vy: 0,
    name: "Aldric",
    classKey: "mago",
    className: "Mago Arcano",
    level: 1,
    hp: 110,
    maxHp: 110,
    xp: 0,
    maxXp: getRequiredXpForLevel(1),
    gold: 150,
    baseAttack: 18,
    defense: 4,
    equippedWeapon: { id: 'staff_orb', name: 'Cajado do Orbe Azul', bonus: 15, icon: 'fa-wand-magic-sparkles', typeKey: 'staff' },
    facing: 'right',
    isMoving: false,
    animTimer: 0,
    isAttacking: false,
    attackAnimTimer: 0,
    levelUpEffectTimer: 0,
    discoveredRegions: ['Bosque de Valória']
};

let combatCombo = { count: 0, timer: 0 };

let inventory = [
    { id: 'staff_orb', name: 'Cajado do Orbe Azul', type: 'weapon', typeKey: 'staff', bonus: 15, icon: 'fa-wand-magic-sparkles', desc: 'Cajado de madeira com esfera arcana azul brilhante.' },
    { id: 'double_axe', name: 'Machado Duplo Nórdico', type: 'weapon', typeKey: 'axe', bonus: 22, icon: 'fa-hammer', desc: 'Machado de duas lâminas pesadas com gema rubi central.' },
    { id: 'royal_sword', name: 'Espada Real & Escudo', type: 'weapon', typeKey: 'sword', bonus: 18, icon: 'fa-shield-halved', desc: 'Lâmina afiada de aço templário.' },
    { id: 'potion', name: 'Poção de Vida', type: 'potion', count: 3, icon: 'fa-vial', desc: 'Restaura 60 pontos de vida instantaneamente.' },
    { id: 'xp_tome', name: 'Tomo de Sabedoria', type: 'xp_book', count: 2, xpAmount: 200, icon: 'fa-book-open', desc: 'Pergaminho antigo que concede +200 XP instantâneo ao ser lido!' }
];

let quests = [
    { id: 'q1', title: 'Ameaça na Floresta', npc: 'Capitão Garrick', desc: 'Derrote 3 Slimes ou Goblins na estrada leste de Valória.', target: 3, current: 0, reward: { xp: 180, gold: 80 }, completed: false, accepted: true },
    { id: 'q2', title: 'O Tesouro das Ruínas', npc: 'Ancião Valerius', desc: 'Encontre e abra o Baú Ancestral nas ruínas a sudeste.', target: 1, current: 0, reward: { xp: 260, gold: 150 }, completed: false, accepted: true },
    { id: 'q3', title: 'Suprimentos do Porto', npc: 'Capitã Lyra', desc: 'Derrote 3 Esqueletos Corsários próximos ao Porto das Brumas (Nordeste).', target: 3, current: 0, reward: { xp: 350, gold: 140, weapon: { id: 'trident_sea', name: 'Lança das Marés', type: 'weapon', typeKey: 'sword', bonus: 26, icon: 'fa-water', desc: 'Arma abençoada pelos navegadores do Porto das Brumas.' } }, completed: false, accepted: false },
    { id: 'q4', title: 'Caça aos Lobos Sombrios', npc: 'Pescador Barnabé', desc: 'Elimine 4 Lobos Sombrios que rondam o caminho norte.', target: 4, current: 0, reward: { xp: 310, gold: 120 }, completed: false, accepted: false },
    { id: 'q5', title: 'A Lâmina Rúnica', npc: 'Mestre Kael', desc: 'Derrote 2 Golens de Pedra perto da Cidadela das Cinzas (Sudoeste).', target: 2, current: 0, reward: { xp: 480, gold: 220, weapon: { id: 'runic_hammer', name: 'Martelo Rúnico de Kael', type: 'weapon', typeKey: 'axe', bonus: 34, icon: 'fa-hammer', desc: 'Forjado nas chamas rúnicas da Cidadela das Cinzas.' } }, completed: false, accepted: false }
];

let npcs = [
    { id: 'garrick', questId: 'q1', name: 'Capitão Garrick', x: 1620, y: 1510, style: 'guard', facing: 'left', text: 'Saudações, viajante! Os Slimes e Goblins estão invadindo a estrada leste. Ajude a proteger o Bosque de Valória!' },
    { id: 'elder', questId: 'q2', name: 'Ancião Valerius', x: 1360, y: 1470, style: 'elder', facing: 'right', text: 'Sinto uma aura poderosa em você! Há um Baú Ancestral escondido nas ruínas a sudeste.' },
    { id: 'elias', isMerchant: true, name: 'Mercador Elias', x: 1450, y: 1495, style: 'blacksmith', facing: 'right', text: 'Bem-vindo à minha tenda! Precisa reforçar seu estoque de Poções de Vida antes de viajar para outros vilarejos?' },
    { id: 'lyra', questId: 'q3', name: 'Capitã Lyra', x: 3180, y: 960, style: 'guard', facing: 'left', text: 'Bem-vindo ao Porto das Brumas! Esqueletos Corsários atacaram nossos navios. Derrote 3 deles e lhe darei a Lança das Marés!' },
    { id: 'barnabe', questId: 'q4', name: 'Pescador Barnabé', x: 3410, y: 1090, style: 'blacksmith', facing: 'left', text: 'Os Lobos Sombrios estão assustando os viajantes na estrada do porto. Elimine 4 lobos para liberar a rota!' },
    { id: 'kael', questId: 'q5', name: 'Mestre Kael', x: 960, y: 3140, style: 'blacksmith', facing: 'right', text: 'Aqui na Cidadela das Cinzas forjamos armas rúnicas! Derrote 2 Golens de Pedra ao sul e forjarei um Martelo Rúnico para você!' },
    { id: 'isolde', isMerchant: true, name: 'Sábia Isolde', x: 1180, y: 3190, style: 'elder', facing: 'left', text: 'As runas antigas vibram com sua presença. Descanse junto às muralhas ou compre poções para enfrentar os chefes!' }
];

let enemies = [];
let projectiles = [];
let floatingTexts = [];

function spawnEnemies() {
    enemies = [];
    for(let i = 0; i < 8; i++) {
        enemies.push({ id: 'slime_' + i, type: 'slime', name: 'Slime Verde', regionTier: 1, x: 1850 + Math.random() * 850, y: 1200 + Math.random() * 850, radius: 20, hp: 50, maxHp: 50, attack: 9, xpValue: 90, speed: 1.5, animOffset: Math.random() * 10 });
    }
    for(let i = 0; i < 6; i++) {
        enemies.push({ id: 'goblin_' + i, type: 'goblin', name: 'Goblin Saqueador', regionTier: 1, x: 2050 + Math.random() * 800, y: 1350 + Math.random() * 900, radius: 22, hp: 80, maxHp: 80, attack: 14, xpValue: 130, speed: 2.1, facing: 'left', animOffset: Math.random() * 10 });
    }
    for(let i = 0; i < 6; i++) {
        enemies.push({ id: 'wolf_' + i, type: 'wolf', name: 'Lobo Sombrio', regionTier: 2, x: 2250 + Math.random() * 900, y: 780 + Math.random() * 650, radius: 21, hp: 95, maxHp: 95, attack: 16, xpValue: 170, speed: 2.6, facing: 'left', animOffset: Math.random() * 10 });
    }
    for(let i = 0; i < 5; i++) {
        enemies.push({ id: 'skeleton_' + i, type: 'skeleton', name: 'Esqueleto Corsário', regionTier: 2, x: 2950 + Math.random() * 650, y: 1180 + Math.random() * 550, radius: 22, hp: 115, maxHp: 115, attack: 18, xpValue: 210, speed: 2.0, facing: 'left', animOffset: Math.random() * 10 });
    }
    for(let i = 0; i < 4; i++) {
        enemies.push({ id: 'golem_' + i, type: 'golem', name: 'Golem de Pedra', regionTier: 3, x: 850 + Math.random() * 850, y: 3420 + Math.random() * 650, radius: 28, hp: 180, maxHp: 180, attack: 23, xpValue: 310, speed: 1.4, facing: 'right', animOffset: Math.random() * 10 });
    }
    enemies.push({ id: 'boss_ork', type: 'boss', name: 'Chefe Grommash', regionTier: 2, x: 2780, y: 2180, radius: 30, hp: 240, maxHp: 240, attack: 22, xpValue: 550, speed: 1.8, facing: 'left', animOffset: 0 });
    enemies.push({ id: 'boss_colossus', type: 'boss', name: 'Colosso Ignis', regionTier: 3, x: 1380, y: 3920, radius: 34, hp: 340, maxHp: 340, attack: 28, xpValue: 780, speed: 1.6, facing: 'left', animOffset: 2 });
}
spawnEnemies();

let roads = [
    { x: 1420, y: 1340, w: 130, h: 1920 },
    { x: 1000, y: 1520, w: 1800, h: 115 },
    { x: 2450, y: 980, w: 120, h: 655 },
    { x: 2450, y: 980, w: 1080, h: 115 },
    { x: 880, y: 3160, w: 670, h: 115 }
];

let waterZones = [{ x: 3580, y: 550, w: 950, h: 1250 }];
let docks = [{ x: 3480, y: 1010, w: 240, h: 75 }];

let props = [
    { type: 'house', x: 1210, y: 1280, w: 140, h: 110, roofColor: '#d97706', name: 'Taverna' },
    { type: 'house', x: 1480, y: 1260, w: 150, h: 115, roofColor: '#b45309', name: 'Prefeitura' },
    { type: 'sign', x: 1690, y: 1505, label: '→ Porto das Brumas | ↓ Cidadela' },
    { type: 'house', x: 3050, y: 790, w: 140, h: 105, roofColor: '#0284c7', name: 'Casa do Porto' },
    { type: 'house', x: 3290, y: 810, w: 145, h: 110, roofColor: '#0369a1', name: 'Estaleiro' },
    { type: 'sign', x: 3120, y: 970, label: '⚓ Porto das Brumas' },
    { type: 'house', x: 880, y: 2960, w: 155, h: 115, roofColor: '#991b1b', name: 'Forja Rúnica' },
    { type: 'house', x: 1120, y: 2980, w: 145, h: 110, roofColor: '#7f1d1d', name: 'Torre Rúnica' },
    { type: 'stoneWall', x: 820, y: 3320, w: 240, h: 36 },
    { type: 'stoneWall', x: 1210, y: 3320, w: 260, h: 36 },
    { type: 'sign', x: 1380, y: 3150, label: '🔥 Cidadela das Cinzas' },
    { type: 'chest', id: 'chest_ruins', x: 2650, y: 2240, radius: 22, opened: false, name: 'Baú Ancestral', isQuestChest: true },
    { type: 'chest', id: 'chest_port', x: 3440, y: 860, radius: 22, opened: false, name: 'Baú dos Marujos', isQuestChest: false },
    { type: 'chest', id: 'chest_citadel', x: 880, y: 3960, radius: 22, opened: false, name: 'Cofre Rúnico', isQuestChest: false }
];

let rocks = [];
for(let i = 0; i < 35; i++) {
    let rx = 250 + Math.random() * 4100;
    let ry = 250 + Math.random() * 4100;
    if (!isNearVillageOrRoad(rx, ry, 95)) rocks.push({ x: rx, y: ry, radius: 22 + Math.random() * 10 });
}

function isNearVillageOrRoad(x, y, margin) {
    if (Math.hypot(x - 1500, y - 1500) < 340) return true;
    if (Math.hypot(x - 3250, y - 980) < 340) return true;
    if (Math.hypot(x - 1100, y - 3150) < 340) return true;
    for (let r of roads) {
        if (x > r.x - margin && x < r.x + r.w + margin && y > r.y - margin && y < r.y + r.h + margin) return true;
    }
    for (let w of waterZones) {
        if (x > w.x - margin && x < w.x + w.w + margin && y > w.y - margin && y < w.y + w.h + margin) return true;
    }
    return false;
}

let trees = [];
for(let i = 0; i < 165; i++) {
    let tx = Math.random() * 4350 + 120;
    let ty = Math.random() * 4350 + 120;
    if (!isNearVillageOrRoad(tx, ty, 65)) trees.push({ x: tx, y: ty, radius: 34, trunkRadius: 13 });
}

let grassDots = [];
for(let i = 0; i < 260; i++) {
    grassDots.push({ x: Math.random() * 4600, y: Math.random() * 4600, r: 4 + Math.random() * 4 });
}

let camera = { x: 0, y: 0 };
let keys = {};

// --- ISOLATED KEYBOARD SHORTCUTS FOR ACTIVE GAMEPLAY ONLY ---
window.addEventListener('keydown', e => {
    const hudHidden = document.getElementById('gameHud').classList.contains('hidden');
    const anyModalOpen = !document.getElementById('inventoryModal').classList.contains('hidden') ||
                         !document.getElementById('questsModal').classList.contains('hidden') ||
                         !document.getElementById('statusModal').classList.contains('hidden') ||
                         !document.getElementById('bugReportModal').classList.contains('hidden');

    const key = e.key.toLowerCase();
    keys[key] = true;

    if (hudHidden || anyModalOpen) return;

    if (key === 'e') {
        e.preventDefault();
        interactWithNearest();
    }
    if (key === 'j') {
        e.preventDefault();
        openModal('inventoryModal');
    }
    if (key === 'h') {
        e.preventDefault();
        usePotion();
    }
    if (key === 'z') {
        e.preventDefault();
        saveGameProgress();
    }
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// PC Mouse Click Aim & Attack + Direct NPC Clicking in world
canvas.addEventListener('click', e => {
    if (document.getElementById('gameHud').classList.contains('hidden')) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const worldX = clientX + camera.x;
    const worldY = clientY + camera.y;

    let clickedNpc = false;
    npcs.forEach(npc => {
        if (Math.hypot(worldX - npc.x, worldY - npc.y) < 38) {
            activeDialogNpc = npc;
            openDialog(npc);
            clickedNpc = true;
        }
    });

    if (!clickedNpc) {
        playerAttack(worldX, worldY);
    }
});

// --- MULTI-TOUCH MOBILE CONTROLS ---
let joyVec = { x: 0, y: 0 };
let activeJoyTouchId = null;

function setupMultiTouchControls() {
    const padZone = document.getElementById('virtualPadZone');
    const nub = document.getElementById('joystickNub');
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    function updateJoystickFromPoint(clientX, clientY) {
        const rect = padZone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = rect.width * 0.34;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        nub.style.transform = `translate(${dx}px, ${dy}px)`;

        const normX = dx / maxDist;
        const normY = dy / maxDist;
        const deadzone = 0.22;

        joyVec.x = Math.abs(normX) > deadzone ? normX : 0;
        joyVec.y = Math.abs(normY) > deadzone ? normY : 0;

        btnUp.classList.toggle('bg-amber-500', joyVec.y < -0.35);
        btnDown.classList.toggle('bg-amber-500', joyVec.y > 0.35);
        btnLeft.classList.toggle('bg-amber-500', joyVec.x < -0.35);
        btnRight.classList.toggle('bg-amber-500', joyVec.x > 0.35);
    }

    function resetJoystick() {
        activeJoyTouchId = null;
        joyVec.x = 0;
        joyVec.y = 0;
        nub.style.transform = `translate(0px, 0px)`;
        btnUp.classList.remove('bg-amber-500');
        btnDown.classList.remove('bg-amber-500');
        btnLeft.classList.remove('bg-amber-500');
        btnRight.classList.remove('bg-amber-500');
    }

    padZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (activeJoyTouchId === null && e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            activeJoyTouchId = t.identifier;
            updateJoystickFromPoint(t.clientX, t.clientY);
        }
    }, { passive: false });

    padZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === activeJoyTouchId) {
                updateJoystickFromPoint(t.clientX, t.clientY);
                break;
            }
        }
    }, { passive: false });

    const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeJoyTouchId) {
                resetJoystick();
                break;
            }
        }
    };
    padZone.addEventListener('touchend', handleTouchEnd, { passive: false });
    padZone.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    let mouseDragging = false;
    padZone.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseDragging = true;
        updateJoystickFromPoint(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
        if (mouseDragging) updateJoystickFromPoint(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
        if (mouseDragging) {
            mouseDragging = false;
            resetJoystick();
        }
    });

    const bindActionBtn = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fn();
        }, { passive: false });
        el.addEventListener('click', (e) => {
            e.preventDefault();
            fn();
        });
    };
    bindActionBtn('btnAttack', playerAttack);
    bindActionBtn('btnInteract', interactWithNearest);
    bindActionBtn('btnPotion', usePotion);
}
setupMultiTouchControls();

// --- SLIDING COLLISION ENGINE ---
function resolveEntityCollisions(entity) {
    const r = entity.radius || 18;
    entity.x = Math.max(45, Math.min(gameWorld.width - 45, entity.x));
    entity.y = Math.max(45, Math.min(gameWorld.height - 45, entity.y));

    for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const trunkY = t.y + 8;
        const minDist = r + t.trunkRadius;
        const dx = entity.x - t.x;
        const dy = entity.y - trunkY;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && dist > 0.001) {
            const overlap = minDist - dist;
            entity.x += (dx / dist) * overlap;
            entity.y += (dy / dist) * overlap;
        }
    }

    for (let i = 0; i < rocks.length; i++) {
        const rk = rocks[i];
        const minDist = r + rk.radius * 0.85;
        const dx = entity.x - rk.x;
        const dy = entity.y - rk.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && dist > 0.001) {
            const overlap = minDist - dist;
            entity.x += (dx / dist) * overlap;
            entity.y += (dy / dist) * overlap;
        }
    }

    const resolveRect = (rx, ry, rw, rh) => {
        const closestX = Math.max(rx, Math.min(entity.x, rx + rw));
        const closestY = Math.max(ry, Math.min(entity.y, ry + rh));
        const dx = entity.x - closestX;
        const dy = entity.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < r * r) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.001) {
                const overlap = r - dist;
                entity.x += (dx / dist) * overlap;
                entity.y += (dy / dist) * overlap;
            } else {
                entity.y += r;
            }
        }
    };

    for (let p of props) {
        if (p.type === 'house') resolveRect(p.x, p.y + 12, p.w, p.h - 12);
        else if (p.type === 'stoneWall') resolveRect(p.x, p.y, p.w, p.h);
    }

    for (let w of waterZones) {
        let onDock = false;
        for (let d of docks) {
            if (entity.x >= d.x && entity.x <= d.x + d.w && entity.y >= d.y - 10 && entity.y <= d.y + d.h + 10) {
                onDock = true;
                break;
            }
        }
        if (!onDock) resolveRect(w.x, w.y, w.w, w.h);
    }
}

// --- CARTOON CHARACTER RENDERER ---
function drawCartoonCharacter(targetCtx, opts) {
    const {
        x, y, scale = 1, facing = 'right',
        isMoving = false, animTimer = 0,
        isAttacking = false, attackProgress = 0,
        style = 'mago', weaponType = 'staff',
        name = '', level = null, nameColor = '#ffffff'
    } = opts;

    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.scale(scale, scale);

    const dir = facing === 'left' ? -1 : 1;
    const walkCycle = isMoving ? Math.sin(animTimer * 10) : 0;
    const bodyBob = isMoving ? Math.abs(Math.sin(animTimer * 10)) * -3.5 : Math.sin(Date.now() * 0.004) * 1;

    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    targetCtx.beginPath();
    targetCtx.ellipse(0, 22, 16, 6, 0, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.lineJoin = 'round';
    targetCtx.lineCap = 'round';
    targetCtx.strokeStyle = '#111111';
    targetCtx.lineWidth = 3;

    const leftLegY = 14 + (walkCycle * 3.5);
    const rightLegY = 14 - (walkCycle * 3.5);
    const leftLegX = -6 - (walkCycle * 3);
    const rightLegX = 5 + (walkCycle * 3);

    targetCtx.fillStyle = '#4a2e1b';
    targetCtx.beginPath();
    targetCtx.roundRect(leftLegX - 5, leftLegY, 10, 8, 3);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.roundRect(rightLegX - 5, rightLegY, 10, 8, 3);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.save();
    targetCtx.translate(0, bodyBob);

    let tunicColor = '#7e22ce';
    if (style === 'berserker' || style === 'blacksmith') tunicColor = '#7c2d12';
    if (style === 'cavaleiro' || style === 'guard') tunicColor = '#2563eb';
    if (style === 'arqueiro') tunicColor = '#15803d';
    if (style === 'elder') tunicColor = '#4338ca';

    if (style === 'mago' || style === 'cavaleiro') {
        targetCtx.fillStyle = style === 'mago' ? '#581c87' : '#b91c1c';
        targetCtx.beginPath();
        targetCtx.moveTo(-8 * dir, -2);
        targetCtx.lineTo(-16 * dir, 15);
        targetCtx.lineTo(-4 * dir, 15);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
    }

    targetCtx.fillStyle = tunicColor;
    targetCtx.beginPath();
    targetCtx.roundRect(-12, -4, 24, 20, 6);
    targetCtx.fill();
    targetCtx.stroke();

    if (style === 'berserker' || style === 'blacksmith' || style === 'cavaleiro') {
        targetCtx.fillStyle = '#64748b';
        targetCtx.beginPath();
        targetCtx.arc(-9 * dir, 1, 7, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
    }

    targetCtx.fillStyle = '#451a03';
    targetCtx.fillRect(-11, 9, 22, 4);
    targetCtx.fillStyle = '#facc15';
    targetCtx.fillRect(-3, 8.5, 6, 5);

    targetCtx.fillStyle = '#fed7aa';
    targetCtx.beginPath();
    targetCtx.arc(0, -14, 13, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    const eyeOffsetX = dir * 4;
    targetCtx.fillStyle = '#111111';
    targetCtx.beginPath();
    targetCtx.arc(eyeOffsetX - 3.5, -14, 2, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.beginPath();
    targetCtx.arc(eyeOffsetX + 4.5, -14, 2, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.lineWidth = 2.2;
    targetCtx.beginPath();
    targetCtx.moveTo(eyeOffsetX - 6, -18);
    targetCtx.lineTo(eyeOffsetX - 1.5, -17);
    targetCtx.moveTo(eyeOffsetX + 2, -17);
    targetCtx.lineTo(eyeOffsetX + 7, -18);
    targetCtx.stroke();
    targetCtx.lineWidth = 3;

    if (style === 'mago') {
        targetCtx.fillStyle = '#9333ea';
        targetCtx.beginPath();
        targetCtx.ellipse(0, -23, 19, 5, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.beginPath();
        targetCtx.moveTo(-12, -23);
        targetCtx.lineTo(-2 * dir, -41);
        targetCtx.lineTo(12, -23);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.strokeStyle = '#fbbf24';
        targetCtx.lineWidth = 2.5;
        targetCtx.beginPath();
        targetCtx.moveTo(-11, -24);
        targetCtx.lineTo(11, -24);
        targetCtx.stroke();
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 3;
    } else if (style === 'berserker' || style === 'blacksmith') {
        targetCtx.fillStyle = '#292524';
        targetCtx.beginPath();
        targetCtx.arc(eyeOffsetX, -10, 10.5, 0.1 * Math.PI, 0.9 * Math.PI);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
        if (style === 'berserker') {
            targetCtx.fillStyle = '#64748b';
            targetCtx.beginPath();
            targetCtx.arc(0, -17, 13, Math.PI, 0);
            targetCtx.fill();
            targetCtx.stroke();
            targetCtx.fillStyle = '#fef3c7';
            targetCtx.beginPath();
            targetCtx.moveTo(-11, -20); targetCtx.lineTo(-18, -31); targetCtx.lineTo(-7, -23);
            targetCtx.fill(); targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(11, -20); targetCtx.lineTo(18, -31); targetCtx.lineTo(7, -23);
            targetCtx.fill(); targetCtx.stroke();
        }
    } else if (style === 'cavaleiro' || style === 'guard') {
        targetCtx.fillStyle = '#94a3b8';
        targetCtx.beginPath();
        targetCtx.arc(0, -16, 13.5, Math.PI, 0);
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.fillStyle = '#38bdf8';
        targetCtx.beginPath();
        targetCtx.arc(0, -30, 5, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
    } else if (style === 'arqueiro') {
        targetCtx.fillStyle = '#166534';
        targetCtx.beginPath();
        targetCtx.arc(0, -15, 14, Math.PI * 0.85, Math.PI * 0.15);
        targetCtx.fill();
        targetCtx.stroke();
    } else if (style === 'elder') {
        targetCtx.fillStyle = '#f8fafc';
        targetCtx.beginPath();
        targetCtx.moveTo(-10, -11);
        targetCtx.lineTo(0, 6);
        targetCtx.lineTo(10, -11);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
    }

    targetCtx.save();
    targetCtx.translate(6 * dir, 5);
    let swingAngle = isAttacking ? Math.sin(attackProgress * Math.PI) * 1.4 * dir : 0;
    targetCtx.rotate(swingAngle);

    if (weaponType === 'staff') {
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 6;
        targetCtx.beginPath();
        targetCtx.moveTo(-14 * dir, 6);
        targetCtx.lineTo(18 * dir, -6);
        targetCtx.stroke();

        targetCtx.strokeStyle = '#92400e';
        targetCtx.lineWidth = 3;
        targetCtx.beginPath();
        targetCtx.moveTo(-14 * dir, 6);
        targetCtx.lineTo(18 * dir, -6);
        targetCtx.stroke();

        targetCtx.fillStyle = '#fbbf24';
        targetCtx.beginPath();
        targetCtx.arc(17 * dir, -6, 4.5, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.fillStyle = '#38bdf8';
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 2.5;
        targetCtx.beginPath();
        targetCtx.arc(22 * dir, -8, 6.5, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
    } else if (weaponType === 'axe') {
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 6;
        targetCtx.beginPath();
        targetCtx.moveTo(-10 * dir, 10);
        targetCtx.lineTo(14 * dir, -12);
        targetCtx.stroke();

        targetCtx.strokeStyle = '#78350f';
        targetCtx.lineWidth = 3;
        targetCtx.beginPath();
        targetCtx.moveTo(-10 * dir, 10);
        targetCtx.lineTo(14 * dir, -12);
        targetCtx.stroke();

        targetCtx.fillStyle = '#e2e8f0';
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 2.5;
        targetCtx.beginPath();
        targetCtx.ellipse(13 * dir, -11, 11, 7, -0.6 * dir, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
    } else if (weaponType === 'sword') {
        targetCtx.fillStyle = '#e2e8f0';
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 2.5;
        targetCtx.beginPath();
        targetCtx.moveTo(4 * dir, 2);
        targetCtx.lineTo(24 * dir, -14);
        targetCtx.lineTo(27 * dir, -11);
        targetCtx.lineTo(7 * dir, 5);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.fillStyle = '#facc15';
        targetCtx.fillRect(2 * dir - 3, 1, 8, 4);
    } else if (weaponType === 'bow') {
        targetCtx.strokeStyle = '#111111';
        targetCtx.lineWidth = 5;
        targetCtx.beginPath();
        targetCtx.arc(8 * dir, -2, 14, -Math.PI * 0.45, Math.PI * 0.45, dir === -1);
        targetCtx.stroke();
        targetCtx.strokeStyle = '#b45309';
        targetCtx.lineWidth = 2.5;
        targetCtx.stroke();
    }

    targetCtx.fillStyle = '#fed7aa';
    targetCtx.strokeStyle = '#111111';
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.arc(2 * dir, 2, 4.5, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.restore();
    targetCtx.restore();

    if (name) {
        const label = level !== null ? `${name} (Nv.${level})` : name;
        targetCtx.font = '800 13px "Fredoka", "Inter", sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.lineWidth = 4;
        targetCtx.strokeStyle = '#111111';
        targetCtx.strokeText(label, 0, -48);
        targetCtx.fillStyle = nameColor;
        targetCtx.fillText(label, 0, -48);
    }

    targetCtx.restore();
}

function renderUIAppAvatars() {
    const prevCanvas = document.getElementById('previewCanvas');
    if (prevCanvas && !document.getElementById('charCreationScreen').classList.contains('hidden')) {
        const pCtx = prevCanvas.getContext('2d');
        pCtx.clearRect(0, 0, 112, 112);
        let wType = selectedClassKey === 'mago' ? 'staff' : (selectedClassKey === 'berserker' ? 'axe' : (selectedClassKey === 'cavaleiro' ? 'sword' : 'bow'));
        drawCartoonCharacter(pCtx, { x: 56, y: 74, scale: 1.45, facing: 'right', isMoving: true, animTimer: Date.now() * 0.001, style: selectedClassKey, weaponType: wType });
    }

    const hudCanvas = document.getElementById('hudAvatarCanvas');
    if (hudCanvas && !document.getElementById('gameHud').classList.contains('hidden')) {
        const hCtx = hudCanvas.getContext('2d');
        hCtx.clearRect(0, 0, 60, 60);
        drawCartoonCharacter(hCtx, { x: 28, y: 44, scale: 0.92, facing: 'right', style: player.classKey, weaponType: player.equippedWeapon.typeKey || 'staff' });
    }

    const miniCanvas = document.getElementById('miniAvatarCanvas');
    if (miniCanvas && !document.getElementById('hudExpandBtn').classList.contains('hidden')) {
        const mCtx = miniCanvas.getContext('2d');
        mCtx.clearRect(0, 0, 38, 38);
        drawCartoonCharacter(mCtx, { x: 19, y: 31, scale: 0.65, facing: 'right', style: player.classKey, weaponType: player.equippedWeapon.typeKey || 'staff' });
    }

    const statCanvas = document.getElementById('statusAvatarCanvas');
    if (statCanvas && !document.getElementById('statusModal').classList.contains('hidden')) {
        const sCtx = statCanvas.getContext('2d');
        sCtx.clearRect(0, 0, 64, 64);
        drawCartoonCharacter(sCtx, { x: 32, y: 48, scale: 1.0, facing: 'right', style: player.classKey, weaponType: player.equippedWeapon.typeKey || 'staff' });
    }
}

// --- SILENT BUG REPORT SYSTEM (NO IN-GAME POPUPS) ---
function openBugReportModal() {
    document.getElementById('bugReportTextarea').value = '';
    document.getElementById('bugReportModal').classList.remove('hidden');
}

function sendBugReport() {
    const reportText = document.getElementById('bugReportTextarea').value.trim();
    if (!reportText) return;

    const mailtoLink = `mailto:airesvinicius11@gmail.com?subject=${encodeURIComponent('Relatório de Erro - Crônicas de Valória (Beta)')}&body=${encodeURIComponent(reportText)}`;
    const hiddenFrame = document.createElement('iframe');
    hiddenFrame.style.display = 'none';
    hiddenFrame.src = mailtoLink;
    document.body.appendChild(hiddenFrame);
    setTimeout(() => document.body.removeChild(hiddenFrame), 1000);

    closeModal('bugReportModal');
}

// --- MENU & NAVIGATION FLOW ---
function toggleHudCard(expand) {
    if (expand) {
        document.getElementById('hudExpandBtn').classList.add('hidden');
        document.getElementById('hudPlayerCard').classList.remove('hidden');
    } else {
        document.getElementById('hudPlayerCard').classList.add('hidden');
        document.getElementById('hudExpandBtn').classList.remove('hidden');
    }
}

function showCharacterCreation() {
    document.getElementById('mainMenuScreen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('mainMenuScreen').classList.add('hidden');
        document.getElementById('charCreationScreen').classList.remove('hidden');
    }, 350);
}

function backToMainMenu() {
    document.getElementById('charCreationScreen').classList.add('hidden');
    document.getElementById('mainMenuScreen').classList.remove('hidden');
    document.getElementById('mainMenuScreen').classList.remove('opacity-0');
}

function selectClass(clsKey) {
    selectedClassKey = clsKey;
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('border-amber-400', 'bg-[#252530]');
        card.classList.add('border-[#111827]', 'bg-[#181820]');
    });
    let activeCard = document.getElementById('card-' + clsKey);
    activeCard.classList.remove('border-[#111827]', 'bg-[#181820]');
    activeCard.classList.add('border-amber-400', 'bg-[#252530]');

    const descEl = document.getElementById('selectedClassDesc');
    if (clsKey === 'mago') {
        descEl.innerHTML = `<strong class="text-purple-400">Mago Arcano:</strong> Nascido nas torres arcanas de Aethelgard, domina os ventos mágicos e dispara esferas de pura energia arcana para dizimar inimigos à distância.`;
    } else if (clsKey === 'berserker') {
        descEl.innerHTML = `<strong class="text-amber-400">Bárbaro Nórdico:</strong> Oriundo das montanhas gélidas de Frostpeak, este guerreiro bruto canaliza a fúria ancestral com seu machado pesado, esmagando qualquer oposição.`;
    } else if (clsKey === 'cavaleiro') {
        descEl.innerHTML = `<strong class="text-sky-400">Cavaleiro Real:</strong> Defensor jurado do trono de Valória, empunha espada e escudo com honra inabalável, sendo uma muralha intransponível contra as forças sombrias.`;
    } else if (clsKey === 'arqueiro') {
        descEl.innerHTML = `<strong class="text-emerald-400">Arqueiro da Floresta:</strong> Mestre batedor das matas ancestrais, ataca das sombras com flechas certeiras e precisas, caçando monstros antes de serem vistos.`;
    }
}

function startNewAdventure() {
    let nameInput = document.getElementById('heroNameInput').value.trim();
    player.name = nameInput || "Aldric";
    player.classKey = selectedClassKey;
    player.level = 1;
    player.xp = 0;
    player.maxXp = getRequiredXpForLevel(1);
    player.gold = 150;
    player.defense = 4;
    player.x = 1500;
    player.y = 1540;
    player.discoveredRegions = ['Bosque de Valória'];
    combatCombo = { count: 0, timer: 0 };

    if (selectedClassKey === 'mago') {
        player.className = 'Mago Arcano';
        player.baseAttack = 18;
        player.maxHp = 110;
        player.equippedWeapon = { id: 'staff_orb', name: 'Cajado do Orbe Azul', bonus: 15, icon: 'fa-wand-magic-sparkles', typeKey: 'staff' };
    } else if (selectedClassKey === 'berserker') {
        player.className = 'Bárbaro Nórdico';
        player.baseAttack = 22;
        player.maxHp = 135;
        player.equippedWeapon = { id: 'double_axe', name: 'Machado Duplo Nórdico', bonus: 22, icon: 'fa-hammer', typeKey: 'axe' };
    } else if (selectedClassKey === 'cavaleiro') {
        player.className = 'Cavaleiro Real';
        player.baseAttack = 19;
        player.maxHp = 150;
        player.defense = 7;
        player.equippedWeapon = { id: 'royal_sword', name: 'Espada Real & Escudo', bonus: 18, icon: 'fa-shield-halved', typeKey: 'sword' };
    } else if (selectedClassKey === 'arqueiro') {
        player.className = 'Arqueiro da Floresta';
        player.baseAttack = 20;
        player.maxHp = 115;
        player.equippedWeapon = { id: 'hunter_bow', name: 'Arco Élfico', bonus: 17, icon: 'fa-bullseye', typeKey: 'bow' };
    }
    player.hp = player.maxHp;

    document.getElementById('charCreationScreen').classList.add('hidden');
    document.getElementById('mainMenuScreen').classList.add('hidden');
    document.getElementById('gameHud').classList.remove('hidden');
    document.getElementById('mobileRegionPill').classList.remove('hidden');
    document.getElementById('gameControls').classList.remove('hidden');

    updateHUD();
    saveGameProgress(true);
    showToast(`Bem-vindo a Valória, ${player.name}!`, 'fa-sparkles');
}

function loadAdventureFromMenu() {
    const savedData = localStorage.getItem('cronicas_valoria_save');
    if (!savedData) {
        showToast('Nenhum progresso salvo encontrado! Clique em Nova Aventura.', 'fa-triangle-exclamation');
        return;
    }
    try {
        const data = JSON.parse(savedData);
        player = data.player;
        inventory = data.inventory;
        quests = data.quests;

        document.getElementById('mainMenuScreen').classList.add('hidden');
        document.getElementById('charCreationScreen').classList.add('hidden');
        document.getElementById('gameHud').classList.remove('hidden');
        document.getElementById('mobileRegionPill').classList.remove('hidden');
        document.getElementById('gameControls').classList.remove('hidden');

        updateHUD();
        showToast(`Aventura de ${player.name} carregada com sucesso!`, 'fa-folder-open');
    } catch (err) {
        showToast('Erro ao carregar save. Dados corrompidos.', 'fa-triangle-exclamation');
    }
}

function saveGameProgress(silent = false) {
    const payload = { player, inventory, quests };
    localStorage.setItem('cronicas_valoria_save', JSON.stringify(payload));
    if (!silent) {
        showToast('Progresso salvo com sucesso em Valória!', 'fa-floppy-disk');
    }
}

function showToast(message, iconClass = 'fa-circle-info') {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').innerText = message;
    document.getElementById('toastIcon').className = `fa-solid ${iconClass} text-amber-400 text-base`;
    toast.classList.remove('opacity-0', '-translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-4');
    }, 3200);
}

function getCurrentRegionName() {
    if (Math.hypot(player.x - 1500, player.y - 1500) < 550) return 'Bosque de Valória';
    if (Math.hypot(player.x - 3250, player.y - 980) < 620) return 'Porto das Brumas';
    if (Math.hypot(player.x - 1100, player.y - 3150) < 650) return 'Cidadela das Cinzas';
    if (player.y > 3350) return 'Terras Vulcânicas';
    if (player.x > 2300 && player.y < 1450) return 'Costa Nebulosa';
    return 'Estrada Real de Valória';
}

function checkRegionDiscovery(regionName) {
    const discoverableVillages = ['Porto das Brumas', 'Cidadela das Cinzas', 'Terras Vulcânicas'];
    if (!player.discoveredRegions) player.discoveredRegions = ['Bosque de Valória'];
    if (discoverableVillages.includes(regionName) && !player.discoveredRegions.includes(regionName)) {
        player.discoveredRegions.push(regionName);
        const discoveryXp = 250;
        spawnFloatingText(player.x, player.y - 68, `+${discoveryXp} XP (Descoberta!)`, '#fde047');
        showToast(`Nova Área Descoberta: ${regionName}! (+${discoveryXp} XP)`, 'fa-compass');
        gainXp(discoveryXp);
    }
}

function spawnFloatingText(x, y, text, color = '#fbbf24') {
    floatingTexts.push({ x, y, text, color, vy: -1.4, life: 45 });
}

// --- GAME LOOP UPDATE ---
function update() {
    if (document.getElementById('gameHud').classList.contains('hidden')) return;

    if (combatCombo.timer > 0) {
        combatCombo.timer--;
        if (combatCombo.timer <= 0) combatCombo.count = 0;
    }
    if (player.levelUpEffectTimer > 0) player.levelUpEffectTimer--;

    let moveX = joyVec.x;
    let moveY = joyVec.y;

    if (keys['w'] || keys['arrowup']) moveY -= 1;
    if (keys['s'] || keys['arrowdown']) moveY += 1;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
        moveX /= mag;
        moveY /= mag;
    }

    player.vx = moveX * player.speed;
    player.vy = moveY * player.speed;

    if (player.vx < -0.2) player.facing = 'left';
    else if (player.vx > 0.2) player.facing = 'right';

    player.isMoving = (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1);
    if (player.isMoving) {
        player.animTimer += 0.045;
        player.x += player.vx;
        player.y += player.vy;
    }

    resolveEntityCollisions(player);

    if (player.isAttacking) {
        player.attackAnimTimer += 0.08;
        if (player.attackAnimTimer >= 1) {
            player.isAttacking = false;
            player.attackAnimTimer = 0;
        }
    }

    const targetCamX = player.x - canvas.width / 2;
    const targetCamY = player.y - canvas.height / 2;
    camera.x += (targetCamX - camera.x) * 0.14;
    camera.y += (targetCamY - camera.y) * 0.14;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        let hit = false;
        enemies.forEach(enemy => {
            if (enemy.hp <= 0 || hit) return;
            if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.radius + 12) {
                damageEnemy(enemy, proj.damage);
                hit = true;
            }
        });

        if (hit || proj.life <= 0) projectiles.splice(i, 1);
    }

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.hypot(dx, dy);

        if (dx < 0) enemy.facing = 'left';
        else enemy.facing = 'right';

        if (dist < 360 && dist > 30) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
            resolveEntityCollisions(enemy);
        }

        if (dist < 35) {
            if (Math.random() < 0.035) {
                const mitigatedDmg = Math.max(2, enemy.attack - Math.floor((player.defense || 4) * 0.5));
                player.hp = Math.max(0, player.hp - mitigatedDmg);
                spawnFloatingText(player.x, player.y - 35, `-${mitigatedDmg}`, '#f43f5e');
                if (player.hp <= 0) {
                    showToast('Você caiu em batalha! Retornando ao Bosque de Valória...', 'fa-skull');
                    player.hp = player.maxHp;
                    player.x = 1500;
                    player.y = 1540;
                }
            }
        }
    });

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y += floatingTexts[i].vy;
        floatingTexts[i].life--;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    checkRegionDiscovery(getCurrentRegionName());
    updateHUD();
}

// --- RENDER FUNCTION WITH Y-SORTING DEPTH ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (document.getElementById('gameHud').classList.contains('hidden')) return;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#3b6e19';
    ctx.fillRect(0, 0, gameWorld.width, gameWorld.height);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(1150, 3450, 680, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(3480, 1150, 480, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#477d21';
    grassDots.forEach(d => {
        if (Math.hypot(d.x - 1150, d.y - 3450) > 680) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    waterZones.forEach(w => {
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);

        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3;
        const waveShift = Math.sin(Date.now() * 0.003) * 12;
        for (let wy = w.y + 60; wy < w.y + w.h - 40; wy += 95) {
            for (let wx = w.x + 60; wx < w.x + w.w - 60; wx += 140) {
                ctx.beginPath();
                ctx.arc(wx + waveShift, wy, 18, 0.15 * Math.PI, 0.85 * Math.PI);
                ctx.stroke();
            }
        }
    });

    roads.forEach(r => {
        ctx.fillStyle = '#a85b18';
        ctx.strokeStyle = '#783f0e';
        ctx.lineWidth = 4;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    docks.forEach(d => {
        ctx.fillStyle = '#92400e';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3.5;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);
        for (let px = d.x + 20; px < d.x + d.w; px += 22) {
            ctx.beginPath();
            ctx.moveTo(px, d.y);
            ctx.lineTo(px, d.y + d.h);
            ctx.stroke();
        }
    });

    let renderList = [];

    props.forEach(p => {
        let sortY = p.type === 'house' ? p.y + p.h : (p.type === 'stoneWall' ? p.y + p.h : p.y);
        renderList.push({ sortY, draw: () => drawProp(p) });
    });

    rocks.forEach(rk => {
        renderList.push({ sortY: rk.y + 8, draw: () => drawRock(rk) });
    });

    trees.forEach(t => {
        renderList.push({ sortY: t.y + 10, draw: () => drawTree(t) });
    });

    npcs.forEach(npc => {
        renderList.push({
            sortY: npc.y + 16,
            draw: () => {
                let wType = npc.style === 'guard' ? 'sword' : (npc.style === 'blacksmith' ? 'axe' : 'staff');
                drawCartoonCharacter(ctx, { x: npc.x, y: npc.y, scale: 1, facing: npc.facing, style: npc.style, weaponType: wType, name: npc.name, nameColor: '#fde047' });
                if (npc.questId) {
                    const q = quests.find(item => item.id === npc.questId);
                    if (q && !q.completed) {
                        const bounce = Math.sin(Date.now() * 0.007) * 3;
                        ctx.font = '900 18px "Fredoka", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.strokeStyle = '#111111';
                        ctx.lineWidth = 4;
                        ctx.strokeText('!', npc.x, npc.y - 64 + bounce);
                        ctx.fillStyle = q.accepted ? '#38bdf8' : '#facc15';
                        ctx.fillText('!', npc.x, npc.y - 64 + bounce);
                    }
                }
            }
        });
    });

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        renderList.push({ sortY: enemy.y + 14, draw: () => drawEnemy(enemy) });
    });

    renderList.push({
        sortY: player.y + 16,
        draw: () => {
            if (player.levelUpEffectTimer > 0) {
                const progress = 1 - (player.levelUpEffectTimer / 65);
                const auraRadius = 24 + progress * 75;
                ctx.save();
                ctx.strokeStyle = `rgba(250, 204, 21, ${1 - progress})`;
                ctx.lineWidth = 6 * (1 - progress) + 2;
                ctx.beginPath();
                ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = `rgba(253, 224, 71, ${(1 - progress) * 0.25})`;
                ctx.beginPath();
                ctx.arc(player.x, player.y, auraRadius * 0.85, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            drawCartoonCharacter(ctx, {
                x: player.x, y: player.y, scale: 1.05,
                facing: player.facing, isMoving: player.isMoving,
                animTimer: player.animTimer, isAttacking: player.isAttacking,
                attackProgress: player.attackAnimTimer, style: player.classKey,
                weaponType: player.equippedWeapon.typeKey || 'staff',
                name: player.name, level: player.level, nameColor: '#ffffff'
            });

            if (player.isAttacking && (player.equippedWeapon.typeKey === 'axe' || player.equippedWeapon.typeKey === 'sword')) {
                const dir = player.facing === 'left' ? -1 : 1;
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(player.x + 12 * dir, player.y - 4, 34, -0.9, 0.9, dir === -1);
                ctx.stroke();
            }
        }
    });

    renderList.sort((a, b) => a.sortY - b.sortY);
    renderList.forEach(item => item.draw());

    projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        if (proj.kind === 'orb') {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.rotate(Math.atan2(proj.vy, proj.vx));
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
            ctx.stroke();
        }
        ctx.restore();
    });

    floatingTexts.forEach(ft => {
        ctx.font = '900 15px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();
}

function drawProp(p) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.5;

    if (p.type === 'house') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(p.x + 6, p.y + 8, p.w, p.h);

        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#7c3f11';
        ctx.fillRect(p.x + p.w / 2 - 18, p.y + p.h - 44, 36, 44);
        ctx.strokeRect(p.x + p.w / 2 - 18, p.y + p.h - 44, 36, 44);

        ctx.fillStyle = p.roofColor;
        ctx.beginPath();
        ctx.moveTo(p.x - 14, p.y);
        ctx.lineTo(p.x + p.w / 2, p.y - 42);
        ctx.lineTo(p.x + p.w + 14, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (p.type === 'stoneWall') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.stroke();
    } else if (p.type === 'sign') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.x - 4, p.y - 14, 8, 26);
        ctx.strokeRect(p.x - 4, p.y - 14, 8, 26);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(p.x - 24, p.y - 32, 48, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 11px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3.5;
        ctx.strokeText(p.label, p.x, p.y - 38);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(p.label, p.x, p.y - 38);
    } else if (p.type === 'chest') {
        ctx.fillStyle = p.opened ? '#573317' : '#d97706';
        ctx.beginPath();
        ctx.roundRect(p.x - 18, p.y - 14, 36, 26, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8);

        ctx.font = 'bold 12px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3.5;
        const chestLabel = p.opened ? 'Baú Aberto' : p.name;
        ctx.strokeText(chestLabel, p.x, p.y - 22);
        ctx.fillStyle = '#fde047';
        ctx.fillText(chestLabel, p.x, p.y - 22);
    }
}

function drawRock(rk) {
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(rk.x, rk.y + rk.radius * 0.6, rk.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(rk.x, rk.y, rk.radius, Math.PI, 0);
    ctx.lineTo(rk.x + rk.radius, rk.y + 8);
    ctx.lineTo(rk.x - rk.radius, rk.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawTree(t) {
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 18, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(t.x - 8, t.y - 6, 16, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 20, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.85, enemy.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.type === 'slime') {
        const squish = Math.sin(Date.now() * 0.008 + enemy.animOffset) * 3;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(0, 2 - squish * 0.5, enemy.radius + squish, enemy.radius * 0.85 - squish * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (enemy.type === 'wolf') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(0, 2, 18, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (enemy.type === 'skeleton') {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(-10, -4, 20, 18, 5);
        ctx.fill();
        ctx.stroke();
    } else if (enemy.type === 'golem') {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(-18, -16, 36, 32, 8);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillStyle = enemy.type === 'boss' ? '#991b1b' : '#4d7c0f';
        ctx.beginPath();
        ctx.roundRect(-12, -4, 24, 18, 6);
        ctx.fill();
        ctx.stroke();
    }

    const barW = enemy.type === 'boss' ? 62 : 42;
    const barY = enemy.type === 'boss' ? -46 : -34;
    ctx.fillStyle = '#111111';
    ctx.fillRect(-barW / 2 - 1.5, barY - 1.5, barW + 3, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barW / 2, barY, (enemy.hp / enemy.maxHp) * barW, 5);

    if (enemy.type === 'boss') {
        ctx.font = '800 12px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3.5;
        ctx.strokeText(enemy.name, 0, barY - 6);
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(enemy.name, 0, barY - 6);
    }
    ctx.restore();
}

// --- COMBAT & QUEST PROGRESS ---
function advanceQuest(questId, amount = 1) {
    let q = quests.find(item => item.id === questId);
    if (q && !q.completed) {
        q.accepted = true;
        q.current = Math.min(q.target, q.current + amount);
        if (q.current >= q.target) {
            q.completed = true;
            player.gold += q.reward.gold;
            spawnFloatingText(player.x, player.y - 65, `+${q.reward.xp} XP (Missão!)`, '#fde047');
            if (q.reward.weapon) {
                inventory.push({ ...q.reward.weapon });
                document.getElementById('inventoryBadge').classList.remove('hidden');
                showToast(`Missão "${q.title}" Concluída! +${q.reward.xp} XP e Arma: ${q.reward.weapon.name}!`, 'fa-trophy');
            } else {
                showToast(`Missão Concluída: ${q.title}! (+${q.reward.xp} XP, +${q.reward.gold} Ouro)`, 'fa-scroll');
            }
            gainXp(q.reward.xp);
            saveGameProgress(true);
        }
    }
}

function damageEnemy(enemy, dmg) {
    enemy.hp -= dmg;
    spawnFloatingText(enemy.x, enemy.y - 30, `-${dmg}`, '#fbbf24');

    if (enemy.hp <= 0) {
        combatCombo.count++;
        combatCombo.timer = 420;
        const comboBonusMult = Math.min(0.5, Math.max(0, (combatCombo.count - 1) * 0.15));
        const baseMonsterXp = enemy.xpValue || 90;
        const regionBonusMult = ((enemy.regionTier || 1) - 1) * 0.25;
        const finalXp = Math.round(baseMonsterXp * (1 + comboBonusMult + regionBonusMult));
        const goldReward = enemy.type === 'boss' ? 160 : (30 + (enemy.regionTier || 1) * 10);

        player.gold += goldReward;

        const comboTag = combatCombo.count > 1 ? ` (Combo x${combatCombo.count}!)` : '';
        spawnFloatingText(player.x, player.y - 56, `+${finalXp} XP${comboTag}`, '#38bdf8');
        showToast(`${enemy.name} derrotado! +${finalXp} XP${comboTag} • +${goldReward} Ouro`, 'fa-trophy');

        if (enemy.type === 'boss') {
            inventory.push({ id: 'xp_tome', name: 'Tomo de Sabedoria', type: 'xp_book', count: 1, xpAmount: 250, icon: 'fa-book-open', desc: 'Tomo raro caído de um Chefe! Concede +250 XP ao ser lido.' });
            document.getElementById('inventoryBadge').classList.remove('hidden');
        }

        gainXp(finalXp);

        if (enemy.type === 'slime' || enemy.type === 'goblin') advanceQuest('q1', 1);
        if (enemy.type === 'skeleton') advanceQuest('q3', 1);
        if (enemy.type === 'wolf') advanceQuest('q4', 1);
        if (enemy.type === 'golem') advanceQuest('q5', 1);
    }
}

function playerAttack(targetWorldX, targetWorldY) {
    if (player.isAttacking) return;
    player.isAttacking = true;
    player.attackAnimTimer = 0;

    if (targetWorldX !== undefined && targetWorldY !== undefined) {
        if (targetWorldX < player.x) player.facing = 'left';
        else player.facing = 'right';
    }

    const weaponBonus = player.equippedWeapon ? player.equippedWeapon.bonus : 10;
    const totalAttack = player.baseAttack + weaponBonus;
    const wType = player.equippedWeapon.typeKey || 'staff';
    const dir = player.facing === 'left' ? -1 : 1;

    if (wType === 'staff' || wType === 'bow') {
        let pVx = 9.8 * dir;
        let pVy = 0;
        if (targetWorldX !== undefined && targetWorldY !== undefined) {
            const angle = Math.atan2(targetWorldY - player.y, targetWorldX - player.x);
            pVx = Math.cos(angle) * 11;
            pVy = Math.sin(angle) * 11;
            player.facing = targetWorldX < player.x ? 'left' : 'right';
        }
        projectiles.push({
            x: player.x + 18 * dir,
            y: player.y - 6,
            vx: pVx,
            vy: pVy,
            damage: totalAttack,
            kind: wType === 'staff' ? 'orb' : 'arrow',
            life: 40
        });
    }

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        let dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < 85) damageEnemy(enemy, totalAttack);
    });
}

function interactWithNearest() {
    let interacted = false;
    npcs.forEach(npc => {
        if (Math.hypot(player.x - npc.x, player.y - npc.y) < 85) {
            activeDialogNpc = npc;
            openDialog(npc);
            interacted = true;
        }
    });
    if (interacted) return;

    props.forEach(p => {
        if (p.type === 'chest' && !p.opened) {
            if (Math.hypot(player.x - p.x, player.y - p.y) < 82) {
                p.opened = true;
                player.gold += 150;
                const chestXp = 260;
                spawnFloatingText(player.x, player.y - 56, `+${chestXp} XP (Tesouro!)`, '#fde047');
                if (p.isQuestChest) advanceQuest('q2', 1);
                else showToast(`${p.name} aberto! +${chestXp} XP e +150 Ouro`, 'fa-gem');
                gainXp(chestXp);
            }
        }
    });
}

function gainXp(amount) {
    player.xp += amount;
    let leveledUp = false;
    let hpGainTotal = 0;
    let atkGainTotal = 0;

    while (player.xp >= player.maxXp) {
        leveledUp = true;
        player.level++;
        player.xp -= player.maxXp;
        player.maxXp = getRequiredXpForLevel(player.level);

        const hpGain = 25 + Math.floor(player.level * 3);
        const atkGain = 5 + Math.floor(player.level * 0.5);

        player.maxHp += hpGain;
        player.hp = player.maxHp;
        player.baseAttack += atkGain;
        player.defense = (player.defense || 4) + 2;

        hpGainTotal += hpGain;
        atkGainTotal += atkGain;
    }

    if (leveledUp) {
        player.levelUpEffectTimer = 65;
        spawnFloatingText(player.x, player.y - 82, `NÍVEL ${player.level}! (+${hpGainTotal} HP, +${atkGainTotal} ATQ)`, '#facc15');
        showToast(`SUBIU PARA O NÍVEL ${player.level}! Vida Restaurada • +${hpGainTotal} HP, +${atkGainTotal} ATQ`, 'fa-angles-up');
        saveGameProgress(true);
    }
    updateHUD();
}

function usePotion() {
    let potionItem = inventory.find(i => i.id === 'potion');
    if (potionItem && potionItem.count > 0) {
        if (player.hp >= player.maxHp) {
            showToast('Sua vida já está no máximo!', 'fa-heart');
            return;
        }
        potionItem.count--;
        player.hp = Math.min(player.maxHp, player.hp + 60);
        spawnFloatingText(player.x, player.y - 40, '+60 VIDA', '#4ade80');
        showToast('Poção bebida! +60 VIDA restaurada.', 'fa-vial');
        updateInventoryUI();
    } else {
        showToast('Sem poções disponíveis!', 'fa-triangle-exclamation');
    }
}

function buyPotionFromNpc() {
    if (player.gold < 30) {
        showToast('Ouro insuficiente! Precisa de 30 moedas.', 'fa-coins');
        return;
    }
    player.gold -= 30;
    let potionItem = inventory.find(i => i.id === 'potion');
    if (potionItem) potionItem.count++;
    else inventory.push({ id: 'potion', name: 'Poção de Vida', type: 'potion', count: 1, icon: 'fa-vial', desc: 'Restaura 60 pontos de vida instantaneamente.' });
    updateHUD();
    showToast('Poção de Vida comprada (-30 Ouro)!', 'fa-vial');
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    if (id === 'inventoryModal') {
        document.getElementById('inventoryBadge').classList.add('hidden');
        updateInventoryUI();
    }
    if (id === 'statusModal') updateStatusUI();
    if (id === 'questsModal') updateQuestsUI();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function openDialog(npc) {
    document.getElementById('dialogTitle').querySelector('span').innerText = npc.name;
    document.getElementById('dialogText').innerText = npc.text;
    const shopBtn = document.getElementById('dialogShopBtn');
    const actionBtn = document.getElementById('dialogActionBtn');

    if (npc.isMerchant) {
        shopBtn.classList.remove('hidden');
        actionBtn.innerHTML = `<i class="fa-solid fa-check"></i> Entendido`;
    } else {
        shopBtn.classList.add('hidden');
        actionBtn.innerHTML = `<i class="fa-solid fa-check"></i> Aceitar Missão`;
    }
    document.getElementById('dialogBox').classList.remove('hidden');
}

function closeDialog() {
    document.getElementById('dialogBox').classList.add('hidden');
}

function handleDialogAction() {
    if (activeDialogNpc && activeDialogNpc.questId) {
        let q = quests.find(item => item.id === activeDialogNpc.questId);
        if (q && !q.accepted) {
            q.accepted = true;
            showToast(`Missão Aceita: ${q.title}!`, 'fa-scroll');
        }
    }
    closeDialog();
}

function useXpBook(index) {
    let item = inventory[index];
    if (item && item.type === 'xp_book' && item.count > 0) {
        const xpGain = item.xpAmount || 200;
        item.count--;
        if (item.count <= 0) inventory.splice(index, 1);
        spawnFloatingText(player.x, player.y - 54, `+${xpGain} XP (Tomo!)`, '#38bdf8');
        showToast(`Você leu ${item.name} e ganhou +${xpGain} XP!`, 'fa-book-open');
        gainXp(xpGain);
        updateInventoryUI();
    }
}

function updateHUD() {
    if (!player.maxXp || player.maxXp < 100) player.maxXp = getRequiredXpForLevel(player.level);

    document.getElementById('hudName').innerText = player.name;
    document.getElementById('hudLevel').innerText = `Nv. ${player.level}`;
    document.getElementById('miniHudLevel').innerText = `Nv. ${player.level}`;
    document.getElementById('hudGold').innerText = player.gold;
    document.getElementById('hudHpText').innerText = `${player.hp}/${player.maxHp}`;
    document.getElementById('hudXpText').innerText = `${player.xp} / ${player.maxXp} XP`;
    document.getElementById('hudHpBar').style.width = `${Math.min(100, (player.hp / player.maxHp) * 100)}%`;
    document.getElementById('hudXpBar').style.width = `${Math.min(100, (player.xp / player.maxXp) * 100)}%`;

    const comboBadge = document.getElementById('hudComboBadge');
    if (combatCombo.count > 1 && combatCombo.timer > 0) {
        const mult = (1 + Math.min(0.5, (combatCombo.count - 1) * 0.15)).toFixed(2);
        comboBadge.innerText = `Combo x${mult}`;
        comboBadge.classList.remove('hidden');
    } else {
        comboBadge.classList.add('hidden');
    }

    let potionItem = inventory.find(i => i.id === 'potion');
    document.getElementById('potionCount').innerText = potionItem ? potionItem.count : 0;

    const completedCount = quests.filter(q => q.completed).length;
    document.getElementById('questActiveCount').innerText = `${completedCount}/${quests.length}`;

    const region = getCurrentRegionName();
    document.getElementById('regionNameText').innerText = region;
    document.getElementById('mobileRegionText').innerText = region;
}

function updateStatusUI() {
    document.getElementById('statusHeroName').innerText = player.name;
    document.getElementById('statusClassName').innerText = player.className;
    document.getElementById('statusLevel').innerText = player.level;
    document.getElementById('statusMaxHp').innerText = `${player.hp} / ${player.maxHp}`;
    let totalAtk = player.baseAttack + (player.equippedWeapon ? player.equippedWeapon.bonus : 0);
    document.getElementById('statusAttack').innerText = `${totalAtk} (Def ${player.defense || 4})`;
    document.getElementById('statusXp').innerText = `${player.xp} / ${player.maxXp} XP`;
    document.getElementById('statusGold').innerText = player.gold;
}

function updateInventoryUI() {
    document.getElementById('invGold').innerText = player.gold;
    document.getElementById('equippedWeaponName').innerText = player.equippedWeapon.name;
    document.getElementById('equippedWeaponStats').innerText = `Bônus de Ataque +${player.equippedWeapon.bonus}`;
    document.getElementById('equippedWeaponIcon').innerHTML = `<i class="fa-solid ${player.equippedWeapon.icon}"></i>`;

    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';
    inventory.forEach((item, index) => {
        let div = document.createElement('div');
        div.className = "bg-[#252530] border-2 border-[#111827] hover:border-amber-400 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative shadow";
        div.innerHTML = `
            <i class="fa-solid ${item.icon} text-amber-400 text-xl"></i>
            <span class="text-[10px] text-white font-bold text-center truncate w-full cartoon-font">${item.name}</span>
            ${item.count !== undefined ? `<span class="absolute top-1 right-1 bg-amber-500 text-[#111827] font-black text-[9px] px-1.5 rounded border border-[#111827]">${item.count}</span>` : ''}
        `;
        div.onclick = () => selectInventoryItem(index);
        grid.appendChild(div);
    });
}

function selectInventoryItem(index) {
    let item = inventory[index];
    const descBox = document.getElementById('itemDescBox');
    if (item.type === 'weapon') {
        descBox.innerHTML = `<strong class="text-amber-300">${item.name}</strong> (+${item.bonus} ATQ): ${item.desc} <button onclick="equipWeapon(${index})" class="mt-2 block w-full bg-amber-500 hover:bg-amber-400 text-[#111827] font-extrabold py-1.5 rounded-xl border-2 border-[#111827] text-center cartoon-font cursor-pointer">Equipar Arma</button>`;
    } else if (item.type === 'potion') {
        descBox.innerHTML = `<strong class="text-rose-400">${item.name}</strong>: ${item.desc} <button onclick="usePotion()" class="mt-2 block w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-1.5 rounded-xl border-2 border-[#111827] text-center cartoon-font cursor-pointer">Beber Poção</button>`;
    } else if (item.type === 'xp_book') {
        descBox.innerHTML = `<strong class="text-sky-400">${item.name}</strong>: ${item.desc} <button onclick="useXpBook(${index})" class="mt-2 block w-full bg-sky-500 hover:bg-sky-400 text-[#111827] font-extrabold py-1.5 rounded-xl border-2 border-[#111827] text-center cartoon-font cursor-pointer">Ler Tomo (+${item.xpAmount || 200} XP)</button>`;
    }
}

function equipWeapon(index) {
    let item = inventory[index];
    if (item.type === 'weapon') {
        let oldWeapon = { ...player.equippedWeapon, type: 'weapon', desc: 'Arma guardada na mochila.' };
        player.equippedWeapon = { id: item.id, name: item.name, bonus: item.bonus, icon: item.icon, typeKey: item.typeKey };
        inventory[index] = oldWeapon;
        updateInventoryUI();
        showToast(`Equipado: ${item.name}!`, 'fa-swords');
    }
}

function updateQuestsUI() {
    const container = document.getElementById('questsListContainer');
    container.innerHTML = '';
    quests.forEach(q => {
        let div = document.createElement('div');
        div.className = `p-4 rounded-2xl border-2 border-[#111827] ${q.completed ? 'bg-emerald-950/60' : (q.accepted ? 'bg-[#14141a]' : 'bg-[#14141a]/50 opacity-80')} flex flex-col gap-1.5`;
        let statusBadge = q.completed
            ? '<span class="text-[10px] px-2 py-0.5 rounded-lg font-extrabold uppercase border border-[#111827] bg-emerald-500 text-[#111827]">Concluída</span>'
            : (q.accepted
                ? '<span class="text-[10px] px-2 py-0.5 rounded-lg font-extrabold uppercase border border-[#111827] bg-amber-500 text-[#111827]">Ativa</span>'
                : '<span class="text-[10px] px-2 py-0.5 rounded-lg font-extrabold uppercase border border-[#111827] bg-slate-700 text-slate-300">Fale com NPC</span>');

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="cartoon-font font-bold text-amber-300 text-sm">${q.title} <span class="text-[10px] text-slate-400 font-normal">(${q.npc})</span></h4>
                ${statusBadge}
            </div>
            <p class="text-xs text-slate-300">${q.desc}</p>
            <div class="flex justify-between items-center text-xs text-slate-400 mt-1">
                <span>Progresso: <strong class="text-white">${q.current} / ${q.target}</strong></span>
                <span>Prêmio: <strong class="text-amber-400">+${q.reward.xp} XP, +${q.reward.gold} Ouro${q.reward.weapon ? ' + Arma Rara' : ''}</strong></span>
            </div>
        `;
        container.appendChild(div);
    });
}

setInterval(() => {
    if (!document.getElementById('gameHud').classList.contains('hidden')) {
        saveGameProgress(true);
    }
}, 45000);

function gameLoop() {
    update();
    render();
    renderUIAppAvatars();
    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    gameLoop();
};
