export function collectAppElements() {
  return {
    navBtns: document.querySelectorAll('nav button'),
    views: document.querySelectorAll('.view-container'),
    navbar: document.getElementById('navbar'),
    timerDisplay: document.getElementById('timer-display'),
    timerSection: document.getElementById('timer'),
    timerCircle: document.querySelector('.timer-circle'),
    streamInput: document.getElementById('stream-input'),
    releaseBtn: document.getElementById('release-btn'),
    canvasSection: document.getElementById('canvas'),
    mindMap: document.getElementById('mind-map'),
    nodeColor: document.getElementById('node-color'),
    exportCanvasBtn: document.getElementById('export-canvas-btn'),
    clearCanvasBtn: document.getElementById('clear-canvas-btn')
  };
}
