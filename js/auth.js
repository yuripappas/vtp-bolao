function showRegisterModal() {
  const existing = document.getElementById('register-overlay');
  if (existing) existing.remove();

  const pending = getPending();
  const hasPending = pending.length > 0;

  const el = document.createElement('div');
  el.id = 'register-overlay';
  el.className = 'overlay';
  el.innerHTML = `
    <div class="modal">
      <div class="modal-title">Quase lá!</div>
      <div class="modal-sub">${hasPending
        ? `Seus ${pending.length} palpite(s) estão salvos. Cadastre-se para confirmar e pontuar.`
        : 'Cadastre-se para salvar seus palpites e participar do ranking.'
      }</div>
      <div class="field">
        <label>Nome completo</label>
        <input class="inp" id="reg-name" type="text" placeholder="Seu nome" autocomplete="name">
      </div>
      <div class="field">
        <label>CPF</label>
        <input class="inp" id="reg-cpf" type="text" placeholder="000.000.000-00" inputmode="numeric">
      </div>
      <div class="field">
        <label>WhatsApp</label>
        <input class="inp" id="reg-phone" type="tel" placeholder="(11) 99999-9999" inputmode="numeric">
      </div>
      <div class="field">
        <label>E-mail <span style="font-weight:400;color:var(--gray-500)">(opcional)</span></label>
        <input class="inp" id="reg-email" type="email" placeholder="seuemail@email.com">
      </div>
      <button class="btn btn-primary" id="reg-submit-btn" onclick="submitRegister()">Confirmar cadastro</button>
      <p style="font-size:11px;color:var(--gray-500);text-align:center;margin-top:12px;line-height:1.5">
        Seus dados são usados apenas para o bolão e contato da pizzaria. Nenhuma cobrança envolvida.
      </p>
    </div>`;

  document.body.appendChild(el);

  document.getElementById('reg-cpf').addEventListener('input', e => {
    e.target.value = maskCPF(e.target.value);
  });
  document.getElementById('reg-phone').addEventListener('input', e => {
    e.target.value = maskPhone(e.target.value);
  });
}

async function submitRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const cpf   = document.getElementById('reg-cpf').value.replace(/\D/g, '');
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();

  if (!name)              return toast('Informe seu nome', 'warn');
  if (!validarCPF(cpf))   return toast('CPF inválido', 'err');
  if (phone.length < 10)  return toast('WhatsApp inválido', 'warn');

  const btn = document.getElementById('reg-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    // Verifica se CPF já existe
    const existing = await db.get('bolao_participants', {
      select: 'id,name,total_points,exact_scores',
      filter: `cpf=eq.${cpf}`
    });

    let participant;
    if (existing.length) {
      participant = existing[0];
      toast(`Bem-vindo de volta, ${participant.name.split(' ')[0]}!`, 'ok');
    } else {
      const rows = await db.insert('bolao_participants', { name, cpf, phone, email: email || null });
      participant = rows[0];
      toast(`Cadastro realizado! Bem-vindo, ${participant.name.split(' ')[0]}!`, 'ok');
    }

    setSession(participant);

    // Envia palpites pendentes
    await flushPendingPredictions(participant.id);

    document.getElementById('register-overlay')?.remove();
    updateHeaderState();
    refreshMyStats();

  } catch (e) {
    toast('Erro no cadastro. Tente novamente.', 'err');
    btn.disabled = false;
    btn.textContent = 'Confirmar cadastro';
  }
}

function showLoginModal() {
  const existing = document.getElementById('login-overlay');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'login-overlay';
  el.className = 'overlay';
  el.innerHTML = `
    <div class="modal">
      <div class="modal-title">Entrar no bolão</div>
      <div class="modal-sub">Digite seu CPF para acessar seus palpites e pontuação.</div>
      <div class="field">
        <label>CPF</label>
        <input class="inp" id="login-cpf" type="text" placeholder="000.000.000-00" inputmode="numeric">
      </div>
      <button class="btn btn-primary" id="login-btn" onclick="submitLogin()">Entrar</button>
      <button class="btn btn-ghost" style="margin-top:8px;width:100%" onclick="document.getElementById('login-overlay').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(el);

  document.getElementById('login-cpf').addEventListener('input', e => {
    e.target.value = maskCPF(e.target.value);
  });
}

async function submitLogin() {
  const cpf = document.getElementById('login-cpf').value.replace(/\D/g, '');
  if (!validarCPF(cpf)) return toast('CPF inválido', 'err');

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Buscando...';

  try {
    const rows = await db.get('bolao_participants', {
      select: '*',
      filter: `cpf=eq.${cpf}`
    });
    if (!rows.length) {
      toast('CPF não encontrado. Faça seu cadastro.', 'warn');
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }
    const p = rows[0];
    setSession(p);
    document.getElementById('login-overlay')?.remove();
    toast(`Bem-vindo de volta, ${p.name.split(' ')[0]}!`, 'ok');
    updateHeaderState();
    await loadMyPredictions(p.id);
    refreshMyStats();
    renderMatchList('match-list');
  } catch (e) {
    toast('Erro ao entrar. Tente novamente.', 'err');
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

function updateHeaderState() {
  const session = getSession();
  const loginBtn  = document.getElementById('header-login-btn');
  const logoutBtn = document.getElementById('header-logout-btn');
  const headerName = document.getElementById('header-name');
  if (session) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (headerName) headerName.textContent = session.name.split(' ')[0];
  } else {
    if (loginBtn)  loginBtn.style.display  = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (headerName) headerName.textContent = '';
  }
}

function logout() {
  clearSession();
  clearPending();
  updateHeaderState();
  location.reload();
}
