#!/usr/bin/env node

/**
 * SemVer Version Management Script for Aura Notes Desktop
 * 
 * Usage:
 *   node scripts/bump-version.js patch    (1.0.0 -> 1.0.1)
 *   node scripts/bump-version.js minor    (1.0.1 -> 1.1.0)
 *   node scripts/bump-version.js major    (1.1.0 -> 2.0.0)
 *   node scripts/bump-version.js 1.2.3    (explicit version)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');
const PKG_LOCK_PATH = path.join(ROOT_DIR, 'package-lock.json');

function bumpSemver(currentVersion, bumpType = 'patch') {
  const parts = currentVersion.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid SemVer format: "${currentVersion}". Expected format: X.Y.Z`);
  }

  let [major, minor, patch] = parts;

  switch (bumpType.toLowerCase()) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

function updateVersion(targetBumpOrVersion) {
  if (!fs.existsSync(PKG_PATH)) {
    throw new Error(`package.json not found at: ${PKG_PATH}`);
  }

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  const oldVersion = pkg.version || '1.0.0';
  let newVersion = '';

  const semverRegex = /^\d+\.\d+\.\d+$/;

  if (targetBumpOrVersion && semverRegex.test(targetBumpOrVersion)) {
    newVersion = targetBumpOrVersion;
  } else {
    const bumpType = targetBumpOrVersion || 'patch';
    newVersion = bumpSemver(oldVersion, bumpType);
  }

  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  // Also update package-lock.json if it exists
  if (fs.existsSync(PKG_LOCK_PATH)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(PKG_LOCK_PATH, 'utf-8'));
      pkgLock.version = newVersion;
      if (pkgLock.packages && pkgLock.packages['']) {
        pkgLock.packages[''].version = newVersion;
      }
      fs.writeFileSync(PKG_LOCK_PATH, JSON.stringify(pkgLock, null, 2) + '\n', 'utf-8');
    } catch (err) {
      console.warn('Warning: Could not update package-lock.json:', err.message);
    }
  }

  return { oldVersion, newVersion };
}

if (require.main === module) {
  const arg = process.argv[2] || 'patch';
  try {
    const { oldVersion, newVersion } = updateVersion(arg);
    console.log(`\x1b[32m✔ Version updated: ${oldVersion} -> ${newVersion}\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

module.exports = { updateVersion, bumpSemver };
