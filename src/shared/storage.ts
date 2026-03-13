// shared/storage.ts — Storage abstraction layer for Graytool v2
// All storage access MUST go through this module (AGENTS.md rule).

import type { GrayToolConfig, AppSettings, GlobalFieldConfig, SearchHistoryEntry } from "./types";
import { STORAGE_KEY, SEARCH_HISTORY_PREFIX, MAX_HISTORY_ITEMS } from "./constants";

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  enabled: true,
  showMessageDetailButton: true,
  jsonViewerEnabled: true,
  keyboardShortcutsEnabled: true,
  searchHistoryEnabled: true,
};

const DEFAULT_FIELD_CONFIG: GlobalFieldConfig = {
  defaultMessageField: null,
  rowFieldPrefixes: ["msg.", "context.", ""],
};

export function getDefaultConfig(): GrayToolConfig {
  return {
    version: 2,
    urlPatterns: [],
    buttons: [],
    globalFieldConfig: { ...DEFAULT_FIELD_CONFIG },
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ─── Read ─────────────────────────────────────────────────────

export async function getConfig(): Promise<GrayToolConfig> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Graytool: Error reading config:", chrome.runtime.lastError.message);
        resolve(getDefaultConfig());
        return;
      }

      const raw = result[STORAGE_KEY];

      // No config stored yet → return defaults
      if (!raw) {
        resolve(getDefaultConfig());
        return;
      }

      // v1 detection & migration
      if (isV1Config(raw)) {
        const migrated = migrateV1ToV2(raw);
        resolve(migrated);
        return;
      }

      // Merge with defaults to ensure all fields exist
      const merged = mergeWithDefaults(raw);
      resolve(merged);
    });
  });
}

// ─── Write ────────────────────────────────────────────────────

export async function saveConfig(
  partial: Partial<GrayToolConfig>,
): Promise<void> {
  const current = await getConfig();
  const updated: GrayToolConfig = {
    ...current,
    ...partial,
    version: 2, // Always enforce version
  };

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────

function mergeWithDefaults(raw: Record<string, unknown>): GrayToolConfig {
  const defaults = getDefaultConfig();
  return {
    version: 2,
    urlPatterns: Array.isArray(raw.urlPatterns)
      ? raw.urlPatterns
      : defaults.urlPatterns,
    buttons: Array.isArray(raw.buttons)
      ? (normalizeButtons(
          raw.buttons as Array<Record<string, unknown>>,
        ) as unknown as typeof defaults.buttons)
      : defaults.buttons,
    globalFieldConfig: {
      ...defaults.globalFieldConfig,
      ...(typeof raw.globalFieldConfig === "object" &&
      raw.globalFieldConfig !== null
        ? (raw.globalFieldConfig as Partial<GlobalFieldConfig>)
        : {}),
    },
    settings: {
      ...defaults.settings,
      ...(typeof raw.settings === "object" && raw.settings !== null
        ? (raw.settings as Partial<AppSettings>)
        : {}),
    },
  };
}

// ─── v1 Migration ─────────────────────────────────────────────

interface V1Config {
  buttons?: V1Button[];
  adminBaseUrl?: string;
  environments?: Array<{
    name: string;
    adminBaseUrl: string;
    isDefault?: boolean;
  }>;
  jiraUrl?: string;
}

interface V1Button {
  buttonName?: string;
  graylogRoute?: string;
  adminRoute?: string;
  paramMapping?: Record<string, string>;
  customUrl?: string;
}

function isV1Config(raw: unknown): raw is V1Config {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  // v1 has no "version" field, or has "environments" or "adminBaseUrl"
  return (
    obj.version === undefined || "environments" in obj || "adminBaseUrl" in obj
  );
}

function migrateV1ToV2(v1: V1Config): GrayToolConfig {
  const config = getDefaultConfig();

  // Migrate buttons
  if (Array.isArray(v1.buttons)) {
    config.buttons = v1.buttons.map((btn, index) => {
      const baseUrl = btn.customUrl || v1.adminBaseUrl || "";
      const route = btn.adminRoute || "";
      const fullUrl = `${baseUrl}${route}`;

      // Convert paramMapping to fieldBindings
      const fieldBindings = Object.entries(btn.paramMapping || {}).map(
        ([placeholder, fieldPath]) => ({
          placeholder,
          fieldPath,
        }),
      );

      // Build URL with placeholders
      let urlTemplate = fullUrl;
      for (const binding of fieldBindings) {
        if (!urlTemplate.includes(`{${binding.placeholder}}`)) {
          const separator = urlTemplate.includes("?") ? "&" : "?";
          urlTemplate += `${separator}${binding.placeholder}={${binding.placeholder}}`;
        }
      }

      return {
        id: `migrated-${index}`,
        label: btn.buttonName || `Button ${index + 1}`,
        url: urlTemplate,
        fieldBindings,
        conditions:
          btn.graylogRoute && btn.graylogRoute !== "*"
            ? [
                {
                  field: "route",
                  operator: "contains" as const,
                  value: btn.graylogRoute,
                },
              ]
            : [],
        openInNewTab: true,
        enabled: true,
        color: "primary" as const,
        urlPatternIds: [], // Empty = show on all patterns (v1 behavior)
      };
    });
  }

  return config;
}

// ─── Button Normalization ──────────────────────────────────────

/**
 * Ensure all buttons have urlPatternIds field (for backward compatibility).
 * Buttons without urlPatternIds will get an empty array (show on all patterns).
 */
export function normalizeButtons(
  buttons: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return buttons.map((btn) => ({
    ...btn,
    urlPatternIds: Array.isArray(btn.urlPatternIds) ? btn.urlPatternIds : [],
  }));
}

// ─── Search History (Local Storage) ───────────────────────────

/**
 * Get search history for a specific URL pattern ID
 */
export async function getSearchHistory(
  patternId: string,
): Promise<SearchHistoryEntry[]> {
  const key = `${SEARCH_HISTORY_PREFIX}${patternId}`;
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || []);
    });
  });
}

/**
 * Save a new search query to history
 * Dedupes existing exact matches and maintains max limit
 */
export async function saveSearchQuery(
  patternId: string,
  query: string,
): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  const key = `${SEARCH_HISTORY_PREFIX}${patternId}`;
  const history = await getSearchHistory(patternId);

  // Remove exact match if exists (to move it to top)
  const filtered = history.filter((entry) => entry.query !== trimmed);

  // Add new query to beginning
  filtered.unshift({
    query: trimmed,
    timestamp: Date.now(),
  });

  // Keep only up to max limit
  const capped = filtered.slice(0, MAX_HISTORY_ITEMS);

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: capped }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Clear search history for a specific pattern
 */
export async function clearSearchHistory(patternId: string): Promise<void> {
  const key = `${SEARCH_HISTORY_PREFIX}${patternId}`;
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([key], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}
