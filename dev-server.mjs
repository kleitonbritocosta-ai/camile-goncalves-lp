// Servidor local de pré-visualização. Serve a pasta public/ e simula as APIs na memória.
// Não grava no Supabase e não fala com a Meta. Uso: node dev-server.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const porta = Number(process.env.PORT || 4173);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
};
const cliques = [];

function codigo() {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join('');
}

function lerCorpo(req) {
  return new Promise((ok) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/visita') { await lerCorpo(req); res.writeHead(204); return res.end(); }

  if (url.pathname === '/api/clique') {
    const d = await lerCorpo(req);
    let c = cliques.find((x) => x.sessao && x.sessao === d.sessao);
    if (!c) { c = { codigo: codigo(), sessao: d.sessao, ...d }; cliques.push(c); }
    console.log('[simulado] clique gravado:', c.codigo, d.utm_campaign || '(sem utm)');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ codigo: c.codigo }));
  }

  if (url.pathname === '/api/lead') {
    const d = await lerCorpo(req);
    console.log('[simulado] Lead enviado pelo servidor:', d.codigo, d.event_id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, simulado: true }));
  }

  let caminho = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (!caminho || caminho.endsWith('/')) caminho += 'index.html';
  try {
    const arquivo = await readFile(join(raiz, caminho));
    res.writeHead(200, { 'Content-Type': tipos[extname(caminho)] || 'application/octet-stream' });
    res.end(arquivo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(porta, () => console.log('Pré-visualização em http://localhost:' + porta));
