// inject/field-detector.ts — Graylog field auto-detection
// Discovers fields from log rows using multiple strategies.

import type { DiscoveredField } from "../shared/types";

// ─── Main Discovery Function ──────────────────────────────────

export function discoverRowFields(row: Element): DiscoveredField[] {
  const fields: DiscoveredField[] = [];

  // Strategy 1: data-field attributes (most reliable)
  discoverFromDataAttributes(row, fields);

  // Strategy 2: JSON message parse
  discoverFromJsonMessage(row, fields);

  // Strategy 3: Graylog-specific DOM patterns (dt/dd, field-name classes)
  discoverFromDomPatterns(row, fields);

  return deduplicateFields(fields);
}

// ─── Strategy 1: data-field Attributes ────────────────────────

function discoverFromDataAttributes(
  row: Element,
  fields: DiscoveredField[],
): void {
  try {
    // Legacy mapping (data-field)
    row.querySelectorAll("[data-field]").forEach((el) => {
      const name = el.getAttribute("data-field");
      if (!name) return;

      fields.push({
        name,
        value: el.textContent?.trim() || "",
        source: "data-field",
        element: el,
      });
    });

    // Modern Graylog mapping (data-testid="message-summary-field-X")
    row
      .querySelectorAll("[data-testid^='message-summary-field-']")
      .forEach((el) => {
        const testId = el.getAttribute("data-testid");
        if (!testId) return;
        const name = testId.replace("message-summary-field-", "");

        fields.push({
          name,
          value: el.textContent?.trim() || "",
          source: "data-field",
          element: el,
        });
      });
  } catch (error) {
    // Silent fail
  }
}

// ─── Strategy 2: JSON Message Parse ───────────────────────────

function discoverFromJsonMessage(
  row: Element,
  fields: DiscoveredField[],
): void {
  try {
    // Modern Graylog strategy: Check for "Copy Message" button which has the full JSON
    const clipboardBtn = row.querySelector('[data-clipboard-text^="{"]');
    if (clipboardBtn) {
      const text = clipboardBtn.getAttribute("data-clipboard-text") || "";
      if (tryParseAndFlatten(text, fields)) return;
    }

    // Fallback: Look for elements that might contain JSON
    const messageEls = row.querySelectorAll(
      '[data-field="message"], [data-field="full_message"], .message-body, pre, td > div',
    );

    for (const messageEl of Array.from(messageEls)) {
      const text = messageEl.textContent?.trim() || "";
      if (text.startsWith("{") && text.endsWith("}")) {
        if (tryParseAndFlatten(text, fields)) return;
      }
    }
  } catch (error) {
    // Silent fail
  }
}

function tryParseAndFlatten(text: string, fields: DiscoveredField[]): boolean {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return false;

    const flattened = flattenObject(parsed);
    for (const [path, value] of flattened) {
      fields.push({
        name: path,
        value: typeof value === "string" ? value : String(value),
        source: "json-parse",
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Strategy 3: DOM Patterns ─────────────────────────────────

function discoverFromDomPatterns(
  row: Element,
  fields: DiscoveredField[],
): void {
  try {
    // dt/dd pairs (Graylog expanded message view)
    row.querySelectorAll('dt, [class*="field-name"]').forEach((dt) => {
      const dd = dt.nextElementSibling;
      if (!dd) return;

      const name = dt.textContent?.trim() || "";
      const value = dd.textContent?.trim() || "";
      if (!name) return;

      fields.push({
        name,
        value,
        source: "dom-attribute",
        element: dd,
      });
    });
  } catch (error) {
    // Silent fail
  }
}

// ─── Object Flattener ─────────────────────────────────────────

export function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  result: Array<[string, unknown]> = [],
): Array<[string, unknown]> {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object") {
      // Add the object/array itself as a stringified JSON string
      try {
        result.push([path, JSON.stringify(value)]);
      } catch {
        result.push([path, String(value)]);
      }

      // Continue flattening if it's a plain object
      if (!Array.isArray(value)) {
        flattenObject(value as Record<string, unknown>, path, result);
      }
    } else {
      // Primitive value
      result.push([path, value]);
    }
  }

  return result;
}

// ─── Deduplication ────────────────────────────────────────────

function deduplicateFields(fields: DiscoveredField[]): DiscoveredField[] {
  const seen = new Map<string, DiscoveredField>();

  // Priority: data-field > dom-attribute > json-parse > text-pattern
  const priorityOrder: Record<string, number> = {
    "data-field": 4,
    "dom-attribute": 3,
    "json-parse": 2,
    "text-pattern": 1,
  };

  for (const field of fields) {
    const existing = seen.get(field.name);
    if (
      !existing ||
      priorityOrder[field.source] > priorityOrder[existing.source]
    ) {
      seen.set(field.name, field);
    }
  }

  return Array.from(seen.values());
}
