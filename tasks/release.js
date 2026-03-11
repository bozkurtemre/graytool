#!/usr/bin/env node
// tasks/release.js — Build and package the Chrome extension for releases.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const OUT_DIR = path.join(ROOT_DIR, 'build', 'release');

const FILES = [
  'manifest.json',
  'background.js',
  'inject/index.js',
  'options/options.html',
  'options/options.css',
  'options/options.js',
  'css/fontawesome.css',
  'logo.svg',
];

const DIRS = [
  'icons',
  'webfonts',
];

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');

function readPackageVersion() {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version || '0.0.0';
}

function runBuild() {
  execFileSync(process.execPath, [path.join(ROOT_DIR, 'tasks', 'build.js')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
}

function ensureExists(relPath, kind) {
  const fullPath = path.join(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    const hint = skipBuild ? 'Run without --skip-build' : 'Run npm run build';
    console.error('Missing ' + kind + ': ' + relPath + '. ' + hint + '.');
    process.exit(1);
  }
}

function copyFile(relPath, stageDir) {
  const sourcePath = path.join(SRC_DIR, relPath);
  const destPath = path.join(stageDir, relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
}

function copyDir(relPath, stageDir) {
  const sourcePath = path.join(SRC_DIR, relPath);
  const destPath = path.join(stageDir, relPath);
  fs.cpSync(sourcePath, destPath, { recursive: true });
}

function tryZip(command, argsList, options) {
  try {
    execFileSync(command, argsList, options);
    return true;
  } catch {
    return false;
  }
}

function packageRelease() {
  if (!skipBuild) {
    runBuild();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stageDir = fs.mkdtempSync(path.join(OUT_DIR, 'stage-'));

  FILES.forEach((relPath) => {
    ensureExists(relPath, 'file');
    copyFile(relPath, stageDir);
  });

  DIRS.forEach((relPath) => {
    ensureExists(relPath, 'directory');
    copyDir(relPath, stageDir);
  });

  const version = readPackageVersion();
  const outputZip = path.join(OUT_DIR, 'graytool-' + version + '.zip');
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }

  const zipped =
    tryZip('zip', ['-r', outputZip, '.'], { cwd: stageDir, stdio: 'inherit' }) ||
    tryZip('ditto', ['-c', '-k', '--sequesterRsrc', '.', outputZip], {
      cwd: stageDir,
      stdio: 'inherit',
    });

  fs.rmSync(stageDir, { recursive: true, force: true });

  if (!zipped) {
    console.error("Packaging failed. Install the 'zip' CLI or run on macOS.");
    process.exit(1);
  }

  console.log('✅ Release package created: ' + outputZip);
}

packageRelease();
