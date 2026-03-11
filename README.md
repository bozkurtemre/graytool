<div align="center">
  <img src="src/logo.svg" alt="Graytool Logo" width="256" height="128">
</div>

##

Graytool is a Chrome extension (Manifest V3) that enhances Graylog log management by injecting configurable action buttons into log rows. It helps developers jump from log entries to admin panels, user details, and internal tools faster.

## Features

- URL pattern matching to activate only on configured Graylog instances
- Configurable buttons with URL templates and field bindings
- Automatic field discovery from log rows (data attributes, JSON parsing, DOM patterns)
- Conditional button visibility based on field values
- JSON viewer and search history for log message details
- Import/export configuration for sharing between environments

## Project Structure

```
src/
  manifest.json
  background.ts
  inject/            # Content script files
  options/           # Options UI (React)
  shared/            # Shared types + storage
  icons/
```

## Development

### Prerequisites

- Node.js 16+ (npm)

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

Build outputs are written into `src/` for loading the extension directly.

### Watch mode

```bash
npm run dev
```

### Typecheck / Lint

```bash
npm run lint
```

### Clean

```bash
npm run clean
```

## Loading the Extension

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `src` directory
5. Reload the extension after code changes

## Release Package

```bash
npm run release
```

This produces a zip at `build/release/graytool-<version>.zip` using the version from `package.json`.
