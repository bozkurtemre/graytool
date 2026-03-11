const esbuild = require('esbuild');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV !== 'production';
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  target: 'es2020',
  sourcemap: isDev,
  minify: !isDev,
  logLevel: 'info',
};

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Content script: tek bundle, IIFE format
const contentScriptOptions = {
  ...commonOptions,
  entryPoints: [path.join(SRC_DIR, 'inject/index.ts')],
  outfile: path.join(SRC_DIR, 'inject/index.js'),
  format: 'iife',
};

// Background service worker
const backgroundOptions = {
  ...commonOptions,
  entryPoints: [path.join(SRC_DIR, 'background.ts')],
  outfile: path.join(SRC_DIR, 'background.js'),
  format: 'iife',
};

// Options page: React bundle
const optionsOptions = {
  ...commonOptions,
  entryPoints: [path.join(SRC_DIR, 'options/options.tsx')],
  outfile: path.join(SRC_DIR, 'options/options.js'),
  format: 'iife',
  jsx: 'automatic',
};


function copyAssets() {
  // Copy FontAwesome assets
  fs.mkdirSync(path.join(SRC_DIR, 'css'), { recursive: true });
  const faCssPath = path.join(ROOT_DIR, 'node_modules/@fortawesome/fontawesome-free/css/all.min.css');
  let faCss = fs.readFileSync(faCssPath, 'utf8');
  faCss = faCss.replace(/\.\.\/webfonts\//g, 'chrome-extension://__MSG_@@extension_id__/webfonts/');
  fs.writeFileSync(path.join(SRC_DIR, 'css/fontawesome.css'), faCss);
  fs.cpSync(
    path.join(ROOT_DIR, 'node_modules/@fortawesome/fontawesome-free/webfonts'),
    path.join(SRC_DIR, 'webfonts'),
    { recursive: true }
  );

}

async function build() {
  try {
    copyAssets();

    if (isWatch) {
      // Watch mode — parallel contexts
      const contexts = await Promise.all([
        esbuild.context(contentScriptOptions),
        esbuild.context(backgroundOptions),
        esbuild.context(optionsOptions),
      ]);

      await Promise.all(contexts.map(ctx => ctx.watch()));
      console.log('👀 Watching for changes...');
    } else {
      // One-shot build
      await Promise.all([
        esbuild.build(contentScriptOptions),
        esbuild.build(backgroundOptions),
        esbuild.build(optionsOptions),
      ]);
      console.log('✅ Build complete');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
