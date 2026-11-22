// =====================================================================
//  TON-кошелёк через TON Connect (Wallet в Telegram, Tonkeeper, MyTonWallet и др.)
//  Библиотека лежит в js/vendor и грузится только когда нужна — на скорость запуска не влияет.
// =====================================================================
const tonWallet = (() => {
  let ui = null, loading = null;
  const subs = new Set();

  // ---------- адрес: 0:abcd… → UQ… (как его показывают кошельки) ----------
  function crc16(bytes) {
    let crc = 0;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc;
  }
  function friendly(raw, bounceable = false) {
    const m = /^(-?\d+):([0-9a-fA-F]{64})$/.exec(raw || '');
    if (!m) return raw || '';
    const b = new Uint8Array(36);
    b[0] = bounceable ? 0x11 : 0x51;
    b[1] = Number(m[1]) & 0xff;
    for (let i = 0; i < 32; i++) b[2 + i] = parseInt(m[2].substr(i * 2, 2), 16);
    const c = crc16(b.subarray(0, 34)); b[34] = c >> 8; b[35] = c & 0xff;
    return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_');
  }
  const short = (a) => (a && a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a || '');

  // ---------- комментарий к переводу: ячейка TON (op = 0 + текст) в BOC base64 ----------
  function crc32c(bytes) {
    let crc = 0xffffffff;
    for (const b of bytes) { crc ^= b; for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0x82f63b78 : crc >>> 1; }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function commentBoc(text) {
    const txt = new TextEncoder().encode(String(text)).slice(0, 120);
    const data = new Uint8Array(4 + txt.length); data.set(txt, 4);          // 32 нулевых бита = «текстовый комментарий»
    const cell = new Uint8Array(2 + data.length);
    cell[0] = 0;                                  // нет ссылок, обычная ячейка
    cell[1] = data.length * 2;                    // число полных байт × 2 (биты кратны 8)
    cell.set(data, 2);
    const head = [0xb5, 0xee, 0x9c, 0x72, 0x41, 0x01, 0x01, 0x01, 0x00, cell.length, 0x00];   // 1 ячейка, 1 корень, с crc32c
    const body = new Uint8Array(head.length + cell.length); body.set(head); body.set(cell, head.length);
    const c = crc32c(body), out = new Uint8Array(body.length + 4); out.set(body);
    out.set([c & 0xff, (c >>> 8) & 0xff, (c >>> 16) & 0xff, (c >>> 24) & 0xff], body.length);
    return btoa(String.fromCharCode(...out));
  }

  // ---------- подключение ----------
  function load() {
    if (ui) return Promise.resolve(ui);
    if (loading) return loading;
    loading = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/tonconnect-ui-2.4.4.min.js';
      s.onload = () => {
        try {
          const T = window.TON_CONNECT_UI;
          const bot = (api.cfg('botUsername', '') || CONFIG.BOT_USERNAME || '').replace('@', '');
          ui = new T.TonConnectUI({ manifestUrl: CONFIG.TONCONNECT_MANIFEST || new URL('tonconnect-manifest.json', location.href).href });
          ui.uiOptions = {
            language: getLang() === 'en' ? 'en' : 'ru',
            uiPreferences: { theme: T.THEME ? T.THEME.DARK : 'DARK' },
            actionsConfiguration: bot ? { twaReturnUrl: `https://t.me/${bot}` } : {},
          };
          ui.onStatusChange(() => { const a = address(); if (a && api.live) api.saveWallet(a).catch(() => {}); subs.forEach((f) => f(a)); });
          ok(ui);
        } catch (e) { loading = null; fail(e); }
      };
      s.onerror = () => { loading = null; fail(new Error('tonconnect')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function address() { const raw = ui?.wallet?.account?.address; return raw ? friendly(raw) : ''; }

  return {
    friendly, short, commentBoc,
    /** Адрес подключённого кошелька (UQ…) или '' */
    get address() { return address(); },
    get name() { return ui?.wallet?.device?.appName || ui?.walletInfo?.name || ''; },
    /** Восстановить прошлое подключение (тихо, без окон) */
    async restore() { try { await load(); await ui.connectionRestored; return address(); } catch (e) { return ''; } },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
    async connect() {
      await load(); await ui.connectionRestored;
      if (address()) return address();
      await ui.openModal();
      return new Promise((done) => {
        const off = ui.onStatusChange((w) => { off(); done(w ? address() : ''); });
        const iv = setInterval(() => { if (ui.modalState?.status === 'closed' && !address()) { clearInterval(iv); off(); done(''); } }, 600);
      });
    },
    async disconnect() { await load(); if (ui.wallet) await ui.disconnect(); subs.forEach((f) => f('')); },
    /** Перевод TON с комментарием. nano — строка/число в нанотонах */
    async pay({ address: to, nano, comment }) {
      await load();
      if (!ui.wallet) { const a = await this.connect(); if (!a) throw Object.assign(new Error('cancelled'), { code: 'wallet_cancel' }); }
      return ui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: to, amount: String(nano), payload: comment ? commentBoc(comment) : undefined }],
      });
    },
  };
})();
