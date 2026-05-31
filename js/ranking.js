async function loadRanking(containerId, limit = 10) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<div style="text-align:center;padding:var(--space-6);color:var(--fg-subtle);font-size:var(--text-sm)">Carregando...</div>`;

  try {
    const rows = await db.get('bolao_participants', {
      select: 'id,name,total_points,exact_scores',
      order: 'total_points.desc,exact_scores.desc',
      limit
    });

    if (!rows.length) {
      el.innerHTML = `<div style="text-align:center;padding:var(--space-6);color:var(--fg-subtle);font-size:var(--text-sm)">Nenhum participante ainda. Seja o primeiro!</div>`;
      return;
    }

    const session = getSession();
    el.innerHTML = rows.map((p, i) => {
      const pos   = i + 1;
      const isMe  = session && session.id === p.id;
      const posLbl = `${pos}º`;
      const posClass = pos <= 3 ? `top${pos}` : '';
      return `<div class="rank-item ${isMe ? 'is-me' : ''}">
        <div class="rank-pos ${posClass}">${posLbl}</div>
        <div class="rank-name">${p.name}${isMe ? ' <span style="color:var(--brand-orange);font-size:10px">(você)</span>' : ''}</div>
        <div>
          <div class="rank-pts">${p.total_points}<small> pts</small></div>
          <div class="rank-exact">${p.exact_scores} crav.</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<div style="text-align:center;padding:var(--space-4);color:var(--danger-fg);font-size:var(--text-sm)">Erro ao carregar ranking.</div>`;
  }
}

async function loadSidebarRanking() {
  await loadRanking('ranking-sidebar', 8);
}
