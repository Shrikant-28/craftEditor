#!/usr/bin/env node

/**
 * Windows Release Packaging Script for Aura Notes Desktop
 * 
 * Features:
 *   - Automatic SemVer version bumping and tracking across releases
 *   - Pre-flight checks and icon validation
 *   - Full Vitest test suite execution
 *   - Frontend & Electron main/preload bundling
 *   - Windows NSIS installer & standalone packaging
 *   - SHA-256 checksum generation & release-history.json tracking
 * 
 * Usage:
 *   npm run release                     (Bumps patch version and builds)
 *   npm run release -- --bump minor     (Bumps minor version e.g. 1.1.0)
 *   npm run release -- --bump major     (Bumps major version e.g. 2.0.0)
 *   npm run release -- --version 1.5.0  (Sets explicit version)
 *   npm run release -- --no-bump        (Keeps current version)
 *   npm run release:quick               (Skips tests)
 *   npm run release:dir                 (Unpacked testing directory)
 *   npm run release:portable            (Portable executable)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { updateVersion } = require('./bump-version');

const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

// Helper to format bytes into readable units
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Helper to compute SHA-256 checksum
function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

// Log formatting
function logStep(stepNum, totalSteps, title) {
  console.log(`\n\x1b[36m======================================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m[Step ${stepNum}/${totalSteps}]\x1b[0m \x1b[1m${title}\x1b[0m`);
  console.log(`\x1b[36m======================================================================\x1b[0m`);
}

function runCmd(command, stepDescription) {
  console.log(`\x1b[90m> ${command}\x1b[0m`);
  try {
    execSync(command, { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (error) {
    console.error(`\x1b[31m[ERROR] Failed during: ${stepDescription}\x1b[0m`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipTests = args.includes('--skip-tests');
  const dirOnly = args.includes('--dir');
  const portableOnly = args.includes('--portable');
  const noBump = args.includes('--no-bump') || args.includes('--keep-version') || dirOnly;

  // Check bump type or explicit version
  let bumpType = 'patch';
  const bumpIdx = args.indexOf('--bump');
  if (bumpIdx !== -1 && args[bumpIdx + 1]) {
    bumpType = args[bumpIdx + 1];
  }

  let explicitVersion = null;
  const verIdx = args.indexOf('--version');
  if (verIdx !== -1 && args[verIdx + 1]) {
    explicitVersion = args[verIdx + 1];
  }

  console.log(`\n\x1b[35m╔════════════════════════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[35m║\x1b[0m           \x1b[1mAura Notes Desktop - Windows Release Builder\x1b[0m             \x1b[35m║\x1b[0m`);
  console.log(`\x1b[35m╚════════════════════════════════════════════════════════════════════╝\x1b[0m\n`);

  const totalSteps = skipTests ? 6 : 7;
  let currentStep = 1;

  // Step 1: Version Maintenance
  logStep(currentStep++, totalSteps, 'Release Version Maintenance');
  const pkgCurrent = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  let activeVersion = pkgCurrent.version || '1.0.0';

  if (!noBump) {
    const target = explicitVersion || bumpType;
    const { oldVersion, newVersion } = updateVersion(target);
    activeVersion = newVersion;
    console.log(`• Previous Version: \x1b[33m${oldVersion}\x1b[0m`);
    console.log(`• Target Version:   \x1b[32m\x1b[1m${newVersion}\x1b[0m (${explicitVersion ? 'explicit' : bumpType + ' bump'})`);
    console.log(`• Synchronized package.json and package-lock.json`);
  } else {
    console.log(`• Maintaining Version: \x1b[32m\x1b[1m${activeVersion}\x1b[0m (--no-bump / keep-version active)`);
  }

  // Step 2: Pre-flight checks
  logStep(currentStep++, totalSteps, 'Pre-flight Environment Validation');
  console.log(`• Operating System: ${process.platform} (${process.arch})`);
  console.log(`• Node Version:     ${process.version}`);
  console.log(`• Release Version:  v${activeVersion}`);
  console.log(`• Workspace Root:   ${ROOT_DIR}`);

  if (process.platform !== 'win32') {
    console.warn(`\x1b[33m[WARN] You are building on ${process.platform}. Windows builds work best natively on Windows.\x1b[0m`);
  }

  // Ensure icons exist
  const icoPath = path.join(ROOT_DIR, 'public', 'icon.ico');
  const pngPath = path.join(ROOT_DIR, 'public', 'icon.png');
  if (!fs.existsSync(icoPath) || !fs.existsSync(pngPath)) {
    console.log('• Windows icons not found. Generating icons from public/note.jpg...');
    const iconScript = path.join(ROOT_DIR, 'scripts', 'create-icon.ps1');
    runCmd(`powershell -ExecutionPolicy Bypass -File "${iconScript}"`, 'Icon generation');
  } else {
    console.log('• Windows icons verified (public/icon.ico, public/icon.png)');
  }

  // Step 3: Run Tests (if not skipped)
  if (!skipTests) {
    logStep(currentStep++, totalSteps, 'Executing Vitest Test Suite');
    runCmd('npm run test', 'Running tests');
  }

  // Step 4: Clean previous build artifacts
  logStep(currentStep++, totalSteps, 'Cleaning Stale Build Output');
  const dirsToClean = [
    path.join(ROOT_DIR, 'dist'),
    path.join(ROOT_DIR, 'dist-electron'),
    path.join(ROOT_DIR, 'release', 'win-unpacked')
  ];

  dirsToClean.forEach(d => {
    if (fs.existsSync(d)) {
      console.log(`• Removing ${path.relative(ROOT_DIR, d)}...`);
      try {
        fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
      } catch (err) {
        console.warn(`\x1b[33m• Notice: directory cleanup deferred: ${err.message}\x1b[0m`);
      }
    }
  });

  // Step 5: Build Web Application & Electron Bundles
  logStep(currentStep++, totalSteps, `Building Web Assets & Electron Main/Preload (v${activeVersion})`);
  console.log('• Compiling TypeScript & bundling Vite production bundle...');
  runCmd('npm run build:vite', 'Vite build');

  console.log('• Bundling Electron Main, Preload & copying SQLite WebAssembly...');
  runCmd('npm run build:electron', 'Electron build');

  // Verify built artifacts
  const requiredFiles = [
    path.join(ROOT_DIR, 'dist', 'index.html'),
    path.join(ROOT_DIR, 'dist-electron', 'main.js'),
    path.join(ROOT_DIR, 'dist-electron', 'preload.js'),
    path.join(ROOT_DIR, 'dist-electron', 'sql-wasm.wasm')
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) {
      console.error(`\x1b[31m[ERROR] Expected built file missing: ${path.relative(ROOT_DIR, f)}\x1b[0m`);
      process.exit(1);
    }
  }
  console.log('• All frontend and electron runtime bundles verified.');

  // Step 6: Package Executables with electron-builder
  logStep(currentStep++, totalSteps, `Packaging Windows Distributable (v${activeVersion})`);
  let builderCmd = 'npx electron-builder --win';
  if (dirOnly) {
    builderCmd += ' --dir';
  } else if (portableOnly) {
    builderCmd += ' portable';
  }
  runCmd(builderCmd, 'electron-builder packaging');

  // Step 7: Inspect output, compute SHA-256 checksums, and update release history
  logStep(currentStep++, totalSteps, 'Release Output Verification & SHA-256 Checksums');
  if (!fs.existsSync(RELEASE_DIR)) {
    console.error(`\x1b[31m[ERROR] Release directory not found at: ${RELEASE_DIR}\x1b[0m`);
    process.exit(1);
  }

  const releaseArtifacts = [];
  
  // Check root release directory
  const rootFiles = fs.readdirSync(RELEASE_DIR);
  rootFiles.forEach(f => {
    if (f.endsWith('.exe') || f.endsWith('.blockmap')) {
      releaseArtifacts.push({
        relPath: f,
        fullPath: path.join(RELEASE_DIR, f),
        isInstaller: true,
      });
    }
  });

  // Check unpacked directory if present
  const unpackedDir = path.join(RELEASE_DIR, 'win-unpacked');
  if (fs.existsSync(unpackedDir)) {
    const unpackedFiles = fs.readdirSync(unpackedDir);
    unpackedFiles.forEach(f => {
      if (f.endsWith('.exe')) {
        releaseArtifacts.push({
          relPath: path.join('win-unpacked', f),
          fullPath: path.join(unpackedDir, f),
          isInstaller: false,
        });
      }
    });
  }

  if (releaseArtifacts.length === 0) {
    console.warn('\x1b[33m[WARN] No .exe release artifacts found in release/ directory.\x1b[0m');
  } else {
    const checksumReportLines = [];
    const historyEntries = [];
    console.log(`\n\x1b[1mGenerated Release Artifacts in ./release (v${activeVersion}):\x1b[0m`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Artifact Name                            Size         SHA-256 (first 12)`);
    console.log(`--------------------------------------------------------------------------------`);

    for (const item of releaseArtifacts) {
      const stat = fs.statSync(item.fullPath);
      const sha256 = computeSha256(item.fullPath);
      const sizeStr = formatBytes(stat.size).padEnd(12);
      const shortHash = sha256.substring(0, 12);
      console.log(`${item.relPath.padEnd(40)} ${sizeStr} ${shortHash}...`);
      if (item.isInstaller) {
        checksumReportLines.push(`${sha256}  ${item.relPath}`);
        historyEntries.push({
          name: item.relPath,
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size),
          sha256,
        });
      }
    }
    console.log(`--------------------------------------------------------------------------------`);

    // Write checksums.txt file for installers/packages
    if (checksumReportLines.length > 0) {
      const checksumsFilePath = path.join(RELEASE_DIR, 'checksums.txt');
      fs.writeFileSync(checksumsFilePath, checksumReportLines.join('\n') + '\n', 'utf-8');
      console.log(`• Checksums written to: ${path.relative(ROOT_DIR, checksumsFilePath)}`);
    }

    // Maintain release-history.json
    try {
      const historyFilePath = path.join(RELEASE_DIR, 'release-history.json');
      let history = [];
      if (fs.existsSync(historyFilePath)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
          if (!Array.isArray(history)) history = [];
        } catch {
          history = [];
        }
      }
      history.unshift({
        version: activeVersion,
        timestamp: new Date().toISOString(),
        platform: process.platform,
        arch: process.arch,
        artifacts: historyEntries,
      });
      fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2) + '\n', 'utf-8');
      console.log(`• Release history logged to: ${path.relative(ROOT_DIR, historyFilePath)}`);
    } catch (err) {
      console.warn('• Notice: Could not update release-history.json:', err.message);
    }
  }

  console.log(`\n\x1b[32m✔ Release v${activeVersion} packaging complete successfully!\x1b[0m`);
  console.log(`  Artifacts are ready in: \x1b[36m${RELEASE_DIR}\x1b[0m\n`);
}

main().catch(err => {
  console.error('\x1b[31m[FATAL] Release failed:\x1b[0m', err);
  process.exit(1);
});
