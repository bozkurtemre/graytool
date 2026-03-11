# Contributing to Graytool

First off, thank you for considering contributing to Graytool! It's people like you that make Graytool such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if helpful**
- **Specify your browser version and Graytool version**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the desired behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/bozkurtemre/graytool.git
cd graytool

# Install dependencies
npm install

# Development build with source maps
npm run build

# Production build (minified, no source maps)
npm run build:prod

# Watch mode - rebuild on file changes
npm run dev

# Type checking only (no emit)
npm run typecheck
```

### Loading the Extension

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `src` directory
5. After code changes, click the reload button on the extension card

### Building for Release

```bash
# Create a release package
npm run release
```

The release package will be created in `build/release/graytool-{version}.zip`.

## Coding Standards

### TypeScript

- **Strict mode**: Enabled (`strict: true` in tsconfig.json)
- **Explicit return types**: Required for exported functions
- **Type annotations**: Required for function parameters
- **Avoid `any`**: Use `unknown` when type is truly unknown

### Code Style

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Trailing commas**: Use in multi-line arrays/objects

### File Headers

Each file should have a descriptive header comment:

```typescript
// inject/button-injector.ts — Button injection into Graylog log rows
// Resolves URL templates, evaluates conditions, and injects styled buttons.
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `fieldMap`, `resolvedUrl` |
| Functions | camelCase | `getConfig()`, `processRow()` |
| Constants | SCREAMING_SNAKE_CASE | `DEBOUNCE_MS`, `STORAGE_KEY` |
| Types/Interfaces | PascalCase | `ButtonConfig`, `GrayToolConfig` |
| React components | PascalCase | `ButtonsPage`, `ButtonCard` |
| CSS classes | kebab-case with `gt-` prefix | `gt-btn`, `gt-btn-primary` |

### Storage Access

All storage access MUST go through `src/shared/storage.ts`. Never access `chrome.storage` directly from other modules.

```typescript
// ✅ Good
import { getConfig, saveConfig } from "../shared/storage";
const config = await getConfig();

// ❌ Never do this
chrome.storage.sync.get(["graytool_config"], (result) => {
  // ...
});
```

## Project Structure

```
graytool/
├── src/
│   ├── background.ts       # Service worker for URL matching
│   ├── manifest.json       # Chrome extension manifest
│   ├── logo.svg            # Extension logo
│   ├── icons/              # Extension icons
│   ├── inject/             # Content scripts
│   │   ├── index.ts        # Entry point
│   │   ├── button-injector.ts
│   │   ├── field-detector.ts
│   │   ├── observer.ts
│   │   ├── row-processor.ts
│   │   └── ui/             # UI components
│   ├── options/            # Options page (React)
│   │   ├── options.tsx     # Entry point
│   │   ├── OptionsPage.tsx # Main component
│   │   ├── options.html
│   │   └── options.css
│   └── shared/             # Shared code
│       ├── types.ts        # TypeScript types
│       └── storage.ts      # Chrome storage abstraction
├── tasks/
│   ├── build.js            # esbuild configuration
│   ├── release.js          # Release packaging
│   └── clean.js            # Clean build artifacts
├── AGENTS.md               # AI coding agent guidelines
├── CONTRIBUTING.md         # This file
└── package.json
```

## Questions?

Feel free to open an issue on GitHub or reach out to the maintainer at [emreb.dev](https://emreb.dev).

---

Thank you for contributing! 🎉
