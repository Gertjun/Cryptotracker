// Brug de PWA-Core-kluis achter de bestaande Cryptotracker-datalaag.
// Deze adapter migreert niets vanzelf: de caller moet expliciet een snapshot aanbieden.
import { SYSTEM_KEY, emptySyncState, mergeSyncStates } from './deletions.js';

export const LEGACY_KEYS = Object.freeze({
  data: 'cpt.data',
  settings: 'cpt.settings',
  prices: 'cpt.prices',
  lock: 'cpt.lock',
  vault: 'cpt.vault',
  charts: 'cpt.charts',
  vcharts: 'cpt.vcharts',
});

const clone = (value) => structuredClone(value ?? {});

/** Geeft alleen aantallen terug voor de expliciete pre-importcontrole; geen recordinhoud. */
export function summarizeLegacyData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new TypeError('De legacy-data ontbreken of hebben een ongeldig formaat.');
  }
  const collectionKeys = ['watch', 'alerts', 'goals', 'plans', 'portfolios', 'allocs'];
  const collections = collectionKeys.reduce((count, key) => count + (Array.isArray(data[key]) ? data[key].length : 0), 0);
  const history = Object.values(data.hist && typeof data.hist === 'object' ? data.hist : {})
    .reduce((count, series) => count + (Array.isArray(series)
      ? series.length
      : series && typeof series === 'object' ? Object.keys(series).length : 0), 0);
  let tombstones = 0;
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (value.del === true || value.deleted === true) tombstones++;
    for (const [key, child] of Object.entries(value)) {
      if (key !== SYSTEM_KEY) visit(child);
    }
  };
  visit(data);
  const deletedTransactions = Array.isArray(data.deleted) ? data.deleted.length : 0;
  return Object.freeze({
    transactions: Array.isArray(data.txs) ? data.txs.length : 0,
    collections,
    history,
    deletionMarkers: deletedTransactions + tombstones,
  });
}

const timestampOf = (record, fallback = 0) =>
  Number(record?.updatedAt ?? record?.mod ?? record?.updated ?? record?.created ?? fallback) || 0;

function collectLegacyTombstones(value, path = [], found = {}, fallback = 0) {
  if (Array.isArray(value)) {
    for (const item of value) collectLegacyTombstones(item, path, found, fallback);
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  if (typeof value.id === 'string' && value.id && value.del === true) {
    const key = `${path.join('/')}:${value.id}`;
    found[key] = Math.max(found[key] || 0, timestampOf(value, fallback));
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== SYSTEM_KEY) collectLegacyTombstones(child, [...path, key], found, fallback);
  }
  return found;
}

function normalizeLegacyDeletionFlags(value) {
  if (Array.isArray(value)) {
    for (const item of value) normalizeLegacyDeletionFlags(item);
    return value;
  }
  if (!value || typeof value !== 'object') return value;
  if (typeof value.id === 'string' && value.id && value.del === true) value.deleted = true;
  for (const [key, child] of Object.entries(value)) {
    if (key !== SYSTEM_KEY) normalizeLegacyDeletionFlags(child);
  }
  return value;
}

/**
 * Zet de oude Cryptotracker-verwijderadministratie om naar de Core-ledger.
 * De originele data wordt niet gemuteerd; onbekende velden blijven behouden.
 */
export function convertLegacyDeletions(legacyData) {
  const data = clone(legacyData);
  const state = mergeSyncStates(data[SYSTEM_KEY] || emptySyncState(), null);
  const fallback = Number(data.updated) || 0;

  for (const id of Array.isArray(data.deleted) ? data.deleted : []) {
    if (typeof id !== 'string' || !id) continue;
    const key = `txs:${id}`;
    state.deletions[key] = Math.max(Number(state.deletions[key]) || 0, fallback);
  }
  for (const [key, time] of Object.entries(collectLegacyTombstones(data, [], {}, fallback))) {
    state.deletions[key] = Math.max(Number(state.deletions[key]) || 0, time);
  }
  normalizeLegacyDeletionFlags(data);
  data[SYSTEM_KEY] = state;
  return data;
}

/**
 * Secrets en GitHub-toegang zijn apparaatgebonden. Ze komen niet in de
 * synchronisatiepayload; het Core-device-settings-vak bewaart ze versleuteld.
 */
export function splitLegacySnapshot(snapshot) {
  if (!snapshot || !snapshot.data || typeof snapshot.data !== 'object' || Array.isArray(snapshot.data)) {
    throw new TypeError('De legacy-data ontbreken of hebben een ongeldig formaat.');
  }
  const settings = clone(snapshot.settings);
  const gh = settings.gh && typeof settings.gh === 'object' ? settings.gh : {};
  delete settings.gh;
  delete settings.visit;
  const convertedData = convertLegacyDeletions(snapshot.data);
  const syncState = convertedData[SYSTEM_KEY] || emptySyncState();
  delete convertedData[SYSTEM_KEY];
  const repoParts = typeof gh.repo === 'string' ? gh.repo.trim().split('/') : [];
  const deviceSettings = {
    ...clone(snapshot.coreDeviceSettings),
    github: {
      owner: repoParts.length === 2 ? repoParts[0] : '',
      repo: repoParts.length === 2 ? repoParts[1] : '',
      token: typeof gh.token === 'string' ? gh.token : '',
      path: 'crypto-portfolio.pwa-core-v1.json',
      branch: typeof gh.branch === 'string' && gh.branch ? gh.branch : 'main',
    },
    app: {
      settings,
      prices: clone(snapshot.prices),
      visit: snapshot.visit ?? null,
      chartCache: clone(snapshot.chartCache),
    },
  };
  return {
    payload: {
      ...convertedData,
      schema: 1,
      [SYSTEM_KEY]: syncState,
    },
    deviceSettings,
  };
}

/** Seriële, foutdoorlatende schrijfadapter rond de Core-vault. */
export function createLegacyStorageAdapter(vault) {
  if (!vault || typeof vault.setData !== 'function' || typeof vault.flush !== 'function') {
    throw new TypeError('Een geldige PWA-Core-vault is vereist.');
  }
  let writes = Promise.resolve();
  let writeSequence = 0;
  const writeFailures = [];

  function enqueue(job) {
    const sequence = ++writeSequence;
    const run = writes.then(job);
    // Houd de wachtrij bruikbaar na een fout, maar verlies de fout niet:
    // flush() moet kunnen melden dat een eerdere opslag niet is gelukt.
    writes = run.then(
      () => {
        // Een latere volledige snapshot herstelt eerdere mislukte saves.
        for (let index = writeFailures.length - 1; index >= 0; index--) {
          if (writeFailures[index].sequence < sequence) writeFailures.splice(index, 1);
        }
      },
      (error) => { writeFailures.push({ sequence, error }); },
    );
    return run;
  }

  return Object.freeze({
    async create(password, snapshot) {
      const { payload, deviceSettings } = splitLegacySnapshot(snapshot);
      return enqueue(async () => {
        await vault.create(password, payload);
        if (typeof vault.setDeviceSettings === 'function') {
          await vault.setDeviceSettings(deviceSettings);
        }
        await vault.flush();
        const stored = vault.getData();
        if (JSON.stringify(stored) !== JSON.stringify(payload)) {
          throw new Error('Controle na opslaan mislukt: Core-data wijken af van de aangeboden gegevens.');
        }
        if (typeof vault.getDeviceSettings !== 'function') {
          throw new Error('Controle na opslaan mislukt: Core-apparaatinstellingen kunnen niet worden teruggelezen.');
        }
        const storedDeviceSettings = await vault.getDeviceSettings();
        if (JSON.stringify(storedDeviceSettings) !== JSON.stringify(deviceSettings)) {
          throw new Error('Controle na opslaan mislukt: Core-apparaatinstellingen wijken af van de aangeboden instellingen.');
        }
        const status = vault.getStorageStatus?.();
        if (status?.pending === true || (Number.isInteger(status?.requestedRevision) &&
            Number.isInteger(status?.persistedRevision) && status.persistedRevision < status.requestedRevision)) {
          throw new Error('Controle na opslaan mislukt: de Core-opslag is nog niet volledig bevestigd.');
        }
        return stored;
      });
    },

    save(snapshot) {
      const { payload, deviceSettings } = splitLegacySnapshot(snapshot);
      return enqueue(async () => {
        await vault.setData(payload);
        if (typeof vault.setDeviceSettings === 'function') {
          await vault.setDeviceSettings(deviceSettings);
        }
        await vault.flush();
        const stored = vault.getData();
        if (JSON.stringify(stored) !== JSON.stringify(payload)) {
          throw new Error('Controle na opslaan mislukt: Core-data wijken af van de aangeboden gegevens.');
        }
        if (typeof vault.getDeviceSettings === 'function') {
          const storedDeviceSettings = await vault.getDeviceSettings();
          if (JSON.stringify(storedDeviceSettings) !== JSON.stringify(deviceSettings)) {
            throw new Error('Controle na opslaan mislukt: Core-apparaatinstellingen wijken af van de aangeboden instellingen.');
          }
        }
        const status = vault.getStorageStatus?.();
        if (status?.pending === true || (Number.isInteger(status?.requestedRevision) && Number.isInteger(status?.persistedRevision) && status.persistedRevision < status.requestedRevision)) {
          throw new Error('Controle na opslaan mislukt: de Core-opslag is nog niet volledig bevestigd.');
        }
        return stored;
      });
    },

    load() {
      return clone(vault.getData());
    },

    async loadDeviceSettings() {
      if (typeof vault.getDeviceSettings !== 'function') return null;
      return clone(await vault.getDeviceSettings());
    },

    async flush() {
      const through = writeSequence;
      const pending = writes;
      await pending;
      const failedIndex = writeFailures.findIndex((failure) => failure.sequence <= through);
      if (failedIndex !== -1) {
        // Blijf de fout melden tot een latere volledige save succesvol is.
        throw writeFailures[failedIndex].error;
      }
      await vault.flush();
    },

    /**
     * Koppelt een bestaande WebAuthn-passkey opnieuw aan de Core-datasleutel.
     * De credential kan dezelfde blijven; Core gebruikt zijn eigen PRF/HKDF-afleiding.
     */
    async enrollExistingPasskey(biometric) {
      if (!biometric || typeof biometric.enrollExisting !== 'function') {
        throw new TypeError('De PWA-Core-biometrie-API ontbreekt.');
      }
      await this.flush();
      return biometric.enrollExisting(vault.getDataKey());
    },

    async lock() {
      await this.flush();
      vault.lock();
    },
  });
}

/**
 * Houdt één actieve app-sessie per origin vast. Zonder Web Locks of wanneer
 * een andere sessie actief is, weigert de adapter de sessie (fail closed).
 */
export async function withExclusiveSessionLock(run, locks = globalThis.navigator?.locks) {
  if (!locks || typeof locks.request !== 'function') {
    throw new Error('Deze browser ondersteunt geen veilige sessievergrendeling. De app blijft gesloten.');
  }
  return locks.request('cpt:active-session', { mode: 'exclusive', ifAvailable: true }, async (lock) => {
    if (!lock) throw new Error('Crypto Portfolio is al actief in een ander tabblad of venster.');
    return run();
  });
}
