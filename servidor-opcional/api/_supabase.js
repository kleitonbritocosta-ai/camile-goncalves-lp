// Ajuda comum às funções: fala com o Supabase pela API REST usando a chave de serviço.
// A chave de serviço fica só no servidor (variáveis de ambiente do Vercel), nunca no navegador.

const URL_BASE = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_KEY;

export function configurado() {
  return Boolean(URL_BASE && CHAVE);
}

export async function sb(caminho, { metodo = 'GET', corpo, prefer } = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    method: metodo,
    headers: {
      apikey: CHAVE,
      Authorization: `Bearer ${CHAVE}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

export function limpar(valor, max = 200) {
  return typeof valor === 'string' ? valor.slice(0, max) : null;
}

export function lerJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
