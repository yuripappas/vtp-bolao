const BOLAO_URL = 'https://wdfecydgdzwwxxrncdqx.supabase.co';
const BOLAO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZmVjeWRnZHp3d3h4cm5jZHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODAwOTUsImV4cCI6MjA5NTE1NjA5NX0.sVVljppHf0g7zU-kCuvGxxw67wqAFlVVGRpqjgUBaEA';

const db = {
  async get(table, query = {}) {
    let url = `${BOLAO_URL}/rest/v1/${table}?`;
    const params = [];
    if (query.select)  params.push(`select=${query.select}`);
    if (query.filter)  params.push(query.filter);
    if (query.order)   params.push(`order=${query.order}`);
    if (query.limit)   params.push(`limit=${query.limit}`);
    url += params.join('&');
    const r = await fetch(url, { headers: _h() });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${BOLAO_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ..._h(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async update(table, filter, data) {
    const r = await fetch(`${BOLAO_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { ..._h(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async rpc(fn, params = {}) {
    const r = await fetch(`${BOLAO_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: _h(),
      body: JSON.stringify(params)
    });
    if (!r.ok) throw await r.json();
    return r.json();
  }
};

function _h() {
  return {
    'apikey': BOLAO_KEY,
    'Authorization': `Bearer ${BOLAO_KEY}`,
    'Content-Type': 'application/json'
  };
}
