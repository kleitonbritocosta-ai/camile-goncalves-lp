// POST /api/clique: grava o clique no botão e devolve um código curto (ex.: 4F7K).
// Se a mesma sessão clicar de novo, devolve o mesmo código (duplo clique não cria duas linhas).
import { sb, configurado, limpar, lerJson } from './_supabase.js';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O, 1/I/L

function novoCodigo() {
  let c = '';
  for (let i = 0; i < 4; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return c;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const d = lerJson(req);
  const sessao = limpar(d.sessao, 80);

  if (!configurado()) {
    return res.status(200).json({ codigo: novoCodigo(), gravado: false });
  }

  try {
    if (sessao) {
      const existente = await sb(`cliques?sessao=eq.${encodeURIComponent(sessao)}&select=codigo&limit=1`);
      if (existente && existente[0]) return res.status(200).json({ codigo: existente[0].codigo, gravado: true });
    }
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const codigo = novoCodigo();
      try {
        await sb('cliques', {
          metodo: 'POST',
          corpo: {
            codigo, sessao,
            utm_source: limpar(d.utm_source), utm_medium: limpar(d.utm_medium),
            utm_campaign: limpar(d.utm_campaign), utm_content: limpar(d.utm_content), utm_term: limpar(d.utm_term),
            fbclid: limpar(d.fbclid, 300),
            aparelho: limpar(d.aparelho, 20),
            user_agent: limpar(req.headers['user-agent'], 300),
          },
        });
        return res.status(200).json({ codigo, gravado: true });
      } catch (e) {
        if (!/23505|duplicate/i.test(e.message)) throw e; // código repetido: tenta outro
      }
    }
    throw new Error('sem código livre');
  } catch (e) {
    console.error('clique:', e.message);
    return res.status(200).json({ codigo: novoCodigo(), gravado: false }); // a pessoa segue para o WhatsApp
  }
}
