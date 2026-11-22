// Laad de vastgepinde PWA-Core-modules naast de bestaande klassieke app.
const coreModules = ['./config.js','./core/biometric.js','./core/crypto.js','./core/deletions.js','./core/dom.js','./core/github.js','./core/nav.js','./core/pair.js','./core/records.js','./core/sync.js','./core/ui.js','./core/vault.js','./core/legacy-adapter.js'];

function showBootstrapFailure() {
  document.body.classList.add('locked');
  document.body.classList.remove('private');
  const topbar = document.getElementById('topbar');
  const side = document.getElementById('side');
  const view = document.getElementById('view');
  if (topbar) { topbar.replaceChildren(); topbar.hidden = true; topbar.style.display = 'none'; }
  if (side) { side.replaceChildren(); side.hidden = true; side.style.display = 'none'; }

  const target = view || document.body;
  target.innerHTML = `<section class="lock" id="core-bootstrap-error" role="alert" aria-labelledby="core-bootstrap-error-title">
    <div class="lock-ic" aria-hidden="true">🔒</div>
    <h2 id="core-bootstrap-error-title">Cryptotracker kan niet veilig starten</h2>
    <p class="hint">De beveiligde opslag kon niet worden geladen. Je gegevens zijn niet gewijzigd. Vernieuw de app of probeer het later opnieuw. De oude opslag wordt uit veiligheid niet automatisch geopend.</p>
    <button class="btn" id="core-bootstrap-reload" type="button">App vernieuwen</button>
  </section>`;
  document.getElementById('core-bootstrap-reload')?.addEventListener('click', () => window.location.reload());
}

// Navigatie van PWA-Core (D67): dezelfde module als in de andere apps. De app tekent zijn schermen via de
// hash-route; deze koppeling vertaalt een tik op een knop naar die route (zie syncCoreNav() in app.js).
function setupNav(navModule) {
  const host = document.getElementById('screen-app');
  if (!host || window.coreNav) return;
  const route = { home: '#', txs: '#transacties', reps: '#analyse' };
  const homeIcon = ['M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'];
  window.coreNav = navModule.createNav({
    screens: [
      { id: 'home', label: 'Overzicht', icon: homeIcon },
      { id: 'txs', label: 'Transacties', icon: 'list' },
      { id: 'reps', label: 'Analyse', icon: 'chart' },
    ],
    host,
    onChange: (id) => { if (!window.__navSync) location.hash = route[id]; },
    onSettings: () => window.openSettings?.(),
    onLeaveSettings: () => {},
  });
  // Op een munt-pagina hoort Overzicht bij het actieve scherm; een tik erop gaat terug naar het overzicht.
  host.querySelector('.app-nav')?.addEventListener('click', (e) => {
    const b = e.target.closest('.app-nav-btn');
    if (b?.dataset.screen === 'home' && location.hash.startsWith('#coin/')) location.hash = '#';
  });
  const h = location.hash;
  window.syncCoreNav?.(h.startsWith('#instellingen') ? 'settings' : /^#(analyse|rapporten)/.test(h) ? 'reps' : h.startsWith('#transacties') ? 'txs' : 'home');
}

try {
  const modules = await Promise.all(coreModules.map((path) => import(path)));
  const core = Object.freeze({config:modules[0],biometric:modules[1],crypto:modules[2],deletions:modules[3],dom:modules[4],github:modules[5],nav:modules[6],pair:modules[7],records:modules[8],sync:modules[9],ui:modules[10],vault:modules[11],legacyAdapter:modules[12]});
  setupNav(core.nav);
  if (window.__CPT_TEST_LEGACY__) {
    window.PWACoreV1 = core;
    window.CryptoPortfolioLegacy?.startLegacy();
  } else {
    const runtimeModule = await import('./core/runtime.js');
    await runtimeModule.initialize(core);
    window.PWACoreV1 = Object.freeze({...core,runtime:runtimeModule.runtime});
    window.dispatchEvent(new CustomEvent('pwa-core-ready',{detail:window.PWACoreV1}));
  }
} catch (error) {
  console.error('PWA-Core kon niet worden gestart.',error);
  window.dispatchEvent(new CustomEvent('pwa-core-error',{detail:error}));
  showBootstrapFailure();
}
