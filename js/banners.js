let _banners = [];
let _bannerIdx = 0;
let _bannerTimer = null;

async function loadBanners() {
  const el = document.getElementById('banner-carousel');
  if (!el) return;

  try {
    _banners = await db.get('bolao_banners', {
      select: '*',
      filter: 'is_active=eq.true',
      order: 'display_order.asc'
    });
    if (!_banners.length) { el.style.display = 'none'; return; }
    renderCarousel(el);
    if (_banners.length > 1) startTimer();
  } catch (_) {
    el.style.display = 'none';
  }
}

function renderCarousel(el) {
  el.innerHTML = `
    <div class="bc-wrap">
      <div class="bc-slides" id="bc-slides">
        ${_banners.map((b, i) => `
          <div class="bc-slide ${i === 0 ? 'active' : ''}" style="background:${b.bg_gradient}" data-i="${i}">
            <div class="bc-inner">
              <div class="bc-emoji">${b.emoji || '⚽'}</div>
              <div class="bc-body">
                <div class="bc-title">${b.title}</div>
                ${b.subtitle ? `<div class="bc-sub">${b.subtitle}</div>` : ''}
              </div>
              ${b.cta_text ? `<button class="bc-cta">${b.cta_text}</button>` : ''}
            </div>
          </div>`).join('')}
      </div>

      ${_banners.length > 1 ? `
        <button class="bc-arrow bc-prev" onclick="bannerNav(-1)" aria-label="Anterior">&#8249;</button>
        <button class="bc-arrow bc-next" onclick="bannerNav(1)"  aria-label="Próximo">&#8250;</button>
        <div class="bc-dots">
          ${_banners.map((_, i) => `
            <button class="bc-dot ${i === 0 ? 'active' : ''}" onclick="bannerGo(${i})" aria-label="Banner ${i+1}"></button>
          `).join('')}
        </div>` : ''}
    </div>`;
}

function updateCarousel() {
  document.querySelectorAll('.bc-slide').forEach((s, i) =>
    s.classList.toggle('active', i === _bannerIdx));
  document.querySelectorAll('.bc-dot').forEach((d, i) =>
    d.classList.toggle('active', i === _bannerIdx));
}

function bannerNav(dir) {
  _bannerIdx = (_bannerIdx + dir + _banners.length) % _banners.length;
  updateCarousel();
  resetTimer();
}

function bannerGo(i) {
  _bannerIdx = i;
  updateCarousel();
  resetTimer();
}

function startTimer() {
  _bannerTimer = setInterval(() => bannerNav(1), 5000);
}

function resetTimer() {
  if (_bannerTimer) clearInterval(_bannerTimer);
  if (_banners.length > 1) startTimer();
}

// ── ADMIN BANNER MANAGEMENT ───────────────────────────────────────────────────

const GRADIENTS = [
  { label: 'Roxo VTP',     val: 'linear-gradient(135deg, #6B21D4 0%, #9333EA 100%)' },
  { label: 'Aurora VTP',   val: 'linear-gradient(135deg, #6B21D4 0%, #9333EA 55%, #F5A800 100%)' },
  { label: 'Laranja',      val: 'linear-gradient(135deg, #D97706 0%, #F5A800 100%)' },
  { label: 'Verde Brasil', val: 'linear-gradient(135deg, #166534 0%, #16A34A 100%)' },
  { label: 'Noite VTP',    val: 'linear-gradient(135deg, #1A0A2E 0%, #4C1D95 50%, #6B21D4 100%)' },
  { label: 'Vermelho',     val: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)' },
];

async function adminLoadBanners() {
  const el = document.getElementById('tab-banners');
  if (!el) return;
  el.innerHTML = `<div style="color:var(--fg-subtle);padding:var(--space-4);font-size:var(--text-sm)">Carregando...</div>`;

  const rows = await db.get('bolao_banners', { select: '*', order: 'display_order.asc' });

  el.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-4)">
      <button class="btn btn-primary btn-sm" style="width:auto" onclick="showAddBannerModal()">+ Novo banner</button>
    </div>
    ${rows.length === 0
      ? `<p style="color:var(--fg-subtle);font-size:var(--text-sm)">Nenhum banner cadastrado.</p>`
      : rows.map(b => `
          <div class="card" style="margin-bottom:var(--space-3);overflow:hidden">
            <div style="background:${b.bg_gradient};padding:var(--space-5);border-radius:var(--radius-lg);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-4)">
              <div style="font-size:36px;flex-shrink:0">${b.emoji || '⚽'}</div>
              <div style="flex:1">
                <div style="font-size:var(--text-lg);font-weight:var(--weight-extrabold);color:#fff;line-height:var(--leading-tight)">${b.title}</div>
                ${b.subtitle ? `<div style="font-size:var(--text-sm);color:rgba(255,255,255,.75);margin-top:4px">${b.subtitle}</div>` : ''}
              </div>
              ${b.cta_text ? `<div style="background:rgba(255,255,255,.2);color:#fff;border-radius:var(--radius-lg);padding:8px 16px;font-size:var(--text-sm);font-weight:var(--weight-semibold);white-space:nowrap">${b.cta_text}</div>` : ''}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <span class="badge ${b.is_active ? 'badge-success' : 'badge-neutral'}">${b.is_active ? 'Ativo' : 'Inativo'}</span>
                <span style="font-size:var(--text-xs);color:var(--fg-subtle)">Ordem: ${b.display_order}</span>
              </div>
              <div style="display:flex;gap:var(--space-2)">
                <button class="btn btn-ghost btn-sm" onclick="showEditBannerModal('${b.id}')">Editar</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger-fg);border-color:var(--danger-border)"
                  onclick="deleteBanner('${b.id}')">Excluir</button>
              </div>
            </div>
          </div>`).join('')}`;
}

function showAddBannerModal(existing) {
  const editing = !!existing;
  const b = existing || { title:'', subtitle:'', cta_text:'', bg_gradient: GRADIENTS[0].val, emoji:'⚽', is_active:true, display_order:0 };

  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'banner-modal';
  el.innerHTML = `
    <div class="modal" style="max-width:560px">
      <div class="modal-title">${editing ? 'Editar banner' : 'Novo banner'}</div>

      <div class="field">
        <label>Título</label>
        <input class="inp" id="bm-title" value="${b.title}" placeholder="Ex: Crave o placar, ganhe desconto!">
      </div>
      <div class="field">
        <label>Subtítulo <span style="font-weight:400;color:var(--fg-subtle)">(opcional)</span></label>
        <input class="inp" id="bm-sub" value="${b.subtitle || ''}" placeholder="Descrição complementar">
      </div>
      <div class="field">
        <label>Emoji decorativo</label>
        <input class="inp" id="bm-emoji" value="${b.emoji || '⚽'}" placeholder="⚽" style="font-size:24px;width:80px">
      </div>
      <div class="field">
        <label>Texto do botão <span style="font-weight:400;color:var(--fg-subtle)">(opcional)</span></label>
        <input class="inp" id="bm-cta" value="${b.cta_text || ''}" placeholder="Ex: Palpitar agora">
      </div>
      <div class="field">
        <label>Gradiente de fundo</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2);margin-top:var(--space-1)">
          ${GRADIENTS.map((g, i) => `
            <button class="grad-opt ${b.bg_gradient === g.val ? 'selected' : ''}"
              onclick="selectGrad(this,'${g.val.replace(/'/g, "\\'")}')"
              style="background:${g.val};height:48px;border-radius:var(--radius-md);border:2px solid ${b.bg_gradient === g.val ? '#fff' : 'transparent'};cursor:pointer;font-size:var(--text-xs);color:#fff;font-weight:var(--weight-semibold);outline:none">
              ${g.label}
            </button>`).join('')}
        </div>
        <input type="hidden" id="bm-gradient" value="${b.bg_gradient}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        <div class="field">
          <label>Ordem</label>
          <input class="inp" id="bm-order" type="number" min="0" value="${b.display_order}">
        </div>
        <div class="field">
          <label>Status</label>
          <select class="inp" id="bm-active">
            <option value="true"  ${b.is_active ? 'selected' : ''}>Ativo</option>
            <option value="false" ${!b.is_active ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>

      <!-- Preview -->
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--fg-muted);display:block;margin-bottom:var(--space-2)">Preview</label>
        <div id="bm-preview" style="background:${b.bg_gradient};border-radius:var(--radius-lg);padding:var(--space-5);display:flex;align-items:center;gap:var(--space-4)">
          <div id="bm-prev-emoji" style="font-size:36px">${b.emoji || '⚽'}</div>
          <div style="flex:1">
            <div id="bm-prev-title" style="font-weight:var(--weight-extrabold);color:#fff;font-size:var(--text-lg)">${b.title || 'Título do banner'}</div>
            <div id="bm-prev-sub"   style="color:rgba(255,255,255,.75);font-size:var(--text-sm);margin-top:2px">${b.subtitle || ''}</div>
          </div>
          <div id="bm-prev-cta" style="background:rgba(255,255,255,.2);color:#fff;border-radius:var(--radius-lg);padding:8px 16px;font-size:var(--text-sm);font-weight:var(--weight-semibold);${b.cta_text ? '' : 'display:none'}">${b.cta_text || ''}</div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="submitBanner('${editing ? b.id : ''}')">
        ${editing ? 'Salvar alterações' : 'Adicionar banner'}
      </button>
      <button class="btn btn-ghost" style="margin-top:var(--space-2);width:100%" onclick="document.getElementById('banner-modal').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(el);

  // Live preview
  const sync = () => {
    document.getElementById('bm-prev-title').textContent = document.getElementById('bm-title').value || 'Título do banner';
    document.getElementById('bm-prev-sub').textContent   = document.getElementById('bm-sub').value;
    const cta = document.getElementById('bm-cta').value;
    const ctaEl = document.getElementById('bm-prev-cta');
    ctaEl.textContent = cta; ctaEl.style.display = cta ? '' : 'none';
    document.getElementById('bm-prev-emoji').textContent = document.getElementById('bm-emoji').value || '⚽';
  };
  ['bm-title','bm-sub','bm-cta','bm-emoji'].forEach(id =>
    document.getElementById(id).addEventListener('input', sync));
}

function selectGrad(btn, val) {
  document.querySelectorAll('.grad-opt').forEach(b => b.style.borderColor = 'transparent');
  btn.style.borderColor = '#fff';
  document.getElementById('bm-gradient').value = val;
  document.getElementById('bm-preview').style.background = val;
}

async function showEditBannerModal(id) {
  const rows = await db.get('bolao_banners', { select: '*', filter: `id=eq.${id}` });
  if (!rows.length) return;
  showAddBannerModal(rows[0]);
}

async function submitBanner(editId) {
  const title    = document.getElementById('bm-title').value.trim();
  const subtitle = document.getElementById('bm-sub').value.trim();
  const cta_text = document.getElementById('bm-cta').value.trim();
  const emoji    = document.getElementById('bm-emoji').value.trim();
  const gradient = document.getElementById('bm-gradient').value;
  const order    = parseInt(document.getElementById('bm-order').value) || 0;
  const active   = document.getElementById('bm-active').value === 'true';

  if (!title) return toast('Informe o título do banner', 'warn');

  const payload = { title, subtitle: subtitle || null, cta_text: cta_text || null,
                    emoji, bg_gradient: gradient, display_order: order, is_active: active };

  try {
    if (editId) {
      await db.update('bolao_banners', `id=eq.${editId}`, payload);
      toast('Banner atualizado!', 'ok');
    } else {
      await db.insert('bolao_banners', payload);
      toast('Banner adicionado!', 'ok');
    }
    document.getElementById('banner-modal')?.remove();
    adminLoadBanners();
  } catch (e) {
    toast('Erro ao salvar banner', 'err');
  }
}

async function deleteBanner(id) {
  if (!confirm('Excluir este banner?')) return;
  try {
    await fetch(`${BOLAO_URL}/rest/v1/bolao_banners?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': BOLAO_KEY, 'Authorization': `Bearer ${BOLAO_KEY}` }
    });
    toast('Banner excluído', 'ok');
    adminLoadBanners();
  } catch (e) {
    toast('Erro ao excluir', 'err');
  }
}
