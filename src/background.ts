// background.ts — Graytool v2 Service Worker
// URL pattern matching + content script activation with optional permissions

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
  const matchedPattern = enabledPatterns.find((p) => matchesPattern(url, p.pattern));

  return {
    isMatch: !!matchedPattern,
    matchedPatternId: matchedPattern?.id,
  };
}

// ─── Content Script Injection ──────────────────────────────────

/**
 * Inject content script into a tab if not already injected.
 */
async function injectContentScript(tabId: number): Promise<void> {
  try {
    // Check if already injected by trying to send a message
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    // If successful, content script is already there
  } catch {
    // Not injected, so inject it
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["inject/index.js"],
    });
    // Also inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["css/fontawesome.css"],
    });
    console.log("Graytool: Injected content script into tab", tabId);
  }
}

// ─── Permission Management ──────────────────────────────────────

/**
 * Check if we have permission to access a URL.
 */
async function hasPermissionForUrl(url: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin + "/*";
    const result = await chrome.permissions.contains({
      origins: [origin],
    });
    return result;
  } catch {
    return false;
  }
}

/**
 * Request permission for a URL pattern.
 * Returns true if permission was granted or already exists.
 */
async function requestPermissionForPattern(pattern: string): Promise<boolean> {
  try {
    // Convert glob pattern to origin pattern for permissions
    // e.g., "https://graylog.company.com/*" → "https://graylog.company.com/*"
    const originPattern = pattern;

    const hasPermission = await chrome.permissions.contains({
      origins: [originPattern],
    });

    if (hasPermission) {
      return true;
    }

    // Request permission - this will show a dialog to the user
    const granted = await chrome.permissions.request({
      origins: [originPattern],
    });

    return granted;
  } catch (error) {
    console.log("Graytool: Error requesting permission:", error);
    return false;
  }
}

/**
 * Get all origins from configured URL patterns.
 */
async function getConfiguredOrigins(): Promise<string[]> {
  const config = await getConfig();
  return config.urlPatterns.filter((p) => p.enabled).map((p) => p.pattern);
}

// ─── Tab Listeners ────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  try {
    // Check if we have permission for this URL
    const hasPermission = await hasPermissionForUrl(tab.url);
    if (!hasPermission) {
      // No permission, skip
      return;
    }

    const result = await checkUrlMatch(tab.url);

    if (result.isMatch) {
      // Inject content script
      await injectContentScript(tabId);

      // Send activation message
      const message: GrayToolMessage = {
        type: "ACTIVATE",
        matchedPatternId: result.matchedPatternId,
      };
      chrome.tabs.sendMessage(tabId, message).catch(() => {
        // Content script may not be ready yet — this is expected
      });
    }
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

  if (message.type === "REQUEST_PERMISSION") {
    const pattern = message.pattern;
    if (pattern) {
      requestPermissionForPattern(pattern).then((granted) => {
        sendResponse({ granted });
      });
      return true;
    } else {
      sendResponse({ granted: false });
      return false;
    }
  }

  if (message.type === "HAS_PERMISSION") {
    const url = message.url;
    if (url) {
      hasPermissionForUrl(url).then((hasPermission) => {
        sendResponse({ hasPermission });
      });
      return true;
    } else {
      sendResponse({ hasPermission: false });
      return false;
    }
  }

  if (message.type === "GET_CONFIGURED_ORIGINS") {
    getConfiguredOrigins().then((origins) => {
      sendResponse({ origins });
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
