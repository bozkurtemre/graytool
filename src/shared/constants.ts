// shared/constants.ts — Shared constants for Graytool v2
// Centralizes magic strings and configuration keys.

// ─── Storage Keys ─────────────────────────────────────────────

export const STORAGE_KEY = "graytool_config";
export const SEARCH_HISTORY_PREFIX = "graytool_search_history_";
export const TAB_COLLAPSED_KEY = "graytool_tabs_collapsed";

// ─── Limits ───────────────────────────────────────────────────

export const MAX_HISTORY_ITEMS = 50;

// ─── DOM Attributes ───────────────────────────────────────────

export const PROCESSED_ATTR = "data-graytool-processed";
export const BTN_ID_ATTR = "data-graytool-btn-id";

// ─── Timing ───────────────────────────────────────────────────

export const OBSERVER_DEBOUNCE_MS = 50;
export const PROCESS_INTERVAL_MS = 2000;
export const THEME_CHECK_INTERVAL_MS = 500;
