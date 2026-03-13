// inject/ui/field-selector.ts — Field Selection Modal
// Vanilla TS modal that lets users pick which log field to view as JSON.
// Shown when no defaultMessageField is configured.

import type { DiscoveredField } from "../../shared/types";

// ─── Public API ───────────────────────────────────────────────

type FieldSelectorCallback = (field: DiscoveredField, saveAsDefault: boolean) => void;

export function showFieldSelector(
  fields: DiscoveredField[],
  onSelect: FieldSelectorCallback,
): void {
  // Filter to fields that might contain meaningful content
  const candidates = fields.filter((f) => f.value.length > 0);

  if (candidates.length === 0) return;

  // If only one candidate, auto-select
  if (candidates.length === 1) {
    onSelect(candidates[0], false);
    return;
  }

  createModal(candidates, onSelect);
}

// ─── Modal Creation ───────────────────────────────────────────

function createModal(fields: DiscoveredField[], onSelect: FieldSelectorCallback): void {
  let selectedIndex = 0;
  let saveAsDefault = false;

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "gt-field-modal-overlay";

  // Modal
  const modal = document.createElement("div");
  modal.className = "gt-field-modal";

  // ─ Header
  const header = document.createElement("div");
  header.className = "gt-field-modal-header";

  const title = document.createElement("div");
  title.className = "gt-field-modal-title";
  title.innerHTML =
    '<i class="fas fa-list fa-fw" style="margin-right: 6px;"></i> Select Message Field';

  const closeBtn = document.createElement("button");
  closeBtn.className = "gt-field-modal-close";
  closeBtn.innerHTML = '<i class="fas fa-times fa-fw"></i>';
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", () => {
    cleanup();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // ─ Body
  const body = document.createElement("div");
  body.className = "gt-field-modal-body";

  const desc = document.createElement("p");
  desc.className = "gt-field-modal-desc";
  desc.textContent = "Graytool bu log row'undan hangi field'ı mesaj içeriği olarak okumalı?";
  body.appendChild(desc);

  // Field options
  const optionEls: HTMLElement[] = [];

  fields.forEach((field, index) => {
    const option = document.createElement("div");
    option.className = `gt-field-option${index === 0 ? " gt-selected" : ""}`;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "gt-field-select";
    radio.checked = index === 0;

    const labelWrap = document.createElement("div");
    labelWrap.style.overflow = "hidden";

    const name = document.createElement("div");
    name.className = "gt-field-option-name";
    name.textContent = field.name;

    const preview = document.createElement("div");
    preview.className = "gt-field-option-preview";
    preview.textContent = truncate(field.value, 80);

    labelWrap.appendChild(name);
    labelWrap.appendChild(preview);

    option.appendChild(radio);
    option.appendChild(labelWrap);

    option.addEventListener("click", () => {
      selectedIndex = index;
      optionEls.forEach((el, i) => {
        el.classList.toggle("gt-selected", i === index);
        const r = el.querySelector('input[type="radio"]') as HTMLInputElement;
        if (r) r.checked = i === index;
      });
    });

    body.appendChild(option);
    optionEls.push(option);
  });

  modal.appendChild(body);

  // ─ Footer
  const footer = document.createElement("div");
  footer.className = "gt-field-modal-footer";

  const saveLabel = document.createElement("label");
  saveLabel.className = "gt-field-save-default";
  const saveCheckbox = document.createElement("input");
  saveCheckbox.type = "checkbox";
  saveCheckbox.addEventListener("change", () => {
    saveAsDefault = saveCheckbox.checked;
  });
  saveLabel.appendChild(saveCheckbox);
  saveLabel.appendChild(document.createTextNode("Bu seçimi varsayılan olarak kaydet"));

  const actionBtns = document.createElement("div");
  actionBtns.className = "gt-field-modal-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "gt-btn gt-btn-default";
  cancelBtn.textContent = "İptal";
  cancelBtn.addEventListener("click", cleanup);

  const selectBtn = document.createElement("button");
  selectBtn.className = "gt-btn gt-btn-primary";
  selectBtn.textContent = "Seç ve Devam";
  selectBtn.addEventListener("click", () => {
    const selected = fields[selectedIndex];
    cleanup();
    onSelect(selected, saveAsDefault);
  });

  actionBtns.appendChild(cancelBtn);
  actionBtns.appendChild(selectBtn);
  footer.appendChild(saveLabel);
  footer.appendChild(actionBtns);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });

  // ESC key
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cleanup();
    }
  };
  document.addEventListener("keydown", handleEsc);

  function cleanup(): void {
    document.removeEventListener("keydown", handleEsc);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}
