// inject/ui/styles.ts — Graylog Design Language CSS
// All content script styles are injected as a single <style> tag.
// Automatically detects Graylog's theme (light/dark) from localStorage.

let styleElement: HTMLStyleElement | null = null;
let currentTheme: "light" | "dark" = "dark";

function detectGraylogTheme(): "light" | "dark" {
  try {
    let themeMode = localStorage.getItem("themeMode");
    
    // Handle JSON-encoded value (e.g., "\"light\"")
    if (themeMode) {
      try {
        const parsed = JSON.parse(themeMode);
        if (typeof parsed === "string") {
          themeMode = parsed;
        }
      } catch {
        // Not JSON, use as-is
      }
    }
    
    if (themeMode === "light" || themeMode === "dark") {
      return themeMode;
    }
  } catch {
    // localStorage not accessible
  }
  // Default to dark
  return "dark";
}

export function injectStyles(): void {
  if (styleElement) return; // Already injected

  // Detect current theme
  currentTheme = detectGraylogTheme();

  styleElement = document.createElement("style");
  styleElement.id = "graytool-styles";
  styleElement.textContent = getThemeCSS(currentTheme);
  document.head.appendChild(styleElement);

  // Listen for theme changes
  startThemeWatcher();
}

export function removeStyles(): void {
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
  }
  stopThemeWatcher();
}

// ─── Theme Watcher ─────────────────────────────────────────────

let themeCheckInterval: ReturnType<typeof setInterval> | null = null;

function startThemeWatcher(): void {
  // Check every 500ms for theme changes
  themeCheckInterval = setInterval(() => {
    const newTheme = detectGraylogTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      updateTheme();
    }
  }, 500);
}

function stopThemeWatcher(): void {
  if (themeCheckInterval) {
    clearInterval(themeCheckInterval);
    themeCheckInterval = null;
  }
}

function updateTheme(): void {
  if (styleElement) {
    styleElement.textContent = getThemeCSS(currentTheme);
  }
}

// ─── Theme CSS ──────────────────────────────────────────────────

function getThemeCSS(theme: "light" | "dark"): string {
  const variables = theme === "dark" ? DARK_THEME_VARIABLES : LIGHT_THEME_VARIABLES;
  return `
/* ============================================================
   Graytool v2 — Graylog ${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme
   All styles prefixed with .gt- to avoid collisions.
   ============================================================ */

/* ─── CSS Custom Properties (Graylog Tokens) ─────────────── */

:root {
${variables}
}

${SHARED_CSS}
`;
}

// ─── Dark Theme Variables ───────────────────────────────────────

const DARK_THEME_VARIABLES = `
  /* Primary */
  --gt-primary: rgb(98, 157, 226);
  --gt-primary-hover: rgba(98, 157, 226, 0.8);
  --gt-primary-light: rgba(98, 157, 226, 0.1);

  /* Semantic */
  --gt-danger: #AD0707;
  --gt-warning: #C69B00;
  --gt-success: #00AE42;
  --gt-info: rgb(98, 157, 226);

  /* Backgrounds */
  --gt-bg-page: rgb(34, 34, 34);
  --gt-bg-card: rgb(48, 48, 48);
  --gt-bg-input: rgb(34, 34, 34);
  --gt-bg-header: rgb(48, 48, 48);
  --gt-bg-hover: rgba(255, 255, 255, 0.05);
  --gt-bg-selected: rgba(255, 255, 255, 0.1);

  /* Borders */
  --gt-border: #42464D;
  --gt-border-focus: rgb(98, 157, 226);

  /* Text */
  --gt-text-primary: #ECECEC;
  --gt-text-secondary: #A0A0A0;
  --gt-text-muted: #757575;
  --gt-text-link: rgb(98, 157, 226);

  /* JSON Viewer (Dark theme) */
  --gt-json-key: #56B6C2;
  --gt-json-string: #98C379;
  --gt-json-number: #D19A66;
  --gt-json-boolean: #C678DD;
  --gt-json-null: #808080;
  --gt-json-collapse: #A0A0A0;
  --gt-json-hover-row: #34373C;

  /* Typography */
  --gt-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --gt-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  --gt-font-size-base: 14px;
  --gt-font-size-sm: 12px;
  --gt-font-size-xs: 11px;
  --gt-line-height: 1.5;

  /* Spacing */
  --gt-radius: 4px;
  --gt-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --gt-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);
  --gt-shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

// ─── Light Theme Variables ───────────────────────────────────────

const LIGHT_THEME_VARIABLES = `
  /* Primary */
  --gt-primary: rgb(87, 141, 204);
  --gt-primary-hover: rgba(87, 141, 204, 0.8);
  --gt-primary-light: rgba(87, 141, 204, 0.1);

  /* Semantic */
  --gt-danger: #AD0707;
  --gt-warning: #C69B00;
  --gt-success: #00AE42;
  --gt-info: rgb(87, 141, 204);

  /* Backgrounds */
  --gt-bg-page: #F5F5F5;
  --gt-bg-card: #FFFFFF;
  --gt-bg-input: #FFFFFF;
  --gt-bg-header: #FAFAFA;
  --gt-bg-hover: rgba(0, 0, 0, 0.05);
  --gt-bg-selected: rgba(23, 78, 146, 0.1);

  /* Borders */
  --gt-border: #D9D9D9;
  --gt-border-focus: rgb(87, 141, 204);

  /* Text */
  --gt-text-primary: #1F1F1F;
  --gt-text-secondary: #595959;
  --gt-text-muted: #8C8C8C;
  --gt-text-link: rgb(87, 141, 204);

  /* JSON Viewer (Light theme) */
  --gt-json-key: #0066CC;
  --gt-json-string: #22863A;
  --gt-json-number: #B08800;
  --gt-json-boolean: #6F42C1;
  --gt-json-null: #6A737D;
  --gt-json-collapse: #595959;
  --gt-json-hover-row: #F0F0F0;

  /* Typography */
  --gt-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --gt-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  --gt-font-size-base: 14px;
  --gt-font-size-sm: 12px;
  --gt-font-size-xs: 11px;
  --gt-line-height: 1.5;

  /* Spacing */
  --gt-radius: 4px;
  --gt-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --gt-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
  --gt-shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

// ─── Shared CSS (Theme-independent) ─────────────────────────────

const SHARED_CSS = `
/* ─── Injected Row Buttons ───────────────────────────────── */

.gt-btn-container {
  display: inline-flex;
  gap: 4px;
  margin-left: 6px;
  align-items: center;
  vertical-align: middle;
  float: right;
}

.gt-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  line-height: var(--gt-line-height);
  border-radius: var(--gt-radius);
  border: none;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.gt-btn:focus {
  outline: 2px solid var(--gt-primary);
  outline-offset: 1px;
}

.gt-btn:hover {
  text-decoration: none;
}

/* Button Color Variants */
.gt-btn-primary {
  background: var(--gt-primary);
  color: #FFFFFF;
}
.gt-btn-primary:hover {
  background: var(--gt-primary-hover);
}

.gt-btn-default {
  background: var(--gt-bg-input);
  color: var(--gt-text-primary);
  border: 1px solid var(--gt-border);
}
.gt-btn-default:hover {
  background: var(--gt-bg-hover);
}

.gt-btn-danger {
  background: var(--gt-danger);
  color: #FFFFFF;
}
.gt-btn-danger:hover {
  background: #8B0606;
}

.gt-btn-warning {
  background: var(--gt-warning);
  color: #FFFFFF;
}
.gt-btn-warning:hover {
  background: #A68000;
}

.gt-btn-success {
  background: var(--gt-success);
  color: #FFFFFF;
}
.gt-btn-success:hover {
  background: #008C35;
}

/* Message Detail Button */
.gt-msg-detail-btn {
  background: var(--gt-bg-card);
  color: var(--gt-text-primary);
  border: 1px solid var(--gt-border);
  padding: 3px 8px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  border-radius: var(--gt-radius);
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.gt-msg-detail-btn:hover {
  background: var(--gt-primary);
  color: #FFFFFF;
}

/* ─── JSON Viewer Panel ─────────────────────────────────── */

.gt-json-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.gt-json-panel {
  background: var(--gt-bg-card);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  box-shadow: var(--gt-shadow-xl);
  width: 640px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: var(--gt-font);
  color: var(--gt-text-primary);
  overflow: hidden;
}

.gt-json-panel.gt-minimized {
  max-height: 42px;
  overflow: hidden;
}

.gt-json-panel.gt-maximized {
  width: 95vw;
  height: 95vh;
  max-height: 95vh;
}

/* Panel Header */
.gt-json-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--gt-bg-header);
  border-bottom: 2px solid var(--gt-primary);
  user-select: none;
  min-height: 40px;
}

.gt-json-header-title {
  font-size: var(--gt-font-size-base);
  font-weight: 600;
  color: var(--gt-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.gt-json-header-actions {
  display: flex;
  gap: 4px;
}

.gt-json-header-btn {
  background: none;
  border: 1px solid var(--gt-border);
  border-radius: 3px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--gt-text-secondary);
  font-size: 14px;
  transition: background-color 0.15s ease;
}

.gt-json-header-btn:hover {
  background: var(--gt-bg-hover);
  color: var(--gt-text-primary);
}

/* Toolbar */
.gt-json-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gt-border);
  background: var(--gt-bg-page);
}

.gt-json-field-select {
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 4px 8px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  color: var(--gt-text-primary);
  background: var(--gt-bg-input);
  cursor: pointer;
}

.gt-json-field-select:focus {
  border-color: var(--gt-border-focus);
  outline: none;
}

.gt-json-search {
  flex: 1;
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 4px 8px 4px 28px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  color: var(--gt-text-primary);
  background: var(--gt-bg-input);
  position: relative;
}

.gt-json-search:focus {
  border-color: var(--gt-border-focus);
  outline: none;
}

.gt-json-search-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.gt-json-search-icon {
  position: absolute;
  left: 8px;
  color: var(--gt-text-muted);
  font-size: 13px;
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gt-json-copy-all-btn {
  background: var(--gt-bg-card);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 4px 10px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  color: var(--gt-text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.gt-json-copy-all-btn:hover {
  background: var(--gt-bg-hover);
}

/* JSON Tree Body */
.gt-json-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: var(--gt-font-mono);
  font-size: 13px;
  line-height: 1.6;
  background: var(--gt-bg-card);
}

/* JSON Syntax Highlighting */
.gt-json-key {
  color: var(--gt-json-key);
  font-weight: 500;
}

.gt-json-string {
  color: var(--gt-json-string);
}

.gt-json-number {
  color: var(--gt-json-number);
}

.gt-json-boolean {
  color: var(--gt-json-boolean);
}

.gt-json-null {
  color: var(--gt-json-null);
  font-style: italic;
}

.gt-json-punctuation {
  color: var(--gt-text-muted);
}

.gt-json-toggle {
  color: var(--gt-json-collapse);
  cursor: pointer;
  user-select: none;
  display: inline-block;
  width: 14px;
  text-align: center;
  font-size: 11px;
  transition: transform 0.15s ease;
  border-radius: 2px;
}

.gt-json-toggle:hover {
  background: var(--gt-bg-hover);
  color: var(--gt-text-primary);
}

.gt-json-toggle.gt-collapsed {
  transform: rotate(-90deg);
}

.gt-json-length {
  color: var(--gt-text-muted);
  font-style: italic;
  font-size: var(--gt-font-size-xs);
  margin-left: 4px;
}

.gt-json-collapsible {
  margin-left: 0;
}

.gt-json-collapsible.gt-hidden {
  display: none;
}

/* JSON Row with action buttons */
.gt-json-row {
  display: flex;
  align-items: flex-start;
  padding: 1px 4px;
  border-radius: 2px;
  margin: 0 -4px;
  position: relative;
}

.gt-json-row:hover {
  background: var(--gt-json-hover-row);
}

.gt-json-row-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.gt-json-row-actions {
  display: none;
  gap: 2px;
  margin-left: 8px;
  flex-shrink: 0;
}

.gt-json-row:hover .gt-json-row-actions {
  display: flex;
}

.gt-json-row-action {
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  width: 24px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--gt-text-muted);
  font-size: 12px;
  transition: all 0.15s ease;
  padding: 0;
}

.gt-json-row-action:hover {
  background: var(--gt-bg-hover);
  border-color: var(--gt-border);
  color: var(--gt-text-primary);
}

/* Search highlight */
.gt-highlight {
  background: #D4B830;
  color: #000000;
  border-radius: 2px;
  padding: 0 1px;
}

/* Search result focus */
.gt-search-focus {
  background: var(--gt-primary-light) !important;
  border-left: 3px solid var(--gt-primary);
  margin-left: -3px;
  padding-left: 7px;
}

/* Dimmed (search non-match) */
.gt-json-row.gt-dimmed {
  opacity: 0.3;
}

/* Key/Value clickable */
.gt-json-key-clickable {
  cursor: pointer;
}
.gt-json-key-clickable:hover {
  text-decoration: underline;
}

.gt-json-value-clickable {
  cursor: pointer;
}
.gt-json-value-clickable:hover {
  background: var(--gt-primary-light);
  border-radius: 2px;
}

/* ─── Tabs (JSON Viewer footer) ─────────────────────────── */

.gt-tabs {
  display: flex;
  border-top: 1px solid var(--gt-border);
  background: var(--gt-bg-page);
}

.gt-tab {
  flex: 1;
  background: none;
  border: none;
  border-top: 2px solid transparent;
  padding: 8px 12px;
  font-size: var(--gt-font-size-sm);
  font-family: var(--gt-font);
  color: var(--gt-text-secondary);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}

.gt-tab:hover {
  background: var(--gt-bg-hover);
  color: var(--gt-text-primary);
}

.gt-tab.gt-active {
  color: var(--gt-primary);
  border-top-color: var(--gt-primary);
  font-weight: 500;
}

.gt-tab-content {
  display: none;
  padding: 12px;
}

.gt-tab-content.gt-active {
  display: block;
}

/* ─── Raw Tab ────────────────────────────────────────────── */

.gt-raw-content {
  background: var(--gt-bg-page);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 12px;
  font-family: var(--gt-font-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  color: var(--gt-text-primary);
}

/* ─── DevTools Tab ───────────────────────────────────────── */

.gt-devtools-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gt-devtools-section {
  background: var(--gt-bg-page);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 12px;
}

.gt-devtools-section-title {
  font-size: var(--gt-font-size-sm);
  font-weight: 600;
  color: var(--gt-text-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gt-devtools-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  padding: 8px;
  font-family: var(--gt-font-mono);
  font-size: 12px;
  color: var(--gt-text-primary);
  background: var(--gt-bg-input);
  resize: vertical;
  box-sizing: border-box;
}

.gt-devtools-textarea:focus {
  border-color: var(--gt-border-focus);
  outline: none;
}

.gt-devtools-btn-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

/* ─── Field Selector Modal ──────────────────────────────── */

.gt-field-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gt-field-modal {
  background: var(--gt-bg-card);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  box-shadow: var(--gt-shadow-xl);
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: var(--gt-font);
  color: var(--gt-text-primary);
  overflow: hidden;
}

.gt-field-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 2px solid var(--gt-primary);
  background: var(--gt-bg-header);
}

.gt-field-modal-title {
  font-size: var(--gt-font-size-base);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gt-field-modal-close {
  background: none;
  border: 1px solid var(--gt-border);
  border-radius: 3px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--gt-text-secondary);
  font-size: 14px;
}

.gt-field-modal-close:hover {
  background: var(--gt-bg-hover);
}

.gt-field-modal-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.gt-field-modal-desc {
  font-size: var(--gt-font-size-sm);
  color: var(--gt-text-secondary);
  margin-bottom: 12px;
  line-height: var(--gt-line-height);
}

.gt-field-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gt-field-option:hover {
  background: var(--gt-bg-hover);
}

.gt-field-option.gt-selected {
  background: var(--gt-bg-selected);
  border-color: var(--gt-primary);
}

.gt-field-option input[type="radio"] {
  accent-color: var(--gt-primary);
  margin-top: 2px;
  flex-shrink: 0;
}

.gt-field-option-name {
  font-size: var(--gt-font-size-sm);
  font-weight: 500;
  color: var(--gt-text-primary);
}

.gt-field-option-preview {
  font-size: var(--gt-font-size-xs);
  color: var(--gt-text-muted);
  font-family: var(--gt-font-mono);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}

.gt-field-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--gt-border);
  background: var(--gt-bg-page);
}

.gt-field-save-default {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--gt-font-size-sm);
  color: var(--gt-text-secondary);
}

.gt-field-save-default input[type="checkbox"] {
  accent-color: var(--gt-primary);
}

.gt-field-modal-actions {
  display: flex;
  gap: 8px;
}

/* ─── Context Menu ──────────────────────────────────────── */

.gt-context-menu {
  position: fixed;
  background: var(--gt-bg-card);
  border: 1px solid var(--gt-border);
  border-radius: var(--gt-radius);
  box-shadow: var(--gt-shadow-lg);
  z-index: 10002;
  min-width: 200px;
  padding: 4px 0;
  font-family: var(--gt-font);
}

.gt-context-menu-item {
  padding: 6px 12px;
  cursor: pointer;
  color: var(--gt-text-primary);
  font-size: var(--gt-font-size-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.1s ease;
}

.gt-context-menu-item:hover {
  background: var(--gt-bg-hover);
}

.gt-context-menu-item.gt-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gt-context-menu-item.gt-disabled:hover {
  background: none;
}

.gt-context-menu-separator {
  height: 1px;
  background: var(--gt-border);
  margin: 4px 0;
}

/* ─── Notification Toast ─────────────────────────────────── */

.gt-notification {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 10px 16px;
  border-radius: var(--gt-radius);
  font-family: var(--gt-font);
  font-size: var(--gt-font-size-sm);
  color: #FFFFFF;
  z-index: 10003;
  box-shadow: var(--gt-shadow-lg);
  animation: gt-fade-in-out 3s ease-in-out forwards;
  max-width: 360px;
}

.gt-notification-success {
  background: var(--gt-success);
}

.gt-notification-error {
  background: var(--gt-danger);
}

.gt-notification-info {
  background: var(--gt-primary);
}

.gt-notification-warning {
  background: var(--gt-warning);
}

@keyframes gt-fade-in-out {
  0%   { opacity: 0; transform: translateY(-10px); }
  10%  { opacity: 1; transform: translateY(0); }
  85%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

/* ─── Badge ──────────────────────────────────────────────── */

.gt-badge {
  display: inline-block;
  background: var(--gt-primary);
  color: #FFFFFF;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: var(--gt-font-size-xs);
  font-family: var(--gt-font);
  font-weight: 500;
  line-height: 1.4;
}

/* ─── Dragging State ─────────────────────────────────────── */

.gt-dragging {
  cursor: move;
  user-select: none;
}

.gt-dragging * {
  pointer-events: none;
}
`;
