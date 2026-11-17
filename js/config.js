// App-configuratie voor de vastgepinde PWA-Core v1.2.1.
export const APP = {
  name: 'Crypto Portfolio',
  version: '4.0.4',
  storagePrefix: 'cpt',
  defaultDataPath: 'crypto-portfolio.pwa-core-v1.json',
  defaultBranch: 'main',
  autoLockMinutes: 5,
  autoBiometricUnlock: true,
  syncDelaySeconds: 20,
  minPasswordLength: 12,
  kdfIterations: 600_000,
};
