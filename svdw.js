/*!
 * Shot van de Week – stemwidget + winnaarsoverzicht
 * eredivisiebadminton.nl
 *
 * Gebruik in Squarespace (Code Block):
 *   <div class="svdw" data-weergave="stemmen"></div>
 *   <script src="https://<jouw-github>.github.io/shot-van-de-week/svdw.js" defer></script>
 *   data-weergave: "stemmen" (standaard) of "winnaars"
 */
(function () {
  'use strict';

  // ---------------- instellingen ----------------
  var API = 'https://script.google.com/macros/s/AKfycbzG2daH_46YeFEmePyuqTyXGcax8zFrBi5XA5hhUDE5OIRYIGJLkG6NI1bWjsh4kEOe/exec';
  var TURNSTILE_SITEKEY = ''; // invullen na stap 3 (Cloudflare Turnstile)
  var POLL_MS = 30000;        // tussenstand verversen

  // ---------------- stijl ----------------
  var CSS = [
    ':host{all:initial;display:block}',
    '*{box-sizing:border-box}',
    '.w{--bg:#141414;--card:#212121;--line:#3d3d3d;--acc:#F04714;--track:#333;--txt:#fafafa;--mut:#b5b5b5;',
    ' background:var(--bg);color:var(--txt);font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;padding:40px 16px 48px;border-radius:0;-webkit-font-smoothing:antialiased}',
    '.hd{text-align:center;margin:0 auto 22px;max-width:760px}',
    '.ic{color:var(--acc);width:30px;height:30px;margin:0 auto 6px;display:block}',
    '.pill{display:inline-block;background:var(--acc);color:#fff;font-weight:700;font-size:13px;letter-spacing:.04em;padding:5px 12px;border-radius:999px;text-transform:uppercase}',
    'h2{font-size:clamp(28px,4.4vw,38px);line-height:1.05;margin:10px 0 8px;font-weight:800;letter-spacing:-.01em;text-transform:uppercase}',
    '.sub{color:var(--mut);font-size:16px;margin:0}',
    '.stand{display:flex;align-items:center;justify-content:center;gap:6px;color:var(--mut);font-size:14px;margin:22px 0 0}',
    '.stand b{color:var(--txt)}',
    '.grid{display:grid;gap:20px;grid-template-columns:repeat(3,minmax(0,1fr));max-width:1004px;margin:0 auto}',
    '@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media (max-width:560px){.grid{grid-template-columns:1fr}.w{padding:28px 12px 36px}}',
    '.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;position:relative}',
    '.card.mine{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}',
    '.img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;background:#0c0c0c}',
    '.tr{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;border:2px solid #fff}',
    '.tr svg{width:16px;height:16px;color:#fff}',
    '.bd{padding:16px 16px 16px;display:flex;flex-direction:column;gap:2px;flex:1}',
    '.t{font-size:17px;font-weight:700;text-transform:uppercase;margin:0;line-height:1.25}',
    '.by{color:var(--mut);font-size:15px;margin:2px 0 14px}',
    '.bar{height:8px;background:var(--track);border-radius:99px;overflow:hidden}',
    '.bar i{display:block;height:100%;background:var(--acc);border-radius:99px;width:0;transition:width .6s ease}',
    '.cnt{display:flex;justify-content:space-between;color:var(--mut);font-size:13px;margin:7px 0 14px}',
    '.btn{margin-top:auto;appearance:none;border:0;border-radius:8px;background:var(--acc);color:#fff;font:inherit;font-size:15px;padding:12px;cursor:pointer;width:100%;transition:filter .15s,opacity .15s}',
    '.btn:hover{filter:brightness(1.08)}',
    '.btn:disabled{cursor:default;opacity:.45;filter:none}',
    '.btn.ok{opacity:1;background:transparent;border:1px solid var(--acc);color:var(--acc);font-weight:700}',
    '.msg{text-align:center;color:var(--mut);padding:40px 12px;font-size:16px}',
    '.toast{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#fff;color:#141414;font-weight:700;padding:12px 18px;border-radius:10px;opacity:0;transition:.3s;z-index:9;font-size:15px;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:90vw;text-align:center}',
    '.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}',
    /* winnaars */
    '.wgrid{display:grid;gap:28px;grid-template-columns:repeat(3,minmax(0,1fr));max-width:1004px;margin:0 auto}',
    '@media (max-width:900px){.wgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media (max-width:560px){.wgrid{grid-template-columns:1fr}}',
    '.wimg{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px;background:#0c0c0c}',
    '.wmeta{display:flex;gap:8px;align-items:center;margin:12px 0 6px;flex-wrap:wrap}',
    '.wmeta .pill{font-size:11px;padding:4px 10px}',
    '.wv{color:var(--mut);font-size:13px}',
    '.wt{font-size:17px;font-weight:700;margin:0 0 2px;text-transform:uppercase}',
    '.wtx{color:var(--mut);font-size:15px;line-height:1.5;margin:8px 0 0;white-space:pre-line}'
  ].join('');

  var ICON_CAM = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
  var ICON_USERS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';

  // ---------------- hulp ----------------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function apparaat() {
    var id = ls('svdw_apparaat');
    if (!id) { id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)); ls('svdw_apparaat', id); }
    return id;
  }
  function getJSON(q) { return fetch(API + '?' + q + '&_=' + Date.now()).then(function (r) { return r.json(); }); }
  function postJSON(body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  // ---------------- Turnstile ----------------
  var tsReady = null;
  function loadTurnstile() {
    if (!TURNSTILE_SITEKEY) return Promise.resolve(null);
    if (tsReady) return tsReady;
    tsReady = new Promise(function (res) {
      if (window.turnstile) return res(window.turnstile);
      window.__svdwTs = function () { res(window.turnstile); };
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__svdwTs&render=explicit';
      s.async = true; document.head.appendChild(s);
    });
    return tsReady;
  }
  function getToken(holder) {
    if (!TURNSTILE_SITEKEY) return Promise.resolve('');
    return loadTurnstile().then(function (ts) {
      return new Promise(function (res, rej) {
        holder.innerHTML = '';
        var el = document.createElement('div'); holder.appendChild(el);
        ts.render(el, {
          sitekey: TURNSTILE_SITEKEY, appearance: 'interaction-only', theme: 'dark', language: 'nl',
          callback: function (t) { res(t); }, 'error-callback': function () { rej(new Error('ts')); }
        });
      });
    });
  }

  // ---------------- stemwidget ----------------
  function Stemmen(root, host) {
    var tsHolder = document.createElement('div'); tsHolder.style.cssText = 'display:flex;justify-content:center;margin:12px 0';
    host.insertAdjacentElement('afterend', tsHolder);
    var st = { data: null, gestemd: null, bezig: false };
    var wrap = document.createElement('div'); wrap.className = 'w';
    root.appendChild(wrap);
    var toast = document.createElement('div'); toast.className = 'toast'; root.appendChild(toast);
    function melding(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove('on'); }, 3200); }

    function render() {
      var d = st.data;
      if (!d) { wrap.innerHTML = '<div class="msg">Laden…</div>'; return; }
      if (!d.ronde) {
        wrap.innerHTML = '<div class="hd">' + ICON_CAM + '<h2>Shot van de Week</h2><p class="sub">Er loopt op dit moment geen stemronde. Binnenkort weer een nieuwe!</p></div>';
        return;
      }
      var r = d.ronde, stand = d.stand || null, totaal = stand ? stand.totaal : 0;
      var max = 0; if (stand) Object.keys(stand.per_foto).forEach(function (k) { max = Math.max(max, stand.per_foto[k]); });
      var h = '<div class="hd">' + ICON_CAM + '<span class="pill">' + esc(r.titel || ('Speelronde ' + r.ronde)) + '</span>' +
        '<h2>Shot van de Week</h2><p class="sub">Jouw stem bepaalt het Shot van de Week!</p>' +
        (stand ? '<p class="stand">' + ICON_USERS + ' Huidige stand <b>· ' + totaal + ' ' + (totaal === 1 ? 'stem' : 'stemmen') + ' totaal</b></p>' : '') +
        '</div><div class="grid">';
      d.fotos.forEach(function (f) {
        var n = stand ? (stand.per_foto[f.id] || 0) : 0;
        var pct = stand && totaal ? Math.round(n / totaal * 100) : 0;
        var mine = st.gestemd === f.id;
        var leider = stand && max > 0 && n === max;
        h += '<article class="card' + (mine ? ' mine' : '') + '">' +
          (leider ? '<span class="tr" title="Koploper">' + ICON_TROPHY + '</span>' : '') +
          '<img class="img" loading="lazy" src="' + esc(f.afbeelding) + '" alt="' + esc(f.titel) + ' – foto door ' + esc(f.fotograaf) + '">' +
          '<div class="bd"><h3 class="t">' + esc(f.titel) + '</h3><p class="by">door ' + esc(f.fotograaf) + '</p>' +
          (stand ? '<div class="bar"><i style="width:' + pct + '%"></i></div><div class="cnt"><span>' + n + ' ' + (n === 1 ? 'stem' : 'stemmen') + '</span><span>' + pct + '%</span></div>' : '') +
          (mine ? '<button class="btn ok" disabled>✓ Jouw stem</button>'
                : '<button class="btn" data-id="' + esc(f.id) + '"' + (st.gestemd || st.bezig ? ' disabled' : '') + '>' + (st.gestemd ? 'Je hebt al gestemd' : 'Stem op deze foto') + '</button>') +
          '</div></article>';
      });
      h += '</div>';
      wrap.innerHTML = h;
    }

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-id]');
      if (!b || st.bezig || st.gestemd) return;
      var id = b.getAttribute('data-id');
      st.bezig = true; render(); var nb = wrap.querySelector('button[data-id="' + id + '"]'); if (nb) nb.textContent = 'Even geduld…';
      getToken(tsHolder).then(function (token) {
        return postJSON({ ronde: st.data.ronde.ronde, foto_id: id, apparaat: apparaat(), token: token });
      }).then(function (res) {
        st.bezig = false; tsHolder.innerHTML = '';
        if (res.ok || res.fout === 'al_gestemd') {
          st.gestemd = res.ok ? id : (st.gestemd || 'onbekend');
          ls('svdw_stem_' + st.data.ronde.ronde, st.gestemd);
          melding(res.ok ? 'Bedankt voor je stem! 🏸' : 'Je hebt deze ronde al gestemd.');
          laad();
        } else if (res.fout === 'ronde_gesloten') { melding('Deze stemronde is gesloten.'); laad(); }
        else { melding('Stemmen lukte niet, probeer het opnieuw.'); render(); }
      }).catch(function () { st.bezig = false; melding('Stemmen lukte niet, probeer het opnieuw.'); render(); });
    });

    function laad() {
      return getJSON('actie=ronde').then(function (d) {
        st.data = d;
        if (d.ronde) st.gestemd = ls('svdw_stem_' + d.ronde.ronde) || null;
        render();
      }).catch(function () { if (!st.data) wrap.innerHTML = '<div class="msg">Shot van de Week kon niet geladen worden.</div>'; });
    }
    render(); laad();
    setInterval(function () { if (!document.hidden && !st.bezig && st.data && st.data.ronde && st.data.ronde.tussenstand) laad(); }, POLL_MS);
  }

  // ---------------- winnaarsoverzicht ----------------
  function Winnaars(root) {
    var wrap = document.createElement('div'); wrap.className = 'w'; root.appendChild(wrap);
    wrap.innerHTML = '<div class="msg">Laden…</div>';
    getJSON('actie=winnaars').then(function (d) {
      var w = (d && d.winnaars) || [];
      var h = '<div class="hd">' + ICON_TROPHY.replace('<svg', '<svg class="ic"') + '<span class="pill">Op weg naar het Shot van het Seizoen</span><h2>De winnaars</h2>' +
        '<p class="sub">Elke week kiezen jullie de mooiste foto. Hier staan alle winnaars van dit seizoen.</p></div>';
      if (!w.length) { wrap.innerHTML = h + '<div class="msg">Nog geen winnaars bekend.</div>'; return; }
      h += '<div class="wgrid">';
      w.forEach(function (x) {
        h += '<article>' +
          '<img class="wimg" loading="lazy" src="' + esc(x.afbeelding_url) + '" alt="Winnaar speelronde ' + esc(x.ronde) + ' – ' + esc(x.titel) + '">' +
          '<div class="wmeta"><span class="pill">Speelronde ' + esc(x.ronde) + '</span>' + (x.stemmen !== '' && x.stemmen != null ? '<span class="wv">' + esc(x.stemmen) + ' stemmen</span>' : '') + '</div>' +
          '<h3 class="wt">' + esc(x.titel) + '</h3><p class="by" style="margin:0">' + esc(x.wedstrijd) + ' · foto ' + esc(x.fotograaf) + '</p>' +
          (x.tekst ? '<p class="wtx">' + esc(x.tekst) + '</p>' : '') +
          '</article>';
      });
      wrap.innerHTML = h + '</div>';
    }).catch(function () { wrap.innerHTML = '<div class="msg">Winnaars konden niet geladen worden.</div>'; });
  }

  // ---------------- start ----------------
  function start() {
    var els = document.querySelectorAll('.svdw:not([data-svdw-klaar])');
    Array.prototype.forEach.call(els, function (el) {
      el.setAttribute('data-svdw-klaar', '1');
      var root = el.attachShadow ? el.attachShadow({ mode: 'open' }) : el;
      var style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
      if ((el.getAttribute('data-weergave') || 'stemmen') === 'winnaars') Winnaars(root); else Stemmen(root, el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
