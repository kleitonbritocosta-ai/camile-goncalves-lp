// POST /api/visita: registra que alguém abriu a landing (nosso banco, não o Pixel).
import { sb, configurado, limpar, lerJson } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const d = lerJson(req);
  try {
    if (configurado()) {
      await sb('visitas', {
        metodo: 'POST',
        corpo: {
          utm_source: limpar(d.utm_source), utm_medium: limpar(d.utm_medium),
          utm_campaign: limpar(d.utm_campaign), utm_content: limpar(d.utm_content), utm_term: limpar(d.utm_term),
          aparelho: limpar(d.aparelho, 20),
        },
      });
    }
  } catch (e) {
    console.error('visita:', e.message);
  }
  return res.status(204).end(); // nunca atrapalha a pessoa
}
