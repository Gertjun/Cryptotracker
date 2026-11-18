// App-configuratie voor Cryptotracker 4.0.5 en de vastgepinde PWA-Core v1.2.2.
export const APP = {
  name: 'Crypto Portfolio',
  version: '4.0.5',
  coreVersion: '1.2.2',
  coreCommit: '14dc3ad12c56a448f7de47e2c4c39347475355f6',
  storagePrefix: 'cpt',
  defaultDataPath: 'crypto-portfolio.pwa-core-v1.json',
  defaultBranch: 'main',
  autoLockMinutes: 5,
  autoBiometricUnlock: true,
  syncDelaySeconds: 20,
  minPasswordLength: 12,
  kdfIterations: 600_000,
};
