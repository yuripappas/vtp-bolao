let _matches = [];
let _predictions = {}; // match_id → prediction

async function loadMatches() {
  _matches = await db.get('bolao_matches', {
    select: '*',
    order: 'match_date.asc'
  });
}

async function loadMyPredictions(participantId) {
  if (!participantId) return;
  const rows = await db.get('bolao_predictions', {
    select: '*',
    filter: `participant_id=eq.${participantId}`
  });
  _predictions = {};
  rows.forEach(r => _predictions[r.match_id] = r);
}

function renderMatchList(containerId, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const session = getSession();
  const now     = new Date();
  const filter  = opts.filter || 'all';

  let list = _matches;
  if (filter === 'brazil')               list = list.filter(m => m.is_brazil);
  else if (filter !== 'all')             list = list.filter(m => m.phase === filter);

  if (!list.length) {
    const labels = { brazil:'🇧🇷 Brasil', groups:'Grupos', r16:'Oitavas', qf:'Quartas', sf:'Semifinal', final:'Final' };
    el.innerHTML = `<div style="text-align:center;padding:var(--space-10);color:var(--fg-subtle);font-size:var(--text-sm)">
      ${filter === 'all' ? 'Nenhum jogo disponível ainda.' : `Nenhum jogo de ${labels[filter] || filter} cadastrado ainda.`}
    </div>`;
    return;
  }

  el.innerHTML = list.map(m => renderMatchCard(m, session, now)).join('');
}

function renderMatchCard(m, session, now) {
  const matchDate = new Date(m.match_date);
  const locked    = matchDate <= new Date(now.getTime() + 60 * 60 * 1000);
  const pred      = _predictions[m.id];
  const finished  = m.status === 'finished';
  const isBrazil  = m.is_brazil;

  // Status badge
  let statusHtml = '';
  if (finished)      statusHtml = `<span class="match-status-badge ms-finished">Encerrado</span>`;
  else if (locked)   statusHtml = `<span class="match-status-badge ms-locked">Bloqueado</span>`;
  else               statusHtml = `<span class="match-status-badge ms-open">Aberto</span>`;

  // Score / input block
  let scoreBlock = '';
  if (finished) {
    scoreBlock = `<div class="result-display">
      <span class="result-score">${m.score_home}</span>
      <span class="result-sep">×</span>
      <span class="result-score">${m.score_away}</span>
    </div>`;
  } else if (locked) {
    scoreBlock = `<div class="result-display" style="opacity:.35">
      <span class="result-score">?</span>
      <span class="result-sep">×</span>
      <span class="result-score">?</span>
    </div>`;
  } else {
    const hv = pred ? pred.pred_home : '';
    const av = pred ? pred.pred_away : '';
    scoreBlock = `<div class="score-inputs">
      <input class="score-input" type="number" min="0" max="99" placeholder="0" value="${hv}" data-side="home" inputmode="numeric">
      <span class="score-sep">×</span>
      <input class="score-input" type="number" min="0" max="99" placeholder="0" value="${av}" data-side="away" inputmode="numeric">
    </div>`;
  }

  // Palpitar button
  let actionHtml = '';
  if (!finished && !locked) {
    const hasPred = !!pred;
    actionHtml = `<button class="btn-palpitar ${hasPred ? 'saved' : ''}"
        id="palpitar-${m.id}"
        onclick="handlePalpitar('${m.id}')">
      ${hasPred ? `✓ Palpite salvo — atualizar` : 'Palpitar'}
    </button>`;
  }

  // Result status
  let predStatusHtml = '';
  if (finished && pred) {
    if (pred.is_exact) {
      predStatusHtml = `<div class="pred-status pred-exact">🎯 Placar exato! +${pred.points_earned} pontos${isBrazil ? ' (Brasil ×3)' : ''}</div>`;
    } else if (pred.points_earned > 0) {
      predStatusHtml = `<div class="pred-status pred-partial">✓ Acertou o resultado. +${pred.points_earned} pontos</div>`;
    } else if (pred.id) {
      predStatusHtml = `<div class="pred-status pred-miss">Não acertou desta vez.</div>`;
    }
  } else if (!finished && pred && locked) {
    predStatusHtml = `<div class="pred-status pred-pending">Seu palpite: ${pred.pred_home} × ${pred.pred_away}</div>`;
  }

  return `
    <div class="match-card ${isBrazil ? 'brazil' : ''} ${finished ? 'finished' : ''}"
         data-id="${m.id}">
      ${isBrazil && !finished ? `<div class="brazil-badge">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Jogo do Brasil — Pontos ×3 e R$30 no placar exato!
      </div>` : ''}
      <div class="match-header">
        <div class="match-meta">
          <span class="match-phase-badge">${m.phase_label}</span>
          <span class="match-date-str">${fmtDate(m.match_date)}</span>
        </div>
        ${statusHtml}
      </div>
      <div class="match-teams">
        <div class="team">
          <div class="team-flag">${m.home_flag || '🏳'}</div>
          <div class="team-name">${m.home_team}</div>
        </div>
        <div class="vs-block">${scoreBlock}</div>
        <div class="team">
          <div class="team-flag">${m.away_flag || '🏳'}</div>
          <div class="team-name">${m.away_team}</div>
        </div>
      </div>
      ${actionHtml}
      ${predStatusHtml}
    </div>`;
}

function handlePalpitar(matchId) {
  const card = document.querySelector(`.match-card[data-id="${matchId}"]`);
  if (!card) return;
  const h = card.querySelector('[data-side="home"]')?.value;
  const a = card.querySelector('[data-side="away"]')?.value;

  if (h === '' || a === '') {
    toast('Preencha o placar antes de palpitar', 'warn');
    return;
  }

  const session = getSession();
  if (session) {
    savePrediction(matchId, +h, +a);
  } else {
    const pending = getPending().filter(p => p.match_id !== matchId);
    pending.push({ match_id: matchId, pred_home: +h, pred_away: +a });
    setPending(pending);

    const btn = document.getElementById('palpitar-' + matchId);
    if (btn) {
      btn.classList.add('saved');
      btn.textContent = '✓ Palpite salvo — cadastre-se para pontuar';
    }
    toast('Palpite salvo! Cadastre-se para pontuar.', 'ok');
  }
}

async function savePrediction(matchId, home, away) {
  const session = getSession();
  if (!session) return;

  const btn = document.getElementById('palpitar-' + matchId);
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const existing = _predictions[matchId];
    if (existing) {
      await db.update('bolao_predictions', `id=eq.${existing.id}`, { pred_home: home, pred_away: away });
      _predictions[matchId] = { ...existing, pred_home: home, pred_away: away };
    } else {
      const rows = await db.insert('bolao_predictions', {
        participant_id: session.id,
        match_id: matchId,
        pred_home: home,
        pred_away: away
      });
      _predictions[matchId] = rows[0];
    }
    toast('Palpite salvo!', 'ok');
    if (btn) {
      btn.disabled = false;
      btn.classList.add('saved');
      btn.textContent = '✓ Palpite salvo — atualizar';
    }
  } catch (e) {
    toast('Erro ao salvar palpite', 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Palpitar'; }
  }
}

async function flushPendingPredictions(participantId) {
  const pending = getPending();
  if (!pending.length) return;
  for (const p of pending) {
    try {
      await db.insert('bolao_predictions', {
        participant_id: participantId,
        match_id: p.match_id,
        pred_home: p.pred_home,
        pred_away: p.pred_away
      });
    } catch (_) {}
  }
  clearPending();
}
