// inject/ui/search-history.ts — Search query history feature
// Captures executed search queries from Ace Editor and displays them in a popup.

import { getSearchHistory, saveSearchQuery, clearSearchHistory } from "../../shared/storage";
import type { SearchHistoryEntry } from "../../shared/types";
import { t } from "../../shared/i18n";

// ─── State ────────────────────────────────────────────────────────

let currentPatternId: string | undefined;
let isEnabled = false;
let interceptorActive = false;
let historyPanel: HTMLElement | null = null;
let boundKeydownListener: ((e: KeyboardEvent) => void) | null = null;
let boundSearchClickListener: ((e: Event) => void) | null = null;
let boundEnterListener: ((e: KeyboardEvent) => void) | null = null;

// ─── Initialization & Cleanup ─────────────────────────────────────

export function initSearchHistoryListener(
  matchedPatternId: string | undefined,
  searchHistoryEnabled: boolean,
): void {
  // Clean up any existing listeners first
  destroySearchHistoryListener();

  currentPatternId = matchedPatternId;
  isEnabled = searchHistoryEnabled;

  if (!isEnabled || !currentPatternId) {
    return;
  }

  // 1. Setup keyboard shortcut (Ctrl+H)
  boundKeydownListener = handleKeydown;
  document.addEventListener("keydown", boundKeydownListener);

  // 2. Setup Ace Editor interception
  setupAceEditorInterception();

  // Retry interception setup periodically (Graylog might load editor late)
  const retryInterval = setInterval(() => {
    if (!interceptorActive && isEnabled && currentPatternId) {
      setupAceEditorInterception();
    }
  }, 2000);

  // Stop retrying after 30 seconds
  setTimeout(() => clearInterval(retryInterval), 30000);
}

export function destroySearchHistoryListener(): void {
  // Remove keyboard shortcut listener
  if (boundKeydownListener) {
    document.removeEventListener("keydown", boundKeydownListener);
    boundKeydownListener = null;
  }

  // Remove Ace Editor listeners
  const searchBtn = document.querySelector('button[type="submit"]'); // Adjust if Graylog search button selector differs
  if (searchBtn && boundSearchClickListener) {
    searchBtn.removeEventListener("click", boundSearchClickListener);
  }

  const queryEditor = document.getElementById("QueryEditor");
  if (queryEditor && boundEnterListener) {
    queryEditor.removeEventListener("keydown", boundEnterListener);
  }

  boundSearchClickListener = null;
  boundEnterListener = null;
  interceptorActive = false;
  currentPatternId = undefined;
  isEnabled = false;

  // Remove any open popup
  closeHistoryPanel();
}

// ─── Ace Editor Interception ──────────────────────────────────────

function setupAceEditorInterception(): void {
  if (interceptorActive) return;

  const queryEditor = document.getElementById("QueryEditor");
  if (!queryEditor) return;

  // Listen for Enter key on the query editor
  boundEnterListener = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      captureSearchQuery();
    }
  };
  queryEditor.addEventListener("keydown", boundEnterListener, true);

  // Try to find the search button (magnifying glass)
  // Usually it's next to or near the query editor, often a submit button in a form
  const form = queryEditor.closest("form");
  if (form) {
    const searchBtn = form.querySelector(
      'button[type="submit"], button.search-button, button[title*="Search"]',
    );
    if (searchBtn) {
      boundSearchClickListener = () => {
        captureSearchQuery();
      };
      searchBtn.addEventListener("click", boundSearchClickListener);
    }
  }

  interceptorActive = true;
}

function extractAceEditorValue(): string {
  const queryEditor = document.getElementById("QueryEditor");
  if (!queryEditor) return "";

  // Strategy 1: Look for the hidden textarea used by Ace for value submission (if exists)
  // Sometimes Ace synchronizes with a hidden input

  // Strategy 2: Look for the visible text lines
  const lines = queryEditor.querySelectorAll(".ace_line");
  if (lines.length > 0) {
    let query = "";
    lines.forEach((line) => {
      query += line.textContent + "\n";
    });
    return query.trim();
  }

  // Strategy 3: Try getting from the textarea itself (often empty in Ace, but just in case)
  const textArea = queryEditor.querySelector("textarea.ace_text-input") as HTMLTextAreaElement;
  if (textArea && textArea.value) {
    return textArea.value.trim();
  }

  // Strategy 4: Fallback to any inner text of the editor's content layer
  const scroller = queryEditor.querySelector(".ace_scroller");
  if (scroller) {
    return scroller.textContent?.trim() || "";
  }

  return "";
}

function captureSearchQuery(): void {
  if (!currentPatternId || !isEnabled) return;

  // Use a slight delay to allow Ace Editor to update its DOM if we triggered via Enter
  setTimeout(() => {
    const query = extractAceEditorValue();
    if (query && query.length > 0) {
      saveSearchQuery(currentPatternId!, query).catch((err) => {
        console.error("Graytool: Error saving search history", err);
      });
    }
  }, 100);
}

// ─── Keyboard Shortcut ────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  // Ctrl+H (or Cmd+H on Mac)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
    // Only trigger if we aren't focused on an input/textarea (unless it's the search bar itself)
    const activeEl = document.activeElement as HTMLElement;
    const isInput =
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable);
    const isAceEditor = activeEl && activeEl.closest("#QueryEditor");

    if (!isInput || isAceEditor) {
      e.preventDefault();
      e.stopPropagation();
      toggleHistoryPanel();
    }
  }
}

// ─── Query Application ────────────────────────────────────────────

function applySearchQuery(query: string): void {
  const queryEditor = document.getElementById("QueryEditor");
  if (!queryEditor) {
    alert(t("searchHistory_editorNotFound"));
    return;
  }

  // Find the Ace Editor's underlying textarea
  const textArea = queryEditor.querySelector("textarea.ace_text-input") as HTMLTextAreaElement;

  if (textArea) {
    // Select all existing text (Ctrl+A / Cmd+A equivalent)
    textArea.focus();

    // We need to trigger a sequence of events to make Ace Editor accept the new value
    // 1. Select all
    textArea.select();

    // 2. Set the new value
    textArea.value = query;

    // 3. Dispatch input event
    textArea.dispatchEvent(new Event("input", { bubbles: true }));

    // Auto-execute the search
    setTimeout(() => {
      // Find the form submit button
      const form = queryEditor.closest("form");
      if (form) {
        const searchBtn = form.querySelector(
          'button[type="submit"], button.search-button, button[title*="Search"]',
        ) as HTMLButtonElement;
        if (searchBtn) {
          searchBtn.click();
        } else {
          // Fallback: trigger Enter on the textarea
          textArea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        }
      }
    }, 100);
  } else {
    // If we can't find the text area, show an alert with the query so user can copy it manually
    prompt(t("searchHistory_editorNotFoundPrompt"), query);
  }
}

// ─── History Popup UI ─────────────────────────────────────────────

async function toggleHistoryPanel(): Promise<void> {
  if (historyPanel) {
    closeHistoryPanel();
  } else {
    await openHistoryPanel();
  }
}

async function openHistoryPanel(): Promise<void> {
  if (!currentPatternId || historyPanel) return;

  try {
    const history = await getSearchHistory(currentPatternId);
    renderHistoryPanel(history);
  } catch (error) {
    console.error("Graytool: Failed to load search history", error);
  }
}

function closeHistoryPanel(): void {
  if (historyPanel && historyPanel.parentNode) {
    historyPanel.parentNode.removeChild(historyPanel);
    historyPanel = null;
  }
}

function renderHistoryPanel(history: SearchHistoryEntry[]): void {
  // Create overlay
  historyPanel = document.createElement("div");
  historyPanel.className = "gt-json-overlay gt-history-overlay";

  // Close when clicking overlay background
  historyPanel.addEventListener("click", (e) => {
    if (e.target === historyPanel) {
      closeHistoryPanel();
    }
  });

  // Create panel
  const panel = document.createElement("div");
  panel.className = "gt-json-panel gt-history-panel";
  panel.style.width = "600px";
  panel.style.maxHeight = "70vh";

  // Header
  const header = document.createElement("div");
  header.className = "gt-json-header";

  const title = document.createElement("div");
  title.className = "gt-json-header-title";
  title.innerHTML =
    '<i class="fas fa-history fa-fw" style="margin-right: 6px;"></i> ' + t("searchHistory_title");

  const actions = document.createElement("div");
  actions.className = "gt-json-header-actions";

  const clearBtn = document.createElement("button");
  clearBtn.className = "gt-json-header-btn gt-history-clear-btn";
  clearBtn.innerHTML = '<i class="fas fa-trash fa-fw"></i>';
  clearBtn.title = t("searchHistory_clearHistory");
  clearBtn.addEventListener("click", async () => {
    if (confirm(t("searchHistory_clearConfirm"))) {
      await clearSearchHistory(currentPatternId!);
      closeHistoryPanel();
    }
  });

  const closeBtn = document.createElement("button");
  closeBtn.className = "gt-json-header-btn";
  closeBtn.innerHTML = '<i class="fas fa-times fa-fw"></i>';
  closeBtn.title = t("searchHistory_closeEsc");
  closeBtn.addEventListener("click", closeHistoryPanel);

  // Only show clear button if there is history
  if (history.length > 0) {
    actions.appendChild(clearBtn);
  }
  actions.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(actions);
  panel.appendChild(header);

  // Search Bar
  const searchContainer = document.createElement("div");
  searchContainer.style.padding = "10px 12px";
  searchContainer.style.borderBottom = "1px solid var(--gt-border)";
  searchContainer.style.backgroundColor = "var(--gt-bg-header)";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = t("searchHistory_searchPlaceholder");
  searchInput.style.width = "100%";
  searchInput.style.padding = "8px 10px";
  searchInput.style.border = "1px solid var(--gt-border)";
  searchInput.style.borderRadius = "4px";
  searchInput.style.backgroundColor = "var(--gt-bg-card)";
  searchInput.style.color = "var(--gt-text)";
  searchInput.style.fontSize = "13px";
  searchInput.style.boxSizing = "border-box";

  searchContainer.appendChild(searchInput);
  panel.appendChild(searchContainer);

  // Body
  const body = document.createElement("div");
  body.className = "gt-history-body";
  body.style.flex = "1";
  body.style.overflowY = "auto";
  body.style.padding = "0";
  body.style.backgroundColor = "var(--gt-bg-card)";

  if (history.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "30px 20px";
    emptyMsg.style.color = "var(--gt-text-muted)";
    emptyMsg.textContent =
      t("searchHistory_emptyMessage");
    body.appendChild(emptyMsg);
    searchInput.disabled = true;
  } else {
    // Render list
    const itemElements: { el: HTMLElement; query: string }[] = [];

    history.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "gt-history-item";
      item.style.padding = "10px 12px";
      item.style.borderBottom = "1px solid var(--gt-border)";
      item.style.cursor = "pointer";
      item.style.display = "flex";
      item.style.flexDirection = "row";
      item.style.alignItems = "flex-start";
      item.style.justifyContent = "space-between";
      item.style.transition = "background-color 0.15s";

      item.addEventListener("mouseenter", () => {
        item.style.backgroundColor = "var(--gt-bg-hover)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.backgroundColor = "transparent";
      });

      item.addEventListener("click", () => {
        applySearchQuery(entry.query);
        closeHistoryPanel();
      });

      const contentDiv = document.createElement("div");
      contentDiv.style.flex = "1";
      contentDiv.style.display = "flex";
      contentDiv.style.flexDirection = "column";
      contentDiv.style.gap = "4px";
      contentDiv.style.marginRight = "10px";
      contentDiv.style.overflow = "hidden";

      const queryText = document.createElement("div");
      queryText.style.fontFamily = "var(--gt-font-mono)";
      queryText.style.fontSize = "13px";
      queryText.style.color = "var(--gt-json-string)";
      queryText.style.whiteSpace = "pre-wrap";
      queryText.style.wordBreak = "break-all";
      queryText.textContent = entry.query;

      const dateText = document.createElement("div");
      dateText.style.fontSize = "11px";
      dateText.style.color = "var(--gt-text-muted)";
      const date = new Date(entry.timestamp);
      dateText.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

      contentDiv.appendChild(queryText);
      contentDiv.appendChild(dateText);
      item.appendChild(contentDiv);

      const copyBtn = document.createElement("button");
      copyBtn.className = "gt-json-header-btn";
      copyBtn.innerHTML = '<i class="fas fa-copy fa-fw"></i>';
      copyBtn.title = t("searchHistory_copyToClipboard");
      copyBtn.style.padding = "6px";
      copyBtn.style.marginTop = "2px";
      copyBtn.style.color = "var(--gt-text-muted)";
      copyBtn.style.transition = "color 0.2s";

      copyBtn.addEventListener("mouseenter", () => {
        copyBtn.style.color = "var(--gt-text)";
      });
      copyBtn.addEventListener("mouseleave", () => {
        copyBtn.style.color = "var(--gt-text-muted)";
      });

      copyBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Prevent the item click which executes the search

        try {
          // Use modern clipboard API if available (requires HTTPS / Secure Context)
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(entry.query);
          } else {
            // Fallback for HTTP environments (common for internal Graylog instances)
            const textArea = document.createElement("textarea");
            textArea.value = entry.query;
            // Prevent scrolling to bottom of page in MS Edge
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            textArea.remove();
          }

          copyBtn.innerHTML = '<i class="fas fa-check fa-fw" style="color: #4ade80;"></i>';
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy fa-fw"></i>';
          }, 1500);
        } catch (err) {
          console.error("Graytool: Failed to copy text", err);
          // Show error briefly
          copyBtn.innerHTML = '<i class="fas fa-times fa-fw" style="color: #ef4444;"></i>';
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy fa-fw"></i>';
          }, 1500);
        }
      });

      item.appendChild(copyBtn);
      body.appendChild(item);
      itemElements.push({ el: item, query: entry.query });
    });

    // Search filter logic
    searchInput.addEventListener("input", (e) => {
      const filter = (e.target as HTMLInputElement).value.toLowerCase();
      itemElements.forEach((item) => {
        if (item.query.toLowerCase().includes(filter)) {
          item.el.style.display = "flex";
        } else {
          item.el.style.display = "none";
        }
      });
    });
  }

  panel.appendChild(body);
  historyPanel.appendChild(panel);
  document.body.appendChild(historyPanel);

  // Focus logic for Escape key
  searchInput.focus();

  const escapeListener = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeHistoryPanel();
      document.removeEventListener("keydown", escapeListener);
    }
  };
  document.addEventListener("keydown", escapeListener);
}
