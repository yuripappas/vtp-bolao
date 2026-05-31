let _banners = [];
let _bannerIdx = 0;
let _bannerTimer = null;

// ── HERO IMAGE ────────────────────────────────────────────────────────────────

async function loadHeroImage() {
  try {
    const rows = await db.get('bolao_config', { select: 'value', filter: 'key=eq.hero_image_url' });
    if (!rows.length || !rows[0].value) return;
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    hero.classList.add('hero-image-mode');
    hero.innerHTML = `<img src="${rows[0].value}" alt="Banner Bolão Vai Ter Pizza">`;
  } catch (_) {}
}

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

function renderBannerSlideContent(b) {
  if (b.image_url) {
    return `<img src="${b.image_url}" alt="${b.title || 'Banner'}"
      style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit">`;
  }
  return `<div class="bc-inner">
    <div class="bc-emoji">${b.emoji || '⚽'}</div>
    <div class="bc-body">
      <div class="bc-title">${b.title}</div>
      ${b.subtitle ? `<div class="bc-sub">${b.subtitle}</div>` : ''}
    </div>
    ${b.cta_text ? `<button class="bc-cta">${b.cta_text}</button>` : ''}
  </div>`;
}

function renderCarousel(el) {
  el.innerHTML = `
    <div class="bc-wrap">
      <div class="bc-slides" id="bc-slides">
        ${_banners.map((b, i) => `
          <div class="bc-slide ${i === 0 ? 'active' : ''}" style="${b.image_url ? '' : `background:${b.bg_gradient}`}" data-i="${i}">
            ${renderBannerSlideContent(b)}
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

  let rows;
  try {
    rows = await db.get('bolao_banners', { select: '*', order: 'display_order.asc' });
  } catch (_) {
    el.innerHTML = `<div style="color:var(--danger-fg);padding:var(--space-4);font-size:var(--text-sm)">Tabela de banners não encontrada. Execute o SQL de criação no Supabase primeiro.</div>`;
    return;
  }

  // Hero image section
  let heroUrl = '';
  try {
    const cfg = await db.get('bolao_config', { select: 'value', filter: 'key=eq.hero_image_url' });
    heroUrl = cfg[0]?.value || '';
  } catch (_) {}

  el.innerHTML = `
    <div class="card" style="margin-bottom:var(--space-5);padding:var(--space-5)">
      <div style="font-size:var(--text-sm);font-weight:var(--weight-bold);color:var(--fg);margin-bottom:var(--space-3)">
        Hero banner (imagem principal do site)
      </div>
      ${heroUrl
        ? `<img src="${heroUrl}" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius-lg);margin-bottom:var(--space-3);display:block">`
        : `<div style="background:var(--bg-subtle);border-radius:var(--radius-lg);height:80px;display:flex;align-items:center;justify-content:center;color:var(--fg-subtle);font-size:var(--text-sm);margin-bottom:var(--space-3)">Nenhuma imagem — exibindo hero padrão</div>`}
      <div style="display:flex;gap:var(--space-2);align-items:center">
        <input type="file" id="hero-file-input" accept="image/png,image/jpeg,image/webp"
          style="flex:1;font-size:var(--text-sm)" onchange="previewHeroFile(this)">
        <button class="btn btn-primary btn-sm" style="width:auto;white-space:nowrap" onclick="saveHeroImage()">Salvar hero</button>
        ${heroUrl ? `<button class="btn btn-ghost btn-sm" style="width:auto;color:var(--danger-fg);border-color:var(--danger-border)" onclick="removeHeroImage()">Remover</button>` : ''}
      </div>
      <div id="hero-img-preview" style="margin-top:var(--space-2)"></div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
      <div style="font-size:var(--text-sm);font-weight:var(--weight-bold);color:var(--fg)">Banners do carrossel</div>
      <button class="btn btn-primary btn-sm" style="width:auto" onclick="showAddBannerModal()">+ Novo banner</button>
    </div>
    ${rows.length === 0
      ? `<p style="color:var(--fg-subtle);font-size:var(--text-sm)">Nenhum banner cadastrado.</p>`
      : rows.map(b => `
          <div class="card" style="margin-bottom:var(--space-3);overflow:hidden">
            <div style="${b.image_url ? 'background:#000' : `background:${b.bg_gradient}`};border-radius:var(--radius-lg);margin-bottom:var(--space-4);overflow:hidden;min-height:80px">
              ${b.image_url
                ? `<img src="${b.image_url}" alt="${b.title}" style="width:100%;max-height:120px;object-fit:cover;display:block">`
                : `<div style="padding:var(--space-5);display:flex;align-items:center;gap:var(--space-4)">
                    <div style="font-size:36px;flex-shrink:0">${b.emoji || '⚽'}</div>
                    <div style="flex:1">
                      <div style="font-size:var(--text-lg);font-weight:var(--weight-extrabold);color:#fff;line-height:var(--leading-tight)">${b.title}</div>
                      ${b.subtitle ? `<div style="font-size:var(--text-sm);color:rgba(255,255,255,.75);margin-top:4px">${b.subtitle}</div>` : ''}
                    </div>
                    ${b.cta_text ? `<div style="background:rgba(255,255,255,.2);color:#fff;border-radius:var(--radius-lg);padding:8px 16px;font-size:var(--text-sm);font-weight:var(--weight-semibold);white-space:nowrap">${b.cta_text}</div>` : ''}
                  </div>`}
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
  const b = existing || { title:'', subtitle:'', cta_text:'', bg_gradient: GRADIENTS[0].val, emoji:'⚽', image_url:'', is_active:true, display_order:0 };

  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'banner-modal';
  el.innerHTML = `
    <div class="modal" style="max-width:560px">
      <div class="modal-title">${editing ? 'Editar banner' : 'Novo banner'}</div>

      <div class="field">
        <label>Imagem do banner <span style="font-weight:400;color:var(--fg-subtle)">(PNG/JPG — opcional, substitui gradiente)</span></label>
        <input type="file" class="inp" id="bm-imgfile" accept="image/png,image/jpeg,image/webp"
          style="padding:var(--space-2);cursor:pointer" onchange="previewBannerImage(this)">
        ${b.image_url
          ? `<div id="bm-imgpreview" style="margin-top:var(--space-2);border-radius:var(--radius-lg);overflow:hidden">
               <img src="${b.image_url}" style="width:100%;max-height:100px;object-fit:cover;display:block">
               <div style="font-size:var(--text-xs);color:var(--fg-subtle);margin-top:4px">Imagem atual — selecione um novo arquivo para substituir</div>
             </div>`
          : `<div id="bm-imgpreview" style="display:none"></div>`}
        <input type="hidden" id="bm-imgurl" value="${b.image_url || ''}">
      </div>
      <div id="bm-gradient-section">
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
      </div><!-- /bm-gradient-section -->

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

      <button class="btn btn-primary" onclick="submitBanner('${editing ? b.id : ''}')">
        ${editing ? 'Salvar alterações' : 'Adicionar banner'}
      </button>
      <button class="btn btn-ghost" style="margin-top:var(--space-2);width:100%" onclick="document.getElementById('banner-modal').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(el);

  toggleGradientSection();
}

// ── HERO ADMIN ────────────────────────────────────────────────────────────────

function previewHeroFile(input) {
  const file = input.files[0];
  const preview = document.getElementById('hero-img-preview');
  if (!file || !preview) return;
  preview.innerHTML = `<img src="${URL.createObjectURL(file)}"
    style="width:100%;max-height:140px;object-fit:cover;border-radius:var(--radius-lg);display:block">`;
}

async function saveHeroImage() {
  const input = document.getElementById('hero-file-input');
  const file  = input?.files?.[0];
  if (!file) return toast('Selecione uma imagem primeiro', 'warn');

  const btn = document.querySelector('[onclick="saveHeroImage()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  try {
    const url = await uploadBannerImage(file);
    await upsertConfig('hero_image_url', url);
    toast('Hero atualizado!', 'ok');
    adminLoadBanners();
  } catch (_) {
    toast('Erro ao salvar hero. Verifique se o bucket "banners" existe.', 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar hero'; }
  }
}

async function removeHeroImage() {
  if (!confirm('Remover a imagem do hero? O site voltará ao layout padrão com texto.')) return;
  await upsertConfig('hero_image_url', '');
  toast('Imagem removida', 'ok');
  adminLoadBanners();
}

async function upsertConfig(key, value) {
  const existing = await db.get('bolao_config', { select: 'id', filter: `key=eq.${key}` });
  if (existing.length) {
    await db.update('bolao_config', `key=eq.${key}`, { value });
  } else {
    await db.insert('bolao_config', { key, value });
  }
}

function toggleGradientSection() {
  const hasImg = document.getElementById('bm-imgurl')?.value?.trim() ||
                 document.getElementById('bm-imgfile')?.files?.length;
  const section = document.getElementById('bm-gradient-section');
  if (section) section.style.display = hasImg ? 'none' : '';
}

function previewBannerImage(input) {
  const file = input.files[0];
  const preview = document.getElementById('bm-imgpreview');
  if (!file || !preview) return;
  const url = URL.createObjectURL(file);
  preview.style.display = '';
  preview.innerHTML = `<img src="${url}" style="width:100%;max-height:100px;object-fit:cover;display:block;border-radius:var(--radius-lg)">`;
  document.getElementById('bm-imgurl').value = '';
  toggleGradientSection();
}

async function uploadBannerImage(file) {
  const ext  = file.name.split('.').pop().toLowerCase();
  const name = `banner-${Date.now()}.${ext}`;
  const r = await fetch(`${BOLAO_URL}/storage/v1/object/banners/${name}`, {
    method: 'POST',
    headers: { 'apikey': BOLAO_KEY, 'Authorization': `Bearer ${BOLAO_KEY}`, 'Content-Type': file.type },
    body: file
  });
  if (!r.ok) throw new Error('Erro no upload da imagem');
  return `${BOLAO_URL}/storage/v1/object/public/banners/${name}`;
}

function selectGrad(btn, val) {
  document.querySelectorAll('.grad-opt').forEach(b => b.style.borderColor = 'transparent');
  btn.style.borderColor = '#fff';
  document.getElementById('bm-gradient').value = val;
}

async function showEditBannerModal(id) {
  const rows = await db.get('bolao_banners', { select: '*', filter: `id=eq.${id}` });
  if (!rows.length) return;
  showAddBannerModal(rows[0]);
}

async function submitBanner(editId) {
  const fileInput = document.getElementById('bm-imgfile');
  const file      = fileInput?.files?.[0];
  let   image_url = document.getElementById('bm-imgurl')?.value?.trim() || null;
  const title    = document.getElementById('bm-title')?.value?.trim() || '';
  const subtitle = document.getElementById('bm-sub')?.value?.trim() || '';
  const cta_text = document.getElementById('bm-cta')?.value?.trim() || '';
  const emoji    = document.getElementById('bm-emoji')?.value?.trim() || '⚽';
  const gradient = document.getElementById('bm-gradient')?.value || GRADIENTS[0].val;
  const order    = parseInt(document.getElementById('bm-order').value) || 0;
  const active   = document.getElementById('bm-active').value === 'true';

  if (!file && !image_url && !title) return toast('Selecione uma imagem ou informe um título', 'warn');

  const btn = document.querySelector('#banner-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    if (file) image_url = await uploadBannerImage(file);
  } catch (_) {
    toast('Erro ao fazer upload da imagem. Verifique se o bucket "banners" existe no Supabase Storage.', 'err');
    if (btn) { btn.disabled = false; btn.textContent = editId ? 'Salvar alterações' : 'Adicionar banner'; }
    return;
  }

  const payload = {
    title: title || '', subtitle: subtitle || null, cta_text: cta_text || null,
    emoji, bg_gradient: gradient, image_url: image_url || null,
    display_order: order, is_active: active
  };

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
    if (btn) { btn.disabled = false; btn.textContent = editId ? 'Salvar alterações' : 'Adicionar banner'; }
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
