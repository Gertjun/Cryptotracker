// Laad de vastgepinde PWA-Core-modules naast de bestaande klassieke app.
// app.js blijft een klassiek script zodat bestaande globals en regressietests intact blijven.
const coreModules = [
  './config.js',
  './core/biometric.js',
  './core/crypto.js',
  './core/deletions.js',
  './core/dom.js',
  './core/github.js',
  './core/nav.js',
  './core/pair.js',
  './core/records.js',
  './core/sync.js',
  './core/ui.js',
  './core/vault.js',
  './core/legacy-adapter.js',
];

try {
  const modules = await Promise.all(coreModules.map((path) => import(path)));
  window.PWACoreV1 = Object.freeze({
    config: modules[0],
    biometric: modules[1],
    crypto: modules[2],
    deletions: modules[3],
    dom: modules[4],
    github: modules[5],
    nav: modules[6],
    pair: modules[7],
    records: modules[8],
    sync: modules[9],
    ui: modules[10],
    vault: modules[11],
    legacyAdapter: modules[12],
  });
  window.dispatchEvent(new CustomEvent('pwa-core-ready', { detail: window.PWACoreV1 }));
} catch (error) {
  // De legacy-app blijft bruikbaar; Core-integratie wordt pas actief na succesvolle import.
  console.error('PWA-Core kon niet worden geladen; legacy-opslag blijft actief.', error);
}
