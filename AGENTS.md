# Guidelines for AI Coding Agents

This document provides essential context and conventions for AI coding agents working on the Graytool Chrome extension codebase.

---

## Project Overview

**Graytool** is a Chrome extension (Manifest V3) that enhances Graylog log management interfaces by injecting customizable action buttons into log rows. These buttons allow developers to quickly navigate from log entries to related admin panels, user details, or other internal tools.

### Key Features
- URL pattern matching to activate only on configured Graylog instances
- Configurable buttons with URL templates and field bindings
- Automatic field discovery from log rows (data attributes, JSON parsing, DOM patterns)
- Conditional button visibility based on field values
- JSON viewer for log message details
- Import/export configuration for sharing between environments

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  src/background.ts    │ Service worker for URL matching     │
│  src/inject/          │ Injected into matched pages         │
│    index.ts           │ Entry point, activation handling    │
│    button-injector.ts │ Button creation and URL resolution  │
│    field-detector.ts   │ Field discovery strategies          │
│    observer.ts        │ MutationObserver for DOM changes    │
│    row-processor.ts   │ Process log rows                    │
│    ui/                │ Styles, JSON viewer, field selector  │
│  src/options/         │ Extension options UI (React)        │
│    options.tsx        │ Entry point                         │
│    OptionsPage.tsx    │ Main options page                   │
│  src/shared/          │ Shared code                         │
│    types.ts           │ TypeScript type definitions          │
│    storage.ts         │ Chrome storage abstraction          │
│  src/manifest.json    │ Chrome extension manifest           │
│  src/icons/           │ Extension icons                     │
│  src/logo.svg         │ Extension logo (used in options)    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User visits URL → background.ts checks pattern → sends ACTIVATE message
                                                          ↓
inject (content script) activates ← processes log rows ← injects buttons
                                                          ↓
User clicks button → opens resolved URL in new tab
```

---

## Build and Test Commands

### Development

```bash
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

# Clean build artifacts
npm run clean
```

### Loading the Extension

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `src` directory
5. After code changes, click the reload button on the extension card

### Build System

The project uses **esbuild** for fast bundling. The build process:
1. Bundles TypeScript/TSX files into IIFE format
2. Processes TailwindCSS with PostCSS
3. Copies FontAwesome assets and rewrites font paths for Chrome extension compatibility

Output directory: `src/`

---

## Code Style Guidelines

### Imports

```typescript
// ✅ Preferred: Type-only imports for types
import type { GrayToolConfig, ButtonConfig } from "../shared/types";

// ✅ Regular imports for runtime values
import { getConfig, saveConfig } from "../shared/storage";

// ✅ Import order: external → internal → types
import React, { useState, useEffect } from "react";
import { getConfig } from "../shared/storage";
import type { GrayToolConfig } from "../shared/types";
```

### File Headers

Each file should have a descriptive header comment:

```typescript
// inject/button-injector.ts — Button injection into Graylog log rows
// Resolves URL templates, evaluates conditions, and injects styled buttons.
```

### Section Comments

Use section dividers for logical groupings within files:

```typescript
// ─── Section Name ─────────────────────────────────────────
```

### Formatting

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes for strings, avoid template literals for simple strings
- **Trailing commas**: Use in multi-line arrays/objects

```typescript
// ✅ Good
const config = {
  version: 2,
  buttons: [
    { id: "btn-1", label: "View User" },
  ],
};

// ❌ Avoid
const config = {
  version: 2,
  buttons: [
    { id: 'btn-1', label: 'View User' }
  ]
}
```

### TypeScript Types

- **Strict mode**: Enabled (`strict: true` in tsconfig.json)
- **Explicit return types**: Required for exported functions
- **Type annotations**: Required for function parameters
- **Avoid `any`**: Use `unknown` when type is truly unknown

```typescript
// ✅ Good
export async function getConfig(): Promise<GrayToolConfig> {
  // ...
}

// ✅ Good - explicit parameter and return types
function evaluateCondition(
  condition: ButtonCondition,
  fields: Record<string, string>,
): boolean {
  // ...
}

// ❌ Avoid
function process(data: any) {
  return data;
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `fieldMap`, `resolvedUrl` |
| Functions | camelCase | `getConfig()`, `processRow()` |
| Constants | SCREAMING_SNAKE_CASE | `DEBOUNCE_MS`, `STORAGE_KEY` |
| Types/Interfaces | PascalCase | `ButtonConfig`, `GrayToolConfig` |
| Type unions | PascalCase | `ButtonColor`, `FieldSource` |
| React components | PascalCase | `ButtonsPage`, `ButtonCard` |
| CSS classes | kebab-case with `gt-` prefix | `gt-btn`, `gt-btn-primary` |
| Data attributes | kebab-case with `graytool-` prefix | `data-graytool-btn-id` |

### Error Handling

- Use try/catch for operations that may fail
- Prefer silent failures in content scripts (don't break Graylog UI)
- Always check `chrome.runtime.lastError` after async Chrome API calls

```typescript
// ✅ Good - Chrome API error handling
return new Promise((resolve, reject) => {
  chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
    } else {
      resolve();
    }
  });
});

// ✅ Good - Silent fail in content script
try {
  processRow(row, config);
} catch (error) {
  // Silent fail - don't break Graylog
}

// ✅ Good - Log and continue
try {
  const config = await getConfig();
} catch (error) {
  console.log("Graytool: Error loading config:", error);
  return;
}
```

### React Conventions

- Use functional components with hooks
- Define props interfaces inline or adjacent to component
- Use React.FC type for components with props

```typescript
// ✅ Good
interface Props {
  config: GrayToolConfig;
  onSave: (updates: Partial<GrayToolConfig>) => Promise<void>;
}

export const ButtonsPage: React.FC<Props> = ({ config, onSave }) => {
  const [editing, setEditing] = useState<ButtonConfig | null>(null);
  // ...
};
```

### Storage Access

**All storage access MUST go through [`shared/storage.ts`](shared/storage.ts)**. Never access `chrome.storage` directly from other modules.

```typescript
// ✅ Good
import { getConfig, saveConfig } from "../shared/storage";
const config = await getConfig();

// ❌ Never do this
chrome.storage.sync.get(["graytool_config"], (result) => {
  // ...
});
```

### CSS and Styling

- Use TailwindCSS utility classes in React components
- Content script styles use custom CSS with `gt-` prefix to avoid conflicts
- Graylog design language colors are defined as CSS custom properties

```css
/* Content script styles use gt- prefix */
.gt-btn {
  /* ... */
}

.gt-btn-primary {
  background-color: var(--gt-primary);
}
```

### Message Types

Use typed messages from [`shared/types.ts`](shared/types.ts) for background ↔ content script communication:

```typescript
// ✅ Good
import type { GrayToolMessage } from "../shared/types";

chrome.runtime.onMessage.addListener((message: GrayToolMessage) => {
  switch (message.type) {
    case "ACTIVATE":
      activate();
      break;
    // ...
  }
});
```

---

## Important Files

| File | Purpose |
|------|---------|
| [`src/shared/types.ts`](src/shared/types.ts) | All TypeScript type definitions |
| [`src/shared/storage.ts`](src/shared/storage.ts) | Chrome storage abstraction (REQUIRED for all storage access) |
| [`src/background.ts`](src/background.ts) | Service worker, URL pattern matching |
| [`src/inject/index.ts`](src/inject/index.ts) | Inject script entry point |
| [`src/options/options.tsx`](src/options/options.tsx) | Options page entry point |
| [`src/logo.svg`](src/logo.svg) | Extension logo used in options page |
| [`tasks/build.js`](tasks/build.js) | esbuild configuration |
| [`tasks/release.js`](tasks/release.js) | Release packaging script |
| [`src/manifest.json`](src/manifest.json) | Chrome extension manifest |

---

## Configuration Schema

The extension uses a v2 configuration format stored in Chrome sync storage:

```typescript
interface GrayToolConfig {
  version: 2;
  urlPatterns: UrlPattern[];      // URLs where extension activates
  buttons: ButtonConfig[];        // User-defined buttons
  globalFieldConfig: GlobalFieldConfig;  // Field discovery settings
  settings: AppSettings;          // Feature toggles
}
```

See [`src/shared/types.ts`](src/shared/types.ts) for complete type definitions.
