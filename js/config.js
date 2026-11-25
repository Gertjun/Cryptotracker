// App-configuratie voor Cryptotracker 4.4.0 en de vastgepinde PWA-Core v1.4.0.
export const APP = {
  name: 'Crypto Portfolio',
  version: '4.4.0',
  coreVersion: '1.4.0',
  coreCommit: '208062143441b96c2587dfef311ea0843618b87c',
  storagePrefix: 'cpt',
  defaultDataPath: 'crypto-portfolio.pwa-core-v1.json',
  defaultBranch: 'main',
  autoLockMinutes: 5,
  autoBiometricUnlock: true,
  syncDelaySeconds: 20,
  minPasswordLength: 12,
  kdfIterations: 600_000,
};
