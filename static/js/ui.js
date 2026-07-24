'use strict';

// ── Shared state ─────────────────────────────────────────────
const STATE = {
  allStrains:    [],
  researchCache: {},
  currentFilter: 'all',
  currentId:     null,
};

// ── Escape HTML ───────────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
}

// ── Modal overlay helpers ─────────────────────────────────────
function showOverlay(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideOverlay(id) {
  document.getElementById(id).classList.add('hidden');
  const anyOpen = ['detail-modal', 'add-modal']
    .some(mid => !document.getElementById(mid).classList.contains('hidden'));
  if (!anyOpen) document.body.style.overflow = '';
}

// ── Lightbox ──────────────────────────────────────────────────
function openLightbox(src, alt, e) {
  e.stopPropagation();
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-img').alt = alt;
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}
