(function () {
  'use strict';

  var PIXEL_ID = '990593537421101';
  var WHATSAPP = '5573981316039'; // +55 73 98131-6039 (o mesmo do link da bio do Instagram)
  var ESPERA_MS = 1000;           // tempo para o navegador despachar o Pixel antes de abrir o WhatsApp

  var params = new URLSearchParams(location.search);
  var codigo = (params.get('c') || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 12) || 'SEMCOD';
  var eventId = 'lead-' + codigo;

  var local = ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1 && params.get('pixel') !== '1';

  var mensagem = 'Olá! Vi o anúncio e quero agendar uma avaliação com a Dra. Camile. (ref. ' + codigo + ')';
  var urlWhats = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem);
  var link = document.getElementById('whats');
  var estado = document.getElementById('estado');
  link.href = urlWhats;

  function carregarPixel() {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
  }

  var jaEnviou = false;
  try { jaEnviou = sessionStorage.getItem(eventId) === '1'; } catch (e) {}

  // 1. Pixel no navegador, só nesta página (uma vez por clique; recarregar não reenvia)
  if (!local) {
    carregarPixel();
    if (!jaEnviou) {
      fbq('track', 'Lead', {}, { eventID: eventId });
      try { sessionStorage.setItem(eventId, '1'); } catch (e) {}
    }
  }

  // 2. WhatsApp com a mensagem pronta
  setTimeout(function () {
    if (local) {
      estado.textContent = 'Pré-visualização local: o Pixel não foi disparado e o WhatsApp não abre sozinho. No site publicado, ele abre agora, com o código ' + codigo + ' na mensagem.';
      return;
    }
    location.href = urlWhats;
  }, ESPERA_MS);
})();
