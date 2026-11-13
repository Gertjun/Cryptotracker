// Tijdelijke module-bootstrap voor de gecontroleerde Core-integratie.
// De bestaande app blijft voorlopig een klassiek script; PR C koppelt de adapter.
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

async function startLegacyApp() {
  const script = document.createElement('script');
  script.src = './app.js';
  script.async = false;
  script.onerror = () => console.error('Crypto Portfolio kon app.js niet laden.');
  document.body.append(script);
}

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
} catch (error) {
  // Core wordt pas in de volgende migratiefase aan de app gekoppeld.
  // Een bootstrapfout mag de bestaande, nog actieve app niet blokkeren.
  console.error('PWA-Core kon nog niet worden geladen; legacy-app blijft actief.', error);
}
await startLegacyApp();
