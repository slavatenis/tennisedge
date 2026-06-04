// ── analyzer.js ── Llamada a API + lógica de valor

const Analyzer = (() => {

  const SYSTEM_PROMPT = `Eres un analista profesional de apuestas de tenis con expertise en ATP, WTA, Challenger e ITF.
Analizas partidos con enfoque técnico-táctico y de valor de mercado.

Para cada partido:
1. ESTILO DE JUEGO de cada jugador: tipo de saque, resto, patrones tácticos desde el fondo, red, físico y mentalidad competitiva.
2. EVOLUCIÓN RECIENTE (últimos 6-12 meses): ¿ha cambiado mucho o poco su juego? Lesiones, cambios técnicos, estado de forma, racha de resultados. Asigna evolution_score de 0 (jugador muy estable, predecible) a 10 (jugador muy cambiante, alta incertidumbre analítica).
3. H2H relevante en la superficie indicada.
4. NOTA DE SUPERFICIE: ventajas/desventajas de cada jugador en esa superficie.
5. INDICIOS DE APUESTA en estos mercados:
   - Ganador del partido
   - Hándicap de sets (con qué hándicap)
   - Total de juegos over/under (sugiere línea orientativa)
   - Ganar al menos un set (el teórico perdedor)
   - Duración del partido (si aplica)
6. Para cada mercado: edge = "pos" (hay valor), "neg" (no hay valor / evitar), "neu" (incierto/paso). label = "VALOR", "RIESGO" o "PASAR".
7. Si el circuito es Challenger o ITF, advierte explícitamente que los datos son más escasos y la incertidumbre es mayor.

IMPORTANTE: No inventes estadísticas exactas. Usa rangos y tendencias. Si los datos son insuficientes para un mercado, marca como PASAR con explicación honesta.
Sé directo y técnico. Sin relleno. Sin frases de cortesía.

Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, sin backticks:
{
  "p1": {
    "name": "nombre completo",
    "style": "descripción táctica 2-3 frases",
    "evolution": "descripción del cambio reciente 1-2 frases",
    "evolution_score": 0-10,
    "evolution_uncertain": true/false
  },
  "p2": {
    "name": "nombre completo",
    "style": "descripción táctica 2-3 frases",
    "evolution": "descripción del cambio reciente 1-2 frases",
    "evolution_score": 0-10,
    "evolution_uncertain": true/false
  },
  "h2h": "resumen H2H en esta superficie",
  "surface_note": "ventajas/desventajas en esta superficie para cada uno",
  "circuit_warning": "null o advertencia si es Challenger/ITF",
  "bets": [
    {
      "market": "nombre del mercado",
      "pick": "selección concreta",
      "edge": "pos|neg|neu",
      "label": "VALOR|RIESGO|PASAR",
      "reason": "razonamiento técnico 1-2 frases",
      "implied_prob": null o número 0-100 (probabilidad implícita estimada del pick)
    }
  ],
  "summary": "conclusión del partido en 2-3 frases. Cuál es la apuesta más clara si la hay."
}`;

  function buildUserPrompt(params) {
    const { p1, p2, surface, circuit, tournament, odd1, odd2, oddMarket } = params;
    let prompt = `Partido: ${p1} vs ${p2}\nSuperficie: ${surface}\nCircuito: ${circuit}`;
    if (tournament) prompt += `\nTorneo: ${tournament}`;
    if (odd1 || odd2) {
      prompt += `\n\nCuotas disponibles para el mercado "${oddMarket}":`;
      if (odd1) prompt += `\n- ${p1}: ${odd1} (prob. implícita: ${(100/parseFloat(odd1)).toFixed(1)}%)`;
      if (odd2) prompt += `\n- ${p2}: ${odd2} (prob. implícita: ${(100/parseFloat(odd2)).toFixed(1)}%)`;
      prompt += `\nTen en cuenta estas cuotas al evaluar el valor. Compara tu probabilidad estimada con la implícita del book.`;
    }
    return prompt;
  }

  function calcValue(impliedProb, bookOdd) {
    if (!impliedProb || !bookOdd) return null;
    const bookProb = 100 / parseFloat(bookOdd);
    const ev = (impliedProb / 100) * parseFloat(bookOdd) - 1;
    return {
      bookProb: bookProb.toFixed(1),
      ourProb: impliedProb,
      ev: (ev * 100).toFixed(1),
      hasValue: ev > 0.03
    };
  }

  async function analyze(params) {
    if (!TENNIS_CONFIG.apiKey || TENNIS_CONFIG.apiKey.includes('XXXX')) {
      throw new Error('API_KEY_MISSING');
    }

    const tools = TENNIS_CONFIG.webSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' }]
      : undefined;

    const body = {
      model: TENNIS_CONFIG.model,
      max_tokens: TENNIS_CONFIG.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(params) }]
    };
    if (tools) body.tools = tools;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    let raw = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') raw += block.text;
    }

    raw = raw.replace(/```json|```/g, '').trim();
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('JSON_PARSE_ERROR');
    const parsed = JSON.parse(raw.slice(start, end + 1));

    // Enriquecer con cálculo de valor si hay cuotas
    if (params.odd1 || params.odd2) {
      for (const bet of (parsed.bets || [])) {
        if (bet.implied_prob && params.odd1 &&
            bet.pick.toLowerCase().includes(params.p1.split(' ')[0].toLowerCase())) {
          bet.valueCalc = calcValue(bet.implied_prob, params.odd1);
        } else if (bet.implied_prob && params.odd2 &&
            bet.pick.toLowerCase().includes(params.p2.split(' ')[0].toLowerCase())) {
          bet.valueCalc = calcValue(bet.implied_prob, params.odd2);
        }
      }
    }

    return parsed;
  }

  return { analyze };
})();
