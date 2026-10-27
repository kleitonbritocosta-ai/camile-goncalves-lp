(function () {
  'use strict';

  var params = new URLSearchParams(location.search);

  // Etiqueta da campanha (até 6 letras/números), vinda do ?utm_content= ou ?utm_campaign= do anúncio.
  // Ela vai dentro do código "ref." da mensagem de WhatsApp, para você saber de qual anúncio veio a conversa.
  function etiqueta() {
    var t = params.get('utm_content') || params.get('utm_campaign') || '';
    return t.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  }

  function novoCodigo() {
    var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', c = ''; // sem 0/O, 1/I/L
    for (var i = 0; i < 4; i++) c += a[Math.floor(Math.random() * a.length)];
    var tag = etiqueta();
    return tag ? tag + '-' + c : c;
  }

  // o mesmo código por visita, para o duplo clique não gerar dois
  function codigo() {
    try {
      var c = sessionStorage.getItem('codigo');
      if (!c) { c = novoCodigo(); sessionStorage.setItem('codigo', c); }
      return c;
    } catch (e) { return novoCodigo(); }
  }

  // 1. clique no botão: segue para a página de obrigado (onde o Pixel registra o Lead)
  var indo = false;
  function agendar(ev) {
    ev.preventDefault();
    if (indo) return;
    indo = true;
    document.querySelectorAll('[data-agendar]').forEach(function (b) { b.disabled = true; });
    location.href = 'obrigado.html?c=' + encodeURIComponent(codigo());
  }
  document.querySelectorAll('[data-agendar]').forEach(function (b) { b.addEventListener('click', agendar); });
  // voltar pelo botão do navegador: reativa os botões
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { indo = false; document.querySelectorAll('[data-agendar]').forEach(function (b) { b.disabled = false; }); }
  });

  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. entrada das partes (uma vez) e saída ligada ao scroll
  var itens = Array.prototype.slice.call(document.querySelectorAll('.sobe'));
  // atraso escalonado entre irmãos
  itens.forEach(function (el) {
    var irmaos = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('sobe'); });
    el.style.setProperty('--d', (irmaos.indexOf(el) * 90) + 'ms');
  });

  function entrou(el) {
    el.classList.add('entrou');
    // depois da animação de entrada, o scroll passa a controlar a saída
    setTimeout(function () { el.classList.add('pronto'); }, 1900);
  }
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { entrou(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    itens.forEach(function (el) { io.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add('entrou'); });
  }

  var fotos = Array.prototype.slice.call(document.querySelectorAll('.foto'));
  var agendado = false;
  function aoRolar() {
    agendado = false;
    var vh = window.innerHeight;
    if (!reduz) {
      // saída: perto do topo da tela a parte vai sumindo e subindo
      itens.forEach(function (el) {
        if (!el.classList.contains('pronto')) return;
        var r = el.getBoundingClientRect();
        var zona = vh * 0.22;
        var p = r.bottom < zona ? 1 - Math.max(r.bottom, 0) / zona : 0;
        el.style.setProperty('--sai', p.toFixed(3));
      });
      // paralaxe leve nas fotos
      fotos.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var meio = r.top + r.height / 2 - vh / 2;
        f.querySelector('img').style.setProperty('--par', (-meio * 0.06).toFixed(1) + 'px');
      });
    }
  }
  function pedir() { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  aoRolar();

  // 3. botão fixo embaixo: sempre visível, sai de cena quando a chamada final aparece
  var fixo = document.getElementById('fixo');
  var final = document.getElementById('final');
  if (fixo && final && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var some = es[0].isIntersecting;
      fixo.classList.toggle('escondido', some);
      fixo.setAttribute('aria-hidden', some ? 'true' : 'false');
      fixo.querySelector('button').tabIndex = some ? -1 : 0;
    }, { threshold: 0.35 }).observe(final);
  }
})();
