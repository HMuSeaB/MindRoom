export function initZenCanvas({ store, elements }) {
  const { canvas, canvasSection, clearBtn, colorPicker, exportBtn } = elements;

  if (!canvas) {
    console.warn('Mind map canvas not found');
    return { destroy() {} };
  }

  const ctx = canvas.getContext('2d');
  let nodes = [];
  let selectedNode = null;
  let isDragging = false;
  let lastClickTime = 0;
  const history = [];
  const maxHistory = 20;

  function resizeCanvas() {
    const rect = canvasSection?.getBoundingClientRect() || canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
  }

  function generateShard(radius) {
    const points = [];
    const sides = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const length = radius * (0.8 + Math.random() * 0.4);
      points.push({
        x: Math.cos(angle) * length,
        y: Math.sin(angle) * length
      });
    }
    return points;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#d4af37';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      const dist = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      const offset = dist * 0.2;
      const cx = midX + (i % 2 === 0 ? offset : -offset);
      const cy = midY + (i % 2 === 0 ? -offset : offset);

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.quadraticCurveTo(cx, cy, curr.x, curr.y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    nodes.forEach(node => {
      if (!node.shard) {
        node.shard = generateShard(node.radius || 10);
      }

      const baseColor = node.color || '#e0e0e0';
      ctx.fillStyle = node === selectedNode ? '#ffffff' : baseColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = baseColor;
      ctx.beginPath();

      if (node.shard.length > 0) {
        const start = node.shard[0];
        ctx.moveTo(node.x + start.x, node.y + start.y);
        for (let i = 1; i < node.shard.length; i++) {
          const point = node.shard[i];
          ctx.lineTo(node.x + point.x, node.y + point.y);
        }
      }

      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  function getPos(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function findNode(pos) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (Math.hypot(pos.x - node.x, pos.y - node.y) <= node.radius + 5) {
        return node;
      }
    }
    return null;
  }

  function saveHistory() {
    history.push(JSON.stringify(nodes));
    if (history.length > maxHistory) {
      history.shift();
    }
  }

  function undo() {
    if (history.length === 0) return;
    nodes = JSON.parse(history.pop());
    draw();
    void saveCanvas();
  }

  async function saveCanvas() {
    await store.set('canvas_nodes', nodes.map(node => ({
      x: node.x,
      y: node.y,
      radius: node.radius,
      color: node.color,
      shard: node.shard
    })));
  }

  async function loadCanvas() {
    const data = await store.get('canvas_nodes');
    if (Array.isArray(data)) {
      nodes = data;
      draw();
    }
  }

  const handleStart = event => {
    if (event.target !== canvas) return;
    event.preventDefault();

    const pos = getPos(event);
    const node = findNode(pos);
    const now = Date.now();

    if (node) {
      if (now - lastClickTime < 300 && selectedNode === node) {
        saveHistory();
        nodes = nodes.filter(item => item !== node);
        selectedNode = null;
        draw();
        void saveCanvas();
        return;
      }

      selectedNode = node;
      isDragging = true;
      if (colorPicker) colorPicker.value = node.color || '#e0e0e0';
    } else if (now - lastClickTime > 200) {
      saveHistory();
      nodes.push({
        x: pos.x,
        y: pos.y,
        radius: 15 + Math.random() * 10,
        color: colorPicker ? colorPicker.value : '#e0e0e0',
        shard: generateShard(20)
      });
      draw();
      void saveCanvas();
    }

    lastClickTime = now;
    draw();
  };

  const handleMove = event => {
    if (!isDragging || !selectedNode) return;
    event.preventDefault();
    const pos = getPos(event);
    selectedNode.x = pos.x;
    selectedNode.y = pos.y;
    draw();
  };

  const handleEnd = () => {
    if (isDragging) {
      void saveCanvas();
    }
    isDragging = false;
  };

  const handleClearClick = () => {
    if (!confirm('Clear entire mind map?')) return;
    saveHistory();
    nodes = [];
    draw();
    void saveCanvas();
  };

  const handleExportClick = () => {
    const link = document.createElement('a');
    link.download = `mindroom_zen_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      undo();
    }
  };

  const handleCanvasViewActive = () => {
    window.setTimeout(resizeCanvas, 50);
  };

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd);
  clearBtn?.addEventListener('click', handleClearClick);
  exportBtn?.addEventListener('click', handleExportClick);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('canvasViewActive', handleCanvasViewActive);

  void loadCanvas().catch(err => {
    console.error('Failed to load canvas:', err);
  });
  resizeCanvas();

  return {
    destroy() {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
      clearBtn?.removeEventListener('click', handleClearClick);
      exportBtn?.removeEventListener('click', handleExportClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('canvasViewActive', handleCanvasViewActive);
    }
  };
}
