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
  const now = new Date();

  // Filtra por fase se pedido
  let list = _matches;
  if (opts.phase) list = list.filter(m => m.phase === opts.phase);
  if (opts.status) list = list.filter(m => m.status === opts.status);

  if (!list.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray-500);font-size:14px;">Nenhum jogo disponível ainda.</div>`;
    return;
  }

  el.innerHTML = list.map(m => renderMatchCard(m, session, now, opts.readonly)).join('');

  // Bind inputs
  el.querySelectorAll('.score-input').forEach(inp => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 2);
    });
    inp.addEventListener('change', () => onPredictionChange(inp.closest('.match-card').dataset.id));
  });
}

function renderMatchCard(m, session, now, readonly) {
  const locked = new Date(m.match_date) <= new Date(now.getTime() + 60 * 60 * 1000); // trava 1h antes
  const pred = _predictions[m.id];
  const finished = m.status === 'finished';
  const isBrazil = m.is_brazil;

  let predStatusHtml = '';
  if (finished && pred) {
    if (pred.is_exact) {
      const pts = pred.points_earned;
      predStatusHtml = `<div class="pred-status pred-exact">Placar exato! +${pts} pontos ${isBrazil ? '(Brasil x3)' : ''}</div>`;
    } else if (pred.points_earned > 0) {
      predStatusHtml = `<div class="pred-status pred-partial">Acertou o resultado. +${pred.points_earned} pontos</div>`;
    } else if (pred.points_earned === 0 && pred.id) {
      predStatusHtml = `<div class="pred-status pred-miss">Não acertou desta vez.</div>`;
    }
  } else if (!finished && pred) {
    predStatusHtml = `<div class="pred-status pred-pending">Palpite salvo: ${pred.pred_home} x ${pred.pred_away}</div>`;
  } else if (!finished && !locked && !session) {
    predStatusHtml = `<div class="pred-status pred-pending" style="color:var(--purple)">Faça seu palpite e cadastre-se para pontuar</div>`;
  }

  const homeVal = pred ? pred.pred_home : '';
  const awayVal = pred ? pred.pred_away : '';

  const scoreBlock = finished
    ? `<div class="match-result">
        <span class="result-score">${m.score_home}</span>
        <span class="result-sep">x</span>
        <span class="result-score">${m.score_away}</span>
       </div>`
    : (readonly || locked)
      ? `<div class="match-result" style="opacity:.4">
          <span class="result-score">?</span>
          <span class="result-sep">x</span>
          <span class="result-score">?</span>
         </div>`
      : `<div class="score-inputs">
          <input class="score-input" type="number" min="0" max="99" placeholder="0" value="${homeVal}" data-side="home">
          <span class="score-sep">x</span>
          <input class="score-input" type="number" min="0" max="99" placeholder="0" value="${awayVal}" data-side="away">
         </div>`;

  return `
    <div class="match-card ${isBrazil ? 'brazil' : ''} ${finished ? 'finished' : ''} ${locked && !finished ? 'locked' : ''}"
         data-id="${m.id}">
      ${isBrazil ? `<div class="brazil-banner">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Jogo do Brasil — Pontos x3 e cupom R$30 no placar exato!
      </div>` : ''}
      <div class="match-header">
        <span class="match-phase">${m.phase_label}</span>
        <span class="match-date">${fmtDate(m.match_date)}</span>
      </div>
      <div class="match-teams">
        <div class="team">
          <div class="team-flag">${m.home_flag || '🏳'}</div>
          <div class="team-name">${m.home_team}</div>
        </div>
        <div class="vs-block">
          ${scoreBlock}
          <div class="vs">VS</div>
        </div>
        <div class="team">
          <div class="team-flag">${m.away_flag || '🏳'}</div>
          <div class="team-name">${m.away_team}</div>
        </div>
      </div>
      ${predStatusHtml}
    </div>`;
}

function onPredictionChange(matchId) {
  const card = document.querySelector(`.match-card[data-id="${matchId}"]`);
  if (!card) return;
  const h = card.querySelector('[data-side="home"]')?.value;
  const a = card.querySelector('[data-side="away"]')?.value;
  if (h === '' || a === '') return;

  const session = getSession();
  if (session) {
    savePrediction(matchId, +h, +a);
  } else {
    // Salva pendente para após cadastro
    const pending = getPending().filter(p => p.match_id !== matchId);
    pending.push({ match_id: matchId, pred_home: +h, pred_away: +a });
    setPending(pending);
  }
}

async function savePrediction(matchId, home, away) {
  const session = getSession();
  if (!session) return;
  try {
    const existing = _predictions[matchId];
    if (existing) {
      await db.update('bolao_predictions', `id=eq.${existing.id}`, { pred_home: home, pred_away: away });
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
  } catch (e) {
    toast('Erro ao salvar palpite', 'err');
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
