// Runtimebrug tussen de bestaande Cryptotracker-UI en de PWA-Core-kluis.
// De legacy-opslag en het oude SyncData-bestand worden nooit aangepast of gelezen via GitHub.
import * as vault from './vault.js';
import * as sync from './sync.js';
import * as github from './github.js';
import * as biometric from './biometric.js';
import { createLegacyStorageAdapter, withExclusiveSessionLock } from './legacy-adapter.js';

let core;
let adapter;
let deviceSettings = { github: {}, app: {} };
let releaseSession = null;
let sessionTask = null;
let active = false;
let syncPromise = null;
let syncAgain = false;
let lastHiddenAt = 0;
let lockTimer = null;

const $ = (selector) => document.querySelector(selector);
const clone = (value) => structuredClone(value ?? {});
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function show(title, message, body, error = '') {
  document.body.classList.add('locked');
  document.body.classList.remove('private');
  $('#topbar').innerHTML = '';
  $('#side').innerHTML = '';
  $('#view').innerHTML = `<section class="lock" id="core-gate" aria-labelledby="core-gate-title">
    <div class="lock-ic" aria-hidden="true">🔐</div>
    <h2 id="core-gate-title">${escapeHtml(title)}</h2>
    <p class="hint">${escapeHtml(message)}</p>
    <div id="core-gate-body">${body}</div>
    <p class="err" id="core-gate-error" role="alert">${escapeHtml(error)}</p>
  </section>`;
}

function setError(error) {
  const node = $('#core-gate-error');
  if (node) node.textContent = error?.message || String(error || 'Er is iets misgegaan.');
}

function formField(id, label, type = 'text', value = '', autocomplete = '') {
  return `<div class="field"><label for="${id}">${escapeHtml(label)}</label>
    <input id="${id}" type="${type}" value="${escapeHtml(value)}" autocomplete="${autocomplete}" required></div>`;
}

function githubFields(initial = {}) {
  return `${formField('core-owner', 'GitHub-eigenaar', 'text', initial.owner || 'Gertjun', 'username')}
    ${formField('core-repo', 'Repository', 'text', initial.repo || 'SyncData')}
    ${formField('core-token', 'GitHub-token', 'password', initial.token || '', 'off')}
    ${formField('core-branch', 'Branch', 'text', initial.branch || 'main')}`;
}

function setupScreen(error = '') {
  const hasLegacy = core.legacyAdapter && window.CryptoPortfolioLegacy.hasLegacyData();
  const oldGh = hasLegacy ? window.CryptoPortfolioLegacy.snapshot().settings?.gh || {} : {};
  const repo = typeof oldGh.repo === 'string' ? oldGh.repo.split('/') : [];
  const initial = {
    owner: repo.length === 2 ? repo[0] : 'Gertjun',
    repo: repo.length === 2 ? repo[1] : 'SyncData',
    token: oldGh.token || '',
    branch: oldGh.branch || 'main',
  };
  const legacyChoice = hasLegacy ? `<button class="btn" type="button" data-core-action="migrate">Bestaande gegevens op dit apparaat overzetten</button>` : '';
  show('PWA-Core instellen',
    'De nieuwe kluis staat los van de oude opslag. De bestaande gegevens en het oude synchronisatiebestand blijven behouden.',
    `<div class="core-actions">
      ${legacyChoice}
      <button class="btn sec" type="button" data-core-action="import">Bestaande Core-kluis van GitHub openen</button>
      <details><summary>GitHub-instellingen</summary><div class="mt-2">${githubFields(initial)}</div></details>
      <p class="hint">Gebruik een nieuw Core-wachtwoord van minimaal 12 tekens. Dit is niet het oude synchronisatiewachtwoord.</p>
      ${formField('core-password', 'Core-wachtwoord (nieuw bij migratie, bestaand bij koppelen)', 'password', '', 'current-password')}
      ${formField('core-password-confirm', 'Herhaal Core-wachtwoord', 'password', '', 'new-password')}
      <button class="btn sec" type="button" data-core-action="empty">Nieuwe lege kluis maken</button>
    </div>`, error);
}

function unlockScreen(error = '') {
  const hasPasskey = biometric.isEnrolled();
  show('Crypto Portfolio ontgrendelen',
    'Open de PWA-Core-kluis. De oude lokale gegevens blijven onaangeraakt.',
    `<form id="core-unlock-form">
      ${formField('core-unlock-password', 'Core-wachtwoord', 'password', '', 'current-password')}
      <button class="btn" type="submit">Ontgrendel</button>
    </form>
    ${hasPasskey ? '<button class="btn sec" type="button" data-core-action="passkey">Ontgrendel met passkey</button>' : ''}
    <button class="btn sec" type="button" data-core-action="lock-info">Waarom is dit nodig?</button>`, error);
}

function githubConfigFromForm({ required = true } = {}) {
  const owner = $('#core-owner')?.value.trim();
  const repo = $('#core-repo')?.value.trim();
  const token = $('#core-token')?.value.trim();
  const branch = $('#core-branch')?.value.trim() || 'main';
  if (required && (!owner || !repo || !token)) throw new Error('Vul GitHub-eigenaar, repository en token in.');
  return { owner, repo, token, branch, path: 'crypto-portfolio.pwa-core-v1.json' };
}

async function acquireSession() {
  if (releaseSession) return;
  let enteredResolve;
  let enteredReject;
  const entered = new Promise((resolve, reject) => {
    enteredResolve = resolve;
    enteredReject = reject;
  });
  const held = new Promise((resolve) => { releaseSession = resolve; });
  sessionTask = withExclusiveSessionLock(() => {
    enteredResolve();
    return held;
  }).catch((error) => {
    releaseSession = null;
    enteredReject(error);
  });
  await entered;
}

async function installAppSettings(settingsBox) {
  deviceSettings = settingsBox && typeof settingsBox === 'object'
    ? { autoLockMinutes: 5, ...settingsBox, github: settingsBox.github || {}, app: settingsBox.app || {} }
    : { autoLockMinutes: 5, github: {}, app: {} };
  adapter = createLegacyStorageAdapter(vault);
}

function appGithubSettings() {
  const g = deviceSettings.github || {};
  return {
    owner: g.owner || '',
    repo: g.repo || '',
    token: g.token || '',
    branch: g.branch || 'main',
    path: 'crypto-portfolio.pwa-core-v1.json',
  };
}

async function activate() {
  await installAppSettings(await vault.getDeviceSettings());
  active = true;
  const g = appGithubSettings();
  window.CryptoPortfolioLegacy.setRuntime(runtime);
  window.CryptoPortfolioLegacy.activateCore(vault.getData(), deviceSettings);
  if (g.owner && g.repo && g.token) {
    void syncNow(true).catch(() => {});
  }
  scheduleAutoLock();
}

async function createFromLegacy() {
  const pw = $('#core-password')?.value || '';
  const confirm = $('#core-password-confirm')?.value || '';
  if (pw.length < 12) throw new Error('Kies een Core-wachtwoord van minimaal 12 tekens.');
  if (pw !== confirm) throw new Error('De wachtwoorden zijn niet gelijk.');
  const snapshot = window.CryptoPortfolioLegacy.snapshot();
  if (!snapshot.data || typeof snapshot.data !== 'object') throw new Error('De bestaande gegevens zijn niet beschikbaar.');
  await acquireSession();
  const migrationSnapshot = {
    ...snapshot,
    settings: { ...snapshot.settings, gh: {
      repo: `${$('#core-owner')?.value.trim() || ''}/${$('#core-repo')?.value.trim() || ''}`,
      token: $('#core-token')?.value.trim() || '',
      branch: $('#core-branch')?.value.trim() || 'main',
    } },
    coreDeviceSettings: { autoLockMinutes: 5 },
  };
  const migrationAdapter = createLegacyStorageAdapter(vault);
  await migrationAdapter.create(pw, migrationSnapshot);
  await installAppSettings(await vault.getDeviceSettings());
  await activate();
}

async function createEmpty() {
  const pw = $('#core-password')?.value || '';
  const confirm = $('#core-password-confirm')?.value || '';
  if (pw.length < 12) throw new Error('Kies een Core-wachtwoord van minimaal 12 tekens.');
  if (pw !== confirm) throw new Error('De wachtwoorden zijn niet gelijk.');
  await acquireSession();
  const settingsBox = {
    autoLockMinutes: 5,
    github: githubConfigFromForm({ required: false }),
    app: { settings: {}, prices: {}, visit: null },
  };
  await vault.create(pw, { schema: 1, v: 1, txs: [], deleted: [], updated: Date.now() });
  await vault.setDeviceSettings(settingsBox);
  await vault.flush();
  await installAppSettings(settingsBox);
  await activate();
}

async function importFromGitHub() {
  const pw = $('#core-password')?.value || '';
  if (!pw) throw new Error('Vul het Core-wachtwoord in om de bestaande kluis te openen.');
  const config = githubConfigFromForm();
  await acquireSession();
  const client = github.createClient(config);
  await client.checkRepo();
  const remote = await client.getFile();
  if (!remote) throw new Error('Geen Core-kluis gevonden op het opgegeven pad. Controleer repository en branch.');
  await vault.importEnvelope(remote.envelope, pw);
  const current = await vault.getDeviceSettings();
  const next = current || { autoLockMinutes: 5, github: config, app: {} };
  next.github = config;
  await vault.setDeviceSettings(next);
  await vault.flush();
  await activate();
}

async function unlockLocal(password) {
  await acquireSession();
  await vault.unlockWithPassword(password);
  await activate();
}

async function unlockPasskey() {
  await acquireSession();
  const key = await biometric.unlock();
  await vault.unlockWithKey(key);
  await activate();
}

async function enrollExistingPasskey() {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  await adapter.enrollExistingPasskey(biometric);
  window.CryptoPortfolioLegacy.toast('Bestaande passkey aan Core gekoppeld');
}

async function enrollNewPasskey() {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  if (!(await biometric.isSupported())) throw new Error('Passkeys met PRF worden niet door deze browser of dit apparaat ondersteund.');
  await biometric.enroll(vault.getDataKey());
  window.CryptoPortfolioLegacy.toast('Nieuwe Core-passkey toegevoegd');
}

async function changePassword(current, next) {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  if (typeof next !== 'string' || next.length < 12) throw new Error('Kies een nieuw wachtwoord van minimaal 12 tekens.');
  await vault.changePassword(current, next);
  await vault.flush();
  await syncNow(false);
}

async function githubApi(url) {
  const settings = appGithubSettings();
  if (!settings.owner || !settings.repo || !settings.token) throw new Error('Stel eerst Core-synchronisatie in.');
  let response;
  try {
    response = await fetch(url, { headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${settings.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }, cache: 'no-store' });
  } catch {
    throw new Error('Geen verbinding met GitHub.');
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('GitHub-token ongeldig of onvoldoende bevoegd.');
    if (response.status === 404) throw new Error('Core-versie niet gevonden. Controleer repository en branch.');
    throw new Error(`GitHub gaf fout ${response.status}.`);
  }
  return response.json();
}

async function listVersions() {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  await syncNow(true); // Bewaar de huidige stand voordat de geschiedenis wordt getoond.
  const settings = appGithubSettings();
  const base = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`;
  const query = new URLSearchParams({ path: settings.path, sha: settings.branch, per_page: '40' });
  const commits = await githubApi(`${base}/commits?${query}`);
  return commits.map(commit => ({
    sha: commit.sha,
    ts: Date.parse(commit.commit?.committer?.date || commit.commit?.author?.date),
  })).filter(version => version.sha && Number.isFinite(version.ts));
}

async function readVersionEnvelope(sha) {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  if (!/^[a-f0-9]{7,40}$/i.test(sha)) throw new Error('Ongeldige versie-id.');
  const settings = appGithubSettings();
  const base = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`;
  const path = settings.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const file = await githubApi(`${base}/contents/${path}?ref=${encodeURIComponent(sha)}`);
  let encoded = file.content;
  if (file.encoding !== 'base64' || !encoded) {
    const blob = await githubApi(`${base}/git/blobs/${file.sha}`);
    encoded = blob.content;
  }
  if (!encoded) throw new Error('De Core-versie bevat geen leesbare kluisinhoud.');
  const bytes = Uint8Array.from(atob(encoded.replace(/\\s/g, '')), char => char.charCodeAt(0));
  const envelope = JSON.parse(new TextDecoder().decode(bytes));
  vault.validateEnvelope(envelope);
  return envelope;
}

async function previewVersion(sha) {
  const envelope = await readVersionEnvelope(sha);
  return vault.decryptRemote(envelope);
}

async function restoreVersion(sha, password) {
  if (!active) throw new Error('Ontgrendel eerst de Core-kluis.');
  // Synchroniseer eerst de actuele payload en verwijderledger. De Core-sync
  // blijft ongewijzigd; bij een andere datasleutel uploaden we de restore met
  // een compare-and-swap op de vooraf gecontroleerde GitHub-bestandsha.
  await syncNow(true);
  const settings = appGithubSettings();
  const client = github.createClient(settings);
  const current = await client.getFile();
  const meta = vault.getSyncMeta();
  if (!current || !meta.sha || current.sha !== meta.sha) {
    throw new Error('Het Core-bestand op GitHub is intussen gewijzigd. Herstel is gestopt om overschrijven te voorkomen. Synchroniseer opnieuw en probeer daarna nogmaals.');
  }
  const envelope = await readVersionEnvelope(sha);
  const result = await vault.restoreBackup(envelope, password);
  if (!result.sameKey) {
    biometric.disable(); // Oude passkey kan een andere datasleutel niet meer ontgrendelen.
    await vault.flush();
    const uploadedRevision = vault.getPersistedRevision();
    const nextSha = await client.putFile(vault.getEnvelope(), current.sha, 'Crypto Portfolio: Core-back-up hersteld');
    vault.markSynced(nextSha, uploadedRevision);
  }
  await vault.flush();
  window.CryptoPortfolioLegacy.applyCoreData(vault.getData());
  await syncNow(false);
  return { sameKey: result.sameKey };
}

async function updateGitHub(config) {
  if (!active) throw new Error('De Core-kluis is vergrendeld.');
  deviceSettings = { ...deviceSettings, github: {
    owner: config.owner,
    repo: config.repo,
    token: config.token,
    branch: config.branch || 'main',
    path: 'crypto-portfolio.pwa-core-v1.json',
  } };
  await vault.setDeviceSettings(deviceSettings);
  await vault.flush();
  window.CryptoPortfolioLegacy.toast('Core-synchronisatie-instellingen opgeslagen');
  await syncNow(false);
}

function syncNow(silent = true) {
  if (!active) return Promise.resolve();
  if (syncPromise) {
    syncAgain = true;
    return syncPromise;
  }
  syncPromise = (async () => {
    do {
      syncAgain = false;
      const settings = appGithubSettings();
      if (!settings.owner || !settings.repo || !settings.token) {
        window.CryptoPortfolioLegacy.setSyncStatus('off', '');
        return;
      }
      window.CryptoPortfolioLegacy.setSyncStatus('busy', '');
      try {
        await sync.syncNow({
          settings,
          merge: (local, remote) => window.CryptoPortfolioLegacy.merge(local, remote),
          migrate: (payload) => payload,
          schemaVersion: 1,
        });
        const next = vault.getData();
        window.CryptoPortfolioLegacy.applyCoreData(next);
        await vault.flush();
        window.CryptoPortfolioLegacy.setSyncStatus('ok', '');
        if (!silent) window.CryptoPortfolioLegacy.toast('Core-synchronisatie voltooid');
      } catch (error) {
        window.CryptoPortfolioLegacy.setSyncError(error?.message || 'Core-synchronisatie mislukt');
        if (!silent) window.CryptoPortfolioLegacy.toast(error?.message || 'Core-synchronisatie mislukt');
        throw error;
      }
    } while (syncAgain && active);
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

async function save(snapshot) {
  if (!active || !adapter) return;
  try {
    await adapter.save({
      ...snapshot,
      coreDeviceSettings: { autoLockMinutes: deviceSettings.autoLockMinutes ?? 5 },
      settings: { ...snapshot.settings, gh: {
        repo: `${deviceSettings.github?.owner || ''}/${deviceSettings.github?.repo || ''}`,
        token: deviceSettings.github?.token || '',
        branch: deviceSettings.github?.branch || 'main',
        path: 'crypto-portfolio.pwa-core-v1.json',
      } },
    });
  } catch (error) {
    window.CryptoPortfolioLegacy.setSyncError(error?.message || 'Opslaan in de Core-kluis mislukt');
    throw error;
  }
}

function scheduleAutoLock() {
  clearTimeout(lockTimer);
  if (!active) return;
  const minutes = Number(deviceSettings.autoLockMinutes ?? 5);
  if (minutes < 0) return;
  lockTimer = setTimeout(() => {
    if (!active) return;
    if (document.hidden) void lock();
    else scheduleAutoLock();
  }, Math.max(1, minutes) * 60_000);
}

async function lock() {
  if (!active) return;
  clearTimeout(lockTimer);
  try {
    if (syncPromise) await syncPromise.catch(() => {});
    await adapter.flush();
    await vault.flush();
  } finally {
    active = false;
    adapter = null;
    deviceSettings = { autoLockMinutes: 5, github: {}, app: {} };
    await vault.lock();
    window.CryptoPortfolioLegacy.lockCore();
    const release = releaseSession;
    releaseSession = null;
    if (release) release();
    unlockScreen();
  }
}

const runtime = Object.freeze({
  save,
  syncNow,
  updateGitHub,
  enrollExistingPasskey,
  enrollNewPasskey,
  changePassword,
  listVersions,
  previewVersion,
  restoreVersion,
  lock,
  isActive: () => active,
});

async function handleAction(action) {
  if (action === 'migrate') return createFromLegacy();
  if (action === 'empty') return createEmpty();
  if (action === 'import') return importFromGitHub();
  if (action === 'passkey') return unlockPasskey();
  if (action === 'corelock') return lock();
  if (action === 'lock-info') {
    setError('De Core-kluis gebruikt een eigen datasleutel. Op elk apparaat moet dezelfde bestaande kluis worden geopend.');
    return;
  }
}

export async function initialize(coreModules) {
  core = coreModules;
  if (!window.CryptoPortfolioLegacy) throw new Error('De bestaande app-brug ontbreekt.');
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-core-action]');
    if (!button) return;
    const action = button.dataset.coreAction;
    button.disabled = true;
    try { await handleAction(action); }
    catch (error) { setError(error); button.disabled = false; }
  });
  document.addEventListener('submit', async (event) => {
    if (event.target.id !== 'core-unlock-form') return;
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try { await unlockLocal($('#core-unlock-password').value); }
    catch (error) { setError(error); button.disabled = false; }
  });
  window.addEventListener('cpt-legacy-unlocked', () => setupScreen());
  window.addEventListener('pagehide', () => {
    if (active) {
      void adapter?.flush().catch(() => {});
      void vault.flush().catch(() => {});
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastHiddenAt = Date.now();
      if (active) void syncNow(true).catch(() => {});
    } else if (active) {
      const minutes = Number(deviceSettings.autoLockMinutes ?? 5);
      if (lastHiddenAt && minutes >= 0 && Date.now() - lastHiddenAt >= minutes * 60_000) void lock();
      else { scheduleAutoLock(); void syncNow(true).catch(() => {}); }
    }
  });
  if (vault.hasVault()) unlockScreen();
  else if (window.CryptoPortfolioLegacy.legacyLocked()) window.CryptoPortfolioLegacy.startLegacy({ allowSync: false });
  else setupScreen();
}

export { runtime };
