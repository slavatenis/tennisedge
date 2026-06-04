# 🎾 TennisEdge Analyst

Herramienta de análisis táctico y valor de apuesta para partidos de tenis ATP / WTA / Challenger / ITF.

## Qué hace

- Analiza el **estilo de juego** de cada jugador con búsqueda web en tiempo real
- Evalúa la **evolución reciente** (cambio 0–10) como indicador de incertidumbre analítica
- Muestra **H2H** en la superficie concreta
- Da **indicios de valor** en 5 mercados: ganador, hándicap sets, total juegos, ganar al menos 1 set, duración
- Si introduces **cuotas del book**, calcula el EV estimado y la probabilidad implícita vs. la del modelo
- **Historial** de los últimos 30 análisis guardado localmente
- **Copiar** el análisis completo en texto plano para pegar en Telegram o notas
- Funciona como **PWA** — instálala en el móvil como app nativa

---

## Setup en 3 pasos

### 1. Clona o descarga el repo

```bash
git clone https://github.com/TU_USUARIO/tennisedge.git
cd tennisedge
```

### 2. Pon tu API key de Anthropic

Edita `js/config.js`:

```js
const TENNIS_CONFIG = {
  apiKey: "sk-ant-TU_KEY_AQUI",  // ← cambia esto
  model: "claude-sonnet-4-20250514",
  maxTokens: 1600,
  webSearch: true,
};
```

Obtén tu key en: https://console.anthropic.com/account/keys

> ⚠️ **IMPORTANTE**: La API key queda expuesta en el código del navegador.
> Úsala solo en tu repositorio **privado** o localmente.
> Para uso compartido, necesitarías un backend que haga las llamadas.

### 3. Despliega en GitHub Pages

```bash
git add .
git commit -m "setup"
git push origin main
```

En GitHub → Settings → Pages → Source: `main / (root)` → Save.

Tu app estará en: `https://TU_USUARIO.github.io/tennisedge`

---

## Uso local (sin GitHub)

Abre `index.html` directamente en el navegador. Por restricciones CORS, necesitas un servidor local:

```bash
# Python 3
python -m http.server 8080

# Node
npx serve .
```

Abre `http://localhost:8080`

---

## Estructura

```
tennisedge/
├── index.html          # Shell principal
├── manifest.json       # PWA manifest
├── css/
│   └── style.css       # Estilos (tema oscuro)
└── js/
    ├── config.js       # ← TU API KEY VA AQUÍ
    ├── history.js      # Historial localStorage
    ├── analyzer.js     # Llamada API + cálculo de valor
    ├── render.js       # Renderizado de resultados
    └── app.js          # Controlador UI
```

---

## Mercados analizados

| Mercado | Qué evalúa |
|---|---|
| Ganador partido | Probabilidad estimada vs. cuota |
| Hándicap de sets | Margen esperado del partido |
| Total juegos over/under | Tendencia de duración por estilos |
| Ganar al menos 1 set | Valor en el teórico perdedor |
| Duración del partido | Si aplica por estilos de juego |

---

## Notas

- Los análisis usan búsqueda web para datos recientes (noticias, lesiones, resultados).
- El modelo **no inventa estadísticas exactas** — trabaja con rangos y tendencias.
- Para Challenger/ITF se muestra advertencia de datos limitados.
- La barra de evolución mide **incertidumbre analítica**, no calidad del jugador.

---

Construido con la API de Anthropic (claude-sonnet-4).
