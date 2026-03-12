// inject/ui/json-viewer.ts — JSON Viewer Panel (Graylog Light Theme)
// Vanilla TS. Draggable, collapsible, searchable JSON tree viewer.

import type { DiscoveredField, GrayToolConfig } from "../../shared/types";
import { showFieldSelector } from "./field-selector";

// ─── Helpers ──────────────────────────────────────────────────

function escapeHtml(text: string): string {
  const el = document.createElement("span");
  el.textContent = text;
  return el.innerHTML;
}

async function copyToClipboard(text: string): Promise<void> {
  // Modern clipboard API - always try this first
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for contexts where clipboard API is not available
  // This is needed for older browsers and certain contexts
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);

      // execCommand is deprecated but still needed as fallback for older browsers
      const success = document.execCommand("copy");
      document.body.removeChild(ta);

      if (success) {
        resolve();
      } else {
        reject(new Error("Copy command failed"));
      }
    } catch (e) {
      reject(e);
    }
  });
}

export function showNotification(
  message: string,
  type: "success" | "error" | "info" | "warning" = "info",
): void {
  const el = document.createElement("div");
  el.className = `gt-notification gt-notification-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 3200);
}

function applyGraylogFilter(fieldName: string, fieldValue: string): void {
  const needsQuotes = fieldValue.includes(" ") || fieldValue.includes(":");
  const formatted = needsQuotes ? `"${fieldValue}"` : fieldValue;
  const query = `${fieldName}:${formatted}`;

  const searchInput = document.querySelector<HTMLInputElement>(
    'input[placeholder*="Search"], input[type="search"], .query-input input, [data-testid="search-input"]',
  );

  if (searchInput) {
    const existing = searchInput.value.trim();
    searchInput.value = existing ? `${existing} AND ${query}` : query;
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.dispatchEvent(new Event("change", { bubbles: true }));
    showNotification(`Filter: ${query}`, "success");
  } else {
    copyToClipboard(query).then(() => {
      showNotification("Query copied — paste in Graylog search", "info");
    });
  }
}

// ─── JSON Viewer State ────────────────────────────────────────

let currentOverlay: HTMLElement | null = null;
let currentSearchTerm = "";
let currentFocusIndex = -1;
let matchedRows: HTMLElement[] = [];
const collapseState = new Map<string, boolean>();

// Tab collapse state key for localStorage
const TAB_COLLAPSED_KEY = "graytool_tabs_collapsed";

// ─── Public API ───────────────────────────────────────────────

export function initJsonViewerListener(): void {
  document.addEventListener("graytool:open-detail", ((e: CustomEvent) => {
    const { fields, config } = e.detail as {
      fields: DiscoveredField[];
      config: GrayToolConfig;
      row: Element;
    };
    openJsonViewer(fields, config);
  }) as EventListener);
}

function openJsonViewer(
  fields: DiscoveredField[],
  config: GrayToolConfig,
): void {
  // Close existing viewer if open
  closeJsonViewer();

  const defaultField = config.globalFieldConfig.defaultMessageField;

  if (defaultField) {
    // Find the field with that name
    const matchedField = fields.find((f) => f.name === defaultField);
    if (matchedField) {
      showViewerForContent(matchedField.value, fields, config);
      return;
    }
  }

  // No default → show field selector
  showFieldSelector(fields, (selectedField, saveAsDefault) => {
    if (saveAsDefault) {
      // Save to config (fire-and-forget)
      import("../../shared/storage").then(({ saveConfig }) => {
        saveConfig({
          globalFieldConfig: {
            ...config.globalFieldConfig,
            defaultMessageField: selectedField.name,
          },
        });
      });
    }
    showViewerForContent(selectedField.value, fields, config);
  });
}

function showViewerForContent(
  rawContent: string,
  allFields: DiscoveredField[],
  config: GrayToolConfig,
): void {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Not JSON — wrap it
    parsed = { message: rawContent };
  }

  createViewerPanel(parsed, rawContent, allFields, config);
}

// ─── Panel Creation ───────────────────────────────────────────

function createViewerPanel(
  data: Record<string, unknown>,
  rawContent: string,
  allFields: DiscoveredField[],
  _config: GrayToolConfig,
): void {
  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "gt-json-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeJsonViewer();
  });

  // Panel
  const panel = document.createElement("div");
  panel.className = "gt-json-panel gt-maximized";

  // ─ Header
  const header = createHeader(panel);
  panel.appendChild(header);

  // ─ Toolbar
  const toolbar = createToolbar(allFields, data, rawContent);
  panel.appendChild(toolbar);

  // ─ Body (JSON tree)
  const body = document.createElement("div");
  body.className = "gt-json-body";
  collapseState.clear();
  currentSearchTerm = "";
  renderJsonTree(body, data);
  panel.appendChild(body);

  // ─ Tabs (Raw / DevTools)
  const tabContainer = createTabs(rawContent, body, data);
  panel.appendChild(tabContainer);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // Keyboard
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeJsonViewer();
      document.removeEventListener("keydown", handleKey);
      return;
    }

    // Focus search with "/"
    if (e.key === "/" && !isInputFocused()) {
      e.preventDefault();
      const searchInput = panel.querySelector(
        ".gt-json-search",
      ) as HTMLInputElement | null;
      searchInput?.focus();
      return;
    }

    // Navigate search results with arrow keys
    if (e.key === "ArrowDown" && !isInputFocused()) {
      e.preventDefault();
      navigateSearch("down");
      return;
    }

    if (e.key === "ArrowUp" && !isInputFocused()) {
      e.preventDefault();
      navigateSearch("up");
      return;
    }

    // Allow arrow key navigation even when search input is focused (if there are results)
    if (e.key === "ArrowDown" && isInputFocused() && matchedRows.length > 0) {
      e.preventDefault();
      navigateSearch("down");
      return;
    }

    if (e.key === "ArrowUp" && isInputFocused() && matchedRows.length > 0) {
      e.preventDefault();
      navigateSearch("up");
      return;
    }
  };
  document.addEventListener("keydown", handleKey);
}

function closeJsonViewer(): void {
  if (currentOverlay?.parentNode) {
    currentOverlay.parentNode.removeChild(currentOverlay);
    currentOverlay = null;
  }
}

// ─── Header ───────────────────────────────────────────────────

function createHeader(panel: HTMLElement): HTMLElement {
  const header = document.createElement("div");
  header.className = "gt-json-header";

  const title = document.createElement("div");
  title.className = "gt-json-header-title";
  title.innerHTML = "Message Detail";

  const actions = document.createElement("div");
  actions.className = "gt-json-header-actions";

  // Close
  const closeBtn = createHeaderBtn(
    '<i class="fas fa-times fa-fw"></i>',
    "Close",
    closeJsonViewer,
  );
  actions.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(actions);
  return header;
}

function createHeaderBtn(
  icon: string,
  title: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "gt-json-header-btn";
  btn.innerHTML = icon;
  btn.title = title;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

// ─── Toolbar ──────────────────────────────────────────────────

function createToolbar(
  allFields: DiscoveredField[],
  data: Record<string, unknown>,
  rawContent: string,
): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "gt-json-toolbar";

  // Field dropdown
  const fieldLabel = document.createElement("span");
  fieldLabel.textContent = "Field:";
  fieldLabel.style.fontSize = "12px";
  fieldLabel.style.color = "var(--gt-text-secondary)";
  toolbar.appendChild(fieldLabel);

  const fieldSelect = document.createElement("select");
  fieldSelect.className = "gt-json-field-select";

  // Get unique field names that might contain JSON
  const jsonFields = allFields.filter((f) => {
    try {
      JSON.parse(f.value);
      return true;
    } catch {
      return f.value.startsWith("{");
    }
  });

  if (jsonFields.length > 0) {
    jsonFields.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.name;
      opt.textContent = f.name;
      fieldSelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option");
    opt.textContent = "message";
    fieldSelect.appendChild(opt);
  }

  fieldSelect.addEventListener("change", () => {
    const selectedField = allFields.find((f) => f.name === fieldSelect.value);
    if (selectedField) {
      try {
        const newData = JSON.parse(selectedField.value);
        const body = currentOverlay?.querySelector(".gt-json-body");
        if (body) {
          collapseState.clear();
          renderJsonTree(body as HTMLElement, newData);
        }
      } catch {
        // Not parseable — ignore
      }
    }
  });

  toolbar.appendChild(fieldSelect);

  // Search
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "gt-json-search-wrapper";

  const searchIcon = document.createElement("span");
  searchIcon.className = "gt-json-search-icon";
  searchIcon.innerHTML = '<i class="fas fa-search fa-fw"></i>';
  searchWrapper.appendChild(searchIcon);

  const searchInput = document.createElement("input");
  searchInput.className = "gt-json-search";
  searchInput.type = "text";
  searchInput.placeholder = "Search fields... (/)";
  searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value.toLowerCase();
    const body = currentOverlay?.querySelector(".gt-json-body");
    if (body) {
      applySearchFilter(body as HTMLElement);
    }
  });
  searchWrapper.appendChild(searchInput);
  toolbar.appendChild(searchWrapper);

  // Copy All
  const copyAllBtn = document.createElement("button");
  copyAllBtn.className = "gt-json-copy-all-btn";
  copyAllBtn.textContent = "Copy All";
  copyAllBtn.addEventListener("click", () => {
    const content =
      typeof data === "object" ? JSON.stringify(data, null, 2) : rawContent;
    copyToClipboard(content).then(() => {
      showNotification("Copied to clipboard", "success");
    });
  });
  toolbar.appendChild(copyAllBtn);

  return toolbar;
}

// ─── JSON Tree Rendering ──────────────────────────────────────

function renderJsonTree(container: HTMLElement, data: unknown): void {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  renderValue(fragment, data, "", 0);
  container.appendChild(fragment);
}

function renderValue(
  parent: Node,
  value: unknown,
  path: string,
  indent: number,
): void {
  if (value === null) {
    appendPrimitive(parent, "null", "gt-json-null", path, indent);
    return;
  }

  if (typeof value === "string") {
    appendPrimitive(
      parent,
      `"${escapeHtml(value)}"`,
      "gt-json-string",
      path,
      indent,
      value,
    );
    return;
  }

  if (typeof value === "number") {
    appendPrimitive(
      parent,
      String(value),
      "gt-json-number",
      path,
      indent,
      String(value),
    );
    return;
  }

  if (typeof value === "boolean") {
    appendPrimitive(
      parent,
      String(value),
      "gt-json-boolean",
      path,
      indent,
      String(value),
    );
    return;
  }

  if (Array.isArray(value)) {
    renderArray(parent, value, path, indent);
    return;
  }

  if (typeof value === "object") {
    renderObject(parent, value as Record<string, unknown>, path, indent);
    return;
  }

  // Fallback
  appendPrimitive(
    parent,
    escapeHtml(String(value)),
    "gt-json-string",
    path,
    indent,
  );
}

function appendPrimitive(
  parent: Node,
  displayValue: string,
  className: string,
  path: string,
  _indent: number,
  rawValue?: string,
): void {
  const row = document.createElement("div");
  row.className = "gt-json-row";
  row.setAttribute("data-path", path);
  if (rawValue !== undefined) {
    row.setAttribute("data-value", rawValue);
  }

  const content = document.createElement("span");
  content.className = "gt-json-row-content";
  content.innerHTML = `<span class="${className} gt-json-value-clickable" data-field-path="${escapeHtml(path)}">${displayValue}</span>`;
  row.appendChild(content);

  // Action buttons
  const actions = createRowActions(path, rawValue || displayValue);
  row.appendChild(actions);

  parent.appendChild(row);
}

function renderObject(
  parent: Node,
  obj: Record<string, unknown>,
  path: string,
  indent: number,
): void {
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    const row = document.createElement("div");
    row.className = "gt-json-row";
    row.innerHTML =
      '<span class="gt-json-row-content"><span class="gt-json-punctuation">{}</span></span>';
    parent.appendChild(row);
    return;
  }

  const containerId = `gt-obj-${path || "root"}-${Math.random().toString(36).slice(2, 7)}`;
  const isCollapsed = collapseState.get(path) ?? false;

  // Toggle + opening brace
  const headerRow = document.createElement("div");
  headerRow.className = "gt-json-row";
  headerRow.setAttribute("data-path", path);

  const toggle = document.createElement("span");
  toggle.className = `gt-json-toggle${isCollapsed ? " gt-collapsed" : ""}`;
  toggle.textContent = "▼";
  toggle.addEventListener("click", () => {
    const collapsed = toggle.classList.toggle("gt-collapsed");
    collapseState.set(path, collapsed);
    const container = document.getElementById(containerId);
    if (container) container.classList.toggle("gt-hidden", collapsed);
  });

  const headerContent = document.createElement("span");
  headerContent.className = "gt-json-row-content";
  headerContent.appendChild(toggle);
  headerContent.insertAdjacentHTML(
    "beforeend",
    `<span class="gt-json-punctuation">{</span><span class="gt-json-length">${keys.length} keys</span>`,
  );
  headerRow.appendChild(headerContent);
  parent.appendChild(headerRow);

  // Children container
  const childContainer = document.createElement("div");
  childContainer.id = containerId;
  childContainer.className = `gt-json-collapsible${isCollapsed ? " gt-hidden" : ""}`;
  childContainer.style.paddingLeft = `${(indent + 1) * 16}px`;

  keys.forEach((key, i) => {
    const childPath = path ? `${path}.${key}` : key;
    const val = obj[key];
    const isLast = i === keys.length - 1;

    const keyRow = document.createElement("div");
    keyRow.className = "gt-json-row";
    keyRow.setAttribute("data-path", childPath);
    keyRow.setAttribute("data-key", key);
    if (val !== null && typeof val !== "object") {
      keyRow.setAttribute("data-value", String(val));
    }

    const keyContent = document.createElement("span");
    keyContent.className = "gt-json-row-content";

    const keySpan = `<span class="gt-json-key gt-json-key-clickable" data-field-name="${escapeHtml(key)}" data-field-path="${escapeHtml(childPath)}">"${escapeHtml(key)}"</span>`;
    keyContent.innerHTML = `${keySpan}<span class="gt-json-punctuation">: </span>`;

    keyRow.appendChild(keyContent);

    // If value is primitive, render inline
    if (val === null || typeof val !== "object") {
      const valSpan = renderInlineValue(val, childPath);
      keyContent.appendChild(valSpan);
      if (!isLast)
        keyContent.insertAdjacentHTML(
          "beforeend",
          '<span class="gt-json-punctuation">,</span>',
        );

      // Actions
      const actions = createRowActions(childPath, String(val ?? "null"), key);
      keyRow.appendChild(actions);

      childContainer.appendChild(keyRow);
    } else {
      // Complex value — render on next line
      childContainer.appendChild(keyRow);
      renderValue(childContainer, val, childPath, indent + 1);

      // Trailing comma
      if (!isLast) {
        const commaRow = document.createElement("div");
        commaRow.className = "gt-json-row";
        // Move comma to end of the closing brace row — actually skip this for simplicity
        childContainer.appendChild(commaRow);
      }
    }
  });

  parent.appendChild(childContainer);

  // Closing brace
  const closeRow = document.createElement("div");
  closeRow.className = "gt-json-row";
  closeRow.innerHTML =
    '<span class="gt-json-row-content"><span class="gt-json-punctuation">}</span></span>';
  parent.appendChild(closeRow);
}

function renderArray(
  parent: Node,
  arr: unknown[],
  path: string,
  indent: number,
): void {
  if (arr.length === 0) {
    const row = document.createElement("div");
    row.className = "gt-json-row";
    row.innerHTML =
      '<span class="gt-json-row-content"><span class="gt-json-punctuation">[]</span></span>';
    parent.appendChild(row);
    return;
  }

  const containerId = `gt-arr-${path || "root"}-${Math.random().toString(36).slice(2, 7)}`;
  const isCollapsed = collapseState.get(path) ?? false;

  // Toggle + opening bracket
  const headerRow = document.createElement("div");
  headerRow.className = "gt-json-row";

  const toggle = document.createElement("span");
  toggle.className = `gt-json-toggle${isCollapsed ? " gt-collapsed" : ""}`;
  toggle.textContent = "▼";
  toggle.addEventListener("click", () => {
    const collapsed = toggle.classList.toggle("gt-collapsed");
    collapseState.set(path, collapsed);
    const container = document.getElementById(containerId);
    if (container) container.classList.toggle("gt-hidden", collapsed);
  });

  const headerContent = document.createElement("span");
  headerContent.className = "gt-json-row-content";
  headerContent.appendChild(toggle);
  headerContent.insertAdjacentHTML(
    "beforeend",
    `<span class="gt-json-punctuation">[</span><span class="gt-json-length">${arr.length} items</span>`,
  );
  headerRow.appendChild(headerContent);
  parent.appendChild(headerRow);

  // Children container
  const childContainer = document.createElement("div");
  childContainer.id = containerId;
  childContainer.className = `gt-json-collapsible${isCollapsed ? " gt-hidden" : ""}`;
  childContainer.style.paddingLeft = `${(indent + 1) * 16}px`;

  arr.forEach((item, i) => {
    renderValue(childContainer, item, `${path}[${i}]`, indent + 1);
  });

  parent.appendChild(childContainer);

  // Closing bracket
  const closeRow = document.createElement("div");
  closeRow.className = "gt-json-row";
  closeRow.innerHTML =
    '<span class="gt-json-row-content"><span class="gt-json-punctuation">]</span></span>';
  parent.appendChild(closeRow);
}

function renderInlineValue(value: unknown, _path: string): HTMLSpanElement {
  const span = document.createElement("span");

  if (value === null) {
    span.className = "gt-json-null gt-json-value-clickable";
    span.textContent = "null";
  } else if (typeof value === "string") {
    span.className = "gt-json-string gt-json-value-clickable";
    span.textContent = `"${value}"`;
  } else if (typeof value === "number") {
    span.className = "gt-json-number gt-json-value-clickable";
    span.textContent = String(value);
  } else if (typeof value === "boolean") {
    span.className = "gt-json-boolean gt-json-value-clickable";
    span.textContent = String(value);
  } else {
    span.textContent = String(value);
  }

  return span;
}

// ─── Row Actions ──────────────────────────────────────────────

function createRowActions(
  path: string,
  value: string,
  fieldName?: string,
): HTMLElement {
  const actions = document.createElement("div");
  actions.className = "gt-json-row-actions";

  // Filter button
  const filterBtn = document.createElement("button");
  filterBtn.className = "gt-json-row-action";
  filterBtn.title = "Add as Graylog filter";
  filterBtn.innerHTML = '<i class="fas fa-search-plus fa-fw"></i>';
  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const name = fieldName || path.split(".").pop() || path;
    applyGraylogFilter(name, value);
  });
  actions.appendChild(filterBtn);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "gt-json-row-action";
  copyBtn.title = "Copy value";
  copyBtn.innerHTML = '<i class="fas fa-copy fa-fw"></i>';
  copyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    copyToClipboard(value).then(() => {
      showNotification("Copied!", "success");
    });
  });
  actions.appendChild(copyBtn);

  return actions;
}

// ─── Search ───────────────────────────────────────────────────

function applySearchFilter(body: HTMLElement): void {
  const rows = body.querySelectorAll(".gt-json-row");
  matchedRows = [];
  currentFocusIndex = -1;

  rows.forEach((row) => {
    const el = row as HTMLElement;
    const key = el.getAttribute("data-key") || "";
    const value = el.getAttribute("data-value") || "";
    const path = el.getAttribute("data-path") || "";
    const text = `${key} ${value} ${path}`.toLowerCase();

    // Remove previous focus styling
    el.classList.remove("gt-search-focus");

    if (!currentSearchTerm) {
      el.classList.remove("gt-dimmed");
      // Remove existing highlights
      removeHighlights(el);
      return;
    }

    if (text.includes(currentSearchTerm)) {
      el.classList.remove("gt-dimmed");
      highlightMatches(el, currentSearchTerm);
      // Track matched rows for keyboard navigation
      if (el.getAttribute("data-key") || el.getAttribute("data-value")) {
        matchedRows.push(el);
      }
    } else {
      el.classList.add("gt-dimmed");
      removeHighlights(el);
    }
  });

  // Auto-focus first result when filtering
  if (matchedRows.length > 0) {
    focusSearchResult(0);
  }
}

function focusSearchResult(index: number): void {
  // Remove focus from previous
  if (currentFocusIndex >= 0 && currentFocusIndex < matchedRows.length) {
    matchedRows[currentFocusIndex].classList.remove("gt-search-focus");
  }

  // Clamp index
  if (index < 0) index = 0;
  if (index >= matchedRows.length) index = matchedRows.length - 1;

  currentFocusIndex = index;

  // Add focus to new
  if (currentFocusIndex >= 0 && matchedRows.length > 0) {
    const row = matchedRows[currentFocusIndex];
    row.classList.add("gt-search-focus");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function navigateSearch(direction: "up" | "down"): void {
  if (matchedRows.length === 0) return;

  let newIndex = currentFocusIndex;
  if (direction === "down") {
    newIndex = Math.min(currentFocusIndex + 1, matchedRows.length - 1);
  } else {
    newIndex = Math.max(currentFocusIndex - 1, 0);
  }

  focusSearchResult(newIndex);
}

function highlightMatches(el: HTMLElement, term: string): void {
  removeHighlights(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || "";
    const lowerText = text.toLowerCase();
    const idx = lowerText.indexOf(term);
    if (idx === -1) continue;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);

    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));

    const mark = document.createElement("span");
    mark.className = "gt-highlight";
    mark.textContent = match;
    fragment.appendChild(mark);

    if (after) fragment.appendChild(document.createTextNode(after));

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

function removeHighlights(el: HTMLElement): void {
  el.querySelectorAll(".gt-highlight").forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(
        document.createTextNode(mark.textContent || ""),
        mark,
      );
      parent.normalize();
    }
  });
}

// ─── Tabs ─────────────────────────────────────────────────────

// Helper to get/save collapsed state
function getTabsCollapsedState(): boolean {
  try {
    return localStorage.getItem(TAB_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveTabsCollapsedState(collapsed: boolean): void {
  try {
    localStorage.setItem(TAB_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Ignore localStorage errors
  }
}

function createTabs(
  rawContent: string,
  _body: HTMLElement,
  data: Record<string, unknown>,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "gt-tabs-wrapper";

  // Check saved state - default to collapsed (if not set, collapse by default)
  const savedState = localStorage.getItem(TAB_COLLAPSED_KEY);
  const isInitiallyCollapsed = savedState === null ? true : savedState === "true";
  if (isInitiallyCollapsed) {
    wrapper.classList.add("gt-tabs-collapsed");
  }

  // Tab bar - draggable from top edge
  const tabBar = document.createElement("div");
  tabBar.className = "gt-tabs gt-tabs-draggable";

  const tabs = ["Raw", "DevTools", "Code"];
  const tabPanels: HTMLElement[] = [];

  tabs.forEach((label, index) => {
    const tab = document.createElement("button");
    tab.className = `gt-tab${index === 0 ? " gt-active" : ""}`;
    tab.textContent = label;

    const panel = document.createElement("div");
    panel.className = `gt-tab-content${index === 0 ? " gt-active" : ""}`;

    tab.addEventListener("click", () => {
      // If tabs are collapsed, expand them first
      if (wrapper.classList.contains("gt-tabs-collapsed")) {
        wrapper.classList.remove("gt-tabs-collapsed");
        saveTabsCollapsedState(false);
      }

      tabBar
        .querySelectorAll(".gt-tab")
        .forEach((t) => t.classList.remove("gt-active"));
      tabPanels.forEach((p) => p.classList.remove("gt-active"));
      tab.classList.add("gt-active");
      panel.classList.add("gt-active");
    });

    tabBar.appendChild(tab);
    tabPanels.push(panel);
  });

  // Content container for tab panels
  const contentContainer = document.createElement("div");
  contentContainer.className = "gt-tabs-content";

  // Double-click to toggle collapse/expand
  tabBar.addEventListener("dblclick", (e) => {
    const isCollapsed = wrapper.classList.toggle("gt-tabs-collapsed");
    saveTabsCollapsedState(isCollapsed);
    if (!isCollapsed) {
      contentContainer.style.height = "250px";
    } else {
      contentContainer.style.height = "";
    }
  });

  // Make tab bar draggable from top edge for collapse/expand
  let startY = 0;
  let startHeight = 0;
  let isDragging = false;

  tabBar.addEventListener("mousedown", (e) => {
    // Only start drag from the top edge (first 10px of tab bar - thicker for easier grip)
    const rect = tabBar.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    if (relativeY > 10) return; // Not in top edge area

    isDragging = true;
    startY = e.clientY;

    // If collapsed, expand first with initial height
    if (wrapper.classList.contains("gt-tabs-collapsed")) {
      wrapper.classList.remove("gt-tabs-collapsed");
      saveTabsCollapsedState(false);
      startHeight = 200; // Initial height when expanding
    } else {
      startHeight = contentContainer.offsetHeight || contentContainer.scrollHeight;
    }

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    // Invert direction: dragging down (positive deltaY) collapses, dragging up expands
    const deltaY = startY - e.clientY; // Inverted
    const newHeight = Math.max(0, startHeight + deltaY);

    if (newHeight < 30) {
      // Collapse if dragged near zero
      wrapper.classList.add("gt-tabs-collapsed");
      saveTabsCollapsedState(true);
      contentContainer.style.height = "";
      isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else {
      wrapper.classList.remove("gt-tabs-collapsed");
      saveTabsCollapsedState(false);
      contentContainer.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // Raw tab content
  const rawPre = document.createElement("pre");
  rawPre.className = "gt-raw-content";
  rawPre.textContent = rawContent;
  tabPanels[0].appendChild(rawPre);

  // DevTools tab content
  tabPanels[1].appendChild(createDevToolsTab(rawContent));

  // Code tab content
  tabPanels[2].appendChild(createCodeTab(data));

  wrapper.appendChild(tabBar);
  tabPanels.forEach((p) => contentContainer.appendChild(p));
  wrapper.appendChild(contentContainer);
  return wrapper;
}

function createDevToolsTab(rawContent: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "gt-devtools-container";

  // JSON Escape/Unescape
  const escapeSection = document.createElement("div");
  escapeSection.className = "gt-devtools-section";

  const title = document.createElement("div");
  title.className = "gt-devtools-section-title";
  title.textContent = "JSON Escape / Unescape";
  escapeSection.appendChild(title);

  const textarea = document.createElement("textarea");
  textarea.className = "gt-devtools-textarea";
  textarea.value = rawContent;
  textarea.placeholder = "Paste JSON here...";
  escapeSection.appendChild(textarea);

  const btnRow = document.createElement("div");
  btnRow.className = "gt-devtools-btn-row";

  const escapeBtn = document.createElement("button");
  escapeBtn.className = "gt-btn gt-btn-primary";
  escapeBtn.textContent = "Escape";
  escapeBtn.addEventListener("click", () => {
    textarea.value = JSON.stringify(textarea.value);
  });
  btnRow.appendChild(escapeBtn);

  const unescapeBtn = document.createElement("button");
  unescapeBtn.className = "gt-btn gt-btn-default";
  unescapeBtn.textContent = "Unescape";
  unescapeBtn.addEventListener("click", () => {
    try {
      textarea.value = JSON.parse(textarea.value);
    } catch {
      showNotification("Invalid escaped JSON", "error");
    }
  });
  btnRow.appendChild(unescapeBtn);

  const prettifyBtn = document.createElement("button");
  prettifyBtn.className = "gt-btn gt-btn-default";
  prettifyBtn.textContent = "Prettify";
  prettifyBtn.addEventListener("click", () => {
    try {
      const obj = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(obj, null, 2);
    } catch {
      showNotification("Invalid JSON", "error");
    }
  });
  btnRow.appendChild(prettifyBtn);

  const copyDevBtn = document.createElement("button");
  copyDevBtn.className = "gt-btn gt-btn-default";
  copyDevBtn.textContent = "Copy";
  copyDevBtn.addEventListener("click", () => {
    copyToClipboard(textarea.value).then(() => {
      showNotification("Copied!", "success");
    });
  });
  btnRow.appendChild(copyDevBtn);

  escapeSection.appendChild(btnRow);
  container.appendChild(escapeSection);

  return container;
}

// ─── Code Tab (Code Generation) ────────────────────────────────

type CodeLanguage = "curl" | "fetch" | "axios" | "http" | "php" | "python" | "go" | "java";

interface CodeGenerator {
  name: string;
  generate: (data: Record<string, unknown>) => string;
}

const CODE_GENERATORS: Record<CodeLanguage, CodeGenerator> = {
  curl: {
    name: "cURL",
    generate: (data) => {
      const jsonStr = JSON.stringify(data, null, 0);
      return `curl -X POST "https://api.example.com/endpoint" \\
  -H "Content-Type: application/json" \\
  -d '${jsonStr}'`;
    },
  },
  fetch: {
    name: "JavaScript Fetch",
    generate: (data) => {
      const jsonStr = JSON.stringify(data, null, 2);
      return `fetch("https://api.example.com/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${jsonStr}),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));`;
    },
  },
  axios: {
    name: "Axios",
    generate: (data) => {
      const jsonStr = JSON.stringify(data, null, 2);
      return `import axios from 'axios';

axios.post("https://api.example.com/endpoint", ${jsonStr}, {
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });`;
    },
  },
  http: {
    name: "HTTP",
    generate: (data) => {
      const jsonStr = JSON.stringify(data, null, 0);
      return `POST /endpoint HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: ${jsonStr.length}

${jsonStr}`;
    },
  },
  php: {
    name: "PHP",
    generate: (data) => {
      const phpArray = objectToPhpArray(data, 2);
      return `<?php

\$data = ${phpArray};

\$ch = curl_init();
curl_setopt(\$ch, CURLOPT_URL, "https://api.example.com/endpoint");
curl_setopt(\$ch, CURLOPT_POST, true);
curl_setopt(\$ch, CURLOPT_POSTFIELDS, json_encode(\$data));
curl_setopt(\$ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
]);
curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);

\$response = curl_exec(\$ch);
curl_close(\$ch);

echo \$response;
?>`;
    },
  },
  python: {
    name: "Python",
    generate: (data) => {
      const pythonDict = objectToPythonDict(data, 2);
      return `import requests
import json

data = ${pythonDict}

response = requests.post(
    "https://api.example.com/endpoint",
    headers={"Content-Type": "application/json"},
    data=json.dumps(data)
)

print(response.json())`;
    },
  },
  go: {
    name: "Go",
    generate: (data) => {
      const goStruct = objectToGoStruct(data, "Payload", 0);
      const jsonStr = JSON.stringify(data, null, 0);
      return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

${goStruct}
func main() {
    payload := ${objectToGoInit(data, "Payload", 2)}

    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST", "https://api.example.com/endpoint", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
    },
  },
  java: {
    name: "Java",
    generate: (data) => {
      const jsonStr = JSON.stringify(data, null, 2).replace(/"/g, '\\"');
      return `import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws Exception {
        URL url = new URL("https://api.example.com/endpoint");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        String jsonInputString = "${jsonStr}";

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInputString.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "utf-8"))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            System.out.println(response);
        }
    }
}`;
    },
  },
};

function objectToPhpArray(obj: unknown, indent: number): string {
  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 4);

  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return `"${obj.replace(/"/g, '\\"')}"`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => objectToPhpArray(item, indent + 4));
    return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "[]";
    const items = entries.map(([key, val]) => {
      return `"${key}" => ${objectToPhpArray(val, indent + 4)}`;
    });
    return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
  }

  return "null";
}

function objectToPythonDict(obj: unknown, indent: number): string {
  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 4);

  if (obj === null) return "None";
  if (typeof obj === "boolean") return obj ? "True" : "False";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return `"${obj.replace(/"/g, '\\"')}"`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => objectToPythonDict(item, indent + 4));
    return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const items = entries.map(([key, val]) => {
      return `"${key}": ${objectToPythonDict(val, indent + 4)}`;
    });
    return `{\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}}`;
  }

  return "None";
}

function objectToGoStruct(obj: unknown, structName: string, depth: number): string {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return "";
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) return "";

  let result = `type ${structName} struct {\n`;

  for (const [key, val] of entries) {
    const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
    let fieldType: string;

    if (val === null) {
      fieldType = "interface{}";
    } else if (typeof val === "string") {
      fieldType = "string";
    } else if (typeof val === "number") {
      fieldType = Number.isInteger(val) ? "int" : "float64";
    } else if (typeof val === "boolean") {
      fieldType = "bool";
    } else if (Array.isArray(val)) {
      fieldType = "[]interface{}";
    } else if (typeof val === "object") {
      fieldType = structName + key.charAt(0).toUpperCase() + key.slice(1);
      result += objectToGoStruct(val, fieldType, depth + 1);
    } else {
      fieldType = "interface{}";
    }

    result += `    ${fieldName} ${fieldType} \`json:"${key}"\`\n`;
  }

  result += "}\n\n";
  return result;
}

function objectToGoInit(obj: unknown, structName: string, indent: number): string {
  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 4);

  if (obj === null) return "nil";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return `"${obj}"`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]interface{}{}";
    const items = obj.map((item) => objectToGoInit(item, structName, indent + 4));
    return `[]interface{}{\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}}`;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return `${structName}{}`;
    const items = entries.map(([key, val]) => {
      const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
      return `${fieldName}: ${objectToGoInit(val, structName, indent + 4)}`;
    });
    return `${structName}{\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}}`;
  }

  return "nil";
}

function createCodeTab(data: Record<string, unknown>): HTMLElement {
  const container = document.createElement("div");
  container.className = "gt-devtools-container";
  container.style.padding = "12px";

  // Language selector row
  const selectorRow = document.createElement("div");
  selectorRow.style.display = "flex";
  selectorRow.style.gap = "8px";
  selectorRow.style.marginBottom = "12px";
  selectorRow.style.alignItems = "center";

  const label = document.createElement("span");
  label.textContent = "Language:";
  label.style.fontSize = "12px";
  label.style.color = "var(--gt-text-secondary)";
  selectorRow.appendChild(label);

  const langSelect = document.createElement("select");
  langSelect.className = "gt-json-field-select";

  const languages = Object.keys(CODE_GENERATORS) as CodeLanguage[];
  languages.forEach((lang) => {
    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = CODE_GENERATORS[lang].name;
    langSelect.appendChild(opt);
  });

  selectorRow.appendChild(langSelect);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "gt-btn gt-btn-primary";
  copyBtn.style.marginLeft = "auto";
  copyBtn.innerHTML = '<i class="fas fa-copy fa-fw"></i> Copy';
  selectorRow.appendChild(copyBtn);

  container.appendChild(selectorRow);

  // Code display
  const codePre = document.createElement("pre");
  codePre.className = "gt-raw-content";
  codePre.style.maxHeight = "400px";
  codePre.style.fontSize = "12px";
  codePre.style.margin = "0";

  const updateCode = () => {
    const lang = langSelect.value as CodeLanguage;
    codePre.textContent = CODE_GENERATORS[lang].generate(data);
  };

  updateCode();
  langSelect.addEventListener("change", updateCode);

  copyBtn.addEventListener("click", () => {
    copyToClipboard(codePre.textContent || "").then(() => {
      showNotification("Code copied!", "success");
    });
  });

  container.appendChild(codePre);

  return container;
}

// ─── Utility ──────────────────────────────────────────────────

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  return (
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    (active as HTMLElement).isContentEditable
  );
}
