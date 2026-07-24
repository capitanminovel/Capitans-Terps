'use strict';

// ── Boot ──────────────────────────────────────────────────────
async function init() {
  try {
    const res  = await fetch('/api/strains');
    const data = await res.json();
    STATE.allStrains = data.strains || [];
    renderGrid();
  } catch {
    document.getElementById('strain-grid').innerHTML = `
      <div class="empty-state">
        <div class="empty-glyph">⚠️</div>
        <div class="empty-text">Could not reach server. Is the app running?</div>
      </div>`;
  }
}

// ── Global event listeners ────────────────────────────────────
document.getElementById('detail-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDetailModal();
});
document.getElementById('add-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAddModal();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('lightbox').classList.contains('hidden')) {
    closeLightbox();
  } else if (!document.getElementById('detail-modal').classList.contains('hidden')) {
    closeDetailModal();
  } else if (!document.getElementById('add-modal').classList.contains('hidden')) {
    closeAddModal();
  }
});

init();
