export function initNavigation({ navBtns, views, onViewChange }) {
  const handlers = [];

  function switchView(targetId) {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetId);
    });

    views.forEach(view => {
      view.classList.toggle('active', view.id === targetId);
    });

    onViewChange?.(targetId);
  }

  navBtns.forEach(btn => {
    const handler = () => switchView(btn.dataset.target);
    handlers.push([btn, handler]);
    btn.addEventListener('click', handler);
  });

  return {
    switchView,
    destroy() {
      handlers.forEach(([btn, handler]) => {
        btn.removeEventListener('click', handler);
      });
    }
  };
}
