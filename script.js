(() => {
  "use strict";

  const MAX_DICE = 15;
  const START_DICE = 2;
  const STORAGE_KEY = "zorome-dice-state-v3";

  // dice skins: 1=default(free) 2-4=stage-gated, 5-9=free but unlocked by
  // cumulative play (no payment involved for any skin)
  const DICE_CLASS = [
    "", "dice-souzu", "dice-manzu", "dice-pinzu", "dice-dragonball",
    "dice-hanafuda", "dice-maneki", "dice-matsuri", "dice-retro",
  ];
  const DICE_SKIN_NAMES = [
    "ノーマル", "索子(そうず)", "萬子(まんず)", "筒子(ぴんず)", "ドラゴンボール風",
    "花札風", "招き猫・和柄", "夏祭り・花火", "レトロ8bit",
  ];
  const DICE_UNLOCK = [
    { type: "free" },
    { type: "stage", value: 5 },
    { type: "stage", value: 10 },
    { type: "stage", value: 15 },
    { type: "progress", value: 15 },
    { type: "progress", value: 30 },
    { type: "progress", value: 50 },
    { type: "progress", value: 75 },
    { type: "progress", value: 100 },
  ];

  // tray skins: same idea — first few by stage, the rest unlock with play
  const TRAY_CLASS = [
    "", "tray-ocean", "tray-sunset", "tray-galaxy",
    "tray-hanafuda", "tray-maneki", "tray-matsuri", "tray-retro",
    "tray-giraffe", "tray-zebra", "tray-ladybug", "tray-tiger", "tray-danger",
  ];
  const TRAY_SKIN_NAMES = [
    "ノーマル", "オーシャン", "サンセット", "ギャラクシー",
    "花札風", "招き猫・和柄", "夏祭り・花火", "レトロ8bit",
    "キリン柄", "シマウマ柄", "テントウムシ柄", "トラ柄", "デンジャー柄",
  ];
  const TRAY_UNLOCK = [
    { type: "free" },
    { type: "stage", value: 5 },
    { type: "stage", value: 10 },
    { type: "stage", value: 15 },
    { type: "progress", value: 20 },
    { type: "progress", value: 35 },
    { type: "progress", value: 55 },
    { type: "progress", value: 80 },
    { type: "progress", value: 105 },
    { type: "progress", value: 130 },
    { type: "progress", value: 155 },
    { type: "progress", value: 180 },
    { type: "progress", value: 210 },
  ];

  // sound skins: 1=default(free) 2=和風 3=エレクトロ (both 2,3 unlocked together via soundPack purchase)
  const SOUND_SKIN_NAMES = ["ノーマル", "和風", "エレクトロ", "キュインA(レーザー)", "キュインB(パワーアップ)", "キュインC(RPG風)", "ガコッ(機械式)"];
  const SOUND_SKIN_ICONS = ["🔈", "🎐", "⚡", "🔫", "💥", "✨", "⚙️"];

  const PIP_PATTERNS = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  const FACE_TRANSFORM = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(-90deg)",
    3: "rotateY(-90deg)",
    4: "rotateY(90deg)",
    5: "rotateX(90deg)",
    6: "rotateY(180deg)",
  };

  // ---- DOM refs ----
  const bestCountEl = document.getElementById("bestCount");
  const shopBtn = document.getElementById("shopBtn");

  const openingScreen = document.getElementById("openingScreen");
  const brainJuiceLayer = document.getElementById("brainJuiceLayer");
  const startBtn = document.getElementById("startBtn");
  const topbarEl = document.getElementById("topbar");
  const selectScreen = document.getElementById("selectScreen");
  const playScreen = document.getElementById("playScreen");
  const progressFill = document.getElementById("progressFill");
  const diceCountEl = document.getElementById("diceCount");
  const maxCountEl = document.getElementById("maxCount");
  const stageListEl = document.getElementById("stageList");
  const shakeToggle = document.getElementById("shakeToggle");
  const diceSwatchesEl = document.getElementById("diceSwatches");
  const traySwatchesEl = document.getElementById("traySwatches");
  const soundSwatchesEl = document.getElementById("soundSwatches");
  const skinsStoreBtn = document.getElementById("skinsStoreBtn");
  const secretModeBtn = document.getElementById("secretModeBtn");
  const secretModeOverlay = document.getElementById("secretModeOverlay");
  const secretModeCloseBtn = document.getElementById("secretModeCloseBtn");
  const secretDiceInput = document.getElementById("secretDiceInput");
  const secretDiceValue = document.getElementById("secretDiceValue");
  const secretRateInput = document.getElementById("secretRateInput");
  const secretRateValue = document.getElementById("secretRateValue");
  const secretModeStartBtn = document.getElementById("secretModeStartBtn");
  const previewOverlay = document.getElementById("previewOverlay");
  const previewTitle = document.getElementById("previewTitle");
  const previewStage = document.getElementById("previewStage");
  const previewActions = document.getElementById("previewActions");
  const previewCloseBtn = document.getElementById("previewCloseBtn");

  const backBtn = document.getElementById("backBtn");
  const backBtn2 = document.getElementById("backBtn2");
  const playStageNumEl = document.getElementById("playStageNum");
  const board = document.getElementById("board");
  const tray = document.getElementById("tray");
  const rollBtn = document.getElementById("rollBtn");
  const message = document.getElementById("message");
  const probValueEl = document.getElementById("probValue");
  const stageTimeEl = document.getElementById("stageTime");
  const stageBestTimeEl = document.getElementById("stageBestTime");
  const rollCountEl = document.getElementById("rollCount");
  const reachBadge = document.getElementById("reachBadge");

  const confettiLayer = document.getElementById("confetti");
  const zoromePopup = document.getElementById("zoromePopup");
  const celebrationRays = document.getElementById("celebrationRays");
  const clearCard = document.getElementById("clearCard");
  const clearTimeValue = document.getElementById("clearTimeValue");
  const clearRollsValue = document.getElementById("clearRollsValue");
  const sakibareFlash = document.getElementById("sakibareFlash");
  const sakibareBadge = document.getElementById("sakibareBadge");
  const shutter = document.getElementById("shutter");
  const kiseruEffect = document.getElementById("kiseruEffect");
  const kiseruSmokeLayer = document.getElementById("kiseruSmokeLayer");
  const cutinCard = document.getElementById("cutinCard");
  const mobPreview = document.getElementById("mobPreview");
  const blackout = document.getElementById("blackout");
  const alienPeek = document.getElementById("alienPeek");
  const adOverlay = document.getElementById("adOverlay");
  const adCountdownEl = document.getElementById("adCountdown");
  const adCloseBtn = document.getElementById("adCloseBtn");
  const adRemoveBtn = document.getElementById("adRemoveBtn");
  const storeOverlay = document.getElementById("storeOverlay");
  const storeCloseBtn = document.getElementById("storeCloseBtn");
  const storeItemsEl = document.getElementById("storeItems");
  const toastEl = document.getElementById("toast");
  const testBtn = document.getElementById("testBtn");
  const testOverlay = document.getElementById("testOverlay");
  const testCloseBtn = document.getElementById("testCloseBtn");
  const testColorBtnsEl = document.getElementById("testColorBtns");
  const testEffectBtnsEl = document.getElementById("testEffectBtns");
  const testMiscBtnsEl = document.getElementById("testMiscBtns");
  const testSoundBtnsEl = document.getElementById("testSoundBtns");

  // each tier has its own appearance weight and "reliability" (how often this
  // color, when it shows, actually precedes a real win) — classic pachislot
  // 予告信頼度 design. Color is picked per-roll from the outcome, not from stage.
  const HEAT_TIERS = [
    { solid: "#4d9fff", glow: "rgba(77, 159, 255, 0.6)", weight: 50, reliability: 0.15 }, // 青
    { solid: "#4fd680", glow: "rgba(79, 214, 128, 0.6)", weight: 30, reliability: 0.40 }, // 緑
    { solid: "#ff5d5d", glow: "rgba(255, 93, 93, 0.6)", weight: 14, reliability: 0.75 }, // 赤
    { solid: "#ffd700", glow: "rgba(255, 215, 0, 0.7)", weight: 6, reliability: 0.97 }, // 金
  ];

  // pick a tier weighted by (appearance weight × chance that tier fits this
  // roll's already-decided outcome) — so gold mostly precedes real wins,
  // blue mostly precedes busts, but neither is guaranteed (a false gold flag
  // or a lucky blue reach can still happen, same as real pachislot).
  function pickHeatTierIndex(willWin) {
    const weights = HEAT_TIERS.map((t) => t.weight * (willWin ? t.reliability : 1 - t.reliability));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i;
      r -= weights[i];
    }
    return weights.length - 1;
  }

  function applyHeatColor(tierIndex) {
    const tier = HEAT_TIERS[tierIndex];
    document.documentElement.style.setProperty("--heat-color", tier.solid);
    document.documentElement.style.setProperty("--heat-glow", tier.glow);
  }

  maxCountEl.textContent = MAX_DICE;

  function defaultState() {
    return {
      count: START_DICE,
      best: START_DICE,
      values: Array(START_DICE).fill(null),
      stageBestMs: {},
      diceSkin: 1,
      traySkin: 1,
      soundSkin: 1,
      shakeEnabled: false,
      noAds: false,
      totalRolls: 0,
      totalPlayMs: 0,
      owned: {
        soundPack: false, effectPack: false, secretMode: false,
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed.count !== "number" || !Array.isArray(parsed.values)) return null;
      const base = defaultState();
      return Object.assign(base, parsed, {
        stageBestMs: parsed.stageBestMs || {},
        owned: Object.assign(base.owned, parsed.owned || {}),
      });
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  const state = loadState() || defaultState();
  if (state.values.length !== state.count) {
    state.values = Array(state.count).fill(null);
  }

  let rolling = false;
  let stageStartTime = Date.now();
  let stageRollCount = 0;
  let timerHandle = null;
  let selectedStage = null;
  let playValues = [];
  let secretModeActive = false;
  let secretWinRate = 0.5;

  function randomFace() {
    return 1 + Math.floor(Math.random() * 6);
  }

  function allMatch(values) {
    return values.length > 0 && values.every((v) => v === values[0]);
  }

  function diceThemeClass() {
    return DICE_CLASS[state.diceSkin - 1] || "";
  }

  function trayThemeClass() {
    return TRAY_CLASS[state.traySkin - 1] || "";
  }

  function formatProbability(count) {
    const denom = Math.pow(6, count - 1);
    return "1/" + denom.toLocaleString("ja-JP");
  }

  function formatTime(ms) {
    return (ms / 1000).toFixed(1) + "s";
  }

  // ---- 3D dice ----
  function buildDie(value, locked, size) {
    const scene = document.createElement("div");
    scene.className = "die" + (locked ? " locked" : "");
    if (size) {
      scene.style.width = size + "px";
      scene.style.height = size + "px";
      scene.style.setProperty("--die-half", size / 2 + "px");
    }
    if (locked) return scene;

    const cube = document.createElement("div");
    cube.className = "die-cube " + diceThemeClass();
    for (let faceValue = 1; faceValue <= 6; faceValue++) {
      const face = document.createElement("div");
      face.className = "die-face f" + faceValue;
      face.dataset.value = faceValue;
      const pattern = PIP_PATTERNS[faceValue];
      for (let i = 1; i <= 9; i++) {
        const pip = document.createElement("div");
        pip.className = "pip p" + i + (pattern.includes(i) ? " on" : "");
        face.appendChild(pip);
      }
      cube.appendChild(face);
    }
    cube.style.transform = FACE_TRANSFORM[value || 1];
    scene.appendChild(cube);
    return scene;
  }

  function setDieValue(scene, value) {
    const cube = scene.querySelector(".die-cube");
    if (cube) cube.style.transform = FACE_TRANSFORM[value];
  }

  // ---- physics arena: dice are tossed in from above and actually roll
  // around and bump into each other and the walls, instead of just
  // spinning in place ----
  function layoutArena(count) {
    const arenaWidth = board.clientWidth || tray.clientWidth - 32 || 320;
    const dieSize = count <= 4 ? 70 : count <= 8 ? 58 : count <= 12 ? 48 : 40;
    const cols = Math.max(1, Math.floor(arenaWidth / (dieSize + 14)));
    const rows = Math.ceil(count / cols);
    const arenaHeight = Math.max(230, rows * (dieSize + 30) + 40);
    board.style.height = arenaHeight + "px";
    return { arenaWidth, arenaHeight, dieSize, cols };
  }

  function scatterRestPositions(diceEls, layout) {
    const { arenaWidth, dieSize, cols } = layout;
    diceEls.forEach((el, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = arenaWidth / cols;
      const baseX = col * cellW + cellW / 2 - dieSize / 2;
      const baseY = row * (dieSize + 30) + 16;
      const jx = Math.random() * 14 - 7;
      const jy = Math.random() * 10 - 5;
      const rot = Math.round(Math.random() * 26 - 13);
      el.style.left = Math.round(baseX + jx) + "px";
      el.style.top = Math.round(baseY + jy) + "px";
      el.style.transform = "rotate(" + rot + "deg)";
    });
  }

  function stepDicePhysics(bodies, arenaWidth, arenaHeight, dt) {
    const gravity = 1500;
    const wallRestitution = 0.42;
    const damping = 0.985;

    bodies.forEach((b) => {
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.vAngle * dt;

      if (b.x - b.r < 0) { b.x = b.r; b.vx = -b.vx * wallRestitution; }
      if (b.x + b.r > arenaWidth) { b.x = arenaWidth - b.r; b.vx = -b.vx * wallRestitution; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy = -b.vy * wallRestitution; }
      if (b.y + b.r > arenaHeight) {
        b.y = arenaHeight - b.r;
        b.vy = -b.vy * wallRestitution;
        b.vAngle *= 0.6;
        b.vx *= 0.92;
      }

      b.vx *= damping;
      b.vy *= damping;
      b.vAngle *= damping;
    });

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const c = bodies[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = a.r + c.r;
        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          c.x += nx * overlap;
          c.y += ny * overlap;

          const rvx = c.vx - a.vx;
          const rvy = c.vy - a.vy;
          const relVel = rvx * nx + rvy * ny;
          if (relVel < 0) {
            const bounce = 0.5;
            const impulse = (-(1 + bounce) * relVel) / 2;
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
            c.vx += impulse * nx;
            c.vy += impulse * ny;
            a.vAngle += (Math.random() - 0.5) * 6;
            c.vAngle += (Math.random() - 0.5) * 6;
          }
        }
      }
    }
  }

  function tossDiceIn(diceEls, layout, durationMs) {
    const { arenaWidth, arenaHeight, dieSize } = layout;
    return new Promise((resolve) => {
      const r = dieSize / 2;
      const bodies = diceEls.map((el) => ({
        el,
        x: arenaWidth * (0.12 + Math.random() * 0.76),
        y: -dieSize - Math.random() * 90,
        vx: (Math.random() - 0.5) * 240,
        vy: 460 + Math.random() * 220,
        angle: Math.random() * 40 - 20,
        vAngle: (Math.random() - 0.5) * 10,
        r,
      }));

      diceEls.forEach((el) => {
        const cube = el.querySelector(".die-cube");
        if (cube) cube.classList.add("spin");
      });

      const start = performance.now();
      let last = start;

      function finish() {
        diceEls.forEach((el) => {
          const cube = el.querySelector(".die-cube");
          if (cube) cube.classList.remove("spin");
        });
        resolve();
      }

      function frame(now) {
        if (skipRequested) {
          // fast-forward the physics synchronously so dice still land in a
          // settled, non-overlapping spot instead of freezing mid-air
          for (let i = 0; i < 60; i++) stepDicePhysics(bodies, arenaWidth, arenaHeight, 0.02);
          bodies.forEach((b) => {
            b.el.style.left = b.x - b.r + "px";
            b.el.style.top = b.y - b.r + "px";
            b.el.style.transform = "rotate(" + b.angle.toFixed(1) + "deg)";
          });
          finish();
          return;
        }
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        stepDicePhysics(bodies, arenaWidth, arenaHeight, dt);
        bodies.forEach((b) => {
          b.el.style.left = b.x - b.r + "px";
          b.el.style.top = b.y - b.r + "px";
          b.el.style.transform = "rotate(" + b.angle.toFixed(1) + "deg)";
        });
        if (now - start < durationMs) {
          requestAnimationFrame(frame);
        } else {
          finish();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  // ---- skin unlock levels (each store-exclusive skin is sold separately) ----
  function getProgressScore() {
    // every ~15s of play counts the same as one roll, so both count and
    // time contribute toward unlocking skins
    return state.totalRolls + Math.floor(state.totalPlayMs / 15000);
  }

  function isUnlockRuleMet(rule) {
    if (rule.type === "free") return true;
    if (rule.type === "stage") return state.best >= rule.value;
    if (rule.type === "progress") return getProgressScore() >= rule.value;
    return false;
  }

  function isDiceSkinUnlocked(id) {
    return isUnlockRuleMet(DICE_UNLOCK[id - 1]);
  }

  function isTraySkinUnlocked(id) {
    return isUnlockRuleMet(TRAY_UNLOCK[id - 1]);
  }

  function isSoundUnlocked(id) {
    return id === 1 || state.owned.soundPack;
  }

  function renderSkinPanel() {
    diceSwatchesEl.innerHTML = "";
    traySwatchesEl.innerHTML = "";
    soundSwatchesEl.innerHTML = "";
    for (let i = 1; i <= DICE_CLASS.length; i++) {
      diceSwatchesEl.appendChild(
        makeSwatch("dice", i, isDiceSkinUnlocked(i), state.diceSkin === i, DICE_UNLOCK[i - 1], DICE_SKIN_NAMES[i - 1])
      );
    }
    for (let i = 1; i <= TRAY_CLASS.length; i++) {
      traySwatchesEl.appendChild(
        makeSwatch("tray", i, isTraySkinUnlocked(i), state.traySkin === i, TRAY_UNLOCK[i - 1], TRAY_SKIN_NAMES[i - 1])
      );
    }
    for (let i = 1; i <= SOUND_SKIN_NAMES.length; i++) {
      soundSwatchesEl.appendChild(
        makeSwatch("sound", i, isSoundUnlocked(i), state.soundSkin === i, isSoundUnlocked(i) ? null : "store", SOUND_SKIN_NAMES[i - 1], SOUND_SKIN_ICONS[i - 1])
      );
    }
  }

  function makeSwatch(kind, skinId, unlocked, selected, lockRule, name, icon) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "swatch" + (unlocked ? "" : " locked") + (selected ? " selected" : "");
    el.dataset.kind = kind;
    el.dataset.skin = skinId;
    el.title = name || "";
    if (icon && unlocked) el.textContent = icon;
    if (!unlocked) el.innerHTML = '<span class="swatch-lock">🔒</span>';
    el.addEventListener("click", () => openSkinPreview(kind, skinId, unlocked, name, lockRule));
    return el;
  }

  // lockRule: "store" (sound), or a {type:"stage"|"progress", value} rule object
  function describeLockRule(lockRule) {
    if (lockRule === "store") {
      return { isStore: true, label: "ストアで購入する" };
    }
    if (lockRule.type === "stage") {
      return { isStore: false, label: `ステージ${lockRule.value}到達で解放` };
    }
    const remaining = Math.max(0, lockRule.value - getProgressScore());
    return { isStore: false, label: `プレイを重ねると解放（あと${remaining}）` };
  }

  function openSkinPreview(kind, skinId, unlocked, name, lockRule) {
    previewTitle.textContent = name || "";
    previewStage.innerHTML = "";

    if (kind === "dice") {
      const savedSkin = state.diceSkin;
      state.diceSkin = skinId;
      const die = buildDie(6, false, 110);
      state.diceSkin = savedSkin;
      previewStage.appendChild(die);
    } else if (kind === "tray") {
      const box = document.createElement("div");
      box.className = "preview-tray-box tray " + (TRAY_CLASS[skinId - 1] || "");
      previewStage.appendChild(box);
    } else {
      const note = document.createElement("div");
      note.className = "preview-note";
      note.textContent = "🎉 ゾロ目が揃った瞬間に鳴る「確定音」です";
      previewStage.appendChild(note);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "test-btn";
      btn.textContent = "▶ このサウンドを再生";
      btn.addEventListener("click", () => playKakuteiChime(skinId));
      previewStage.appendChild(btn);
    }

    previewActions.innerHTML = "";
    if (unlocked) {
      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "store-buy-btn";
      useBtn.textContent = "これを使う";
      useBtn.addEventListener("click", () => {
        if (kind === "dice") state.diceSkin = skinId;
        else if (kind === "tray") state.traySkin = skinId;
        else state.soundSkin = skinId;
        saveState();
        renderSkinPanel();
        if (!playScreen.hidden) renderPlay();
        previewOverlay.classList.remove("show");
      });
      previewActions.appendChild(useBtn);
    } else {
      const info = describeLockRule(lockRule);
      const lockBtn = document.createElement("button");
      lockBtn.type = "button";
      lockBtn.className = "store-buy-btn" + (info.isStore ? "" : " owned");
      lockBtn.textContent = info.label;
      if (info.isStore) {
        lockBtn.addEventListener("click", () => {
          previewOverlay.classList.remove("show");
          renderStore();
          storeOverlay.classList.add("show");
        });
      } else {
        lockBtn.disabled = true;
      }
      previewActions.appendChild(lockBtn);
    }

    previewOverlay.classList.add("show");
  }

  // ---- select screen ----
  function renderSelect() {
    bestCountEl.textContent = state.best;
    progressFill.style.width = (state.count / MAX_DICE) * 100 + "%";
    diceCountEl.textContent = state.count;
    renderStageList();
    renderSkinPanel();
    updateShakeToggleUI();
  }

  function renderStageList() {
    stageListEl.innerHTML = "";
    for (let n = START_DICE; n <= MAX_DICE; n++) {
      const cleared = n < state.count;
      const current = n === state.count;
      const locked = n > state.count;
      const row = document.createElement("button");
      row.type = "button";
      row.className =
        "stage-row" + (cleared ? " cleared" : "") + (current ? " current" : "") + (locked ? " locked" : "");
      const best = state.stageBestMs[n];
      row.innerHTML = `
        <span class="stage-row-num">${n}個</span>
        <span class="stage-row-prob">確率 ${formatProbability(n)}</span>
        <span class="stage-row-best">${best ? "自己ベスト " + formatTime(best) : ""}</span>
        <span class="stage-row-status">${locked ? "🔒" : current ? "▶" : "✓"}</span>
      `;
      if (!locked) {
        row.addEventListener("click", () => enterPlayScreen(n));
      } else {
        row.addEventListener("click", () => showToast("前のステージをクリアすると解放されます"));
      }
      stageListEl.appendChild(row);
    }
  }

  function enterPlayScreen(n) {
    selectedStage = n;
    playValues = (!secretModeActive && n === state.count) ? state.values.slice() : Array(n).fill(null);
    playStageNumEl.textContent = secretModeActive ? "裏モード" : n;
    selectScreen.hidden = true;
    playScreen.hidden = false;
    stageStartTime = Date.now();
    stageRollCount = 0;
    rollCountEl.textContent = "0";
    postWinPending = false;
    rollBtn.querySelector(".roll-btn-label").textContent = "振る";
    hideClearCelebration();
    renderPlay();
    setMessage("サイコロを振って、ゾロ目を出そう！");
  }

  function backToSelect() {
    secretModeActive = false;
    playScreen.hidden = true;
    selectScreen.hidden = false;
    renderSelect();
  }

  function renderPlay() {
    tray.className = "tray " + trayThemeClass();
    board.innerHTML = "";
    const layout = layoutArena(selectedStage);
    const diceEls = [];
    for (let i = 0; i < selectedStage; i++) {
      const die = buildDie(playValues[i], false, layout.dieSize);
      board.appendChild(die);
      diceEls.push(die);
    }
    scatterRestPositions(diceEls, layout);
    if (secretModeActive) {
      probValueEl.textContent = Math.round(secretWinRate * 100) + "%";
      stageBestTimeEl.textContent = "";
      return;
    }
    probValueEl.textContent = formatProbability(selectedStage);
    const best = state.stageBestMs[selectedStage];
    stageBestTimeEl.textContent = best ? "(自己ベスト " + formatTime(best) + ")" : "";
  }

  window.addEventListener("resize", () => {
    if (!playScreen.hidden) renderPlay();
  });

  function setMessage(text, mode) {
    message.textContent = text;
    message.className = "message" + (mode ? " " + mode : "");
  }

  function vibrate(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  }

  function spawnConfetti(count) {
    const colors = ["#ff5d8f", "#4fd6c4", "#ffd166", "#a685ff", "#f4f2ff"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      const duration = 1.4 + Math.random() * 1.2;
      piece.style.animationDuration = duration + "s";
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.3) * 1000);
    }
  }

  function showZoromePopup() {
    zoromePopup.classList.remove("show");
    void zoromePopup.offsetWidth;
    zoromePopup.classList.add("show");
    setTimeout(() => zoromePopup.classList.remove("show"), 1150);
  }

  function showClearCelebration(elapsedMs, rollCount) {
    clearTimeValue.textContent = formatTime(elapsedMs);
    clearRollsValue.textContent = rollCount + "回";

    celebrationRays.classList.remove("show");
    void celebrationRays.offsetWidth;
    celebrationRays.classList.add("show");

    clearCard.classList.remove("show");
    void clearCard.offsetWidth;
    clearCard.classList.add("show");
    // stays up until the player presses ホームに戻る — see hideClearCelebration()
  }

  function hideClearCelebration() {
    celebrationRays.classList.remove("show");
    clearCard.classList.remove("show");
  }

  function spawnSparkles(count) {
    const sparkles = ["✨", "🌟", "💫", "⭐"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.background = "none";
      piece.style.fontSize = 14 + Math.random() * 14 + "px";
      piece.style.left = Math.random() * 100 + "vw";
      piece.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      const duration = 1.3 + Math.random() * 1.3;
      piece.style.animationDuration = duration + "s";
      piece.style.animationDelay = Math.random() * 0.6 + "s";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.7) * 1000);
    }
  }

  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    return audioCtx;
  }

  // gives a tonal source a bit of ringing hall/arcade decay — the "wet"
  // send that makes pachinko chimes feel roomy instead of dry/flat
  function sendToEcho(ctx, node, opts) {
    const delayTime = (opts && opts.delayTime) || 0.15;
    const feedback = (opts && opts.feedback) || 0.32;
    const wet = (opts && opts.wet) || 0.32;
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = delayTime;
    const fb = ctx.createGain();
    fb.gain.value = feedback;
    const wetGain = ctx.createGain();
    wetGain.gain.value = wet;
    node.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(ctx.destination);
  }

  function playDiceRollSound(durationMs) {
    // "カランコロン" — bright, light clinks (like small hard dice or bells
    // knocking together), not a dull rumble
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const duration = durationMs / 1000;
    const now = ctx.currentTime;

    // a very soft noise bed underneath, just for texture
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.035, now + 0.05);
    noiseGain.gain.linearRampToValueAtTime(0, now + duration);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    // knock hits — a short filtered noise "tock" plus a brief inharmonic
    // ring, more like ceramic/wood clacking than a musical electronic blip
    const clinkCount = Math.max(4, Math.floor(duration * 11));
    for (let i = 0; i < clinkCount; i++) {
      const t = now + (Math.random() * 0.7 + (i / clinkCount) * 0.3) * duration;
      const freq = 1500 + Math.random() * 900;

      // the actual "knock" transient — filtered noise, very short
      const knockBufSize = Math.floor(ctx.sampleRate * 0.03);
      const knockBuf = ctx.createBuffer(1, knockBufSize, ctx.sampleRate);
      const kd = knockBuf.getChannelData(0);
      for (let s = 0; s < knockBufSize; s++) {
        kd[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / knockBufSize, 1.6);
      }
      const knock = ctx.createBufferSource();
      knock.buffer = knockBuf;
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = "bandpass";
      knockFilter.frequency.value = freq;
      knockFilter.Q.value = 1.4;
      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(0.5, t);
      knockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      knock.connect(knockFilter);
      knockFilter.connect(knockGain);
      knockGain.connect(ctx.destination);
      knock.start(t);

      // a faint inharmonic ring, detuned so it doesn't read as a clean tone
      [1, 1.83].forEach((mult) => {
        const ring = ctx.createOscillator();
        const ringGain = ctx.createGain();
        ring.type = "sine";
        ring.frequency.value = freq * mult;
        ringGain.gain.setValueAtTime(0, t);
        ringGain.gain.linearRampToValueAtTime(0.05, t + 0.003);
        ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        ring.connect(ringGain);
        ringGain.connect(ctx.destination);
        ring.start(t);
        ring.stop(t + 0.06);
      });
    }
  }

  function playKakuteiChime(skinOverride) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const skin = skinOverride || (isSoundUnlocked(state.soundSkin) ? state.soundSkin : 1);

    if (skin === 2) {
      // 和風: pentatonic bell (sine + slow decay, like a small bell/kane)
      const bellBus = ctx.createGain();
      bellBus.gain.value = 1;
      bellBus.connect(ctx.destination);
      sendToEcho(ctx, bellBus, { delayTime: 0.19, feedback: 0.4, wet: 0.34 });

      const notes = [659.25, 783.99, 987.77, 1318.5];
      notes.forEach((freq, i) => {
        const t0 = now + i * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.35, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
        osc.connect(gain);
        gain.connect(bellBus);
        osc.start(t0);
        osc.stop(t0 + 0.95);

        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.type = "sine";
        shimmer.frequency.value = freq * 2.01;
        shimmerGain.gain.setValueAtTime(0, t0);
        shimmerGain.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(bellBus);
        shimmer.start(t0);
        shimmer.stop(t0 + 0.65);
      });
      return;
    }

    if (skin === 3) {
      // エレクトロ: synth zap with quick pitch-bend, plus a sub thump
      const notes = [220, 440, 660, 880];
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = "sine";
      thump.frequency.setValueAtTime(90, now);
      thump.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      thumpGain.gain.setValueAtTime(0.5, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.3);

      notes.forEach((freq, i) => {
        const t0 = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * 0.6, t0);
        osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.06);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.22, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.32);
      });
      return;
    }

    if (skin === 4) return playKyuinA();
    if (skin === 5) return playKyuinB();
    if (skin === 6) return playKyuinC();
    if (skin === 7) return playGako();

    // ノーマル: bright ascending fanfare
    const notes = [880, 1108.7, 1318.5, 1760];
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    sendToEcho(ctx, master, { delayTime: 0.13, feedback: 0.34, wet: 0.28 });

    notes.forEach((freq, i) => {
      const t0 = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.9, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.4);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, t0);
      gain2.gain.linearRampToValueAtTime(0.25, t0 + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(t0);
      osc2.stop(t0 + 0.35);
    });
  }

  function playReachTick(index) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const freq = 500 + index * 90;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    sendToEcho(ctx, gain, { delayTime: 0.09, feedback: 0.22, wet: 0.22 });
    osc.start(now);
    osc.stop(now + 0.2);
  }

  function playReachSiren(durationMs) {
    // the classic pachislot reach alarm — an alternating two-tone siren
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    const osc = ctx.createOscillator();
    osc.type = "square";
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.06);
    gain.gain.setValueAtTime(0.1, Math.max(now + 0.06, now + duration - 0.12));
    gain.gain.linearRampToValueAtTime(0, now + duration);

    const baseFreq = 740;
    const swing = 220;
    const stepDur = 0.14;
    for (let t = now; t < now + duration; t += stepDur) {
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.setValueAtTime(baseFreq + swing, t + stepDur / 2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    sendToEcho(ctx, gain, { delayTime: 0.12, feedback: 0.24, wet: 0.2 });
    osc.start(now);
    osc.stop(now + duration);
  }

  function playSakibareSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.5);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.44, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);

    const t2 = now + 0.45;
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = "triangle";
    ping.frequency.value = 1200;
    pingGain.gain.setValueAtTime(0, t2);
    pingGain.gain.linearRampToValueAtTime(0.5, t2 + 0.02);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.3);
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    sendToEcho(ctx, pingGain, { delayTime: 0.1, feedback: 0.35, wet: 0.4 });
    ping.start(t2);
    ping.stop(t2 + 0.35);
  }

  // ---- sound candidates (for the test panel — not wired into real gameplay
  // until one is picked) ----
  function playDokyunB() {
    // パンチの効いたスネア風インパクト＋余韻のライザー
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(200, now);
    body.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    bodyGain.gain.setValueAtTime(0.6, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    body.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    body.start(now);
    body.stop(now + 0.2);

    const t2 = now + 0.08;
    const riser = ctx.createOscillator();
    const riserGain = ctx.createGain();
    riser.type = "sawtooth";
    riser.frequency.setValueAtTime(250, t2);
    riser.frequency.exponentialRampToValueAtTime(1100, t2 + 0.45);
    riserGain.gain.setValueAtTime(0.001, t2);
    riserGain.gain.exponentialRampToValueAtTime(0.18, t2 + 0.1);
    riserGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);
    riser.connect(riserGain);
    riserGain.connect(ctx.destination);
    riser.start(t2);
    riser.stop(t2 + 0.55);
  }

  function playDokyunC() {
    // 爆発風：低音ランブル＋ノイズバースト
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.6);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.6);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2500, now);
    lp.frequency.exponentialRampToValueAtTime(300, now + 0.6);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = "sine";
    rumble.frequency.setValueAtTime(90, now);
    rumble.frequency.exponentialRampToValueAtTime(35, now + 0.5);
    rumbleGain.gain.setValueAtTime(0.8, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 0.6);
  }

  function playKyuinA() {
    // シャープなレーザー風「キュイン、キュイン」
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [0, 0.22].forEach((offset) => {
      const t0 = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, t0);
      osc.frequency.exponentialRampToValueAtTime(1900, t0 + 0.15);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    });
  }

  function playKyuinB() {
    // シンセの「パワーアップ」二段ヒット
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [0, 0.2].forEach((offset, idx) => {
      const t0 = now + offset;
      [1, 1.005].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? "sine" : "square";
        osc.frequency.setValueAtTime((260 + idx * 140) * detune, t0);
        osc.frequency.exponentialRampToValueAtTime((900 + idx * 300) * detune, t0 + 0.16);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.3);
      });
    });
  }

  function playKyuinC() {
    // 王道RPG風の輝かしいアルペジオ
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [988, 1245, 1568, 1976].forEach((freq, i) => {
      const t0 = now + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.45);
    });
  }

  function playGako() {
    // 「ガコッ」— a single heavy mechanical latch/lever thunk, not musical
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const bufSize = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.2);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.6, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    noise.start(now);

    const thunk = ctx.createOscillator();
    const tg = ctx.createGain();
    thunk.type = "square";
    thunk.frequency.setValueAtTime(140, now);
    thunk.frequency.exponentialRampToValueAtTime(55, now + 0.09);
    tg.gain.setValueAtTime(0.7, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thunk.connect(tg);
    tg.connect(ctx.destination);
    thunk.start(now);
    thunk.stop(now + 0.16);

    // a second smaller clack shortly after, like a latch catching
    const t2 = now + 0.11;
    const clack = ctx.createOscillator();
    const cg = ctx.createGain();
    clack.type = "square";
    clack.frequency.value = 300;
    cg.gain.setValueAtTime(0.3, t2);
    cg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.05);
    clack.connect(cg);
    cg.connect(ctx.destination);
    clack.start(t2);
    clack.stop(t2 + 0.06);
  }

  function playMetalClank() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    // metallic clang: a few slightly detuned square tones with fast decay
    [520, 780, 1040].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq + i * 6;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    });

    // impact thunk under the clang
    const thunk = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    thunk.type = "sine";
    thunk.frequency.setValueAtTime(120, now);
    thunk.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    thunkGain.gain.setValueAtTime(0.5, now);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    thunk.connect(thunkGain);
    thunkGain.connect(ctx.destination);
    thunk.start(now);
    thunk.stop(now + 0.22);
  }

  async function playShutter() {
    shutter.classList.remove("show");
    void shutter.offsetWidth;
    shutter.classList.add("show");
    await sleep(900); // lines up with the slam+overshoot in the CSS animation
    playMetalClank();
    vibrate([50]);
    await sleep(1000);
    shutter.classList.remove("show");
  }

  async function playKiseru() {
    sakibareBadge.textContent = "激アツ予感…";
    sakibareBadge.classList.remove("show");
    void sakibareBadge.offsetWidth;
    sakibareBadge.classList.add("show");

    kiseruSmokeLayer.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const puff = document.createElement("div");
      puff.className = "kiseru-smoke";
      puff.style.setProperty("--sx", Math.round(-30 - Math.random() * 60) + "px");
      puff.style.animationDelay = i * 0.22 + Math.random() * 0.1 + "s";
      kiseruSmokeLayer.appendChild(puff);
    }

    kiseruEffect.classList.remove("show");
    void kiseruEffect.offsetWidth;
    kiseruEffect.classList.add("show");
    requestAnimationFrame(() => {
      kiseruSmokeLayer.querySelectorAll(".kiseru-smoke").forEach((el) => el.classList.add("show"));
    });
    await sleep(2300);
    kiseruEffect.classList.remove("show");
    sakibareBadge.classList.remove("show");
    kiseruSmokeLayer.innerHTML = "";
  }

  async function playCutin() {
    cutinCard.classList.remove("show");
    void cutinCard.offsetWidth;
    cutinCard.classList.add("show");
    await sleep(1400);
    cutinCard.classList.remove("show");
  }

  async function playMobPreview() {
    mobPreview.innerHTML = "";
    const iconCount = 45 + Math.floor(Math.random() * 20);
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    for (let i = 0; i < iconCount; i++) {
      const el = document.createElement("div");
      el.className = "mob-icon";
      el.textContent = faces[Math.floor(Math.random() * faces.length)];
      const scale = 0.55 + Math.random() * 0.9;
      el.style.left = Math.random() * 94 + "%";
      el.style.top = Math.random() * 92 + "%";
      el.style.fontSize = (2.3 * scale).toFixed(2) + "rem";
      el.style.width = el.style.height = Math.round(76 * scale) + "px";
      el.style.animationDelay = Math.random() * 0.5 + "s";
      mobPreview.appendChild(el);
    }
    sakibareBadge.textContent = "群予告！";
    sakibareBadge.classList.remove("show");
    void sakibareBadge.offsetWidth;
    requestAnimationFrame(() => {
      mobPreview.querySelectorAll(".mob-icon").forEach((el) => el.classList.add("show"));
      sakibareBadge.classList.add("show");
    });
    await sleep(1300);
    sakibareBadge.classList.remove("show");
    mobPreview.innerHTML = "";
  }

  async function playSakibare() {
    playSakibareSound();
    vibrate([30, 40, 30, 40, 80]);
    sakibareFlash.classList.remove("show");
    void sakibareFlash.offsetWidth;
    sakibareFlash.classList.add("show");

    const pool = ["shutter", "kiseru", "cutin", "mob"];
    const type = pool[Math.floor(Math.random() * pool.length)];

    if (type === "shutter") await playShutter();
    else if (type === "kiseru") await playKiseru();
    else if (type === "cutin") await playCutin();
    else await playMobPreview();

    sakibareFlash.classList.remove("show");
  }

  async function playKakuteiEffect() {
    blackout.classList.add("show");
    await sleep(280);
    alienPeek.classList.add("show");
    await sleep(700);
    blackout.classList.remove("show");
    await sleep(150);
    alienPeek.classList.remove("show");
    await sleep(200);
  }

  let toastTimer = null;
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // ---- ads & store (mock — no real payment/ad network wired up) ----
  const STORE_ITEMS = [
    { id: "noAds", price: "¥300", name: "広告を非表示にする", desc: "ゾロ目が揃うたびに出る広告を消します" },
    { id: "soundPack", price: "¥300", name: "プレミアムサウンド", desc: "ゾロ目が揃った時に鳴る「確定音」を6種類（和風・エレクトロ・キュインA/B/C・ガコッ）から選べるようになります" },
    { id: "effectPack", price: "¥300", name: "プレミアム演出", desc: "節目のステージで「激アツ演出」（金シャッター・キセル風・カットイン・群予告）が出るようになります" },
    { id: "secretMode", price: "¥300", name: "🔓 裏モード", desc: "サイコロの数と的中率を自由に設定して遊べる特殊モードが解放されます（記録には反映されません）" },
  ];

  function isOwned(id) {
    return id === "noAds" ? state.noAds : !!state.owned[id];
  }

  function renderStore() {
    storeItemsEl.innerHTML = "";
    STORE_ITEMS.forEach((item) => {
      const owned = isOwned(item.id);
      const row = document.createElement("div");
      row.className = "store-item";
      row.innerHTML = `
        <div>
          <div class="store-item-name">${item.name}</div>
          <div class="store-item-desc">${item.desc}</div>
        </div>
      `;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "store-buy-btn" + (owned ? " owned" : "");
      btn.textContent = owned ? "購入済み" : "購入 " + item.price;
      btn.disabled = owned;
      btn.addEventListener("click", () => purchase(item.id, item.name));
      row.appendChild(btn);
      storeItemsEl.appendChild(row);
    });
  }

  function purchase(id, name) {
    // NOTE: mock purchase only — wiring real payment requires Google Play
    // Billing / App Store StoreKit (or a web payment provider) on top of this.
    if (id === "noAds") state.noAds = true;
    else state.owned[id] = true;
    saveState();
    renderStore();
    renderSkinPanel();
    showToast(`「${name}」を購入しました（テスト）`);
  }

  shopBtn.addEventListener("click", () => {
    renderStore();
    storeOverlay.classList.add("show");
  });
  skinsStoreBtn.addEventListener("click", () => {
    renderStore();
    storeOverlay.classList.add("show");
  });
  storeCloseBtn.addEventListener("click", () => storeOverlay.classList.remove("show"));

  secretModeBtn.addEventListener("click", () => {
    if (!state.owned.secretMode) {
      showToast("裏モードはストアの購入で解放されます");
      renderStore();
      storeOverlay.classList.add("show");
      return;
    }
    secretDiceValue.textContent = secretDiceInput.value;
    secretRateValue.textContent = secretRateInput.value;
    secretModeOverlay.classList.add("show");
  });
  secretModeCloseBtn.addEventListener("click", () => secretModeOverlay.classList.remove("show"));
  secretModeOverlay.addEventListener("click", (e) => {
    if (e.target === secretModeOverlay) secretModeOverlay.classList.remove("show");
  });
  secretDiceInput.addEventListener("input", () => {
    secretDiceValue.textContent = secretDiceInput.value;
  });
  secretRateInput.addEventListener("input", () => {
    secretRateValue.textContent = secretRateInput.value;
  });
  secretModeStartBtn.addEventListener("click", () => {
    secretModeActive = true;
    secretWinRate = Number(secretRateInput.value) / 100;
    secretModeOverlay.classList.remove("show");
    enterPlayScreen(Number(secretDiceInput.value));
  });
  previewCloseBtn.addEventListener("click", () => previewOverlay.classList.remove("show"));
  previewOverlay.addEventListener("click", (e) => {
    if (e.target === previewOverlay) previewOverlay.classList.remove("show");
  });
  storeOverlay.addEventListener("click", (e) => {
    if (e.target === storeOverlay) storeOverlay.classList.remove("show");
  });

  // set while an ad overlay's promise is pending, so any button that
  // dismisses the overlay (not just adCloseBtn) can resolve it — otherwise
  // whoever is awaiting showAdOverlay() hangs forever
  let closeAdOverlay = null;

  function showAdOverlay() {
    return new Promise((resolve) => {
      let remaining = 5;
      adCountdownEl.textContent = remaining;
      adCloseBtn.disabled = true;
      adOverlay.classList.add("show");

      const interval = setInterval(() => {
        remaining -= 1;
        adCountdownEl.textContent = Math.max(remaining, 0);
        if (remaining <= 0) {
          clearInterval(interval);
          adCloseBtn.disabled = false;
        }
      }, 1000);

      function close() {
        clearInterval(interval);
        adOverlay.classList.remove("show");
        adCloseBtn.removeEventListener("click", close);
        closeAdOverlay = null;
        resolve();
      }
      adCloseBtn.addEventListener("click", close);
      closeAdOverlay = close;
    });
  }

  adRemoveBtn.addEventListener("click", () => {
    if (closeAdOverlay) closeAdOverlay();
    renderStore();
    storeOverlay.classList.add("show");
  });

  // ---- test panel (dev/QA only — lets you trigger any effect on demand) ----
  const HEAT_TIER_NAMES = ["青", "緑", "赤", "金"];

  function makeTestBtn(label, onClick, closeFirst) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "test-btn";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (closeFirst) testOverlay.classList.remove("show");
      onClick();
    });
    return btn;
  }

  function renderTestPanel() {
    testColorBtnsEl.innerHTML = "";
    HEAT_TIER_NAMES.forEach((name, i) => {
      testColorBtnsEl.appendChild(
        makeTestBtn(
          name,
          () => {
            applyHeatColor(i);
            sakibareBadge.textContent = name + "予告";
            sakibareBadge.classList.remove("show");
            void sakibareBadge.offsetWidth;
            sakibareBadge.classList.add("show");
            reachBadge.classList.remove("show");
            void reachBadge.offsetWidth;
            reachBadge.classList.add("show");
            setTimeout(() => {
              sakibareBadge.classList.remove("show");
              reachBadge.classList.remove("show");
            }, 1200);
          },
          true
        )
      );
    });

    testEffectBtnsEl.innerHTML = "";
    [
      ["金シャッター", playShutter],
      ["キセル風", playKiseru],
      ["カットイン", playCutin],
      ["群予告", playMobPreview],
    ].forEach(([label, fn]) => {
      testEffectBtnsEl.appendChild(makeTestBtn(label, () => fn(), true));
    });

    testMiscBtnsEl.innerHTML = "";
    [
      ["確定演出(暗転+ｴｲﾘｱﾝ)", () => playKakuteiEffect(), true],
      ["ゾロ目ポップアップ", () => showZoromePopup(), true],
      ["達成カード(タイム/回数)", () => showClearCelebration(4230, 7), true],
      ["キラキラ", () => spawnSparkles(30), true],
      ["紙吹雪", () => spawnConfetti(40), true],
      ["広告", () => showAdOverlay(), true],
      ["振動", () => vibrate([40, 60, 40]), false],
    ].forEach(([label, fn, closeFirst]) => {
      testMiscBtnsEl.appendChild(makeTestBtn(label, () => fn(), closeFirst));
    });

    testSoundBtnsEl.innerHTML = "";
    [
      ["確定音:ノーマル", () => playKakuteiChime(1)],
      ["確定音:和風", () => playKakuteiChime(2)],
      ["確定音:エレクトロ", () => playKakuteiChime(3)],
      ["確定音:キュインA(レーザー)", () => playKyuinA()],
      ["確定音:キュインB(パワーアップ)", () => playKyuinB()],
      ["確定音:キュインC(RPG風)", () => playKyuinC()],
      ["確定音:ガコッ(機械式)", () => playGako()],
      ["転がる音", () => playDiceRollSound(650)],
      ["リーチ音", () => playReachTick(3)],
      ["リーチサイレン", () => playReachSiren(1800)],
      ["先バレ音:現行", () => playSakibareSound()],
      ["先バレ候補:ドキュンB(パンチ)", () => playDokyunB()],
      ["先バレ候補:ドキュンC(爆発)", () => playDokyunC()],
      ["シャッター金属音", () => playMetalClank()],
    ].forEach(([label, fn]) => {
      testSoundBtnsEl.appendChild(makeTestBtn(label, () => fn()));
    });
  }

  testBtn.addEventListener("click", () => {
    renderTestPanel();
    testOverlay.classList.add("show");
  });
  testCloseBtn.addEventListener("click", () => testOverlay.classList.remove("show"));
  testOverlay.addEventListener("click", (e) => {
    if (e.target === testOverlay) testOverlay.classList.remove("show");
  });

  // ---- shake-to-roll ----
  const SHAKE_THRESHOLD = 28;
  const SHAKE_COOLDOWN_MS = 800;
  let lastAccel = null;
  let lastShakeTime = 0;
  let motionAttached = false;

  function handleMotion(event) {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null) return;
    if (!lastAccel) {
      lastAccel = { x: acc.x, y: acc.y, z: acc.z };
      return;
    }
    const delta =
      Math.abs(acc.x - lastAccel.x) +
      Math.abs(acc.y - lastAccel.y) +
      Math.abs(acc.z - lastAccel.z);
    lastAccel = { x: acc.x, y: acc.y, z: acc.z };

    const now = Date.now();
    if (delta > SHAKE_THRESHOLD && now - lastShakeTime > SHAKE_COOLDOWN_MS) {
      lastShakeTime = now;
      if (!rolling && !playScreen.hidden) roll();
    }
  }

  function attachMotionListener() {
    if (motionAttached) return;
    window.addEventListener("devicemotion", handleMotion);
    motionAttached = true;
  }

  function detachMotionListener() {
    if (!motionAttached) return;
    window.removeEventListener("devicemotion", handleMotion);
    motionAttached = false;
    lastAccel = null;
  }

  function updateShakeToggleUI() {
    shakeToggle.setAttribute("aria-pressed", state.shakeEnabled ? "true" : "false");
  }

  function enableShake() {
    const DME = window.DeviceMotionEvent;
    if (!DME) {
      showToast("この端末は振る操作に対応していません");
      state.shakeEnabled = false;
      updateShakeToggleUI();
      saveState();
      return;
    }
    if (typeof DME.requestPermission === "function") {
      DME.requestPermission()
        .then((result) => {
          if (result === "granted") {
            state.shakeEnabled = true;
            attachMotionListener();
          } else {
            state.shakeEnabled = false;
            showToast("振る操作には端末の許可が必要です");
          }
          updateShakeToggleUI();
          saveState();
        })
        .catch(() => {
          state.shakeEnabled = false;
          updateShakeToggleUI();
          saveState();
        });
    } else {
      state.shakeEnabled = true;
      attachMotionListener();
      updateShakeToggleUI();
      saveState();
    }
  }

  shakeToggle.addEventListener("click", () => {
    if (state.shakeEnabled) {
      state.shakeEnabled = false;
      detachMotionListener();
      updateShakeToggleUI();
      saveState();
    } else {
      enableShake();
    }
  });

  let playMsSinceSave = 0;
  function updateTimers() {
    if (!playScreen.hidden) {
      // freeze the on-screen timer once a round is won — otherwise it just
      // keeps counting up behind the celebration card, which reads as
      // "the timer never stops" even though the run itself is over
      if (!postWinPending) {
        stageTimeEl.textContent = formatTime(Date.now() - stageStartTime);
      }
      state.totalPlayMs += 100;
      playMsSinceSave += 100;
      if (playMsSinceSave >= 5000) {
        playMsSinceSave = 0;
        saveState();
      }
    }
  }

  function startTimerLoop() {
    if (timerHandle) return;
    timerHandle = setInterval(updateTimers, 100);
  }

  const MILESTONES = [5, 10, 15];

  function isBigChance(count, matched) {
    if (!matched) return false;
    if (count >= MAX_DICE) return true;
    return MILESTONES.includes(count + 1);
  }

  let skipRequested = false;

  // pressing 振る again mid-roll fast-forwards straight to the result
  // instead of waiting through the rest of the animation
  function sleep(ms) {
    if (skipRequested) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function roll() {
    if (rolling) return;
    rolling = true;
    skipRequested = false;
    // intentionally leave rollBtn enabled during the roll — pressing it
    // again is how the player skips straight to the result

    stageRollCount += 1;
    rollCountEl.textContent = String(stageRollCount);
    state.totalRolls += 1;

    const playCount = selectedStage;
    const isFrontier = !secretModeActive && playCount === state.count;
    const dice = Array.from(board.children);

    let finalValues, matched;
    if (secretModeActive) {
      // 裏モード: the outcome is decided by the user's own dial-in rate,
      // not the real dice odds — dice values are just for show
      matched = Math.random() < secretWinRate;
      const shared = randomFace();
      finalValues = playValues.map(() => (matched ? shared : randomFace()));
      if (!matched && finalValues.every((v) => v === finalValues[0])) {
        finalValues[finalValues.length - 1] = (finalValues[0] % 6) + 1;
      }
    } else {
      finalValues = playValues.map(() => randomFace());
      matched = allMatch(finalValues);
    }
    const bigChance = isFrontier && isBigChance(playCount, matched);
    const showBigChance = bigChance && state.owned.effectPack; // 激熱演出はプレミアム限定
    // the alien "kakutei" peek is rare and — like a real premonition cue —
    // flashes just before the last die locks in, not after the win is shown
    const willPeekAlien = matched && (bigChance || Math.random() < 0.12);
    applyHeatColor(pickHeatTierIndex(matched));

    if (showBigChance) await playSakibare();

    setMessage(showBigChance ? "予感がする…！" : "振っています…");
    const layout = layoutArena(playCount);
    playDiceRollSound(950);
    await tossDiceIn(dice, layout, 950);

    let matchingSoFar = true;
    for (let i = 0; i < dice.length; i++) {
      setDieValue(dice[i], finalValues[i]);
      if (i > 0) matchingSoFar = matchingSoFar && finalValues[i] === finalValues[0];

      const remaining = dice.slice(i + 1);

      // "reach" only means something with exactly one die left to reveal —
      // everything else already matches, and this last one decides it all
      if (matchingSoFar && remaining.length === 1) {
        remaining.forEach((d) => d.classList.add("reach"));
        tray.classList.add("reach");
        reachBadge.classList.add("show");
        setMessage("リーチ！！", "win");
        playDiceRollSound(1800);
        playReachSiren(1800);
        // drag out the suspense on the very last die with a few ticks
        // instead of resolving it right away
        for (let t = 0; t < 4; t++) {
          if (skipRequested) break;
          playReachTick(i + t);
          await sleep(450);
        }
        if (willPeekAlien && !skipRequested) await playKakuteiEffect();
      } else {
        await sleep(180);
      }
    }

    dice.forEach((d) => d.classList.remove("reach"));
    tray.classList.remove("reach");
    reachBadge.classList.remove("show");

    playValues = finalValues;
    if (isFrontier) state.values = finalValues;

    if (matched) {
      dice.forEach((d) => d.classList.add("matched"));
      vibrate([40, 60, 40]);
      playKakuteiChime();
      showZoromePopup();

      const elapsed = Date.now() - stageStartTime;
      if (!secretModeActive) {
        const prevBest = state.stageBestMs[playCount];
        if (!prevBest || elapsed < prevBest) {
          state.stageBestMs[playCount] = elapsed;
        }
      }

      showClearCelebration(elapsed, stageRollCount);

      if (isFrontier) {
        if (playCount >= MAX_DICE) {
          setMessage(`🎉 ${MAX_DICE}個すべてゾロ目！完全クリア！`, "clear");
        } else {
          state.count += 1;
          state.values = Array(state.count).fill(null);
          if (state.count > state.best) state.best = state.count;
          setMessage("ゾロ目！次のステージが解放された！", "win");
        }
      } else if (secretModeActive) {
        setMessage("ゾロ目！（裏モード）", "win");
      } else {
        setMessage("ゾロ目！クリア済みステージを再クリア！", "win");
      }
      spawnConfetti(isFrontier && playCount >= MAX_DICE ? 80 : 40);
      spawnSparkles(isFrontier && playCount >= MAX_DICE ? 40 : 20);
      stageStartTime = Date.now();
    } else {
      setMessage("惜しい！もう一度「振る」を押してね");
    }

    saveState();
    stageBestTimeEl.textContent = state.stageBestMs[playCount]
      ? "(自己ベスト " + formatTime(state.stageBestMs[playCount]) + ")"
      : "";

    if (matched) {
      setTimeout(() => {
        Array.from(board.children).forEach((d) => d.classList.remove("matched"));
      }, 900);
    }

    rolling = false;
    rollBtn.disabled = false;

    if (matched) {
      postWinPending = true;
      rollBtn.querySelector(".roll-btn-label").textContent = "ホームに戻る";
    }
  }

  let postWinPending = false;

  async function leavePlayAfterWin() {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;
    // keep postWinPending true (and the stage timer frozen) until we're
    // actually done — playScreen stays visible through the whole ad wait,
    // so clearing it early made updateTimers() start ticking again behind
    // the ad overlay
    hideClearCelebration();
    if (!state.noAds) {
      await sleep(200);
      await showAdOverlay();
    }
    postWinPending = false;
    rolling = false;
    rollBtn.disabled = false;
    backToSelect();
  }

  rollBtn.addEventListener("click", () => {
    if (rolling) {
      skipRequested = true;
      return;
    }
    if (postWinPending) leavePlayAfterWin();
    else roll();
  });
  backBtn.addEventListener("click", () => {
    if (rolling) return;
    if (postWinPending) leavePlayAfterWin();
    else backToSelect();
  });
  backBtn2.addEventListener("click", () => {
    if (rolling) return;
    if (postWinPending) leavePlayAfterWin();
    else backToSelect();
  });

  startBtn.addEventListener("click", () => {
    getAudioCtx(); // warm up audio on this first real user gesture
    openingScreen.hidden = true;
    topbarEl.hidden = false;
    selectScreen.hidden = false;
  });

  function renderBrainJuice() {
    brainJuiceLayer.innerHTML = "";
    const cols = 13;
    const rows = 10;
    const cellW = 300 / cols;
    const cellH = 220 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const el = document.createElement("span");
        el.className = "juice-char";
        el.textContent = "汁";
        const x = c * cellW + cellW / 2 + (Math.random() * cellW * 0.6 - cellW * 0.3);
        const y = r * cellH + cellH / 2 + (Math.random() * cellH * 0.6 - cellH * 0.3);
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.fontSize = 12 + Math.random() * 10 + "px";
        el.style.color = "hsl(" + Math.round(Math.random() * 360) + ", 90%, 62%)";
        el.style.transform = `translate(-50%, -50%) rotate(${Math.round(Math.random() * 50 - 25)}deg)`;
        brainJuiceLayer.appendChild(el);
      }
    }
  }
  renderBrainJuice();

  renderSelect();
  startTimerLoop();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
