// ── app.js ── Controlador principal de la UI

(function () {

  // ── ELEMENTOS ──
  const elP1          = document.getElementById('p1');
  const elP2          = document.getElementById('p2');
  const elSurface     = document.getElementById('surface');
  const elCircuit     = document.getElementById('circuit');
  const elTournament  = document.getElementById('tournament');
  const elOdd1        = document.getElementById('odd1');
  const elOdd2        = document.getElementById('odd2');
  const elOddMarket   = document.getElementById('odd-market');
  const elOdd1Label   = document.getElementById('odd1-label');
  const elOdd2Label   = document.getElementById('odd2-label');
  const elBtn         = document.getElementById('btn-analyze');
  const elApiWarning  = document.getElementById('api-warning');

  const elFormSection    = document.getElementById('form-section');
  const elResultSection  = document.getElementById('result-section');
  const elLoadingSection = document.getElementById('loading-section');
  const elLoaderMsg      = document.getElementById('loader-msg');
  const elResultTitle    = document.getElementById('result-title');
  const elResultBody     = document.getElementById('result-body');
  const elHistoryList    = document.getElementById('history-list');
  const elSidebar        = document.getElementById('sidebar');

  const elCopyToast = document.createElement('div');
  elCopyToast.id = 'copy-toast';
  document.body.appendChild(elCopyToast);

  // ── API KEY MODAL ──
  const elKeyModal = document.createElement('div');
  elKeyModal.id = 'key-modal';
  elKeyModal.innerHTML = `
    <div id="key-modal-box">
      <div id="key-modal-logo"><span class="logo-mark">TE</span><span class="logo-text">TennisEdge Analyst</span></div>
      <p id="key-modal-desc">Introduce tu API key de Anthropic.<br>Se guarda solo en este navegador, nunca en el código.</p>
      <div class="field" style="margin-bottom:10px;">
        <label for="key-input">API Key</label>
        <input id="key-input" type="password" placeholder="sk-ant-api03-..." autocomplete="off" style="font-family:monospace;font-size:12px;" />
      </div>
      <div id="key-modal-hint">Consíguela en <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener">console.anthropic.com</a></div>
      <button id="key-modal-save">Guardar y continuar →</button>
      <div id="key-modal-err" class="hidden" style="color:#e05252;font-size:12px;margin-top:8px;"></div>
    </div>`;
  document.body.appendChild(elKeyModal);

  // ── KEY MODAL STYLES ──
  const style = document.createElement('style');
  style.textContent = `
    #key-modal {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.75);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    #key-modal.hidden { display: none; }
    #key-modal-box {
      background: #1c2333; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 28px 28px 24px;
      width: 100%; max-width: 400px; margin: 16px;
    }
    #key-modal-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    #key-modal-desc { font-size: 13px; color: #8b95a8; line-height: 1.6; margin-bottom: 16px; }
    #key-modal-hint { font-size: 11px; color: #535e70; margin-bottom: 14px; }
    #key-modal-hint a { color: #3b9eff; text-decoration: none; }
    #key-modal-save {
      width: 100%; padding: 11px; background: #3b9eff;
      border: none; border-radius: 8px; color: #fff;
      font-size: 14px; font-weight: 600; cursor: pointer;
    }
    #key-modal-save:hover { background: #1a6fcc; }
    #key-settings-btn {
      background: none; border: none; color: #535e70;
      font-size: 11px; cursor: pointer; padding: 4px 0;
      text-decoration: underline;
    }
    #key-settings-btn:hover { color: #8b95a8; }
  `;
  document.head.appendChild(style);

  let currentData   = null;
  let currentParams = null;
  let activeId      = null;

  const LOADER_MSGS = [
    'Buscando datos recientes...',
    'Analizando estilos de juego...',
    'Evaluando H2H y superficie...',
    'Calculando indicios de valor...',
  ];

  // ── INIT ──
  function init() {
    if (!TENNIS_CONFIG.apiKey) {
      showKeyModal();
    } else {
      hideKeyModal();
      enableForm();
    }
    renderHistoryList();
    bindEvents();
    addKeySettingsBtn();
  }

  // ── KEY MODAL ──
  function showKeyModal(msg) {
    elKeyModal.classList.remove('hidden');
    if (msg) {
      document.getElementById('key-modal-err').textContent = msg;
      document.getElementById('key-modal-err').classList.remove('hidden');
    }
    setTimeout(() => document.getElementById('key-input').focus(), 100);
  }

  function hideKeyModal() {
    elKeyModal.classList.add('hidden');
  }

  function saveKey() {
    const val = document.getElementById('key-input').value.trim();
    if (!val.startsWith('sk-ant-')) {
      document.getElementById('key-modal-err').textContent = 'La key debe empezar por sk-ant-';
      document.getElementById('key-modal-err').classList.remove('hidden');
      return;
    }
    TENNIS_CONFIG.apiKey = val;
    hideKeyModal();
    enableForm();
    elApiWarning.classList.add('hidden');
  }

  function enableForm() {
    validateForm();
  }

  function addKeySettingsBtn() {
    const btn = document.createElement('button');
    btn.id = 'key-settings-btn';
    btn.textContent = '🔑 Cambiar API key';
    btn.addEventListener('click', () => {
      document.getElementById('key-input').value = '';
      document.getElementById('key-modal-err').classList.add('hidden');
      showKeyModal();
    });
    document.querySelector('.sidebar-footer').prepend(btn);
  }

  // ── EVENTS ──
  function bindEvents() {
    [elP1, elP2].forEach(el => el.addEventListener('input', updateOddLabels));
    [elP1, elP2].forEach(el => el.addEventListener('input', validateForm));
    elBtn.addEventListener('click', runAnalysis);

    document.getElementById('key-modal-save').addEventListener('click', saveKey);
    document.getElementById('key-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') saveKey();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !elKeyModal.classList.contains('hidden')) return;
      if (e.key === 'Enter' && document.activeElement !== elBtn) runAnalysis();
    });

    document.getElementById('btn-new').addEventListener('click', showForm);
    document.getElementById('btn-new-from-result').addEventListener('click', showForm);
    document.getElementById('btn-copy').addEventListener('click', copyResult);
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
    document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
      elSidebar.classList.toggle('open');
    });
  }

  function validateForm() {
    const hasKey = !!TENNIS_CONFIG.apiKey;
    const hasPlayers = elP1.value.trim() && elP2.value.trim();
    elBtn.disabled = !(hasKey && hasPlayers);
  }

  function updateOddLabels() {
    elOdd1Label.textContent = elP1.value.trim() || 'Jug. 1';
    elOdd2Label.textContent = elP2.value.trim() || 'Jug. 2';
  }

  // ── MAIN ANALYSIS ──
  async function runAnalysis() {
    if (elBtn.disabled) return;

    const params = {
      p1: elP1.value.trim(),
      p2: elP2.value.trim(),
      surface: elSurface.value,
      circuit: elCircuit.value,
      tournament: elTournament.value.trim(),
      odd1: elOdd1.value || null,
      odd2: elOdd2.value || null,
      oddMarket: elOddMarket.value,
    };
    if (!params.p1 || !params.p2) return;

    showLoading();
    const msgInterval = cycleLoaderMessages();

    try {
      const data = await Analyzer.analyze(params);
      clearInterval(msgInterval);

      const id = Date.now().toString();
      const entry = {
        id, params, data,
        match: `${data.p1.name} vs ${data.p2.name}`,
        surface: params.surface,
        circuit: params.circuit,
        timestamp: new Date().toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }),
      };

      History.add(entry);
      renderHistoryList();
      showResult(data, params, id);

    } catch(err) {
      clearInterval(msgInterval);
      if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
        TENNIS_CONFIG.apiKey = '';
        showKeyModal('API key inválida o expirada. Introduce una nueva.');
        elLoadingSection.classList.add('hidden');
        elFormSection.classList.remove('hidden');
      } else {
        showErrorResult(err.message);
      }
    }
  }

  function cycleLoaderMessages() {
    let i = 0;
    return setInterval(() => {
      i = (i + 1) % LOADER_MSGS.length;
      elLoaderMsg.textContent = LOADER_MSGS[i];
    }, 2200);
  }

  // ── UI STATE ──
  function showLoading() {
    elFormSection.classList.add('hidden');
    elResultSection.classList.add('hidden');
    elLoadingSection.classList.remove('hidden');
    elLoaderMsg.textContent = LOADER_MSGS[0];
  }

  function showForm() {
    elFormSection.classList.remove('hidden');
    elResultSection.classList.add('hidden');
    elLoadingSection.classList.add('hidden');
    activeId = null;
    renderHistoryList();
    elP1.focus();
  }

  function showResult(data, params, id) {
    currentData   = data;
    currentParams = params;
    activeId      = id;

    elResultTitle.textContent = `${data.p1.name} vs ${data.p2.name} · ${params.surface}`;
    elResultBody.innerHTML = Renderer.render(data, params);

    elFormSection.classList.add('hidden');
    elLoadingSection.classList.add('hidden');
    elResultSection.classList.remove('hidden');

    renderHistoryList();
    elResultSection.scrollTop = 0;
  }

  function showErrorResult(msg) {
    elLoadingSection.classList.add('hidden');
    elFormSection.classList.remove('hidden');
    elResultSection.classList.add('hidden');
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'color:#e05252;font-size:13px;margin-top:10px;padding:10px 14px;background:rgba(224,82,82,0.08);border-radius:8px;border:1px solid rgba(224,82,82,0.2);';
    errDiv.textContent = '❌ Error: ' + msg;
    elFormSection.appendChild(errDiv);
    setTimeout(() => errDiv.remove(), 6000);
  }

  // ── HISTORY ──
  function renderHistoryList() {
    const items = History.load();
    if (!items.length) {
      elHistoryList.innerHTML = '<li style="padding:10px;font-size:11px;color:var(--text-3);">Sin análisis guardados</li>';
      return;
    }
    elHistoryList.innerHTML = items.map(item => `
      <li class="history-item ${item.id === activeId ? 'active' : ''}" data-id="${item.id}">
        <div class="hi-match">${item.match}</div>
        <div class="hi-meta">${item.surface} · ${item.circuit} · ${item.timestamp}</div>
      </li>
    `).join('');

    elHistoryList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const entry = History.get(el.dataset.id);
        if (entry) showResult(entry.data, entry.params, entry.id);
      });
    });
  }

  function clearHistory() {
    if (!confirm('¿Borrar todo el historial?')) return;
    History.clear();
    renderHistoryList();
    showForm();
  }

  // ── COPY ──
  function copyResult() {
    if (!currentData) return;
    const text = Renderer.toPlainText(currentData, currentParams);
    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Análisis copiado');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copiado');
    });
  }

  function showToast(msg) {
    elCopyToast.textContent = msg;
    elCopyToast.classList.add('show');
    setTimeout(() => elCopyToast.classList.remove('show'), 2500);
  }

  // ── START ──
  init();

})();
