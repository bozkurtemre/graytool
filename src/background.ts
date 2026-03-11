// background.ts — Graytool v2 Service Worker
// URL pattern matching + content script activation

import { getConfig } from "./shared/storage";
import type { GrayToolMessage } from "./shared/types";

console.log("Graytool: Background service worker loaded");

// ─── Extension Icon Click Handler ───────────────────────────────

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html") });
});

// ─── URL Pattern Matching ─────────────────────────────────────

/**
 * Convert a glob-style URL pattern to a RegExp.
 * Supports:
 *   *  → match anything
 *   .  → literal dot
 */
function matchesPattern(url: string, pattern: string): boolean {
  try {
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars including ? (except *)
          .replace(/\*/g, ".*") + // Convert glob * to regex .*
        "$",
    );
    return regex.test(url);
  } catch {
    console.log("Graytool: Invalid pattern:", pattern);
    return false;
  }
}

/**
 * Check if a URL matches any enabled pattern in config.
 * Returns both the match status and the ID of the first matching pattern.
 */
async function checkUrlMatch(
  url: string,
): Promise<{ isMatch: boolean; matchedPatternId?: string }> {
  const config = await getConfig();

  if (!config.settings.enabled) return { isMatch: false };

  const enabledPatterns = config.urlPatterns.filter((p) => p.enabled);
  const matchedPattern = enabledPatterns.find((p) =>
    matchesPattern(url, p.pattern),
  );

  return {
    isMatch: !!matchedPattern,
    matchedPatternId: matchedPattern?.id,
  };
}

// ─── Tab Listeners ────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  try {
    const result = await checkUrlMatch(tab.url);
    const message: GrayToolMessage = result.isMatch
      ? { type: "ACTIVATE", matchedPatternId: result.matchedPatternId }
      : { type: "DEACTIVATE" };

    chrome.tabs.sendMessage(tabId, message).catch(() => {
      // Content script may not be ready yet — this is expected
    });
  } catch (error) {
    console.log("Graytool: Error checking URL match:", error);
  }
});

// ─── Message Handler ──────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_URL") {
    const url = sender.url || sender.tab?.url;
    if (url) {
      checkUrlMatch(url).then((result) => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
    } else {
      sendResponse({ isMatch: false });
      return false;
    }
  }

  if (message.type === "GET_CONFIG") {
    getConfig().then((config) => {
      sendResponse({ config });
    });
    return true;
  }
});

// ─── Storage Change Listener ──────────────────────────────────

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName !== "sync") return;

  // Notify all tabs that config has changed
  chrome.tabs.query({}, (tabs) => {
    const message: GrayToolMessage = { type: "CONFIG_UPDATED" };
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have content script — expected
        });
      }
    }
  });
});
