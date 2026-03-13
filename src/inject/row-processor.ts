// inject/row-processor.ts — Log row processing orchestration
// Coordinates field discovery and button injection (P1).

import type { GrayToolConfig, DiscoveredField } from "../shared/types";
import { PROCESSED_ATTR } from "../shared/constants";
import { discoverRowFields } from "./field-detector";
import { injectButtons } from "./button-injector";

// ─── Clear Processed Markers ────────────────────────────────────

/**
 * Clear all processed markers from rows.
 * Called when URL changes (SPA navigation) to allow re-processing.
 */
export function clearProcessedMarkers(): void {
  const markedRows = document.querySelectorAll(`[${PROCESSED_ATTR}]`);
  markedRows.forEach((row) => {
    row.removeAttribute(PROCESSED_ATTR);
    // Also remove any injected buttons
    const container = row.querySelector(".gt-btn-container");
    if (container) {
      container.remove();
    }
    // Remove individual buttons with our data attribute
    const buttons = row.querySelectorAll("[data-graytool-btn-id]");
    buttons.forEach((btn) => btn.remove());
  });
}

// ─── Process Single Row ───────────────────────────────────────

export function processRow(row: Element, config: GrayToolConfig, matchedPatternId?: string): void {
  try {
    // Skip already-processed rows
    if (row.hasAttribute(PROCESSED_ATTR)) {
      return;
    }

    // Discover fields from this row
    const fields = discoverRowFields(row);
    if (fields.length === 0) {
      return;
    }

    // Mark as processed
    row.setAttribute(PROCESSED_ATTR, "true");

    // Convert fields to a lookup map
    const fieldMap = fieldsToMap(fields);

    // Inject configured buttons + Message Detail button
    injectButtons(row, config, fieldMap, fields, matchedPatternId);
  } catch (error) {
    // Silent fail
  }
}

// ─── Process Existing Rows ────────────────────────────────────

const RETRY_INTERVALS = [100, 300, 600, 1000, 2000]; // Retry at increasing intervals

export function processExistingRows(
  config: GrayToolConfig,
  matchedPatternId?: string,
  retryIndex = 0,
): void {
  try {
    // Graylog row selectors (v1 and v2)
    const selectors = [
      "table tbody", // Modern Graylog wraps a single message in a tbody
      "table tbody tr",
      '[class*="log-row"]',
      '[class*="message-group"]',
      '[class*="MessageTableEntry"]',
    ];

    const allRows = document.querySelectorAll(selectors.join(", "));
    let processedCount = 0;

    allRows.forEach((row) => {
      // Quick check: does this row have field-like content?
      if (
        row.querySelector("[data-field]") ||
        row.querySelector("[data-testid^='message-summary-field-']") ||
        row.querySelector("dt")
      ) {
        processRow(row, config, matchedPatternId);
        processedCount++;
      }
    });

    // If no rows found and we have retries left, try again after a delay
    if (processedCount === 0 && retryIndex < RETRY_INTERVALS.length) {
      setTimeout(() => {
        processExistingRows(config, matchedPatternId, retryIndex + 1);
      }, RETRY_INTERVALS[retryIndex]);
    }
  } catch (error) {
    // Silent fail
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function fieldsToMap(fields: DiscoveredField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields) {
    map[field.name] = field.value;
  }
  return map;
}
