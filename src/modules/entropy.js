export function initEntropySystem({ getAudioAnalysis }) {
  const state = {
    mode: 'CHAOS',
    crystalEnergy: 0,
    shockwaves: [],
    ashes: [],
    currentVolume: 0
  };

  document.body.style.isolation = 'isolate';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.8;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let lastTime = 0;
  let animationFrameId = 0;
  const particles = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      size: Math.random() * 2 + 0.5,
      baseAlpha: Math.random() * 0.4 + 0.1,
      drawScale: 1,
      drawAlpha: 0.1
    };
  }

  function updateParticle(particle, dt) {
    state.shockwaves.forEach(wave => {
      const dx = particle.x - wave.x;
      const dy = particle.y - wave.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const waveDist = Math.abs(dist - wave.radius);

      if (waveDist < wave.thickness) {
        const angle = Math.atan2(dy, dx);
        const force = wave.isFlow ? 200 : 50;
        particle.x += Math.cos(angle) * force * dt;
        particle.y += Math.sin(angle) * force * dt;
        const intensity = 1 - waveDist / wave.thickness;
        particle.drawScale = 1 + intensity * (wave.isFlow ? 2 : 5);
        particle.drawAlpha = Math.min(1, particle.baseAlpha + intensity);
      }
    });

    if (state.mode === 'CHAOS') {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (particle.x < 0) {
        particle.x = 0;
        particle.vx = Math.abs(particle.vx);
      } else if (particle.x > width) {
        particle.x = width;
        particle.vx = -Math.abs(particle.vx);
      }

      if (particle.y < 0) {
        particle.y = 0;
        particle.vy = Math.abs(particle.vy);
      } else if (particle.y > height) {
        particle.y = height;
        particle.vy = -Math.abs(particle.vy);
      }

      if (particle.x < -200 || particle.x > width + 200 || particle.y < -200 || particle.y > height + 200) {
        Object.assign(particle, createParticle());
      }
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    particle.x += Math.cos(angle + 1.5) * 100 * dt;
    particle.y += Math.sin(angle + 1.5) * 100 * dt;
    particle.x += Math.cos(angle) * 80 * dt;
    particle.y += Math.sin(angle) * 80 * dt;

    if (dist < 40) {
      state.crystalEnergy += 1;
      Object.assign(particle, createParticle());
      if (Math.random() > 0.5) {
        particle.x = Math.random() > 0.5 ? 0 : width;
      }
    }
  }

  function drawParticle(particle) {
    const alpha = particle.drawAlpha ?? particle.baseAlpha;
    const currentScale = particle.drawScale || 1;
    const pulse = 1 + state.currentVolume * 0.5;
    const radius = Math.max(0.5, particle.size * currentScale * pulse);

    ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    particle.drawScale = 1;
    particle.drawAlpha = particle.baseAlpha;
  }

  function drawCrystal() {
    if (state.mode !== 'ORDER') return;

    const centerX = width / 2;
    const centerY = height / 2;
    const size = 30 + state.crystalEnergy * 0.5 + state.currentVolume * 10;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Date.now() * 0.001);

    if (state.crystalEnergy > 0) {
      ctx.shadowBlur = state.crystalEnergy * 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      state.crystalEnergy *= 0.95;
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.restore();
  }

  function animate(timestamp) {
    try {
      if (!lastTime) lastTime = timestamp;
      const safeDt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      ctx.clearRect(0, 0, width, height);
      state.currentVolume = (getAudioAnalysis?.()?.volume || 0) / 255;

      state.shockwaves = state.shockwaves.filter(wave => {
        wave.radius += wave.speed * safeDt;
        wave.alpha -= wave.decay * safeDt;
        return wave.alpha > 0;
      });

      state.ashes = state.ashes.filter(ash => {
        ash.y -= ash.speed * safeDt;
        ash.x += Math.sin(ash.y * 0.05 + ash.offset) * 20 * safeDt;
        ash.alpha -= 0.5 * safeDt;
        if (ash.alpha <= 0) return false;
        ctx.fillStyle = `rgba(200, 200, 200, ${ash.alpha})`;
        ctx.beginPath();
        ctx.arc(ash.x, ash.y, ash.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      particles.forEach(particle => {
        updateParticle(particle, safeDt);
        drawParticle(particle);
      });

      drawCrystal();
    } catch (err) {
      console.error('Animate Error:', err);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function triggerRipple(isFlow) {
    state.shockwaves.push({
      x: width / 2,
      y: height / 2,
      radius: 0,
      speed: isFlow ? 1000 : 300,
      thickness: isFlow ? 50 : 150,
      decay: isFlow ? 0.8 : 0.2,
      alpha: 1,
      isFlow
    });
  }

  function triggerShockwave() {
    state.shockwaves.push({
      x: window.innerWidth / 2,
      y: window.innerHeight,
      radius: 0,
      speed: 600,
      thickness: 150,
      decay: 0.8,
      alpha: 1,
      isFlow: false
    });
  }

  function triggerAshEffect() {
    for (let i = 0; i < 200; i++) {
      state.ashes.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight - 100 + Math.random() * 50,
        speed: 50 + Math.random() * 100,
        size: Math.random() * 3 + 1,
        alpha: 1,
        offset: Math.random() * 100
      });
    }
  }

  resize();
  for (let i = 0; i < 150; i++) {
    const particle = createParticle();
    particle.drawAlpha = particle.baseAlpha;
    particles.push(particle);
  }

  window.addEventListener('resize', resize);
  animationFrameId = requestAnimationFrame(animate);

  return {
    setMode(mode) {
      state.mode = mode;
    },
    triggerRipple,
    triggerShockwave,
    triggerAshEffect,
    destroy() {
      window.removeEventListener('resize', resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      canvas.remove();
    }
  };
}
