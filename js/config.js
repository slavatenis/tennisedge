// ─────────────────────────────────────────────
//  TennisEdge Analyst — Configuración
//  La API key se guarda en el navegador (localStorage)
//  El código es seguro para repositorios públicos
// ─────────────────────────────────────────────

const TENNIS_CONFIG = {
  // La key se gestiona desde la UI — no pongas nada aquí
  get apiKey() {
    return localStorage.getItem('tennisedge_apikey') || '';
  },
  set apiKey(val) {
    if (val) localStorage.setItem('tennisedge_apikey', val);
    else localStorage.removeItem('tennisedge_apikey');
  },

  model: "model: "claude-opus-4-5",
  maxTokens: 1600,
  webSearch: true,
};
