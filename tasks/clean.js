#!/usr/bin/env node
// tasks/clean.js — Remove build artifacts.

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

const TARGETS = [
  'build',
  'src/css',
  'src/webfonts',
  'src/background.js',
  'src/background.js.map',
  'src/inject/index.js',
  'src/inject/index.js.map',
  'src/options/options.js',
  'src/options/options.js.map',
];

for (const relPath of TARGETS) {
  const fullPath = path.join(ROOT_DIR, relPath);
  fs.rmSync(fullPath, { recursive: true, force: true });
}

console.log('✅ Clean complete');
