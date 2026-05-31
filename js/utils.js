function toast(msg, type = 'ok') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +cpf[i] * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== +cpf[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +cpf[i] * (11 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === +cpf[10];
}

function maskCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Milestones: 5 / 12 / 20 / 30 / 45 cravadas = 10/20/30/40/50%
const COUPON_MILESTONES = [
  { at: 45, pct: 50, level: 'Campeão',  icon: 'trophy' },
  { at: 30, pct: 40, level: 'Lendário', icon: 'zap' },
  { at: 20, pct: 30, level: 'Fera',     icon: 'flame' },
  { at: 12, pct: 20, level: 'Craque',   icon: 'star' },
  { at:  5, pct: 10, level: 'Estreante',icon: 'award' },
];

function couponPct(exactCount) {
  for (const m of COUPON_MILESTONES) {
    if (exactCount >= m.at) return m.pct;
  }
  return 0;
}

function nextMilestone(exactCount) {
  for (let i = COUPON_MILESTONES.length - 1; i >= 0; i--) {
    if (exactCount < COUPON_MILESTONES[i].at) return COUPON_MILESTONES[i];
  }
  return null; // já atingiu tudo
}

function nextCouponPct(exactCount) {
  const m = nextMilestone(exactCount);
  return m ? m.pct : 50;
}

// Guarda participante na sessão (localStorage)
const SESSION_KEY = 'bolao_participant';
function getSession()       { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
function setSession(p)      { localStorage.setItem(SESSION_KEY, JSON.stringify(p)); }
function clearSession()     { localStorage.removeItem(SESSION_KEY); }

// Guarda palpites antes do cadastro
const PENDING_KEY = 'bolao_pending_predictions';
function getPending()       { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
function setPending(arr)    { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); }
function clearPending()     { localStorage.removeItem(PENDING_KEY); }
