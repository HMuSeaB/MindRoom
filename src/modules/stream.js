export function initStreamMemory({ store, elements, typeSound, triggerShockwave, triggerAshEffect }) {
  const { textarea, releaseBtn } = elements;
  if (!textarea) {
    console.warn('Stream input textarea not found');
    return { destroy() {} };
  }

  let timeoutId = null;
  let wakeLock = null;
  let releaseTimeoutId = null;

  async function loadStreamState() {
    const savedText = await store.get('stream_content');
    if (savedText) {
      textarea.value = savedText;
    }
  }

  const handleInput = () => {
    triggerShockwave?.();
    typeSound?.play();

    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(async () => {
      await store.set('stream_content', textarea.value);
    }, 1000);
  };

  const handleReleaseClick = async () => {
    if (!textarea.value.trim()) return;

    window.clearTimeout(timeoutId);
    await store.set('last_released_thought', textarea.value);
    triggerAshEffect?.();
    textarea.style.transition = 'opacity 1s';
    textarea.style.opacity = '0';

    window.clearTimeout(releaseTimeoutId);
    releaseTimeoutId = window.setTimeout(async () => {
      textarea.value = '';
      textarea.style.opacity = '1';
      await store.set('stream_content', '');
    }, 1000);
  };

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;

    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock active');
    } catch (err) {
      console.log('Wake Lock not supported or failed:', err);
    }
  }

  textarea.addEventListener('input', handleInput);
  releaseBtn?.addEventListener('click', handleReleaseClick);
  void loadStreamState().catch(err => {
    console.error('Failed to load stream content:', err);
  });
  void requestWakeLock();

  return {
    destroy() {
      window.clearTimeout(timeoutId);
      window.clearTimeout(releaseTimeoutId);
      textarea.removeEventListener('input', handleInput);
      releaseBtn?.removeEventListener('click', handleReleaseClick);
      void wakeLock?.release?.();
    }
  };
}
