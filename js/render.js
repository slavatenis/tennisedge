// ── render.js ── Construye el HTML del análisis

const Renderer = (() => {

  function evoColor(score) {
    if (score >= 7) return '#e05252';
    if (score >= 4) return '#f5a623';
    return '#34c77b';
  }

  function evoBar(score, name) {
    const pct = score * 10;
    const color = evoColor(score);
    const label = score >= 7 ? 'Alta incertidumbre' : score >= 4 ? 'Cambio moderado' : 'Estable';
    return `
      <div class="pc-evo-label">Cambio reciente — ${label}</div>
      <div class="evo-bar-wrap">
        <div class="evo-bar-outer">
          <div class="evo-bar-inner" style="width:${pct}%;background:${color};"></div>
        </div>
        <span class="evo-score">${score}/10</span>
      </div>`;
  }

  function badgeClass(label) {
    if (label === 'VALOR') return 'val';
    if (label === 'RIESGO') return 'risk';
    return 'skip';
  }

  function edgeClass(edge) {
    if (edge === 'pos') return 'edge-pos';
    if (edge === 'neg') return 'edge-neg';
    return 'edge-neu';
  }

  function valueBox(vc) {
    if (!vc) return '';
    const sign = vc.ev > 0 ? '+' : '';
    const color = vc.hasValue ? '#34c77b' : '#e05252';
    return `<div class="value-box" style="color:${color}">
      EV estimado: ${sign}${vc.ev}% · Nuestra prob: ${vc.ourProb}% vs Book: ${vc.bookProb}%
    </div>`;
  }

  function renderPlayerCard(p) {
    const uncertain = p.evolution_uncertain
      ? `<div class="uncertainty-note">⚠️ Datos recientes limitados — mayor margen de error en este análisis</div>`
      : '';
    return `
      <div class="player-card">
        <div class="pc-name">${escHtml(p.name)}</div>
        <div class="pc-style">${escHtml(p.style)}</div>
        ${evoBar(p.evolution_score, p.name)}
        <div class="pc-evo-text">${escHtml(p.evolution)}</div>
        ${uncertain}
      </div>`;
  }

  function renderBetCard(bet) {
    const vc = bet.valueCalc ? valueBox(bet.valueCalc) : '';
    return `
      <div class="bet-card ${edgeClass(bet.edge)}">
        <div class="bc-top">
          <span class="bc-market">${escHtml(bet.market)}</span>
          <span class="bc-badge ${badgeClass(bet.label)}">${bet.label}</span>
        </div>
        <div class="bc-pick">${escHtml(bet.pick)}</div>
        <div class="bc-reason">${escHtml(bet.reason)}</div>
        ${bet.implied_prob ? `<div style="font-size:10px;color:var(--text-3);margin-top:3px;">Prob. estimada: ${bet.implied_prob}%</div>` : ''}
        ${vc}
      </div>`;
  }

  function render(data, params) {
    let html = '';

    // Circuit warning
    if (data.circuit_warning && data.circuit_warning !== 'null') {
      html += `<div class="uncertainty-note" style="margin-bottom:14px;">⚠️ ${escHtml(data.circuit_warning)}</div>`;
    }

    // Player cards
    html += `<div class="result-grid-2">
      ${renderPlayerCard(data.p1)}
      ${renderPlayerCard(data.p2)}
    </div>`;

    // H2H + surface
    if (data.h2h) {
      html += `<div class="info-card">
        <div class="ic-label">H2H · ${escHtml(params.surface)}</div>
        <div class="ic-text">${escHtml(data.h2h)}</div>
      </div>`;
    }
    if (data.surface_note) {
      html += `<div class="info-card">
        <div class="ic-label">Nota de superficie</div>
        <div class="ic-text">${escHtml(data.surface_note)}</div>
      </div>`;
    }

    // Cuotas intro
    if (params.odd1 || params.odd2) {
      html += `<div class="info-card" style="border-color:rgba(59,158,255,0.2);">
        <div class="ic-label" style="color:var(--accent);">Cuotas introducidas — ${escHtml(params.oddMarket)}</div>
        <div class="ic-text">`;
      if (params.odd1) html += `${escHtml(params.p1)}: <strong style="color:var(--text-1);">${params.odd1}</strong> (prob. implícita: ${(100/parseFloat(params.odd1)).toFixed(1)}%)`;
      if (params.odd1 && params.odd2) html += ` &nbsp;·&nbsp; `;
      if (params.odd2) html += `${escHtml(params.p2)}: <strong style="color:var(--text-1);">${params.odd2}</strong> (prob. implícita: ${(100/parseFloat(params.odd2)).toFixed(1)}%)`;
      html += `</div></div>`;
    }

    // Bet cards
    if (data.bets && data.bets.length) {
      html += `<div class="ic-label" style="margin-bottom:8px;">Indicios de apuesta</div>`;
      html += `<div class="bets-grid">`;
      for (const bet of data.bets) html += renderBetCard(bet);
      html += `</div>`;
    }

    // Summary
    if (data.summary) {
      html += `<div class="summary-card">
        <div class="ic-label">Conclusión</div>
        <div class="ic-text">${escHtml(data.summary)}</div>
      </div>`;
    }

    return html;
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function toPlainText(data, params) {
    let t = `🎾 TennisEdge Analyst\n`;
    t += `${data.p1.name} vs ${data.p2.name} — ${params.surface} (${params.circuit})\n`;
    if (params.tournament) t += `📍 ${params.tournament}\n`;
    t += `\n`;
    t += `── ESTILOS ──\n`;
    t += `${data.p1.name}: ${data.p1.style}\nEvolución: ${data.p1.evolution} [${data.p1.evolution_score}/10]\n\n`;
    t += `${data.p2.name}: ${data.p2.style}\nEvolución: ${data.p2.evolution} [${data.p2.evolution_score}/10]\n\n`;
    if (data.h2h) t += `── H2H ──\n${data.h2h}\n\n`;
    if (data.surface_note) t += `── SUPERFICIE ──\n${data.surface_note}\n\n`;
    t += `── APUESTAS ──\n`;
    for (const b of (data.bets || [])) {
      t += `[${b.label}] ${b.market}: ${b.pick}\n→ ${b.reason}\n`;
      if (b.implied_prob) t += `Prob. estimada: ${b.implied_prob}%\n`;
      t += `\n`;
    }
    if (data.summary) t += `── CONCLUSIÓN ──\n${data.summary}\n`;
    return t;
  }

  return { render, toPlainText };
})();
