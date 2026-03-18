import { initNavigation } from './modules/navigation.js';
import { createAudioSystem } from './modules/audio.js';
import { initEntropySystem } from './modules/entropy.js';
import { initTimer } from './modules/timer.js';
import { initStreamMemory } from './modules/stream.js';
import { initZenCanvas } from './modules/canvas.js';
import { createAppStore } from './modules/storage.js';
import { collectAppElements } from './modules/dom.js';

document.addEventListener('DOMContentLoaded', () => {
  const elements = collectAppElements();
  const store = createAppStore('mind_room_data.bin');
  const disposers = [];

  const navigation = initNavigation({
    navBtns: elements.navBtns,
    views: elements.views,
    onViewChange(targetId) {
      if (targetId === 'canvas') {
        window.dispatchEvent(new Event('canvasViewActive'));
      }
    }
  });
  disposers.push(navigation.destroy);

  const audio = createAudioSystem();
  const entropy = initEntropySystem({ getAudioAnalysis: () => audio.typeSound.getAnalysis() });
  audio.setRippleTrigger(entropy.triggerRipple);
  disposers.push(audio.destroy, entropy.destroy);

  const timer = initTimer({
    store,
    elements: {
      timerDisplay: elements.timerDisplay,
      timerSection: elements.timerSection,
      timerCircle: elements.timerCircle,
      navbar: elements.navbar
    },
    playAmbientSound: audio.playAmbientSound,
    stopAmbientSound: audio.stopAmbientSound,
    playZenBell: audio.playZenBell,
    setEntropyMode: entropy.setMode
  });
  disposers.push(timer.destroy);

  const stream = initStreamMemory({
    store,
    elements: {
      textarea: elements.streamInput,
      releaseBtn: elements.releaseBtn
    },
    typeSound: audio.typeSound,
    triggerShockwave: entropy.triggerShockwave,
    triggerAshEffect: entropy.triggerAshEffect
  });
  disposers.push(stream.destroy);

  const canvas = initZenCanvas({
    store,
    elements: {
      canvas: elements.mindMap,
      canvasSection: elements.canvasSection,
      clearBtn: elements.clearCanvasBtn,
      colorPicker: elements.nodeColor,
      exportBtn: elements.exportCanvasBtn
    }
  });
  disposers.push(canvas.destroy);

  window.addEventListener('beforeunload', () => {
    disposers.forEach(dispose => dispose?.());
  }, { once: true });
});
