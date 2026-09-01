(() => {
  "use strict";

  const MAX_DICE = 15;
  const START_DICE = 2;
  const STORAGE_KEY = "zorome-dice-state-v2";
  const SKIN_STAGES = [1, 5, 10, 15]; // skin id N unlocks at SKIN_STAGES[N-1]
  const TRAY_CLASS = ["", "tray-ocean", "tray-sunset", "tray-galaxy"];
  const DICE_CLASS = ["", "dice-neon", "dice-gold", "dice-rainbow"];

  const PIP_PATTERNS = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  const board = document.getElementById("board");
  const tray = document.getElementById("tray");
  const rollBtn = document.getElementById("rollBtn");
  const resetBtn = document.getElementById("resetBtn");
  const message = document.getElementById("message");
  const diceCountEl = document.getElementById("diceCount");
  const maxCountEl = document.getElementById("maxCount");
  const bestCountEl = document.getElementById("bestCount");
  const progressFill = document.getElementById("progressFill");
  const confettiLayer = document.getElementById("confetti");
  const probValueEl = document.getElementById("probValue");
  const stageTimeEl = document.getElementById("stageTime");
  const stageBestTimeEl = document.getElementById("stageBestTime");
  const totalTimeEl = document.getElementById("totalTime");
  const diceSwatchesEl = document.getElementById("diceSwatches");
  const traySwatchesEl = document.getElementById("traySwatches");
  const zoromePopup = document.getElementById("zoromePopup");
  const shakeToggle = document.getElementById("shakeToggle");
  const reachBadge = document.getElementById("reachBadge");
  const sakibareFlash = document.getElementById("sakibareFlash");
  const sakibareBadge = document.getElementById("sakibareBadge");
  const shutter = document.getElementById("shutter");
  const kiseruEffect = document.getElementById("kiseruEffect");
  const cutinCard = document.getElementById("cutinCard");
  const mobPreview = document.getElementById("mobPreview");
  const blackout = document.getElementById("blackout");
  const alienPeek = document.getElementById("alienPeek");
  const shopBtn = document.getElementById("shopBtn");
  const adOverlay = document.getElementById("adOverlay");
  const adCountdownEl = document.getElementById("adCountdown");
  const adCloseBtn = document.getElementById("adCloseBtn");
  const adRemoveBtn = document.getElementById("adRemoveBtn");
  const storeOverlay = document.getElementById("storeOverlay");
  const storeCloseBtn = document.getElementById("storeCloseBtn");
  const storeItemsEl = document.getElementById("storeItems");
  const toastEl = document.getElementById("toast");

  const HEAT_TIERS = [
    { solid: "#4d9fff", glow: "rgba(77, 159, 255, 0.6)" }, // 青
    { solid: "#ffd166", glow: "rgba(255, 209, 102, 0.6)" }, // 黄
    { solid: "#4fd680", glow: "rgba(79, 214, 128, 0.6)" }, // 緑
    { solid: "#a685ff", glow: "rgba(166, 133, 255, 0.6)" }, // 紫
    { solid: "#ff5d5d", glow: "rgba(255, 93, 93, 0.6)" }, // 赤
    { solid: "#ffd700", glow: "rgba(255, 215, 0, 0.7)" }, // 金
  ];

  function heatTier(count) {
    if (count >= 14) return 6;
    if (count >= 11) return 5;
    if (count >= 9) return 4;
    if (count >= 7) return 3;
    if (count >= 5) return 2;
    return 1;
  }

  function applyHeatColor(count) {
    const tier = HEAT_TIERS[heatTier(count) - 1];
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
      shakeEnabled: false,
      noAds: false,
      owned: { dicePack: false, soundPack: false, effectPack: false },
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

  function randomFace() {
    return 1 + Math.floor(Math.random() * 6);
  }

  function buildDie(value, locked) {
    const die = document.createElement("div");
    die.className = "die" + (locked ? " locked" : " " + diceThemeClass());
    if (locked) return die;
    for (let i = 1; i <= 9; i++) {
      const pip = document.createElement("div");
      pip.className = "pip p" + i;
      die.appendChild(pip);
    }
    if (value) setDieFace(die, value);
    return die;
  }

  function diceThemeClass() {
    return DICE_CLASS[state.diceSkin - 1] || "";
  }

  function trayThemeClass() {
    return TRAY_CLASS[state.traySkin - 1] || "";
  }

  function setDieFace(die, value) {
    const pattern = PIP_PATTERNS[value] || [];
    const pips = die.querySelectorAll(".pip");
    pips.forEach((pip, idx) => {
      const pos = idx + 1;
      pip.classList.toggle("on", pattern.includes(pos));
    });
  }

  function unlockedSkinLevel() {
    if (state.owned.dicePack) return SKIN_STAGES.length;
    let level = 1;
    for (let i = 1; i < SKIN_STAGES.length; i++) {
      if (state.best >= SKIN_STAGES[i]) level = i + 1;
    }
    return level;
  }

  function formatProbability(count) {
    const denom = Math.pow(6, count - 1);
    const percent = 100 / denom;
    if (percent >= 0.01) {
      return percent.toFixed(percent >= 1 ? 2 : 4) + "%";
    }
    return "1 / " + denom.toLocaleString("ja-JP");
  }

  function formatTime(ms) {
    const s = ms / 1000;
    return s.toFixed(1) + "s";
  }

  function render() {
    tray.className = "tray " + trayThemeClass();

    board.innerHTML = "";
    for (let i = 0; i < MAX_DICE; i++) {
      const isUnlocked = i < state.count;
      const value = isUnlocked ? state.values[i] : null;
      const die = buildDie(value, !isUnlocked);
      board.appendChild(die);
    }
    diceCountEl.textContent = state.count;
    bestCountEl.textContent = state.best;
    progressFill.style.width = (state.count / MAX_DICE) * 100 + "%";
    probValueEl.textContent = formatProbability(state.count);

    const best = state.stageBestMs[state.count];
    stageBestTimeEl.textContent = best ? "(自己ベスト " + formatTime(best) + ")" : "";

    renderSkinPanel();
  }

  function renderSkinPanel() {
    const level = unlockedSkinLevel();
    diceSwatchesEl.innerHTML = "";
    traySwatchesEl.innerHTML = "";
    for (let i = 1; i <= SKIN_STAGES.length; i++) {
      const unlocked = i <= level;
      diceSwatchesEl.appendChild(makeSwatch("dice", i, unlocked, state.diceSkin === i));
      traySwatchesEl.appendChild(makeSwatch("tray", i, unlocked, state.traySkin === i));
    }
  }

  function makeSwatch(kind, skinId, unlocked, selected) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "swatch" + (unlocked ? "" : " locked") + (selected ? " selected" : "");
    el.dataset.kind = kind;
    el.dataset.skin = skinId;
    if (!unlocked) {
      el.innerHTML = '<span class="swatch-lock">🔒</span>';
      el.addEventListener("click", () => {
        setMessage(`ステージ${SKIN_STAGES[skinId - 1]}到達で解放されます`);
      });
    } else {
      el.addEventListener("click", () => {
        if (kind === "dice") state.diceSkin = skinId;
        else state.traySkin = skinId;
        saveState();
        render();
      });
    }
    return el;
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
    // force reflow so the animation restarts
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

  function playKakuteiChime() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes = state.owned.soundPack
      ? [880, 1108.7, 1318.5, 1760, 2217.5, 2637] // premium: longer sparkling run
      : [880, 1108.7, 1318.5, 1760]; // A5, C#6, E6, A6 — bright ascending fanfare
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

  function allMatch(values) {
    return values.length > 0 && values.every((v) => v === values[0]);
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

    const pool = ["shutter", "kiseru", "cutin", "mob"];
    if (state.owned.effectPack) pool.push("goldRain");
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

  // --- ads & store (mock — no real payment/ad network wired up) ---
  const STORE_ITEMS = [
    { id: "noAds", price: "¥300", name: "広告を非表示にする", desc: "ゾロ目が揃うたびに出る広告を消します" },
    { id: "dicePack", price: "¥300", name: "サイコロ＆お皿 全種解放", desc: "ステージ到達を待たずに全デザインを使えます" },
    { id: "soundPack", price: "¥300", name: "プレミアムサウンド", desc: "確定音がより豪華になります" },
    { id: "effectPack", price: "¥300", name: "プレミアム演出", desc: "激アツ演出に専用パターンが追加されます" },
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
    render();
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

  // --- shake-to-roll ---
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
      if (!rolling) roll();
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
      setMessage("この端末は振る操作に対応していません");
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
            setMessage("振る操作には端末の許可が必要です");
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
    if (count >= MAX_DICE) return true; // full clear
    return MILESTONES.includes(count + 1);
  }

  async function roll() {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;

    const dice = Array.from(board.children).slice(0, state.count);

    // decide the outcome up front so we can foreshadow a big chance
    const finalValues = state.values.map(() => randomFace());
    const matched = allMatch(finalValues);
    const bigChance = isBigChance(state.count, matched);
    applyHeatColor(state.count);

    if (bigChance) {
      await playSakibare();
    }

    dice.forEach((d) => d.classList.add("rolling"));
    setMessage(bigChance ? "予感がする…！" : "振っています…");

    const shuffleTicks = 8;
    for (let t = 0; t < shuffleTicks; t++) {
      dice.forEach((d) => setDieFace(d, randomFace()));
      await sleep(50);
    }
    dice.forEach((d) => d.classList.remove("rolling"));

    // reveal dice one at a time; if everything revealed so far matches,
    // hold suspense ("reach") on the dice still spinning
    let matchingSoFar = true;
    for (let i = 0; i < dice.length; i++) {
      setDieFace(dice[i], finalValues[i]);
      if (i > 0) matchingSoFar = matchingSoFar && finalValues[i] === finalValues[0];

      const remaining = dice.slice(i + 1);
      const isLast = i === dice.length - 1;

      if (matchingSoFar && !isLast && remaining.length > 0) {
        remaining.forEach((d) => d.classList.add("reach"));
        tray.classList.add("reach");
        reachBadge.classList.add("show");
        setMessage("リーチ！！", "win");
        playReachTick(i);
        await sleep(500);
        for (let t = 0; t < 3; t++) {
          remaining.forEach((d) => setDieFace(d, randomFace()));
          await sleep(90);
        }
      } else {
        await sleep(110);
      }
    }

    dice.forEach((d) => d.classList.remove("reach"));
    tray.classList.remove("reach");
    reachBadge.classList.remove("show");

    state.values = finalValues;

    if (matched) {
      await playKakuteiEffect();
      dice.forEach((d) => d.classList.add("matched"));
      vibrate([40, 60, 40]);
      playKakuteiChime();
      showZoromePopup();

      const elapsed = Date.now() - stageStartTime;
      const prevBest = state.stageBestMs[state.count];
      if (!prevBest || elapsed < prevBest) {
        state.stageBestMs[state.count] = elapsed;
      }

      if (state.count >= MAX_DICE) {
        setMessage(`🎉 ${MAX_DICE}個すべてゾロ目！完全クリア！（${formatTime(elapsed)}）`, "clear");
        spawnConfetti(80);
      } else {
        state.count += 1;
        state.values.push(null);
        if (state.count > state.best) state.best = state.count;
        setMessage(`ゾロ目！サイコロが${state.count}個に増えた！（${formatTime(elapsed)}）`, "win");
        spawnConfetti(40);
      }
      stageStartTime = Date.now();
    } else {
      setMessage("惜しい！もう一度「振る」を押してね");
    }

    saveState();
    render();
    if (matched) {
      Array.from(board.children).slice(0, Math.min(state.count, dice.length)).forEach((d) => {
        d.classList.add("matched");
      });
      setTimeout(() => {
        Array.from(board.children).forEach((d) => d.classList.remove("matched"));
      }, 900);
    }

    if (matched && !state.noAds) {
      await sleep(600);
      await showAdOverlay();
    }

    rolling = false;
    rollBtn.disabled = false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function reset() {
    if (rolling) return;
    state.count = START_DICE;
    state.values = Array(START_DICE).fill(null);
    state.totalElapsedMs = 0;
    state.totalStartTime = Date.now();
    stageStartTime = Date.now();
    saveState();
    setMessage("2個のサイコロを振って、ゾロ目を出そう！");
    render();
  }

  rollBtn.addEventListener("click", roll);
  resetBtn.addEventListener("click", reset);

  window.addEventListener("beforeunload", () => {
    state.totalElapsedMs += Date.now() - state.totalStartTime;
    state.totalStartTime = Date.now();
    saveState();
  });

  render();
  startTimerLoop();
  if (state.count >= MAX_DICE && allMatch(state.values.length ? state.values : [])) {
    setMessage(`🎉 ${MAX_DICE}個すべてゾロ目！完全クリア！`, "clear");
  } else if (state.count > START_DICE) {
    setMessage(`続きから！現在${state.count}個のサイコロ`);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
