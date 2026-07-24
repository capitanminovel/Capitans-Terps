'use strict';

// ── Grid rendering ────────────────────────────────────────────
function renderGrid() {
  const grid    = document.getElementById('strain-grid');
  const countEl = document.getElementById('strain-count');

  const strains = STATE.currentFilter === 'all'
    ? STATE.allStrains
    : STATE.allStrains.filter(s => s.status === STATE.currentFilter);

  countEl.textContent = `${strains.length} strain${strains.length !== 1 ? 's' : ''}`;

  if (!strains.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-glyph">🌱</div>
        <div class="empty-text">No ${STATE.currentFilter !== 'all' ? STATE.currentFilter + ' ' : ''}strains yet.</div>
      </div>`;
    return;
  }

  grid.innerHTML = strains.map(s => {
    const sc  = s.status.replace(' ', '-');
    const res = STATE.researchCache[s.id];
    return `
      <div class="strain-card" onclick="openDetail('${s.id}')">
        <div class="card-img-wrap">
          <img src="/images/strains/${s.id}.jpg" alt="${esc(s.name)}"
            onclick="openLightbox(this.src,'${esc(s.name)}',event)"
            onerror="this.parentElement.style.display='none'">
        </div>
        <div class="card-top">
          <div>
            <div class="card-name">${esc(s.name)}</div>
            <div class="card-breeder">${esc(s.breeder)}</div>
          </div>
          <span class="status-tag ${sc}">${esc(s.status)}</span>
        </div>
        ${s.lineage ? `<div class="card-lineage">${esc(s.lineage)}</div>` : ''}
        <div class="card-type-row">
          ${s.type ? `<span class="card-type ${typeSlug(s.type)}">${esc(s.type)}</span>` : ''}
          ${s.best_for ? s.best_for.split(',').map(b => `<span class="card-best-for">${esc(b.trim())}</span>`).join('') : ''}
        </div>
        ${s.notes ? `<div class="card-notes">${esc(s.notes)}</div>` : ''}
        <div class="card-footer">
          ${res ? `<span class="card-researched">✦ Researched</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

function setFilter(filter, btn) {
  STATE.currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

// ── Add strain modal ──────────────────────────────────────────
function openAddModal()  { showOverlay('add-modal'); }
function closeAddModal() { hideOverlay('add-modal'); document.getElementById('add-form').reset(); }

async function submitAddStrain(e) {
  e.preventDefault();
  const form = e.target;
  const body = {
    name:    form.name.value.trim(),
    breeder: form.breeder.value.trim(),
    lineage: form.lineage.value.trim(),
    status:  form.status.value,
    type:    form.type.value,
    notes:   form.notes.value.trim(),
  };
  try {
    const res  = await fetch('/api/strains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const newS = await res.json();
    STATE.allStrains.push(newS);
    renderGrid();
    closeAddModal();
    toast(`"${newS.name}" added`);
  } catch {
    toast('Failed to add strain');
  }
}
