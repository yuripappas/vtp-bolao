async function loadMyCoupons(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const session = getSession();
  if (!session) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500);font-size:14px;">Faça seu cadastro para ver seus cupons.</div>`;
    return;
  }

  try {
    const coupons = await db.get('bolao_coupons', {
      select: '*,bolao_matches(home_team,away_team,is_brazil)',
      filter: `participant_id=eq.${session.id}`,
      order: 'issued_at.desc'
    });

    if (!coupons.length) {
      el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--gray-500);font-size:14px;">
        Nenhum cupom ainda. Acerte um placar para ganhar seu primeiro desconto!
      </div>`;
      return;
    }

    el.innerHTML = coupons.map(c => {
      const redeemed = !!c.redeemed_at;
      const isFixed  = c.type === 'fixed';
      const value    = isFixed ? `R$${Number(c.discount_brl).toFixed(0)} off` : `${c.discount_pct}% off`;
      const match    = c.bolao_matches;
      const matchStr = match ? `${match.home_team} x ${match.away_team}` : '';
      return `
        <div class="coupon-card ${redeemed ? 'redeemed' : ''} ${isFixed ? 'fixed' : ''}">
          <div class="coupon-value">${value}</div>
          <div class="coupon-info">
            <div class="coupon-code-big">${c.code}</div>
            <div class="coupon-desc">${matchStr ? `Placar exato: ${matchStr}` : ''}</div>
            ${redeemed
              ? `<div style="font-size:var(--text-xs);color:var(--fg-subtle);margin-top:var(--space-1)">Resgatado em ${fmtDate(c.redeemed_at)}</div>`
              : `<div style="font-size:var(--text-xs);color:var(--success-fg);font-weight:var(--weight-semibold);margin-top:var(--space-1)">Disponível — apresente na pizzaria</div>`
            }
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--red);font-size:14px;">Erro ao carregar cupons.</div>`;
  }
}

async function refreshMyStats() {
  const session = getSession();
  if (!session) return;

  try {
    const rows = await db.get('bolao_participants', {
      select: 'total_points,exact_scores',
      filter: `id=eq.${session.id}`
    });
    if (!rows.length) return;
    const p = rows[0];

    // Atualiza sessão local
    setSession({ ...session, ...p });

    // Stats cards
    const elPts    = document.getElementById('stat-points');
    const elExact  = document.getElementById('stat-exact');
    const elCoupon = document.getElementById('stat-coupon');

    if (elPts)    elPts.textContent    = p.total_points;
    if (elExact)  elExact.textContent  = p.exact_scores;
    if (elCoupon) elCoupon.textContent = couponPct(p.exact_scores) + '%';

    renderCouponProgress(p.exact_scores);
  } catch (_) {}
}

function renderCouponProgress(exactCount) {
  const el = document.getElementById('coupon-progress');
  if (!el) return;

  const currentPct = couponPct(exactCount);
  const next       = nextMilestone(exactCount);

  el.innerHTML = `
    <div class="milestone-progress">
      <div class="milestone-header">
        <span class="milestone-label">Seu nível atual</span>
        <span class="milestone-pct">${currentPct > 0 ? currentPct + '% de desconto desbloqueado' : 'Nenhum nível atingido ainda'}</span>
      </div>
      <div class="milestone-levels">
        ${COUPON_MILESTONES.slice().reverse().map(m => {
          const done    = exactCount >= m.at;
          const isCurr  = currentPct === m.pct && done;
          return `<div class="milestone-level ${done ? 'done' : ''} ${isCurr ? 'current' : ''}">
            <div class="ml-icon">${lc(m.icon, 18, done ? 'var(--brand-orange)' : 'var(--fg-subtle)')}</div>
            <div class="ml-body">
              <div class="ml-name">${m.level}</div>
              <div class="ml-goal">${m.at} placares exatos</div>
            </div>
            <div class="ml-reward">${m.pct}% off</div>
            ${done ? '<div class="ml-badge">✓</div>' : ''}
          </div>`;
        }).join('')}
      </div>
      ${next
        ? `<div class="milestone-next">
            Faltam <strong>${next.at - exactCount}</strong> placar${next.at - exactCount > 1 ? 'es' : ''} exato${next.at - exactCount > 1 ? 's' : ''} para desbloquear
            <strong>${next.icon} ${next.level} (${next.pct}% off)</strong>
           </div>`
        : `<div class="milestone-next" style="color:var(--brand-orange);font-weight:var(--weight-bold)">
            Parabéns! Você atingiu o nível máximo — 50% de desconto!
           </div>`
      }
    </div>`;
}
