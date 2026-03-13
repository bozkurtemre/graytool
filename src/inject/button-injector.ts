// inject/button-injector.ts — Button injection into Graylog log rows
// Resolves URL templates, evaluates conditions, and injects styled buttons.

import type {
  ButtonConfig,
  ButtonCondition,
  GrayToolConfig,
  DiscoveredField,
} from "../shared/types";
import { escapeHtml } from "../shared/utils";

// ─── Button Injection ─────────────────────────────────────────

export function injectButtons(
  row: Element,
  config: GrayToolConfig,
  fieldMap: Record<string, string>,
  fields: DiscoveredField[],
  matchedPatternId?: string,
): void {
  // Find or create button container
  let container = row.querySelector(".gt-btn-container") as HTMLElement | null;
  if (!container) {
    container = document.createElement("span");
    container.className = "gt-btn-container";

    // Find the best insertion point in the row
    const insertTarget = findInsertionPoint(row);
    if (insertTarget) {
      insertTarget.appendChild(container);
    } else {
      row.appendChild(container);
    }
  }

  let injectedCount = 0;

  // Process each enabled button
  for (const button of config.buttons) {
    if (!button.enabled) continue;

    // Check if button is allowed for this URL pattern
    if (!isButtonAllowedForPattern(button, matchedPatternId)) {
      continue;
    }

    try {
      // Check deduplication
      const btnId = `graytool-btn-${button.id}`;
      if (row.querySelector(`[data-graytool-btn-id="${btnId}"]`)) {
        continue;
      }

      // Evaluate conditions
      if (!evaluateConditions(button.conditions, fieldMap)) {
        continue;
      }

      // Resolve URL template
      const resolvedUrl = resolveUrl(button.url, fieldMap, button);
      if (!resolvedUrl) {
        continue; // Required placeholder not found
      }

      // Create and inject button
      const btnEl = createButton(button, resolvedUrl, btnId);
      container.appendChild(btnEl);
      injectedCount++;
    } catch (error) {
      // Silently ignore injection errors
    }
  }

  // Add Message Detail button if enabled
  if (config.settings.showMessageDetailButton) {
    injectMessageDetailButton(row, container, fields, config);
    injectedCount++;
  }
}

// ─── URL Pattern Filter ────────────────────────────────────────

/**
 * Check if a button should be shown for the current URL pattern.
 * - If button has no urlPatternIds defined (empty/undefined), show on all patterns
 * - If button has urlPatternIds, only show if matchedPatternId is in that list
 */
function isButtonAllowedForPattern(
  button: ButtonConfig,
  matchedPatternId?: string,
): boolean {
  const patternIds = button.urlPatternIds;

  // No pattern restriction = show on all patterns
  if (!patternIds || patternIds.length === 0) {
    return true;
  }

  // If patterns are specified but we don't know which pattern we're on, don't show
  if (!matchedPatternId) {
    return false;
  }

  // Show only if current pattern is in the allowed list
  return patternIds.includes(matchedPatternId);
}

// ─── URL Template Resolution ──────────────────────────────────

export function resolveUrl(
  template: string,
  fields: Record<string, string>,
  button: ButtonConfig,
): string | null {
  let url = template;
  const placeholders = [...template.matchAll(/\{(\w+(?:\.\w+)*)\}/g)];

  for (const [match, placeholder] of placeholders) {
    const value = findBindingValue(placeholder, fields, button);
    if (value === null) return null; // Required field missing → hide button
    url = url.replace(match, encodeURIComponent(value));
  }

  return url;
}

function findBindingValue(
  placeholder: string,
  fields: Record<string, string>,
  button: ButtonConfig,
): string | null {
  // 1. Direct field name match
  if (fields[placeholder]) return fields[placeholder];

  // 2. FieldBinding specifics (fieldPath + fallbackPaths)
  const binding = button.fieldBindings.find(
    (b) => b.placeholder === placeholder,
  );
  if (binding) {
    // Try primary field path
    if (fields[binding.fieldPath]) return fields[binding.fieldPath];

    // Try fallback paths
    if (binding.fallbackPaths) {
      for (const path of binding.fallbackPaths) {
        if (fields[path]) return fields[path];
      }
    }
  }

  return null;
}

// ─── Condition Evaluation ─────────────────────────────────────

export function evaluateConditions(
  conditions: ButtonCondition[],
  fields: Record<string, string>,
): boolean {
  if (conditions.length === 0) return true; // No conditions = always show

  // All conditions must pass (AND logic)
  return conditions.every((condition) => evaluateCondition(condition, fields));
}

function evaluateCondition(
  condition: ButtonCondition,
  fields: Record<string, string>,
): boolean {
  const value = fields[condition.field];

  switch (condition.operator) {
    case "exists":
      return value !== undefined && value !== "";
    case "equals":
      return value === condition.value;
    case "notEquals":
      return value !== condition.value;
    case "contains":
      return (
        value !== undefined &&
        condition.value !== undefined &&
        value.includes(condition.value)
      );
    case "startsWith":
      return (
        value !== undefined &&
        condition.value !== undefined &&
        value.startsWith(condition.value)
      );
    default:
      return false;
  }
}

// ─── DOM Creation ─────────────────────────────────────────────

function createButton(
  button: ButtonConfig,
  url: string,
  btnId: string,
): HTMLElement {
  const el = document.createElement("a");
  el.href = url;
  el.setAttribute("data-graytool-btn-id", btnId);
  el.className = `gt-btn gt-btn-${button.color}`;
  el.title = button.label;

  if (button.openInNewTab) {
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }

  el.innerHTML = `<span>${escapeHtml(button.label)}</span>`;

  // Prevent event propagation to Graylog's row click handler
  el.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  return el;
}

function injectMessageDetailButton(
  row: Element,
  container: HTMLElement,
  fields: DiscoveredField[],
  config: GrayToolConfig,
): void {
  const btnId = "graytool-msg-detail";
  if (row.querySelector(`[data-graytool-btn-id="${btnId}"]`)) return;

  // Only show if there are fields to display
  if (fields.length === 0) return;

  const btn = document.createElement("button");
  btn.className = "gt-msg-detail-btn";
  btn.setAttribute("data-graytool-btn-id", btnId);
  btn.innerHTML = `<i class="fa fa-arrow-up-right-from-square"></i>`;
  btn.title = "Message Detail — View JSON";
  btn.style.display = "inline-flex";
  btn.style.alignItems = "center";
  btn.style.gap = "4px";

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Dispatch custom event that json-viewer.ts will listen to
    const event = new CustomEvent("graytool:open-detail", {
      detail: { fields, config, row },
      bubbles: true,
    });
    document.dispatchEvent(event);
  });

  container.appendChild(btn);
}

// ─── Helpers ──────────────────────────────────────────────────

function findInsertionPoint(row: Element): Element | null {
  // Try common Graylog row structures

  // Modern Graylog (if row is a tbody, find first row's last td/th)
  if (row.tagName?.toLowerCase() === "tbody") {
    const summaryRow = row.querySelector("tr"); // the first tr
    if (summaryRow) {
      const lastCell = summaryRow.querySelector("td:last-child, th:last-child");
      if (lastCell) return lastCell;
    }
  }

  // Modern Graylog (if row is a tr and has data-testid, try last td/th)
  if (row.querySelector("[data-testid^='message-summary-field-']")) {
    const lastCell = row.querySelector("td:last-child, th:last-child");
    if (lastCell) return lastCell;
  }

  // 1. Last <td> in a table row
  const lastTd = row.querySelector("td:last-child");
  if (lastTd) return lastTd;

  // 2. Message content area
  const messageArea =
    row.querySelector('[data-field="message"]') ||
    row.querySelector(".message-body") ||
    row.querySelector('[class*="message"]');
  if (messageArea) return messageArea;

  // 3. Fallback: the row itself
  return row;
}


