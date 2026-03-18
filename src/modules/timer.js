const DEFAULT_TIME = 25 * 60;
const MIN_TIME = 60;
const MAX_TIME = 120 * 60;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

export function initTimer({
  store,
  elements,
  playAmbientSound,
  stopAmbientSound,
  playZenBell,
  setEntropyMode
}) {
  const { timerDisplay, timerSection, timerCircle, navbar } = elements;
  const state = {
    timerRunning: false,
    timeLeft: DEFAULT_TIME,
    presetTime: DEFAULT_TIME,
    timerInterval: null
  };

  async function saveTimerState() {
    await store.set('timer_state', {
      timeLeft: state.timeLeft,
      presetTime: state.presetTime,
      wasRunning: state.timerRunning
    });
  }

  async function loadTimerState() {
    const saved = await store.get('timer_state');
    if (saved?.timeLeft) state.timeLeft = saved.timeLeft;
    if (saved?.presetTime) state.presetTime = saved.presetTime;
    timerDisplay.textContent = formatTime(state.timeLeft);
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(state.timeLeft);
  }

  function restoreNavbar() {
    if (!navbar) return;
    navbar.style.opacity = '1';
    navbar.style.pointerEvents = 'auto';
  }

  function hideNavbar() {
    if (!navbar) return;
    navbar.style.opacity = '0';
    navbar.style.pointerEvents = 'none';
  }

  function resetTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.timerRunning = false;
    state.timeLeft = state.presetTime || DEFAULT_TIME;
    updateTimerDisplay();
    setEntropyMode?.('CHAOS');
    timerCircle?.classList.remove('running');
    restoreNavbar();
    void saveTimerState();
    stopAmbientSound?.();
  }

  function toggleTimer() {
    state.timerRunning = !state.timerRunning;

    if (state.timerRunning) {
      setEntropyMode?.('ORDER');
      timerCircle?.classList.add('running');
      hideNavbar();
      playAmbientSound?.();
      state.timerInterval = window.setInterval(() => {
        if (state.timeLeft > 0) {
          state.timeLeft -= 1;
          updateTimerDisplay();
          if (state.timeLeft % 30 === 0) {
            void saveTimerState();
          }
          return;
        }

        playZenBell?.();
        resetTimer();
      }, 1000);
      return;
    }

    setEntropyMode?.('CHAOS');
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    timerCircle?.classList.remove('running');
    restoreNavbar();
    void saveTimerState();
    stopAmbientSound?.();
  }

  function applyTimeChange(nextValue) {
    const bounded = Math.max(MIN_TIME, Math.min(MAX_TIME, nextValue));
    if (bounded === state.timeLeft) return;

    state.timeLeft = bounded;
    state.presetTime = bounded;
    updateTimerDisplay();
    void saveTimerState();
  }

  let touchStartY = null;

  const handleWheel = event => {
    if (state.timerRunning) return;
    event.preventDefault();
    applyTimeChange(state.timeLeft - Math.sign(event.deltaY) * 60);
  };

  const handleTouchStart = event => {
    if (state.timerRunning) return;
    touchStartY = event.touches[0].clientY;
  };

  const handleTouchMove = event => {
    if (state.timerRunning || touchStartY === null) return;
    event.preventDefault();

    const touchY = event.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    if (Math.abs(deltaY) < 30) return;

    applyTimeChange(state.timeLeft + Math.sign(deltaY) * 60);
    touchStartY = touchY;
  };

  const handleTouchEnd = () => {
    touchStartY = null;
  };

  timerSection.addEventListener('wheel', handleWheel, { passive: false });
  timerSection.addEventListener('touchstart', handleTouchStart, { passive: true });
  timerSection.addEventListener('touchmove', handleTouchMove, { passive: false });
  timerSection.addEventListener('touchend', handleTouchEnd, { passive: true });
  timerSection.addEventListener('click', toggleTimer);

  void loadTimerState();

  return {
    destroy() {
      clearInterval(state.timerInterval);
      stopAmbientSound?.();
      timerSection.removeEventListener('wheel', handleWheel);
      timerSection.removeEventListener('touchstart', handleTouchStart);
      timerSection.removeEventListener('touchmove', handleTouchMove);
      timerSection.removeEventListener('touchend', handleTouchEnd);
      timerSection.removeEventListener('click', toggleTimer);
    }
  };
}
