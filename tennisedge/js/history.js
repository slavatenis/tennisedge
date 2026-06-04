// ── history.js ── Gestión del historial con localStorage

const History = (() => {
  const KEY = 'tennisedge_history';
  const MAX = 30;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); }
    catch(e) { console.warn('History save failed', e); }
  }

  function add(entry) {
    // entry: { id, match, surface, circuit, tournament, data, odds, timestamp }
    const items = load();
    items.unshift(entry);
    if (items.length > MAX) items.splice(MAX);
    save(items);
    return items;
  }

  function remove(id) {
    const items = load().filter(i => i.id !== id);
    save(items);
    return items;
  }

  function clear() {
    save([]);
    return [];
  }

  function get(id) {
    return load().find(i => i.id === id) || null;
  }

  return { load, add, remove, clear, get };
})();
