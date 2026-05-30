async function loadRanking(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500);font-size:14px;">Carregando ranking...</div>`;

  try {
    const rows = await db.get('bolao_participants', {
      select: 'id,name,total_points,exact_scores',
      order: 'total_points.desc,exact_scores.desc',
      limit: 10
    });

    if (!rows.length) {
      el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500);font-size:14px;">Nenhum participante ainda. Seja o primeiro!</div>`;
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const session = getSession();

    el.innerHTML = `<div class="ranking-list">
      ${rows.map((p, i) => {
        const pos = i + 1;
        const isMe = session && session.id === p.id;
        const posClass = pos <= 3 ? `pos-${pos}` : '';
        const medal = medals[i] || `${pos}º`;
        return `<div class="ranking-item ${posClass} ${isMe ? 'is-me' : ''}" style="${isMe ? 'box-shadow:0 0 0 2px var(--purple)' : ''}">
          <div class="rank-pos">${medal}</div>
          <div class="rank-name">${isMe ? '<strong>' : ''}${p.name}${isMe ? ' (você)</strong>' : ''}</div>
          <div class="rank-pts">${p.total_points} <span>pts</span></div>
        </div>`;
      }).join('')}
    </div>
    <p style="text-align:center;font-size:12px;color:var(--gray-500);margin-top:16px;">
      O 1º colocado no encerramento da Copa ganha <strong>1 pizza por mês durante 1 ano</strong> (retirada no local).
    </p>`;
  } catch (e) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--red);font-size:14px;">Erro ao carregar ranking.</div>`;
  }
}
