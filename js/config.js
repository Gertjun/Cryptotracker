// App-configuratie voor Cryptotracker 4.0.6 en de vastgepinde PWA-Core v1.3.0.
export const APP = {
  name: 'Crypto Portfolio',
  version: '4.0.7',
  coreVersion: '1.3.0',
  coreCommit: 'fd47638355d975d85dfc376b07810b4b0e4b2a63',
  storagePrefix: 'cpt',
  defaultDataPath: 'crypto-portfolio.pwa-core-v1.json',
  defaultBranch: 'main',
  autoLockMinutes: 5,
  autoBiometricUnlock: true,
  syncDelaySeconds: 20,
  minPasswordLength: 12,
  kdfIterations: 600_000,
};
