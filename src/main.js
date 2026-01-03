// Tauri Store 通过全局 API 访问（因为没有打包工具）
// 使用 window.__TAURI__.store

// 引入 Tauri 的 API (如果需要系统操作，比如保存文件)
// import { invoke } from '@tauri-apps/api/core';

// 简单的状态管理
// 简单的状态管理
const state = {
  view: 'timer',
  timerRunning: false,
  timeLeft: 25 * 60,
  presetTime: 25 * 60, // 记住用户设定的时间
  timerInterval: null
};

// 等待 DOM 加载完成后再初始化
document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素缓存
  const els = {
    navBtns: document.querySelectorAll('nav button'),
    views: document.querySelectorAll('.view-container'),
    timerDisplay: document.getElementById('timer-display'),
    timerSection: document.getElementById('timer')
  };

  // --- 导航逻辑 ---
  function switchView(targetId) {
    // 更新按钮状态
    els.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetId);
    });

    // 更新视图状态（使用 Open Props 动画）
    els.views.forEach(view => {
      if (view.id === targetId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    state.view = targetId;

    // 如果切换到 canvas，触发重新调整大小
    if (targetId === 'canvas') {
      window.dispatchEvent(new Event('canvasViewActive'));
    }
  }

  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.target));
  });

  // --- 专注音效系统 (Ambient Sound) ---
  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;

  function playAmbientSound() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (noiseNode) return; // 已在播放

      // 创建棕噪音（更柔和的白噪音）
      const bufferSize = 2 * audioCtx.sampleRate;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // 调整音量
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 2); // 淡入

      noiseNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      noiseNode.start();

      console.log('Ambient sound started.');
    } catch (err) {
      console.log('Audio not supported:', err);
    }
  }

  function stopAmbientSound() {
    try {
      if (gainNode && noiseNode) {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); // 淡出
        setTimeout(() => {
          if (noiseNode) {
            noiseNode.stop();
            noiseNode = null;
            gainNode = null;
          }
        }, 1000);
        console.log('Ambient sound stopped.');
      }
    } catch (err) {
      console.log('Error stopping audio:', err);
    }
  }

  // --- 数字敲击乐 (TypeSound Engine) ---
  const typeSound = {
    ctx: null,
    convolver: null,
    lastTap: 0,
    tapHistory: [], // 记录最近几次点击的时间戳，计算 BPM
    compressor: null,

    init() {
      try {
        if (!this.ctx) {
          // 复用全局 AudioContext 如果已存在
          this.ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
          audioCtx = this.ctx; // 确保全局引用同步
        }

        // 防止削顶失真 (Clipping)
        if (!this.compressor) {
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.value = -24;
          this.compressor.knee.value = 30;
          this.compressor.ratio.value = 12;
          this.compressor.attack.value = 0.003;
          this.compressor.release.value = 0.25;
          this.compressor.connect(this.ctx.destination);
        }

        this.generateReverb();
      } catch (e) {
        console.warn('TypeSound init failed:', e);
      }
    },

    // 算法生成混响 Impulse Response
    generateReverb() {
      const rate = this.ctx.sampleRate;
      const length = rate * 2.5; // 2.5秒混响尾音
      const decay = 2.0;
      const buffer = this.ctx.createBuffer(2, length, rate);

      for (let c = 0; c < 2; c++) {
        const channel = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          // 产生噪音并按指数衰减
          channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = buffer;
      this.convolver.connect(this.compressor); // Connect to compressor
    },

    getBPM() {
      const now = Date.now();
      this.tapHistory.push(now);
      // 只保留最近 5 秒内的点击
      this.tapHistory = this.tapHistory.filter(t => now - t < 5000);

      if (this.tapHistory.length < 2) return 0;

      // 计算每分钟点击数 (CPM - Characters Per Minute)
      // 近似 BPM
      const cpm = this.tapHistory.length * 12; // (60s / 5s)
      return cpm;
    },

    play() {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const bpm = this.getBPM();
      const t = this.ctx.currentTime;

      // 基于 BPM 决定音色
      const isFlowState = bpm > 300;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);

      // 混响发送
      const reverbGain = this.ctx.createGain();
      gain.connect(reverbGain);
      reverbGain.connect(this.convolver);
      // 干音也输出一部分，连接到压缩器
      gain.connect(this.compressor);

      if (isFlowState) {
        // --- 冰流音色 (High) ---
        osc.type = 'sine';
        // 随机五声音阶 (Pentatonic scale)
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
        const note = notes[Math.floor(Math.random() * notes.length)] * 1;

        osc.frequency.setValueAtTime(note, t);
        // 微小失谐，模拟自然感
        osc.detune.value = Math.random() * 20 - 10;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);

        // 短促信封 (Volume tuned down to prevent clipping)
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01); // 0.6 -> 0.4
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        reverbGain.gain.value = 0.25;

        osc.start(t);
        osc.stop(t + 0.3);

      } else {
        // --- 深思音色 (Low) ---
        osc.type = 'triangle';
        const notes = [130.81, 146.83, 164.81, 196.00, 220.00]; // C3...
        const note = notes[Math.floor(Math.random() * notes.length)];

        osc.frequency.setValueAtTime(note, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t); // 很闷

        // 缓慢信封 (Volume tuned down to prevent clipping)
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05); // 0.4 -> 0.3
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

        reverbGain.gain.value = 0.6;

        osc.start(t);
        osc.stop(t + 2.0);
      }
    }
  };

  // --- 计时器逻辑 (Vibe Focus) ---
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // 禅钟：专注结束音效
  function playZenBell() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const t = audioCtx.currentTime;
      // Fundamental (Low)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.value = 220; // A3
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.5, t + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
      osc1.start(t);
      osc1.stop(t + 4.0);

      // Harmonic (High)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.value = 660; // 3rd harmonic
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.1, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
      osc2.start(t);
      osc2.stop(t + 3.0);
    } catch (e) {
      console.warn('ZenBell failed:', e);
    }
  }

  // 保存 Timer 状态
  async function saveTimerState() {
    try {
      await store.set('timer_state', {
        timeLeft: state.timeLeft,
        presetTime: state.presetTime, // Save user preference
        wasRunning: state.timerRunning
      });
      await store.save();
    } catch (err) {
      console.error('Failed to save timer:', err);
    }
  }

  // 加载 Timer 状态
  async function loadTimerState() {
    try {
      const saved = await store.get('timer_state');
      if (saved) {
        if (saved.timeLeft) state.timeLeft = saved.timeLeft;
        if (saved.presetTime) state.presetTime = saved.presetTime;
        els.timerDisplay.textContent = formatTime(state.timeLeft);
      }
    } catch (err) {
      console.error('Failed to load timer:', err);
    }
  }

  function toggleTimer() {
    state.timerRunning = !state.timerRunning;
    const circle = document.querySelector('.timer-circle');
    const nav = document.getElementById('navbar');

    if (state.timerRunning) {
      // 切换到秩序模式 (开始结晶)
      if (typeof entropyState !== 'undefined') entropyState.mode = 'ORDER';

      circle.classList.add('running');
      // 沉浸模式：淡出导航
      nav.style.opacity = '0';
      nav.style.pointerEvents = 'none';

      // 播放专注音效
      playAmbientSound();

      state.timerInterval = setInterval(() => {
        if (state.timeLeft > 0) {
          state.timeLeft--;
          els.timerDisplay.textContent = formatTime(state.timeLeft);
          // 每30秒保存一次状态
          if (state.timeLeft % 30 === 0) {
            saveTimerState();
          }
        } else {
          // 时间到！
          playZenBell();
          resetTimer();
        }
      }, 1000);
    } else {
      // 切换回混乱模式
      if (typeof entropyState !== 'undefined') entropyState.mode = 'CHAOS';

      clearInterval(state.timerInterval);
      circle.classList.remove('running');
      nav.style.opacity = '1';
      nav.style.pointerEvents = 'auto';
      saveTimerState();
      stopAmbientSound();
    }
  }

  function resetTimer() {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    // 重置为用户设定的时间，而不是写死的 25:00
    state.timeLeft = state.presetTime || 25 * 60;
    els.timerDisplay.textContent = formatTime(state.timeLeft);

    if (typeof entropyState !== 'undefined') entropyState.mode = 'CHAOS';
    document.querySelector('.timer-circle').classList.remove('running');
    document.getElementById('navbar').style.opacity = '1';
    saveTimerState();
    stopAmbientSound();
  }

  // 滚轮调整时间 (Adjust Time)
  els.timerSection.addEventListener('wheel', (e) => {
    if (state.timerRunning) return; // 运行时不可调整
    e.preventDefault();

    // 滚轮方向：向上(deltaY<0)增加时间，向下(deltaY>0)减少时间
    // 为了符合直觉：向上滚 = 增加
    const delta = Math.sign(e.deltaY);

    // 每次滚动调整 1 分钟 (60s)
    let change = delta * 60;

    // 注意：deltaY > 0 是向下滚，通常逻辑是“减少”？
    // Mac/Trackpad: 向下滚是内容向上走，通常对应 Value Decrease?
    // Windows Mouse: 向后滚(Down)是页面向下。
    // Let's standard: Scroll Down (positive) -> Decrease. Scroll Up (negative) -> Increase.
    let newTime = state.timeLeft - change;

    // 限制范围：1分钟 - 120分钟
    if (newTime < 60) newTime = 60;
    if (newTime > 120 * 60) newTime = 120 * 60;

    // 如果变化了，更新并保存
    if (newTime !== state.timeLeft) {
      state.timeLeft = newTime;
      state.presetTime = newTime; // Update default
      els.timerDisplay.textContent = formatTime(state.timeLeft);

      // Debounce saving if needed, but safe here
      saveTimerState();
    }
  }, { passive: false });

  els.timerSection.addEventListener('click', toggleTimer);

  // 初始化时加载 Timer 状态
  loadTimerState();

  // --- 熵系统：视觉核心 (Entropy System) ---

  // --- 熵系统：视觉核心 (Entropy System) ---
  const entropyState = {
    mode: 'CHAOS', // CHAOS | ORDER
    crystalEnergy: 0,
    shockwaves: [],
    ashes: []
  };

  function initEntropySystem() {
    document.body.style.isolation = 'isolate';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.8;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let lastTime = 0;

    // DPI 适配
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.reset();
        // 初始随机分布
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() > 0.5 ? 0 : width; // 从边缘重生
        this.y = Math.random() * height;
        if (Math.random() > 0.5) { this.x = Math.random() * width; this.y = Math.random() > 0.5 ? 0 : height; }

        // 基础属性
        this.vx = (Math.random() - 0.5) * 50; // pixels per second
        this.vy = (Math.random() - 0.5) * 50;
        this.size = Math.random() * 2 + 0.5;
        this.baseAlpha = Math.random() * 0.4 + 0.1;
        this.jitter = Math.random() * 20;
      }

      update(dt) {
        // 1. 冲击波物理 (Wavefront)
        entropyState.shockwaves.forEach(wave => {
          const dx = this.x - wave.x;
          const dy = this.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // 波前判定：是否处于波环内
          const waveDist = Math.abs(dist - wave.radius);
          if (waveDist < wave.thickness) {
            const angle = Math.atan2(dy, dx);
            const force = wave.strength * (1 - waveDist / wave.thickness);
            this.x += Math.cos(angle) * force * dt * 60;
            this.y += Math.sin(angle) * force * dt * 60;
          }
        });

        if (entropyState.mode === 'CHAOS') {
          // 混乱模式：布朗运动 + 边界反弹
          this.x += this.vx * dt;
          this.y += this.vy * dt;

          // 增加微小高频抖动 (Jitter)
          this.x += (Math.random() - 0.5) * this.jitter * dt;
          this.y += (Math.random() - 0.5) * this.jitter * dt;

          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;

        } else if (entropyState.mode === 'ORDER') {
          // 秩序模式：引力吸入
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = centerX - this.x;
          const dy = centerY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // 转为切向速度 (螺旋)
          const angle = Math.atan2(dy, dx);
          const orbitSpeed = 100;
          const suckSpeed = 80;

          this.x += Math.cos(angle + 1.5) * orbitSpeed * dt; // 旋转
          this.y += Math.sin(angle + 1.5) * orbitSpeed * dt;
          this.x += Math.cos(angle) * suckSpeed * dt; // 吸入
          this.y += Math.sin(angle) * suckSpeed * dt;

          // 吞噬判定 (Absorption)
          if (dist < 40) {
            entropyState.crystalEnergy += 1;
            this.reset(); // 粒子死亡并重置
          }
        }
      }

      draw() {
        ctx.fillStyle = `rgba(200, 200, 200, ${this.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 初始化粒子池
    for (let i = 0; i < 150; i++) particles.push(new Particle());

    // 绘制晶体核心 (The Crystal)
    function drawCrystal(dt) {
      if (entropyState.mode !== 'ORDER') return;

      const centerX = width / 2;
      const centerY = height / 2;
      const size = 30 + entropyState.crystalEnergy * 0.5; // 随能量变大

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Date.now() * 0.001); // 缓慢旋转

      // 能量脉冲闪烁
      if (entropyState.crystalEnergy > 0) {
        ctx.shadowBlur = entropyState.crystalEnergy * 2;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        entropyState.crystalEnergy *= 0.95; // 能量衰减
      }

      ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      }
      ctx.closePath();
      ctx.stroke();

      // 内部几何
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();

      ctx.restore();
    }

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000; // 秒为单位
      lastTime = timestamp;

      // 限制最小 dt 防止切屏后跳跃
      const safeDt = Math.min(dt, 0.1);

      ctx.clearRect(0, 0, width, height);

      // 更新冲击波
      entropyState.shockwaves = entropyState.shockwaves.filter(wave => {
        wave.radius += wave.speed * safeDt;
        wave.alpha -= wave.decay * safeDt;
        return wave.alpha > 0;
      });

      // 更新 & 绘制 Ashes (Release Ritual)
      entropyState.ashes = entropyState.ashes.filter(ash => {
        ash.y -= ash.speed * safeDt; // 向上飘
        ash.x += Math.sin(ash.y * 0.05 + ash.offset) * 20 * safeDt; // 左右摇摆
        ash.alpha -= 0.5 * safeDt; // 渐隐

        if (ash.alpha <= 0) return false;

        ctx.fillStyle = `rgba(200, 200, 200, ${ash.alpha})`; // 灰烬色
        ctx.beginPath();
        ctx.arc(ash.x, ash.y, ash.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // 绘制粒子
      particles.forEach(p => {
        p.update(safeDt);
        p.draw();
      });

      // 绘制晶体
      drawCrystal(safeDt);

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  // 启动熵系统
  initEntropySystem();

  // 对外暴露冲击波触发器
  window.triggerShockwave = () => {
    entropyState.shockwaves.push({
      x: window.innerWidth / 2, // 默认从中心扩散，更具仪式感
      y: window.innerHeight,    // 或者从底部向上
      radius: 0,
      strength: 20,
      speed: 600,       // 波速 pixels/s
      thickness: 150,   // 波厚度
      decay: 0.8,       // 衰减速度
      alpha: 1.0
    });
  };

  // 对外暴露灰烬仪式触发器
  window.triggerAshEffect = () => {
    for (let i = 0; i < 200; i++) {
      entropyState.ashes.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight - 100 + Math.random() * 50, // 底部区域
        speed: 50 + Math.random() * 100, // 上升速度
        size: Math.random() * 3 + 1,
        alpha: 1.0,
        offset: Math.random() * 100 // 用于正弦波漂移
      });
    }
  };

  // --- 本地存储系统：记忆持久化 ---
  // 使用 Tauri 全局 API 创建 store
  const { LazyStore } = window.__TAURI__.store;
  const store = new LazyStore('mind_room_data.bin');

  async function initStreamMemory() {
    const textarea = document.getElementById('stream-input');

    // 如果元素不存在，直接返回（避免崩溃）
    if (!textarea) {
      console.warn('Stream input textarea not found');
      return;
    }

    // 加载记忆
    const savedText = await store.get('stream_content');
    if (savedText) {
      textarea.value = savedText;
    }

    // 监听输入，自动保存 (防抖，避免存太频繁)
    let timeout;
    textarea.addEventListener('input', () => {
      // 触发冲击波视觉反馈
      if (window.triggerShockwave) window.triggerShockwave();

      // 触发数字敲击乐
      if (typeSound) typeSound.play();

      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await store.set('stream_content', textarea.value);
        await store.save(); // 这一步才是真正写入硬盘
        console.log('Thought preserved.');
      }, 1000); // 停笔1秒后保存
    });

    // Release Ritual logic
    const releaseBtn = document.getElementById('release-btn');
    if (releaseBtn) {
      releaseBtn.addEventListener('click', async () => {
        if (!textarea.value.trim()) return;

        // 1. 保存当前思绪到历史（这里简单覆盖，未来可做 History List）
        await store.set('last_released_thought', textarea.value);
        await store.save();

        // 2. 视觉仪式：化为灰烬
        if (window.triggerAshEffect) window.triggerAshEffect();

        // 3. 清空画布
        textarea.style.transition = 'opacity 1s';
        textarea.style.opacity = '0';

        setTimeout(() => {
          textarea.value = '';
          textarea.style.opacity = '1';
          // 同时清空实时保存的内容
          store.set('stream_content', '');
          store.save();
        }, 1000);

        console.log('Thought released to the void.');
      });
    }

    // 尝试申请屏幕常亮 (在 Android Webview 中有效)
    try {
      navigator.wakeLock.request('screen').then(() => {
        console.log('Screen Wake Lock active');
      });
    } catch (err) {
      // 桌面端可能会报错，忽略即可
      console.log('Wake Lock not supported or failed:', err);
    }
  }

  // 初始化存储系统
  initStreamMemory();

  // --- 禅意画布系统 (Zen Canvas) ---
  function initZenCanvas() {
    const canvas = document.getElementById('mind-map');
    const clearBtn = document.getElementById('clear-canvas-btn');
    const colorPicker = document.getElementById('node-color');
    const exportBtn = document.getElementById('export-canvas-btn');

    if (!canvas) {
      console.warn('Mind map canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    let nodes = [];
    let selectedNode = null;
    let isDragging = false;
    let lastClickTime = 0;
    let clickCount = 0;
    let history = []; // 撤销历史
    const MAX_HISTORY = 20;

    // 调整画布大小
    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    }

    // 生成碎瓷片形状 (Kintsugi Shard)
    function generateShard(radius) {
      const points = [];
      const sides = 5 + Math.floor(Math.random() * 3); // 5-7边形
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        // 半径随机变化，产生破碎感
        const r = radius * (0.8 + Math.random() * 0.4);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r
        });
      }
      return points;
    }

    // 绘制所有内容 (Kintsugi Style)
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 1. 绘制液态金线 (Liquid Gold) ---
      // 金色光晕配置
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#d4af37'; // Gold glow
      ctx.strokeStyle = '#d4af37'; // Gold
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];

        // 计算中点偏移，形成贝塞尔曲线
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        // 随机偏移量基于节点距离，保持一定的有机感
        // 注意：这里使用固定偏移实际上会导致重绘时抖动，
        // 理想做法是将偏移存入 connection 对象。
        // 为了简化，我们使用确定的计算方式：
        const dist = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        const offset = dist * 0.2;
        // 使用正弦函数根据索引决定偏移方向，避免随机抖动
        const cx = midX + (i % 2 === 0 ? offset : -offset);
        const cy = midY + (i % 2 === 0 ? -offset : offset);

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.quadraticCurveTo(cx, cy, curr.x, curr.y);
        ctx.stroke();
      }

      // 重置光晕，准备画节点
      ctx.shadowBlur = 0;

      // --- 2. 绘制破碎节点 (Shards) ---
      nodes.forEach((node, index) => {
        // 如果节点没有形状数据，补全它
        if (!node.shard) {
          node.shard = generateShard(node.radius || 10);
        }

        const baseColor = node.color || '#e0e0e0';

        ctx.fillStyle = node === selectedNode ? '#ffffff' : baseColor;
        // 给节点加一点点阴影增加厚度感
        ctx.shadowBlur = 10;
        ctx.shadowColor = baseColor;

        ctx.beginPath();
        if (node.shard.length > 0) {
          const start = node.shard[0];
          ctx.moveTo(node.x + start.x, node.y + start.y);
          for (let i = 1; i < node.shard.length; i++) {
            const p = node.shard[i];
            ctx.lineTo(node.x + p.x, node.y + p.y);
          }
        }
        ctx.closePath();
        ctx.fill();

        // 金缮边缘 (Golden Edge)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'; // 淡金色
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset
      });
    }

    // 获取鼠标/触摸位置
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    // 查找点击的节点
    function findNode(pos) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dist = Math.hypot(pos.x - node.x, pos.y - node.y);
        if (dist <= node.radius + 5) {
          return node;
        }
      }
      return null;
    }

    // 保存历史（用于撤销）
    function saveHistory() {
      history.push(JSON.stringify(nodes));
      if (history.length > MAX_HISTORY) {
        history.shift();
      }
    }

    // 撤销
    function undo() {
      if (history.length === 0) return;
      nodes = JSON.parse(history.pop());
      draw();
    }

    // --- 持久化 ---
    async function saveCanvas() {
      const data = nodes.map(n => ({
        x: n.x, y: n.y, radius: n.radius, color: n.color, shard: n.shard
      }));
      await store.set('canvas_nodes', data);
      await store.save();
    }

    async function loadCanvas() {
      const data = await store.get('canvas_nodes');
      if (data && Array.isArray(data)) {
        nodes = data;
        draw();
      }
    }
    loadCanvas();

    // --- 交互逻辑 ---
    // 鼠标/触摸开始
    function handleStart(e) {
      if (e.target !== canvas) return;
      e.preventDefault();
      const pos = getPos(e);
      const node = findNode(pos);
      const now = Date.now();

      if (node) {
        // 双击删除
        if (now - lastClickTime < 300 && selectedNode === node) {
          saveHistory();
          nodes = nodes.filter(n => n !== node);
          selectedNode = null;
          draw();
          saveCanvas();
          return;
        }

        selectedNode = node;
        isDragging = true;

        // 更新颜色选择器
        if (colorPicker) colorPicker.value = node.color || '#e0e0e0';

      } else {
        // 单击空白处创建
        // 简单去抖，防止误触
        if (now - lastClickTime > 200) {
          saveHistory();
          nodes.push({
            x: pos.x,
            y: pos.y,
            radius: 15 + Math.random() * 10,
            color: colorPicker ? colorPicker.value : '#e0e0e0',
            shard: generateShard(20)
          });
          draw();
          saveCanvas();
        }
      }
      lastClickTime = now;
      draw();
    }

    function handleMove(e) {
      if (isDragging && selectedNode) {
        e.preventDefault();
        const pos = getPos(e);
        selectedNode.x = pos.x;
        selectedNode.y = pos.y;
        draw();
      }
    }

    function handleEnd(e) {
      if (isDragging) {
        saveCanvas();
      }
      isDragging = false;
    }

    // 绑定事件
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);

    // 触摸支持
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    // --- 按钮事件 ---
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear entire mind map?')) {
          saveHistory();
          nodes = [];
          draw();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `mindroom_zen_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }

    // Ctrl+Z 撤销
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    });

    // 调整大小
    window.addEventListener('resize', resizeCanvas);
    // 监听视图切换事件（自定义）
    window.addEventListener('canvasViewActive', () => {
      setTimeout(resizeCanvas, 50); // 稍作延迟确保布局稳定
    });

    // 初次绘制
    resizeCanvas();
  }

  // 初始化 Zen Canvas
  initZenCanvas();
});