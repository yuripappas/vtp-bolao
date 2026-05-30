const ADMIN_PASS = 'vtp2026'; // Trocar por senha forte antes de ir ao ar

let _adminAuthed = false;

function adminInit() {
  const saved = sessionStorage.getItem('bolao_admin');
  if (saved === ADMIN_PASS) {
    _adminAuthed = true;
    showAdminPanel();
  } else {
    showAdminLogin();
  }
}

function showAdminLogin() {
  document.getElementById('admin-content').innerHTML = `
    <div style="max-width:360px;margin:80px auto;padding:0 16px">
      <div class="card">
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">Admin Bolão</h2>
        <p style="font-size:14px;color:var(--gray-500);margin-bottom:20px">Área restrita</p>
        <div class="field">
          <label>Senha</label>
          <input class="inp" id="admin-pass-inp" type="password" placeholder="Senha de acesso">
        </div>
        <button class="btn btn-primary" onclick="adminLogin()">Entrar</button>
      </div>
    </div>`;
}

function adminLogin() {
  const v = document.getElementById('admin-pass-inp').value;
  if (v === ADMIN_PASS) {
    sessionStorage.setItem('bolao_admin', v);
    _adminAuthed = true;
    showAdminPanel();
  } else {
    toast('Senha incorreta', 'err');
  }
}

async function showAdminPanel() {
  document.getElementById('admin-content').innerHTML = `
    <div class="container" style="padding-top:24px;padding-bottom:48px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <h1 style="font-size:22px;font-weight:800">Bolão Copa — Admin</h1>
        <button class="btn btn-ghost btn-sm" onclick="showAddMatchModal()">+ Novo jogo</button>
      </div>
      <div class="tabs">
        <button class="tab active" onclick="adminTab(this,'tab-matches')">Jogos</button>
        <button class="tab" onclick="adminTab(this,'tab-ranking')">Ranking</button>
        <button class="tab" onclick="adminTab(this,'tab-coupons')">Cupons</button>
      </div>
      <div id="tab-matches"></div>
      <div id="tab-ranking"  style="display:none"></div>
      <div id="tab-coupons"  style="display:none"></div>
    </div>`;
  await adminLoadMatches();
}

function adminTab(btn, tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('[id^="tab-"]').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = '';
  if (tabId === 'tab-ranking') adminLoadRanking();
  if (tabId === 'tab-coupons') adminLoadCoupons();
}

async function adminLoadMatches() {
  const el = document.getElementById('tab-matches');
  if (!el) return;
  el.innerHTML = `<div style="color:var(--gray-500);padding:16px;font-size:14px">Carregando...</div>`;

  const matches = await db.get('bolao_matches', { select: '*', order: 'match_date.asc' });

  if (!matches.length) {
    el.innerHTML = `<div style="color:var(--gray-500);padding:16px;font-size:14px">Nenhum jogo cadastrado.</div>`;
    return;
  }

  el.innerHTML = matches.map(m => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:700;font-size:15px">${m.home_flag||''} ${m.home_team} x ${m.away_team} ${m.away_flag||''}</div>
          <div style="font-size:12px;color:var(--gray-500)">${m.phase_label} · ${fmtDate(m.match_date)} ${m.is_brazil ? '· 🇧🇷 Jogo do Brasil' : ''}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${m.status === 'finished'
            ? `<span class="badge badge-green">Encerrado ${m.score_home}x${m.score_away}</span>`
            : `<button class="btn btn-sm btn-primary" onclick="showCloseMatchModal('${m.id}','${m.home_team}','${m.away_team}')">Encerrar</button>`
          }
        </div>
      </div>
    </div>`).join('');
}

function showAddMatchModal() {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'add-match-overlay';
  el.innerHTML = `
    <div class="modal">
      <div class="modal-title">Novo jogo</div>
      <div class="field"><label>Time da casa</label><input class="inp" id="am-home" placeholder="Brasil"></div>
      <div class="field"><label>Bandeira (emoji)</label><input class="inp" id="am-home-flag" placeholder="🇧🇷"></div>
      <div class="field"><label>Time visitante</label><input class="inp" id="am-away" placeholder="Argentina"></div>
      <div class="field"><label>Bandeira (emoji)</label><input class="inp" id="am-away-flag" placeholder="🇦🇷"></div>
      <div class="field"><label>Fase</label>
        <select class="inp" id="am-phase">
          <option value="groups">Fase de Grupos</option>
          <option value="r16">Oitavas de Final</option>
          <option value="qf">Quartas de Final</option>
          <option value="sf">Semifinal</option>
          <option value="final">Final</option>
        </select>
      </div>
      <div class="field"><label>Data e hora</label><input class="inp" id="am-date" type="datetime-local"></div>
      <div class="field" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="am-brazil" style="width:18px;height:18px;accent-color:var(--purple)">
        <label for="am-brazil" style="font-size:14px;font-weight:600;cursor:pointer">Jogo do Brasil (pontos x3)</label>
      </div>
      <button class="btn btn-primary" onclick="submitAddMatch()">Adicionar jogo</button>
      <button class="btn btn-ghost" style="margin-top:8px;width:100%" onclick="document.getElementById('add-match-overlay').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(el);
}

const PHASE_LABELS = { groups: 'Fase de Grupos', r16: 'Oitavas de Final', qf: 'Quartas de Final', sf: 'Semifinal', final: 'Final' };

async function submitAddMatch() {
  const home      = document.getElementById('am-home').value.trim();
  const away      = document.getElementById('am-away').value.trim();
  const homeFlag  = document.getElementById('am-home-flag').value.trim();
  const awayFlag  = document.getElementById('am-away-flag').value.trim();
  const phase     = document.getElementById('am-phase').value;
  const dateVal   = document.getElementById('am-date').value;
  const isBrazil  = document.getElementById('am-brazil').checked;

  if (!home || !away || !dateVal) return toast('Preencha todos os campos obrigatórios', 'warn');

  try {
    await db.insert('bolao_matches', {
      home_team: home, away_team: away,
      home_flag: homeFlag, away_flag: awayFlag,
      phase, phase_label: PHASE_LABELS[phase],
      match_date: new Date(dateVal).toISOString(),
      is_brazil: isBrazil
    });
    toast('Jogo adicionado!', 'ok');
    document.getElementById('add-match-overlay')?.remove();
    adminLoadMatches();
  } catch (e) {
    toast('Erro ao adicionar jogo', 'err');
  }
}

function showCloseMatchModal(matchId, home, away) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'close-match-overlay';
  el.innerHTML = `
    <div class="modal">
      <div class="modal-title">Encerrar jogo</div>
      <div class="modal-sub">${home} x ${away}</div>
      <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:24px">
        <div class="field" style="margin:0;text-align:center">
          <label>${home}</label>
          <input class="score-input" id="close-home" type="number" min="0" max="99" placeholder="0" style="margin:8px auto 0;display:block">
        </div>
        <span style="font-size:24px;font-weight:700;color:var(--gray-300);padding-top:20px">x</span>
        <div class="field" style="margin:0;text-align:center">
          <label>${away}</label>
          <input class="score-input" id="close-away" type="number" min="0" max="99" placeholder="0" style="margin:8px auto 0;display:block">
        </div>
      </div>
      <button class="btn btn-primary" onclick="submitCloseMatch('${matchId}')">Encerrar e calcular pontos</button>
      <button class="btn btn-ghost" style="margin-top:8px;width:100%" onclick="document.getElementById('close-match-overlay').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(el);
}

async function submitCloseMatch(matchId) {
  const h = document.getElementById('close-home').value;
  const a = document.getElementById('close-away').value;
  if (h === '' || a === '') return toast('Informe o placar', 'warn');

  const btn = document.querySelector('#close-match-overlay .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Calculando...';

  try {
    await db.rpc('bolao_close_match', {
      p_match_id: matchId,
      p_score_home: +h,
      p_score_away: +a
    });
    toast('Jogo encerrado e pontos calculados!', 'ok');
    document.getElementById('close-match-overlay')?.remove();
    adminLoadMatches();
  } catch (e) {
    toast('Erro ao encerrar jogo', 'err');
    btn.disabled = false;
    btn.textContent = 'Encerrar e calcular pontos';
  }
}

async function adminLoadRanking() {
  const el = document.getElementById('tab-ranking');
  const rows = await db.get('bolao_participants', {
    select: 'name,cpf,phone,email,total_points,exact_scores',
    order: 'total_points.desc,exact_scores.desc'
  });
  if (!rows.length) { el.innerHTML = '<p style="color:var(--gray-500);padding:16px;font-size:14px">Nenhum participante.</p>'; return; }
  el.innerHTML = `<div class="card" style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--border)">
        <th style="padding:10px 8px">#</th>
        <th style="padding:10px 8px">Nome</th>
        <th style="padding:10px 8px">CPF</th>
        <th style="padding:10px 8px">WhatsApp</th>
        <th style="padding:10px 8px">Pts</th>
        <th style="padding:10px 8px">Placares</th>
      </tr></thead>
      <tbody>${rows.map((r, i) => `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:10px 8px;font-weight:700">${i + 1}º</td>
          <td style="padding:10px 8px;font-weight:600">${r.name}</td>
          <td style="padding:10px 8px;color:var(--gray-500)">${r.cpf}</td>
          <td style="padding:10px 8px;color:var(--gray-500)">${r.phone || '-'}</td>
          <td style="padding:10px 8px;font-weight:700;color:var(--purple)">${r.total_points}</td>
          <td style="padding:10px 8px">${r.exact_scores}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function adminLoadCoupons() {
  const el = document.getElementById('tab-coupons');
  el.innerHTML = `<div style="color:var(--gray-500);padding:16px;font-size:14px">Carregando...</div>`;
  const rows = await db.get('bolao_coupons', {
    select: '*,bolao_participants(name,phone)',
    order: 'issued_at.desc'
  });
  if (!rows.length) { el.innerHTML = '<p style="color:var(--gray-500);padding:16px;font-size:14px">Nenhum cupom emitido.</p>'; return; }
  el.innerHTML = `<div class="card" style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--border)">
        <th style="padding:10px 8px">Código</th>
        <th style="padding:10px 8px">Participante</th>
        <th style="padding:10px 8px">Valor</th>
        <th style="padding:10px 8px">Status</th>
        <th style="padding:10px 8px">Ação</th>
      </tr></thead>
      <tbody>${rows.map(c => {
        const val = c.type === 'fixed' ? `R$${Number(c.discount_brl).toFixed(0)}` : `${c.discount_pct}%`;
        return `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:10px 8px;font-family:monospace;font-weight:700">${c.code}</td>
          <td style="padding:10px 8px">${c.bolao_participants?.name || '-'}<br><span style="color:var(--gray-500);font-size:11px">${c.bolao_participants?.phone || ''}</span></td>
          <td style="padding:10px 8px;font-weight:700;color:${c.type === 'fixed' ? 'var(--green)' : 'var(--purple)'}">${val}</td>
          <td style="padding:10px 8px">
            ${c.redeemed_at
              ? `<span class="badge badge-gray">Resgatado</span>`
              : `<span class="badge badge-green">Disponível</span>`
            }
          </td>
          <td style="padding:10px 8px">
            ${!c.redeemed_at ? `<button class="btn btn-sm btn-ghost" onclick="redeemCoupon('${c.id}')">Resgatar</button>` : ''}
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>`;
}

async function redeemCoupon(couponId) {
  const atendente = prompt('Nome do atendente que está resgatando:');
  if (!atendente) return;
  try {
    await db.update('bolao_coupons', `id=eq.${couponId}`, {
      redeemed_at: new Date().toISOString(),
      redeemed_by: atendente
    });
    toast('Cupom resgatado!', 'ok');
    adminLoadCoupons();
  } catch (e) {
    toast('Erro ao resgatar cupom', 'err');
  }
}
