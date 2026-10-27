// POST /api/lead: envia o evento Lead pelo servidor (API de Conversões da Meta).
// Usa o mesmo event_id do Pixel do navegador, então a Meta conta uma vez só.
import { sb, configurado, limpar, lerJson } from './_supabase.js';

const PIXEL_ID = process.env.META_PIXEL_ID || '990593537421101';
const TOKEN = process.env.META_CAPI_TOKEN;           // gerado no Gerenciador de Eventos
const TESTE = process.env.META_TEST_EVENT_CODE;      // opcional: aparece na aba "Eventos de teste"

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const d = lerJson(req);
  const codigo = limpar(d.codigo, 8);
  const eventId = limpar(d.event_id, 40);
  if (!codigo || !eventId) return res.status(400).json({ ok: false });

  let linha = null;
  try {
    if (configurado()) {
      const r = await sb(`cliques?codigo=eq.${encodeURIComponent(codigo)}&select=fbclid,user_agent,criado_em,evento_enviado&limit=1`);
      linha = r && r[0];
    }
  } catch (e) { console.error('lead/busca:', e.message); }

  if (linha && linha.evento_enviado) return res.status(200).json({ ok: true, repetido: true });
  if (!TOKEN) return res.status(200).json({ ok: false, motivo: 'META_CAPI_TOKEN ausente' });

  // O IP é usado só nesta chamada para a Meta casar o evento. Não é guardado.
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  const fbc = limpar(d.fbc, 300) ||
    (linha && linha.fbclid ? `fb.1.${new Date(linha.criado_em).getTime()}.${linha.fbclid}` : undefined);

  const corpo = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: limpar(d.url, 300),
      user_data: {
        client_ip_address: ip,
        client_user_agent: limpar(req.headers['user-agent'], 300) || (linha && linha.user_agent) || undefined,
        fbp: limpar(d.fbp, 200) || undefined,
        fbc,
      },
    }],
    ...(TESTE ? { test_event_code: TESTE } : {}),
  };

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const ok = r.ok;
    if (!ok) console.error('lead/meta:', r.status, await r.text());
    if (ok && configurado()) {
      await sb(`cliques?codigo=eq.${encodeURIComponent(codigo)}`, { metodo: 'PATCH', corpo: { evento_enviado: true } })
        .catch((e) => console.error('lead/marca:', e.message));
    }
    return res.status(200).json({ ok });
  } catch (e) {
    console.error('lead:', e.message);
    return res.status(200).json({ ok: false });
  }
}
