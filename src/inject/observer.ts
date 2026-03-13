// inject/observer.ts — MutationObserver management
// Watches for new log rows added to the DOM.

import type { GrayToolConfig } from "../shared/types";
import { OBSERVER_DEBOUNCE_MS } from "../shared/constants";
import { processRow } from "./row-processor";

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeConfig: GrayToolConfig | null = null;
let activeMatchedPatternId: string | undefined = undefined;

// ─── Observer Setup ───────────────────────────────────────────

export function startObserver(config: GrayToolConfig, matchedPatternId?: string): void {
  // Clean up if already running
  stopObserver();

  activeConfig = config;
  activeMatchedPatternId = matchedPatternId;

  observer = new MutationObserver((mutations) => {
    // Debounce: don't process every mutation immediately
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      handleMutations(mutations);
    }, OBSERVER_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function stopObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  activeConfig = null;
  activeMatchedPatternId = undefined;
}

// ─── Mutation Handler ─────────────────────────────────────────

function handleMutations(mutations: MutationRecord[]): void {
  if (!activeConfig) return;

  const newRows = new Set<Element>();

  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (!(node instanceof Element)) continue;

      // Check if the added node itself is a log row
      if (isLogRow(node)) {
        newRows.add(node);
      }

      // Check children for log rows
      const childRows = node.querySelectorAll(
        'tbody, tr, [class*="log-row"], [class*="message-group"]',
      );
      childRows.forEach((row) => {
        if (isLogRow(row)) {
          newRows.add(row);
        }
      });
    }
  }

  // Process discovered rows
  for (const row of newRows) {
    try {
      processRow(row, activeConfig, activeMatchedPatternId);
    } catch (error) {
      // Silent fail
    }
  }
}

// ─── Row Detection ────────────────────────────────────────────

function isLogRow(element: Element): boolean {
  const tagName = element.tagName?.toLowerCase();
  const className = element.className || "";

  // Modern Graylog message table (tbody wraps a single message)
  if (tagName === "tbody" && element.querySelector("[data-testid^='message-summary-field-']")) {
    return true;
  }

  // Modern Graylog message table row
  if (tagName === "tr" && element.querySelector("[data-testid^='message-summary-field-']")) {
    return true;
  }

  // Table row in legacy Graylog message table
  if (tagName === "tr" && element.querySelector("[data-field]")) {
    return true;
  }

  // Graylog-specific class patterns
  if (
    typeof className === "string" &&
    (className.includes("log-row") ||
      className.includes("message-group") ||
      className.includes("MessageTableEntry"))
  ) {
    return true;
  }

  return false;
}
