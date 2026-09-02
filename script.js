(() => {
  "use strict";

  const MAX_DICE = 15;
  const START_DICE = 2;
  const STORAGE_KEY = "zorome-dice-state-v3";

  // dice skins: 1=default(free) 2=souzu@5 3=manzu@10 4=pinzu@15, rest are store-exclusive (diceSkinPack)
  const DICE_CLASS = [
    "", "dice-souzu", "dice-manzu", "dice-pinzu", "dice-dragonball",
    "dice-hanafuda", "dice-maneki", "dice-matsuri", "dice-retro",
  ];
  const DICE_SKIN_NAMES = [
    "ノーマル", "索子(そうず)", "萬子(まんず)", "筒子(ぴんず)", "ドラゴンボール風",
    "花札風", "招き猫・和柄", "夏祭り・花火", "レトロ8bit",
  ];
  // 0 = free, a number = unlocked at that stage, null = store-exclusive only
  const DICE_STAGE_REQ = [0, 5, 10, 15, null, null, null, null, null];

  // tray skins: 1=default 2=ocean@5 3=sunset@10 4=galaxy@15, rest are store-exclusive (traySkinPack)
  const TRAY_CLASS = [
    "", "tray-ocean", "tray-sunset", "tray-galaxy",
    "tray-hanafuda", "tray-maneki", "tray-matsuri", "tray-retro",
  ];
  const TRAY_SKIN_NAMES = [
    "ノーマル", "オーシャン", "サンセット", "ギャラクシー",
    "花札風", "招き猫・和柄", "夏祭り・花火", "レトロ8bit",
  ];
  const TRAY_STAGE_REQ = [0, 5, 10, 15, null, null, null, null];

  // sound skins: 1=default(free) 2=和風 3=エレクトロ (both 2,3 unlocked together via soundPack purchase)
  const SOUND_SKIN_NAMES = ["ノーマル", "和風", "エレクトロ"];
  const SOUND_SKIN_ICONS = ["🔈", "🎐", "⚡"];

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
  const totalTimeEl = document.getElementById("totalTime");
  const reachBadge = document.getElementById("reachBadge");

  const confettiLayer = document.getElementById("confetti");
  const zoromePopup = document.getElementById("zoromePopup");
  const sakibareFlash = document.getElementById("sakibareFlash");
  const sakibareBadge = document.getElementById("sakibareBadge");
  const shutter = document.getElementById("shutter");
  const kiseruEffect = document.getElementById("kiseruEffect");
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
    { solid: "#4d9fff", glow: "rgba(77, 159, 255, 0.6)", weight: 40, reliability: 0.15 }, // 青
    { solid: "#ffd166", glow: "rgba(255, 209, 102, 0.6)", weight: 25, reliability: 0.30 }, // 黄
    { solid: "#4fd680", glow: "rgba(79, 214, 128, 0.6)", weight: 15, reliability: 0.45 }, // 緑
    { solid: "#a685ff", glow: "rgba(166, 133, 255, 0.6)", weight: 10, reliability: 0.65 }, // 紫
    { solid: "#ff5d5d", glow: "rgba(255, 93, 93, 0.6)", weight: 7, reliability: 0.85 }, // 赤
    { solid: "#ffd700", glow: "rgba(255, 215, 0, 0.7)", weight: 3, reliability: 0.97 }, // 金
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
      owned: { diceSkinPack: false, traySkinPack: false, soundPack: false, effectPack: false },
      totalStartTime: Date.now(),
      totalElapsedMs: 0,
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
  let timerHandle = null;
  let selectedStage = null;
  let playValues = [];

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
  function buildDie(value, locked) {
    const scene = document.createElement("div");
    scene.className = "die" + (locked ? " locked" : "");
    if (locked) return scene;

    // scatter each die slightly so they don't look laser-aligned, like real
    // dice settling unevenly in a bowl
    scene.style.setProperty("--rest-x", (Math.random() * 12 - 6).toFixed(1) + "px");
    scene.style.setProperty("--rest-y", (Math.random() * 12 - 6).toFixed(1) + "px");
    scene.style.setProperty("--rest-rot", (Math.random() * 26 - 13).toFixed(1) + "deg");

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

  let dieSizeRaf = null;
  function updateDieSize() {
    if (dieSizeRaf) cancelAnimationFrame(dieSizeRaf);
    dieSizeRaf = requestAnimationFrame(() => {
      const sample = board.querySelector(".die:not(.locked)");
      if (!sample) return;
      const w = sample.getBoundingClientRect().width;
      if (w > 0) document.documentElement.style.setProperty("--die-half", w / 2 + "px");
    });
  }
  window.addEventListener("resize", updateDieSize);

  // ---- skin unlock levels ----
  function isDiceSkinUnlocked(id) {
    if (state.owned.diceSkinPack) return true;
    const req = DICE_STAGE_REQ[id - 1];
    return req !== null && state.best >= req;
  }

  function isTraySkinUnlocked(id) {
    if (state.owned.traySkinPack) return true;
    const req = TRAY_STAGE_REQ[id - 1];
    return req !== null && state.best >= req;
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
        makeSwatch("dice", i, isDiceSkinUnlocked(i), state.diceSkin === i, DICE_STAGE_REQ[i - 1], DICE_SKIN_NAMES[i - 1])
      );
    }
    for (let i = 1; i <= TRAY_CLASS.length; i++) {
      traySwatchesEl.appendChild(
        makeSwatch("tray", i, isTraySkinUnlocked(i), state.traySkin === i, TRAY_STAGE_REQ[i - 1], TRAY_SKIN_NAMES[i - 1])
      );
    }
    for (let i = 1; i <= SOUND_SKIN_NAMES.length; i++) {
      soundSwatchesEl.appendChild(
        makeSwatch("sound", i, isSoundUnlocked(i), state.soundSkin === i, isSoundUnlocked(i) ? null : "store", SOUND_SKIN_NAMES[i - 1], SOUND_SKIN_ICONS[i - 1])
      );
    }
  }

  function makeSwatch(kind, skinId, unlocked, selected, stageReq, name, icon) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "swatch" + (unlocked ? "" : " locked") + (selected ? " selected" : "");
    el.dataset.kind = kind;
    el.dataset.skin = skinId;
    el.title = name || "";
    if (icon && unlocked) el.textContent = icon;
    if (!unlocked) {
      el.innerHTML = '<span class="swatch-lock">🔒</span>';
      el.addEventListener("click", () => {
        showToast(stageReq === "store" || !stageReq ? "ストアの購入で解放されます" : `ステージ${stageReq}到達で解放されます`);
      });
    } else {
      el.addEventListener("click", () => {
        if (kind === "dice") state.diceSkin = skinId;
        else if (kind === "tray") state.traySkin = skinId;
        else state.soundSkin = skinId;
        saveState();
        renderSkinPanel();
        if (!playScreen.hidden) renderPlay();
      });
    }
    return el;
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
    playValues = n === state.count ? state.values.slice() : Array(n).fill(null);
    playStageNumEl.textContent = n;
    selectScreen.hidden = true;
    playScreen.hidden = false;
    stageStartTime = Date.now();
    postWinPending = false;
    rollBtn.querySelector(".roll-btn-label").textContent = "振る";
    renderPlay();
    setMessage("サイコロを振って、ゾロ目を出そう！");
    updateDieSize();
  }

  function backToSelect() {
    playScreen.hidden = true;
    selectScreen.hidden = false;
    renderSelect();
  }

  function renderPlay() {
    tray.className = "tray " + trayThemeClass();
    board.innerHTML = "";
    for (let i = 0; i < selectedStage; i++) {
      board.appendChild(buildDie(playValues[i], false));
    }
    probValueEl.textContent = formatProbability(selectedStage);
    const best = state.stageBestMs[selectedStage];
    stageBestTimeEl.textContent = best ? "(自己ベスト " + formatTime(best) + ")" : "";
  }

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

  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function playDiceRollSound(durationMs) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const duration = durationMs / 1000;
    const now = ctx.currentTime;

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
    bandpass.frequency.setValueAtTime(1200, now);
    bandpass.frequency.linearRampToValueAtTime(500, now + duration);
    bandpass.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.05, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const tockCount = Math.max(2, Math.floor(duration * 6));
    for (let i = 0; i < tockCount; i++) {
      const t = now + Math.random() * duration;
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 200 + Math.random() * 250;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.22, t + 0.005);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(og);
      og.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
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
        gain.connect(ctx.destination);
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
        shimmerGain.connect(ctx.destination);
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

    // ノーマル: bright ascending fanfare
    const notes = [880, 1108.7, 1318.5, 1760];
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

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
    osc.start(now);
    osc.stop(now + 0.2);
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
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
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
    pingGain.gain.linearRampToValueAtTime(0.3, t2 + 0.02);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.3);
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.start(t2);
    ping.stop(t2 + 0.35);
  }

  async function playShutter() {
    shutter.classList.remove("show");
    void shutter.offsetWidth;
    shutter.classList.add("show");
    await sleep(950);
    shutter.classList.remove("show");
  }

  async function playKiseru() {
    sakibareBadge.textContent = "激アツ予感…";
    sakibareBadge.classList.remove("show");
    void sakibareBadge.offsetWidth;
    sakibareBadge.classList.add("show");
    kiseruEffect.classList.remove("show");
    void kiseruEffect.offsetWidth;
    kiseruEffect.classList.add("show");
    await sleep(1050);
    kiseruEffect.classList.remove("show");
    sakibareBadge.classList.remove("show");
  }

  async function playCutin() {
    cutinCard.classList.remove("show");
    void cutinCard.offsetWidth;
    cutinCard.classList.add("show");
    await sleep(1000);
    cutinCard.classList.remove("show");
  }

  async function playMobPreview() {
    mobPreview.innerHTML = "";
    const iconCount = 6 + Math.floor(Math.random() * 3);
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    for (let i = 0; i < iconCount; i++) {
      const el = document.createElement("div");
      el.className = "mob-icon";
      el.textContent = faces[Math.floor(Math.random() * faces.length)];
      el.style.left = 5 + Math.random() * 80 + "%";
      el.style.top = 5 + Math.random() * 70 + "%";
      el.style.animationDelay = Math.random() * 0.25 + "s";
      mobPreview.appendChild(el);
    }
    sakibareBadge.textContent = "群予告！";
    sakibareBadge.classList.remove("show");
    void sakibareBadge.offsetWidth;
    requestAnimationFrame(() => {
      mobPreview.querySelectorAll(".mob-icon").forEach((el) => el.classList.add("show"));
      sakibareBadge.classList.add("show");
    });
    await sleep(950);
    sakibareBadge.classList.remove("show");
    mobPreview.innerHTML = "";
  }

  async function playGoldRain() {
    sakibareBadge.textContent = "プレミアム演出！";
    sakibareBadge.classList.remove("show");
    void sakibareBadge.offsetWidth;
    sakibareBadge.classList.add("show");
    const coins = ["💰", "✨", "🌟"];
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.background = "none";
      piece.style.fontSize = "18px";
      piece.style.left = Math.random() * 100 + "vw";
      piece.textContent = coins[Math.floor(Math.random() * coins.length)];
      const duration = 1 + Math.random() * 0.8;
      piece.style.animationDuration = duration + "s";
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.5) * 1000);
    }
    await sleep(950);
    sakibareBadge.classList.remove("show");
  }

  async function playSakibare() {
    playSakibareSound();
    vibrate([30, 40, 30, 40, 80]);
    sakibareFlash.classList.remove("show");
    void sakibareFlash.offsetWidth;
    sakibareFlash.classList.add("show");

    const pool = ["shutter", "kiseru", "cutin", "mob", "goldRain"];
    const type = pool[Math.floor(Math.random() * pool.length)];

    if (type === "shutter") await playShutter();
    else if (type === "kiseru") await playKiseru();
    else if (type === "cutin") await playCutin();
    else if (type === "goldRain") await playGoldRain();
    else await playMobPreview();

    sakibareFlash.classList.remove("show");
  }

  async function playKakuteiEffect() {
    blackout.classList.add("show");
    await sleep(200);
    alienPeek.classList.add("show");
    await sleep(480);
    blackout.classList.remove("show");
    await sleep(120);
    alienPeek.classList.remove("show");
    await sleep(150);
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
    { id: "diceSkinPack", price: "¥300", name: "サイコロ 全種解放", desc: "ステージ到達を待たずに全デザイン（ドラゴンボール風含む）を使えます" },
    { id: "traySkinPack", price: "¥300", name: "お皿 全種解放", desc: "ステージ到達を待たずに全デザインを使えます" },
    { id: "soundPack", price: "¥300", name: "プレミアムサウンド", desc: "「和風」「エレクトロ」の確定音を選べるようになります" },
    { id: "effectPack", price: "¥300", name: "プレミアム演出", desc: "節目のステージで「激アツ演出」（金シャッター・キセル風・カットイン・群予告・金の雨）が出るようになります" },
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
  storeCloseBtn.addEventListener("click", () => storeOverlay.classList.remove("show"));
  storeOverlay.addEventListener("click", (e) => {
    if (e.target === storeOverlay) storeOverlay.classList.remove("show");
  });

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
        resolve();
      }
      adCloseBtn.addEventListener("click", close);
    });
  }

  adRemoveBtn.addEventListener("click", () => {
    adOverlay.classList.remove("show");
    renderStore();
    storeOverlay.classList.add("show");
  });

  // ---- test panel (dev/QA only — lets you trigger any effect on demand) ----
  const HEAT_TIER_NAMES = ["青", "黄", "緑", "紫", "赤", "金"];

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
      ["金の雨", playGoldRain],
    ].forEach(([label, fn]) => {
      testEffectBtnsEl.appendChild(makeTestBtn(label, () => fn(), true));
    });

    testMiscBtnsEl.innerHTML = "";
    [
      ["確定演出(暗転+ｴｲﾘｱﾝ)", () => playKakuteiEffect(), true],
      ["ゾロ目ポップアップ", () => showZoromePopup(), true],
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
      ["転がる音", () => playDiceRollSound(650)],
      ["リーチ音", () => playReachTick(3)],
      ["先バレ音", () => playSakibareSound()],
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

  function updateTimers() {
    stageTimeEl.textContent = formatTime(Date.now() - stageStartTime);
    totalTimeEl.textContent = formatTime(state.totalElapsedMs + (Date.now() - state.totalStartTime));
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function roll() {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;

    const playCount = selectedStage;
    const isFrontier = playCount === state.count;
    const dice = Array.from(board.children);

    const finalValues = playValues.map(() => randomFace());
    const matched = allMatch(finalValues);
    const bigChance = isFrontier && isBigChance(playCount, matched);
    const showBigChance = bigChance && state.owned.effectPack; // 激熱演出はプレミアム限定
    applyHeatColor(pickHeatTierIndex(matched));

    if (showBigChance) await playSakibare();

    dice.forEach((d) => {
      d.style.setProperty("--toss-x", Math.round(Math.random() * 16 - 8) + "px");
      d.classList.add("rolling");
    });
    setMessage(showBigChance ? "予感がする…！" : "振っています…");
    playDiceRollSound(650);
    await sleep(650);
    dice.forEach((d) => d.classList.remove("rolling"));

    let matchingSoFar = true;
    for (let i = 0; i < dice.length; i++) {
      setDieValue(dice[i], finalValues[i]);
      if (i > 0) matchingSoFar = matchingSoFar && finalValues[i] === finalValues[0];

      const remaining = dice.slice(i + 1);
      const isLast = i === dice.length - 1;

      // only build "reach" suspense once at least two dice have already
      // matched each other — a single revealed die is not a reach yet
      if (i > 0 && matchingSoFar && !isLast && remaining.length > 0) {
        remaining.forEach((d) => {
          d.style.setProperty("--toss-x", Math.round(Math.random() * 16 - 8) + "px");
          d.classList.add("reach");
        });
        tray.classList.add("reach");
        reachBadge.classList.add("show");
        setMessage("リーチ！！", "win");
        playReachTick(i);
        playDiceRollSound(400);
        await sleep(650);
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
      // the blackout+alien "kakutei" confirm is always shown for a big-chance
      // win, but only sometimes for an ordinary match so it stays special
      if (bigChance || Math.random() < 0.35) {
        await playKakuteiEffect();
      }
      dice.forEach((d) => d.classList.add("matched"));
      vibrate([40, 60, 40]);
      playKakuteiChime();
      showZoromePopup();

      const elapsed = Date.now() - stageStartTime;
      const prevBest = state.stageBestMs[playCount];
      if (!prevBest || elapsed < prevBest) {
        state.stageBestMs[playCount] = elapsed;
      }

      if (isFrontier) {
        if (playCount >= MAX_DICE) {
          setMessage(`🎉 ${MAX_DICE}個すべてゾロ目！完全クリア！（${formatTime(elapsed)}）`, "clear");
        } else {
          state.count += 1;
          state.values = Array(state.count).fill(null);
          if (state.count > state.best) state.best = state.count;
          setMessage(`ゾロ目！次のステージが解放された！（${formatTime(elapsed)}）`, "win");
        }
      } else {
        setMessage(`ゾロ目！クリア済みステージを再クリア！（${formatTime(elapsed)}）`, "win");
      }
      spawnConfetti(isFrontier && playCount >= MAX_DICE ? 80 : 40);
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
    postWinPending = false;
    if (!state.noAds) {
      await sleep(200);
      await showAdOverlay();
    }
    rolling = false;
    rollBtn.disabled = false;
    backToSelect();
  }

  rollBtn.addEventListener("click", () => {
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

  window.addEventListener("beforeunload", () => {
    state.totalElapsedMs += Date.now() - state.totalStartTime;
    state.totalStartTime = Date.now();
    saveState();
  });

  renderSelect();
  startTimerLoop();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
