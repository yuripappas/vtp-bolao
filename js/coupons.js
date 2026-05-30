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
      const value    = isFixed ? `R$${Number(c.discount_brl).toFixed(0)}` : `${c.discount_pct}%`;
      const desc     = isFixed
        ? `Desconto fixo — Placar exato jogo do Brasil`
        : `${c.discount_pct}% de desconto na sua próxima pizza`;
      return `
        <div class="coupon-card ${redeemed ? 'redeemed' : ''} ${isFixed ? 'fixed' : ''}">
          <div class="coupon-value">${value}</div>
          <div class="coupon-info">
            <div class="coupon-code">${c.code}</div>
            <div class="coupon-desc">${desc}</div>
            ${redeemed
              ? `<div style="font-size:11px;color:var(--gray-500);margin-top:4px">Resgatado em ${fmtDate(c.redeemed_at)}</div>`
              : `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">Disponível — apresente na pizzaria</div>`
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

  const steps = [
    { count: 1, pct: '10%' },
    { count: 2, pct: '20%' },
    { count: 3, pct: '30%' },
    { count: 4, pct: '40%' },
    { count: 5, pct: '50%' }
  ];

  el.innerHTML = `
    <div class="coupon-progress">
      <div class="progress-title">Desconto progressivo por placares exatos</div>
      <div class="progress-steps">
        ${steps.map(s => {
          const done   = exactCount >= s.count;
          const active = exactCount === s.count - 1;
          return `<div class="prog-step">
            <div class="prog-dot ${done ? 'done' : active ? 'active' : ''}">${s.pct}</div>
            <div class="prog-label ${done ? 'done' : ''}">${s.count} acerto${s.count > 1 ? 's' : ''}</div>
          </div>`;
        }).join('')}
      </div>
      ${exactCount >= 5
        ? `<p style="text-align:center;font-size:12px;color:var(--green);font-weight:700;margin-top:12px">Parabéns! Você atingiu o desconto máximo de 50%!</p>`
        : `<p style="text-align:center;font-size:12px;color:var(--gray-500);margin-top:12px">
            Próximo cupom: <strong>${nextCouponPct(exactCount)}% de desconto</strong> no ${exactCount + 1}º placar exato
           </p>`
      }
    </div>`;
}
