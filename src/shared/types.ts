// shared/types.ts — Graytool v2 type definitions

// ─── Config Version ───────────────────────────────────────────

export interface GrayToolConfig {
  version: 2;
  urlPatterns: UrlPattern[];
  buttons: ButtonConfig[];
  globalFieldConfig: GlobalFieldConfig;
  settings: AppSettings;
}

// ─── URL Patterns ─────────────────────────────────────────────

export interface UrlPattern {
  id: string;
  pattern: string; // "https://graylog.company.com/*"
  label: string; // "Production Graylog"
  enabled: boolean;
}

// ─── Button Config ────────────────────────────────────────────

export type ButtonColor =
  | "primary"
  | "default"
  | "danger"
  | "warning"
  | "success";

export type ButtonConditionOperator =
  | "exists"
  | "equals"
  | "contains"
  | "startsWith"
  | "notEquals";

export interface ButtonConfig {
  id: string;
  label: string; // Button display text
  url: string; // Full URL template: "https://admin.company.com/users/{userId}"
  fieldBindings: FieldBinding[];
  conditions: ButtonCondition[];
  openInNewTab: boolean;
  enabled: boolean;
  color: ButtonColor;
  icon?: string; // Optional SVG icon string
  urlPatternIds?: string[]; // IDs of URL patterns where this button should appear (empty = all patterns)
}

export interface FieldBinding {
  placeholder: string; // Placeholder name in URL: {placeholder}
  fieldPath: string; // Log field path: "userId" or "context.user.id"
  fallbackPaths?: string[];
}

export interface ButtonCondition {
  field: string;
  operator: ButtonConditionOperator;
  value?: string;
}

// ─── Field Config ─────────────────────────────────────────────

export interface GlobalFieldConfig {
  defaultMessageField?: string | null; // null/undefined = auto-detect
  rowFieldPrefixes: string[]; // ["msg.", "context.", ""]
  searchPrefixes?: string[]; // alias for popup UI
}

// ─── App Settings ─────────────────────────────────────────────

export interface AppSettings {
  enabled: boolean;
  showMessageDetailButton: boolean;
  jsonViewerEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  searchHistoryEnabled: boolean;
}

// ─── Search History ───────────────────────────────────────────

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
}

// ─── Field Discovery ──────────────────────────────────────────

export type FieldSource =
  | "data-field"
  | "json-parse"
  | "text-pattern"
  | "dom-attribute";

export interface DiscoveredField {
  name: string;
  value: string;
  source: FieldSource;
  element?: Element;
}

// ─── Messages (Background ↔ Content Script) ───────────────────

export interface ActivateMessage {
  type: "ACTIVATE";
  matchedPatternId?: string; // ID of the URL pattern that matched
}

export interface DeactivateMessage {
  type: "DEACTIVATE";
}

export interface ConfigUpdatedMessage {
  type: "CONFIG_UPDATED";
}

export interface CheckUrlResponse {
  isMatch: boolean;
  matchedPatternId?: string; // ID of the URL pattern that matched
}

export type GrayToolMessage =
  | ActivateMessage
  | DeactivateMessage
  | ConfigUpdatedMessage;
