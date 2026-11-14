import { lstat, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'core-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const allowed = (path) =>
  path === 'css/base.css' ||
  /^js\/core\/[A-Za-z0-9._-]+\.js$/.test(path);

function validateManifest({ regenerateChecksums = false } = {}) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Manifest moet een JSON-object zijn.');
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error('Ongeldige of niet-ondersteunde manifest schemaVersion.');
  }
  const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
  if (typeof manifest.coreVersion !== 'string' || !semver.test(manifest.coreVersion)) {
    throw new Error('coreVersion moet een geldige SemVer-versie zijn.');
  }
  if (!['unreleased', 'released'].includes(manifest.releaseStatus)) {
    throw new Error('releaseStatus moet unreleased of released zijn.');
  }
  if (!manifest.source || typeof manifest.source !== 'object' ||
      typeof manifest.source.repository !== 'string' || !manifest.source.repository.trim() ||
      typeof manifest.source.ref !== 'string' || !manifest.source.ref.trim() ||
      typeof manifest.source.commit !== 'string' ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(manifest.source.commit)) {
    throw new Error('Manifest source moet repository, ref en een geldige commit-SHA bevatten.');
  }
  if (!Array.isArray(manifest.allowlist) || manifest.allowlist.length === 0 ||
      new Set(manifest.allowlist).size !== manifest.allowlist.length) {
    throw new Error('Manifest allowlist ontbreekt, is leeg of bevat dubbele paden.');
  }
  for (const path of manifest.allowlist) {
    if (typeof path !== 'string' || !allowed(path) ||
        path.includes('..') || path.includes('\\') || path.startsWith('/')) {
      throw new Error(`Niet-toegestaan kernbestand: ${path}`);
    }
  }
  if (!manifest.checksums || typeof manifest.checksums !== 'object' ||
      Array.isArray(manifest.checksums)) {
    throw new Error('Manifest checksums moet een object zijn.');
  }

  // In generate mode the checksum map is output, not trusted input. Allow
  // an empty, partial, stale or malformed map to be replaced in one pass.
  if (regenerateChecksums) return;

  const keys = Object.keys(manifest.checksums);
  const unexpected = keys.filter(path => !manifest.allowlist.includes(path));
  if (unexpected.length) {
    throw new Error(`Checksum staat niet op de allowlist: ${unexpected.join(', ')}`);
  }
  for (const [path, checksum] of Object.entries(manifest.checksums)) {
    if (!/^[a-f0-9]{64}$/.test(checksum)) {
      throw new Error(`Ongeldig SHA-256-formaat voor: ${path}`);
    }
  }
  if (manifest.releaseStatus === 'released' &&
      (keys.length !== manifest.allowlist.length ||
       manifest.allowlist.some(path => !Object.hasOwn(manifest.checksums, path)))) {
    throw new Error('Een released manifest moet voor elk allowlisted bestand exact één checksum bevatten.');
  }
  if (keys.length > 0 &&
      (keys.length !== manifest.allowlist.length ||
       manifest.allowlist.some(path => !Object.hasOwn(manifest.checksums, path)))) {
    throw new Error('Checksums zijn gedeeltelijk ingevuld; genereer alle checksums opnieuw.');
  }
}

async function readAllowedFile(path) {
  const absolutePath = resolve(root, path);
  const relative = absolutePath.slice(root.length + 1);
  if (!relative || relative.startsWith(`..${sep}`) || relative === '..') {
    throw new Error(`Pad valt buiten de repository: ${path}`);
  }

  let current = root;
  for (const segment of path.split('/')) {
    current = resolve(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink()) {
      throw new Error(`Symlinks zijn niet toegestaan in kernpaden: ${path}`);
    }
  }
  const info = await lstat(absolutePath);
  if (!info.isFile()) {
    throw new Error(`Kernbestand moet een regulier bestand zijn: ${path}`);
  }
  return readFile(absolutePath);
}

validateManifest({ regenerateChecksums: process.argv[2] === 'generate' });

if (process.argv[2] === 'generate') {
  const checksums = {};
  for (const path of manifest.allowlist) {
    checksums[path] = createHash('sha256').update(await readAllowedFile(path)).digest('hex');
  }
  manifest.checksums = checksums;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`SHA-256-checksums bijgewerkt voor ${Object.keys(checksums).length} bestanden.`);
} else if (process.argv[2] === 'verify') {
  const keys = Object.keys(manifest.checksums);
  if (keys.length === 0 && manifest.releaseStatus === 'unreleased') {
    for (const path of manifest.allowlist) await readAllowedFile(path);
    console.log('Unreleased manifest: structuur en allowlist gecontroleerd; checksums worden bij release gegenereerd.');
  } else {
    for (const path of manifest.allowlist) {
      const actual = createHash('sha256').update(await readAllowedFile(path)).digest('hex');
      if (actual !== manifest.checksums[path]) throw new Error(`Checksum mismatch: ${path}`);
    }
    console.log(`Alle ${keys.length} SHA-256-checksums zijn geldig.`);
  }
} else {
  throw new Error('Gebruik: node tools/manifest.mjs generate|verify');
}
