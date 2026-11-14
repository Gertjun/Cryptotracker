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
const timestampOf = (record, fallback = 0) =>
  Number(record?.updatedAt ?? record?.mod ?? record?.updated ?? record?.created ?? fallback) || 0;

function collectLegacyTombstones(value, path = [], found = {}, fallback = 0) {
  if (Array.isArray(value)) {
    for (const item of value) collectLegacyTombstones(item, path, found, fallback);
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  if (typeof value.id === 'string' && value.id && value.del === true) {
    const key = `data/${path.join('/')}:${value.id}`;
    found[key] = Math.max(found[key] || 0, timestampOf(value, fallback));
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== SYSTEM_KEY) collectLegacyTombstones(child, [...path, key], found, fallback);
  }
  return found;
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
    const key = `data/txs:${id}`;
    state.deletions[key] = Math.max(Number(state.deletions[key]) || 0, fallback);
  }
  for (const [key, time] of Object.entries(collectLegacyTombstones(data, [], {}, fallback))) {
    state.deletions[key] = Math.max(Number(state.deletions[key]) || 0, time);
  }
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
  const deviceSettings = {
    github: {
      token: typeof gh.token === 'string' ? gh.token : '',
      repo: typeof gh.repo === 'string' ? gh.repo : '',
      path: typeof gh.path === 'string' && gh.path ? gh.path : 'crypto-portfolio.pwa-core-v1.json',
      branch: typeof gh.branch === 'string' && gh.branch ? gh.branch : 'main',
    },
  };
  return {
    payload: {
      schema: 1,
      data: convertedData,
      settings,
      prices: clone(snapshot.prices),
      visit: snapshot.visit ?? null,
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

  function enqueue(job) {
    const run = writes.then(job);
    writes = run.catch(() => {});
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
        return vault.getData();
      });
    },

    load() {
      return clone(vault.getData());
    },

    async flush() {
      await writes;
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
