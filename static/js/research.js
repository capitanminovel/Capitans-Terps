'use strict';

// ── Open detail modal ─────────────────────────────────────────
async function openDetail(id) {
  STATE.currentId = id;
  const strain = STATE.allStrains.find(s => s.id === id);
  if (!strain) return;

  document.getElementById('modal-name').textContent    = strain.name;
  document.getElementById('modal-breeder').textContent = strain.breeder;
  const lineageEl = document.getElementById('modal-lineage');
  if (lineageEl) lineageEl.textContent = strain.lineage || '';

  const metaEl = document.getElementById('modal-meta');
  if (metaEl) {
    const typePill    = strain.type     ? `<span class="card-type ${typeSlug(strain.type)}">${esc(strain.type)}</span>` : '';
    const bestForPill = strain.best_for ? strain.best_for.split(',').map(b => `<span class="card-best-for">${esc(b.trim())}</span>`).join('') : '';
    metaEl.innerHTML  = typePill + bestForPill;
  }

  const tag = document.getElementById('modal-status-tag');
  tag.textContent = strain.status;
  tag.className   = `status-tag ${strain.status.replace(' ', '-')}`;

  document.getElementById('modal-status-select').value = strain.status;
  document.getElementById('modal-type-select').value   = strain.type || 'Hybrid';

  const imgWrap = document.getElementById('modal-img-wrap');
  imgWrap.innerHTML = `<img src="/images/strains/${id}.jpg" alt="${esc(strain.name)}"
    onclick="openLightbox(this.src,'${esc(strain.name)}',event)"
    onerror="this.parentElement.style.display='none'">`;
  imgWrap.style.display = 'block';

  loadGallery(id, strain);

  showOverlay('detail-modal');

  if (STATE.researchCache[id]) {
    renderResearch(STATE.researchCache[id], strain);
    return;
  }

  setModalBody(`<div class="loading-panel"><div class="spinner"></div>
    <div class="loading-text">Loading…</div></div>`);

  try {
    const res  = await fetch(`/api/research/${id}`);
    const data = await res.json();
    if (data && data.genetics_lineage) {
      STATE.researchCache[id] = data;
      renderResearch(data, strain);
      renderGrid();
    } else {
      showGeneratePanel(strain);
    }
  } catch {
    showGeneratePanel(strain);
  }
}

// ── Gallery (additional strain photos beyond the main image) ──
const GALLERY_MAX = 6;

function probeImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function loadGallery(id, strain) {
  const wrap   = document.getElementById('modal-gallery');
  const thumbs = document.getElementById('gallery-thumbs');
  thumbs.innerHTML = '';
  wrap.classList.add('hidden');

  const candidates = Array.from({ length: GALLERY_MAX }, (_, i) => `/images/strains/${id}-${i + 1}.jpg`);
  const found = await Promise.all(candidates.map(probeImage));
  if (STATE.currentId !== id) return;

  const urls = candidates.filter((_, i) => found[i]);
  if (!urls.length) return;

  thumbs.innerHTML = urls.map(src =>
    `<img src="${src}" alt="${esc(strain.name)}" onclick="openLightbox(this.src,'${esc(strain.name)}',event)">`
  ).join('');
  wrap.classList.remove('hidden');
}

function closeDetailModal() {
  hideOverlay('detail-modal');
  document.getElementById('research-tabs').classList.add('hidden');
  STATE.currentId = null;
}

function setModalBody(html) {
  document.getElementById('research-tabs').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = html;
}

// ── Generate panel ────────────────────────────────────────────
function showGeneratePanel(strain) {
  setModalBody(`
    <div class="generate-panel">
      <div class="generate-glyph">🔬</div>
      <div class="generate-title">No research yet</div>
      <div class="generate-desc">
        Generate a full profile for <strong style="color:var(--text)">${esc(strain.name)}</strong>
        covering genetics, terpenes, effects, grow notes, and rosin extraction.
      </div>
      <button class="btn-generate" onclick="generateResearch()">
        ✦ &nbsp;Generate Research
      </button>
    </div>
    <div style="padding:0 1.6rem 1.5rem; border-top:1px solid var(--border); padding-top:1.25rem">
      <div class="form-group" style="gap:.45rem">
        <label class="form-label">My Notes</label>
        <textarea class="notes-textarea" id="notes-standalone"
          placeholder="Personal notes, grow observations, acquisition info…">${esc(strain.notes || '')}</textarea>
        <div class="notes-actions">
          <button class="btn btn-outline" onclick="saveNotes()">Save Notes</button>
        </div>
      </div>
    </div>`);
}

// ── Render research tabs ──────────────────────────────────────
function renderResearch(r, strain) {
  const tabs    = document.getElementById('research-tabs');
  const body    = document.getElementById('modal-body');
  const genDate = r.generated_at
    ? new Date(r.generated_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    : '—';

  const sections = [
    { id:'genetics', icon:'🧬', title:'Genetics & Lineage',  key:'genetics_lineage'  },
    { id:'terpenes', icon:'🌿', title:'Terpene Profile',     key:'terpene_profile'   },
    { id:'effects',  icon:'✨', title:'Effects',             key:'effects'           },
    { id:'flavor',   icon:'👃', title:'Flavor & Aroma',      key:'flavor_aroma'      },
    { id:'grow',     icon:'🪴', title:'Grow Notes',          key:'grow_notes'        },
    { id:'rosin',    icon:'🍯', title:'Rosin & Extraction',  key:'rosin_extraction'  },
  ];

  let html = sections.map(s => `
    <div class="research-panel${s.id === 'genetics' ? ' active' : ''}" id="panel-${s.id}">
      <div class="section-title">${s.icon}&nbsp;${s.title}</div>
      <div class="research-text">${esc(r[s.key] || '—')}</div>
      ${s.id === 'rosin' ? `<div class="research-meta">Generated ${genDate} · Claude AI</div>` : ''}
    </div>`).join('');

  html += `
    <div class="research-panel" id="panel-notes">
      <div class="section-title">📝&nbsp;My Notes</div>
      <textarea class="notes-textarea" id="notes-main"
        placeholder="Personal grow notes, observations…">${esc(strain.notes || '')}</textarea>
      <div class="notes-actions">
        <button class="btn btn-outline" onclick="saveNotes()">Save Notes</button>
      </div>
    </div>`;

  body.innerHTML = html;
  tabs.classList.remove('hidden');
  tabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  tabs.querySelector('[data-tab="genetics"]').classList.add('active');
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.research-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(`panel-${tabId}`);
  if (panel) panel.classList.add('active');
  btn.classList.add('active');
}

// ── Generate research via API ─────────────────────────────────
async function generateResearch() {
  if (!STATE.currentId) return;
  const strain = STATE.allStrains.find(s => s.id === STATE.currentId);

  setModalBody(`
    <div class="loading-panel">
      <div class="spinner"></div>
      <div class="loading-text">Claude is researching ${esc(strain?.name || 'this strain')}…</div>
      <div class="loading-sub">Pulling genetics, terpenes, grow notes &amp; extraction data</div>
    </div>`);

  try {
    const res = await fetch(`/api/research/${STATE.currentId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    STATE.researchCache[STATE.currentId] = data;
    renderResearch(data, strain);
    renderGrid();
    toast('Research generated ✦');
  } catch (e) {
    setModalBody(`
      <div class="generate-panel">
        <div class="generate-glyph">⚠️</div>
        <div class="generate-title">Research failed</div>
        <div class="generate-desc">${esc(e.message)}</div>
        <button class="btn-generate" onclick="generateResearch()">Try Again</button>
      </div>`);
  }
}

// ── Status update ─────────────────────────────────────────────
async function updateStatus() {
  if (!STATE.currentId) return;
  const newStatus = document.getElementById('modal-status-select').value;

  try {
    const res = await fetch(`/api/strains/${STATE.currentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error();
    const idx = STATE.allStrains.findIndex(s => s.id === STATE.currentId);
    if (idx !== -1) STATE.allStrains[idx].status = newStatus;

    const tag = document.getElementById('modal-status-tag');
    tag.textContent = newStatus;
    tag.className   = `status-tag ${newStatus.replace(' ', '-')}`;

    renderGrid();
    toast('Status updated');
  } catch {
    toast('Failed to update status');
  }
}

// ── Type update ────────────────────────────────────────────────
async function updateType() {
  if (!STATE.currentId) return;
  const newType = document.getElementById('modal-type-select').value;
  const strain  = STATE.allStrains.find(s => s.id === STATE.currentId);
  if (!strain) return;

  try {
    const res = await fetch(`/api/strains/${STATE.currentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: strain.status, type: newType }),
    });
    if (!res.ok) throw new Error();
    strain.type = newType;

    const metaEl = document.getElementById('modal-meta');
    if (metaEl) {
      const typePill    = strain.type     ? `<span class="card-type ${typeSlug(strain.type)}">${esc(strain.type)}</span>` : '';
      const bestForPill = strain.best_for ? strain.best_for.split(',').map(b => `<span class="card-best-for">${esc(b.trim())}</span>`).join('') : '';
      metaEl.innerHTML  = typePill + bestForPill;
    }

    renderGrid();
    toast('Type updated');
  } catch {
    toast('Failed to update type');
  }
}

// ── Save notes ────────────────────────────────────────────────
async function saveNotes() {
  if (!STATE.currentId) return;
  const el = document.getElementById('notes-main') || document.getElementById('notes-standalone');
  if (!el) return;
  const notes  = el.value;
  const strain = STATE.allStrains.find(s => s.id === STATE.currentId);
  if (!strain) return;

  try {
    await fetch(`/api/strains/${STATE.currentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: strain.status, notes }),
    });
    strain.notes = notes;
    renderGrid();
    toast('Notes saved');
  } catch {
    toast('Failed to save notes');
  }
}

// ── Delete strain ─────────────────────────────────────────────
function confirmDelete() {
  if (!STATE.currentId) return;
  const strain = STATE.allStrains.find(s => s.id === STATE.currentId);
  if (!confirm(`Delete "${strain?.name}"? This cannot be undone.`)) return;
  deleteStrain();
}

async function deleteStrain() {
  if (!STATE.currentId) return;
  try {
    const res = await fetch(`/api/strains/${STATE.currentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    STATE.allStrains = STATE.allStrains.filter(s => s.id !== STATE.currentId);
    delete STATE.researchCache[STATE.currentId];
    closeDetailModal();
    renderGrid();
    toast('Strain removed');
  } catch {
    toast('Failed to delete strain');
  }
}
