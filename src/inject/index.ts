// inject/index.ts — Graytool v2 Content Script Entry Point
// Activates only when background.ts sends ACTIVATE message.

import { getConfig } from "../shared/storage";
import type { GrayToolConfig, GrayToolMessage } from "../shared/types";
import { startObserver, stopObserver } from "./observer";
import { processExistingRows, clearProcessedMarkers } from "./row-processor";
import { injectStyles, removeStyles } from "./ui/styles";
import { initJsonViewerListener } from "./ui/json-viewer";
import {
  initSearchHistoryListener,
  destroySearchHistoryListener,
} from "./ui/search-history";

let isActive = false;
let currentConfig: GrayToolConfig | null = null;
let currentMatchedPatternId: string | undefined = undefined;
let processInterval: ReturnType<typeof setInterval> | null = null;

// ─── Activation ───────────────────────────────────────────────

async function activate(matchedPatternId?: string): Promise<void> {
  if (isActive) return;

  try {
    currentConfig = await getConfig();
    currentMatchedPatternId = matchedPatternId;

    if (!currentConfig.settings.enabled) {
      return;
    }

    isActive = true;

    // Inject Graylog design language CSS
    injectStyles();

    // Initialize JSON viewer event listener
    initJsonViewerListener();

    // Initialize Search History listener
    initSearchHistoryListener(
      currentMatchedPatternId,
      currentConfig.settings.searchHistoryEnabled,
    );

    // Process existing rows on page
    processExistingRows(currentConfig, currentMatchedPatternId);

    // Start observing DOM mutations
    startObserver(currentConfig, currentMatchedPatternId);

    // Start periodic processing for pagination/SPA navigation
    startPeriodicProcessing();
  } catch (error) {
    // Silent fail
  }
}

function deactivate(): void {
  if (!isActive) return;

  isActive = false;
  currentConfig = null;
  stopObserver();
  stopPeriodicProcessing();
  destroySearchHistoryListener();
  removeStyles();
}

// ─── Periodic Row Processing ────────────────────────────────────

/**
 * Simple approach: periodically check for unprocessed rows.
 * This handles pagination, filtering, and any other DOM changes.
 */
function startPeriodicProcessing(): void {
  if (processInterval) return;

  // Process immediately
  processExistingRows(currentConfig!, currentMatchedPatternId);

  // Listen for clicks on Graylog pagination
  document.addEventListener("click", handleGraylogPaginationClick, true);

  // Then check every 2 seconds for new/changed rows
  processInterval = setInterval(() => {
    if (!isActive || !currentConfig) return;
    // processExistingRows already skips already-processed rows
    processExistingRows(currentConfig, currentMatchedPatternId);
  }, 2000);
}

/**
 * Handle clicks on Graylog's pagination controls.
 * The pagination has data-testid="graylog-pagination"
 */
function handleGraylogPaginationClick(event: MouseEvent): void {
  if (!isActive || !currentConfig) return;

  const target = event.target as Element;

  // Check if click is within Graylog pagination
  const pagination = target.closest('[data-testid="graylog-pagination"]');
  if (!pagination) return;

  // Check if clicked on a clickable element (not disabled or current page)
  const clickedItem = target.closest("li");
  if (!clickedItem) return;

  // Skip if disabled or active (current page)
  if (clickedItem.classList.contains("disabled") || clickedItem.classList.contains("active")) {
    return;
  }

  // Clear processed markers and delay to let Graylog update the DOM
  setTimeout(() => {
    if (!isActive || !currentConfig) return;
    // Clear all processed markers so rows get re-processed
    clearProcessedMarkers();
    // Process rows
    processExistingRows(currentConfig, currentMatchedPatternId);
  }, 300);
}

function stopPeriodicProcessing(): void {
  document.removeEventListener("click", handleGraylogPaginationClick, true);

  if (processInterval) {
    clearInterval(processInterval);
    processInterval = null;
  }
}

async function reloadConfig(): Promise<void> {
  if (!isActive) return;

  try {
    currentConfig = await getConfig();

    if (!currentConfig.settings.enabled) {
      deactivate();
      return;
    }

    // Restart observer and features with new config (preserve matchedPatternId)
    stopObserver();
    startObserver(currentConfig, currentMatchedPatternId);
    
    // Update search history state based on new config
    initSearchHistoryListener(
      currentMatchedPatternId,
      currentConfig.settings.searchHistoryEnabled,
    );
    
    processExistingRows(currentConfig, currentMatchedPatternId);
  } catch (error) {
    // Silent fail
  }
}

// ─── Message Listener ─────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: GrayToolMessage) => {
  switch (message.type) {
    case "ACTIVATE":
      activate(message.matchedPatternId);
      break;
    case "DEACTIVATE":
      deactivate();
      break;
    case "CONFIG_UPDATED":
      reloadConfig();
      break;
  }
});

// ─── Initial Check ────────────────────────────────────────────
// On load, ask background if this page matches any pattern.

chrome.runtime.sendMessage({ type: "CHECK_URL" }, (response) => {
  if (chrome.runtime.lastError) {
    return;
  }
  if (response?.isMatch) {
    activate(response.matchedPatternId);
  }
});
