// shared/utils.ts — Shared utility functions for Graytool v2
// Centralizes escapeHtml, escapeAttr, copyToClipboard to avoid duplication.

// ─── HTML Escaping ────────────────────────────────────────────

/**
 * Escape text for safe insertion as HTML text content.
 * Uses DOM API to guarantee correctness.
 */
export function escapeHtml(text: string): string {
  const el = document.createElement("span");
  el.textContent = text;
  return el.innerHTML;
}

/**
 * Escape text for safe insertion into HTML attribute values.
 * Handles quotes and angle brackets that escapeHtml may miss.
 */
export function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Clipboard ────────────────────────────────────────────────

/**
 * Copy text to clipboard with modern API and legacy fallback.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);

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
