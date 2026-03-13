// options/OptionsPage.tsx — Graytool Extension Options Page
// Graylog-styled settings page for the Chrome extension

import React, { useState, useEffect } from "react";
import type {
  GrayToolConfig,
  UrlPattern,
  ButtonConfig,
  AppSettings,
  GlobalFieldConfig,
  ButtonColor,
  ButtonCondition,
  ButtonConditionOperator,
} from "../shared/types";
import { getConfig, getDefaultConfig, saveConfig } from "../shared/storage";

// ─── SVG Icons ────────────────────────────────────────────────────────

const GraytoolLogo: React.FC = () => (
  <img src="../logo.svg" alt="Graytool Logo" height="26" style={{ marginLeft: "-16px" }} />
);

const CircleInfoIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="circle-info"
    className="svg-inline--fa fa-circle-info"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path
      fill="currentColor"
      d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
    ></path>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="plus"
    className="svg-inline--fa fa-plus"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
  >
    <path
      fill="currentColor"
      d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
    ></path>
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="trash"
    className="svg-inline--fa fa-trash"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
  >
    <path
      fill="currentColor"
      d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
    ></path>
  </svg>
);

const EditIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="pen"
    className="svg-inline--fa fa-pen"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path
      fill="currentColor"
      d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.4-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"
    ></path>
  </svg>
);

// ─── Helper Functions ───────────────────────────────────────────────────

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Main Component ───────────────────────────────────────────────────

export const OptionsPage: React.FC = () => {
  const [config, setConfig] = useState<GrayToolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "patterns" | "buttons" | "settings" | "fields" | "help"
  >("patterns");
  const [editingButton, setEditingButton] = useState<ButtonConfig | null>(null);
  const [editingPattern, setEditingPattern] = useState<UrlPattern | null>(null);
  const [buttonSearch, setButtonSearch] = useState("");
  const [buttonPatternFilter, setButtonPatternFilter] = useState<string>("all");
  const [patternSearch, setPatternSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load config on mount
  useEffect(() => {
    getConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  // Save config
  const handleSave = async (partial?: Partial<GrayToolConfig>) => {
    if (!config) return;
    setSaving(true);
    try {
      await saveConfig(partial || config);
      if (partial) {
        setConfig({ ...config, ...partial });
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    }
    setSaving(false);
  };

  // ─── URL Patterns ───────────────────────────────────────────────────

  const handleAddPattern = () => {
    const newPattern: UrlPattern = {
      id: generateId(),
      pattern: "",
      label: "",
      enabled: true,
    };
    setEditingPattern(newPattern);
  };

  const handleSavePattern = async () => {
    if (!config || !editingPattern) return;

    // Request permission for the new pattern
    if (editingPattern.pattern) {
      try {
        const granted = await chrome.permissions.request({
          origins: [editingPattern.pattern],
        });
        if (!granted) {
          setImportStatus({
            type: "error",
            message: "Permission denied. The extension will not work on this URL pattern.",
          });
          return;
        }
      } catch (error) {
        console.error("Failed to request permission:", error);
      }
    }

    const existingIndex = config.urlPatterns.findIndex((p) => p.id === editingPattern.id);
    let newPatterns: UrlPattern[];
    if (existingIndex >= 0) {
      newPatterns = [...config.urlPatterns];
      newPatterns[existingIndex] = editingPattern;
    } else {
      newPatterns = [...config.urlPatterns, editingPattern];
    }
    handleSave({ urlPatterns: newPatterns });
    setEditingPattern(null);
  };

  const handleDeletePattern = (id: string) => {
    if (!config) return;
    const newPatterns = config.urlPatterns.filter((p) => p.id !== id);
    handleSave({ urlPatterns: newPatterns });
  };

  const handleTogglePattern = (id: string) => {
    if (!config) return;
    const newPatterns = config.urlPatterns.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p,
    );
    handleSave({ urlPatterns: newPatterns });
  };

  // ─── Buttons ────────────────────────────────────────────────────────

  const handleAddButton = () => {
    const newButton: ButtonConfig = {
      id: generateId(),
      label: "",
      url: "",
      fieldBindings: [],
      conditions: [],
      openInNewTab: true,
      enabled: true,
      color: "primary",
      urlPatternIds: [],
    };
    setEditingButton(newButton);
  };

  const handleSaveButton = () => {
    if (!config || !editingButton) return;
    const existingIndex = config.buttons.findIndex((b) => b.id === editingButton.id);
    let newButtons: ButtonConfig[];
    if (existingIndex >= 0) {
      newButtons = [...config.buttons];
      newButtons[existingIndex] = editingButton;
    } else {
      newButtons = [...config.buttons, editingButton];
    }
    handleSave({ buttons: newButtons });
    setEditingButton(null);
  };

  const handleDeleteButton = (id: string) => {
    if (!config) return;
    const newButtons = config.buttons.filter((b) => b.id !== id);
    handleSave({ buttons: newButtons });
  };

  const handleToggleButton = (id: string) => {
    if (!config) return;
    const newButtons = config.buttons.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
    handleSave({ buttons: newButtons });
  };

  // ─── Conditions ────────────────────────────────────────────────────────

  const handleAddCondition = () => {
    if (!editingButton) return;
    const newCondition: ButtonCondition = {
      field: "",
      operator: "exists",
      value: "",
    };
    setEditingButton({
      ...editingButton,
      conditions: [...editingButton.conditions, newCondition],
    });
  };

  const handleUpdateCondition = (index: number, updates: Partial<ButtonCondition>) => {
    if (!editingButton) return;
    const newConditions = [...editingButton.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setEditingButton({ ...editingButton, conditions: newConditions });
  };

  const handleRemoveCondition = (index: number) => {
    if (!editingButton) return;
    const newConditions = editingButton.conditions.filter((_, i) => i !== index);
    setEditingButton({ ...editingButton, conditions: newConditions });
  };

  // ─── URL Pattern IDs ────────────────────────────────────────────────────

  const handleToggleUrlPatternId = (patternId: string) => {
    if (!editingButton) return;
    const currentIds = editingButton.urlPatternIds || [];
    const newIds = currentIds.includes(patternId)
      ? currentIds.filter((id) => id !== patternId)
      : [...currentIds, patternId];
    setEditingButton({ ...editingButton, urlPatternIds: newIds });
  };

  // ─── Settings ────────────────────────────────────────────────────────

  const handleSettingChange = (key: keyof AppSettings, value: boolean) => {
    if (!config) return;
    handleSave({ settings: { ...config.settings, [key]: value } });
  };

  // ─── Field Config ────────────────────────────────────────────────────

  const handleFieldConfigChange = (
    key: keyof GlobalFieldConfig,
    value: string | string[] | null,
  ) => {
    if (!config) return;
    handleSave({ globalFieldConfig: { ...config.globalFieldConfig, [key]: value } });
  };

  // ─── Import / Export ─────────────────────────────────────────────────

  const sanitizeImportedConfig = (raw: unknown): GrayToolConfig | null => {
    if (typeof raw !== "object" || raw === null) return null;
    const data = raw as Partial<GrayToolConfig>;
    const defaults = getDefaultConfig();

    return {
      version: 2,
      urlPatterns: Array.isArray(data.urlPatterns)
        ? (data.urlPatterns as UrlPattern[])
        : defaults.urlPatterns,
      buttons: Array.isArray(data.buttons) ? (data.buttons as ButtonConfig[]) : defaults.buttons,
      globalFieldConfig: {
        ...defaults.globalFieldConfig,
        ...(typeof data.globalFieldConfig === "object" && data.globalFieldConfig !== null
          ? (data.globalFieldConfig as Partial<GlobalFieldConfig>)
          : {}),
      },
      settings: {
        ...defaults.settings,
        ...(typeof data.settings === "object" && data.settings !== null
          ? (data.settings as Partial<AppSettings>)
          : {}),
      },
    };
  };

  const handleExportConfig = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "graytool-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportText = async () => {
    if (!importText.trim()) {
      setImportStatus({ type: "error", message: "Paste JSON or import a file first." });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch (error) {
      setImportStatus({ type: "error", message: "Invalid JSON. Please check the format." });
      return;
    }

    const sanitized = sanitizeImportedConfig(parsed);
    if (!sanitized) {
      setImportStatus({ type: "error", message: "Invalid configuration format." });
      return;
    }

    // Request permissions for imported URL patterns
    const patternsToRequest = sanitized.urlPatterns.filter((p) => p.pattern).map((p) => p.pattern);

    if (patternsToRequest.length > 0) {
      try {
        const granted = await chrome.permissions.request({
          origins: patternsToRequest,
        });
        if (!granted) {
          setImportStatus({
            type: "error",
            message: "Permission denied. The extension will not work on the imported URL patterns.",
          });
          return;
        }
      } catch (error) {
        console.error("Failed to request permissions:", error);
        setImportStatus({ type: "error", message: "Failed to request permissions." });
        return;
      }
    }

    setSaving(true);
    try {
      await saveConfig(sanitized);
      setConfig(sanitized);
      setEditingButton(null);
      setEditingPattern(null);
      setImportStatus({ type: "success", message: "Settings imported successfully." });
    } catch (error) {
      console.error("Failed to import config:", error);
      setImportStatus({ type: "error", message: "Failed to save imported settings." });
    }
    setSaving(false);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportText(text);
      setImportStatus({
        type: "success",
        message: "File loaded. Review and click Import JSON to apply.",
      });
    } catch (error) {
      console.error("Failed to read import file:", error);
      setImportStatus({ type: "error", message: "Failed to read file." });
    }

    event.target.value = "";
  };

  // ─── Loading State ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="gl-page">
        <div className="gl-main-content">
          <div className="gl-content-wrapper">
            <div style={{ textAlign: "center", padding: "40px" }}>Loading configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="gl-page">
        <div className="gl-main-content">
          <div className="gl-content-wrapper">
            <div style={{ textAlign: "center", padding: "40px", color: "var(--gl-btn-danger)" }}>
              Failed to load configuration
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get pattern labels for display
  const getPatternLabels = (patternIds: string[] | undefined): string[] => {
    if (!patternIds || patternIds.length === 0) return ["All Patterns"];
    return patternIds.map((id) => {
      const pattern = config.urlPatterns.find((p) => p.id === id);
      return pattern?.label || pattern?.pattern || id;
    });
  };

  // Filter buttons based on search and pattern filter
  const getFilteredButtons = (): ButtonConfig[] => {
    let filtered = config.buttons;

    // Filter by search text
    if (buttonSearch.trim()) {
      const searchLower = buttonSearch.toLowerCase();
      filtered = filtered.filter(
        (button) =>
          button.label.toLowerCase().includes(searchLower) ||
          button.url.toLowerCase().includes(searchLower),
      );
    }

    // Filter by URL pattern
    if (buttonPatternFilter !== "all") {
      filtered = filtered.filter((button) => {
        const patternIds = button.urlPatternIds || [];
        if (buttonPatternFilter === "none") {
          return patternIds.length === 0;
        }
        return patternIds.includes(buttonPatternFilter);
      });
    }

    return filtered;
  };

  const filteredButtons = getFilteredButtons();

  // Filter URL patterns based on search text
  const getFilteredPatterns = (): UrlPattern[] => {
    if (!patternSearch.trim()) return config.urlPatterns;
    const searchLower = patternSearch.toLowerCase();
    return config.urlPatterns.filter(
      (pattern) =>
        (pattern.label || "").toLowerCase().includes(searchLower) ||
        pattern.pattern.toLowerCase().includes(searchLower),
    );
  };

  const filteredPatterns = getFilteredPatterns();

  return (
    <div className="gl-page">
      {/* Navigation */}
      <nav className="gl-navbar navbar navbar-default navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="gl-navbar-brand navbar-brand" href="/options/options.html">
              <GraytoolLogo />
            </a>
          </div>
          <div className="navbar-collapse collapse">
            <ul className="gl-navbar-main nav navbar-nav">
              <li className={activeTab === "patterns" ? "active" : ""}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("patterns");
                  }}
                >
                  <div className="gl-nav-item-state-indicator">URL Patterns</div>
                </a>
              </li>
              <li className={activeTab === "buttons" ? "active" : ""}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("buttons");
                  }}
                >
                  <div className="gl-nav-item-state-indicator">Buttons</div>
                </a>
              </li>
              <li className={activeTab === "fields" ? "active" : ""}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("fields");
                  }}
                >
                  <div className="gl-nav-item-state-indicator">Field Config</div>
                </a>
              </li>
              <li className={activeTab === "settings" ? "active" : ""}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("settings");
                  }}
                >
                  <div className="gl-nav-item-state-indicator">Settings</div>
                </a>
              </li>
              <li className={activeTab === "help" ? "active" : ""}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("help");
                  }}
                >
                  <div className="gl-nav-item-state-indicator">Help</div>
                </a>
              </li>
            </ul>
            <ul className="gl-navbar-right nav navbar-nav navbar-right">
              <li>
                <span style={{ padding: "15px", color: "var(--gl-text-muted)", fontSize: "12px" }}>
                  {saving ? "Saving..." : "Auto-saved"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="gl-main-content">
        <div className="gl-content-wrapper">
          <div className="gl-page-content container-fluid">
            {/* Page Header */}
            <div className="gl-content-head gl-row">
              <div className="col-sm-12">
                <div className="gl-page-header">
                  <div className="gl-page-header-main">
                    <h1>
                      {activeTab === "patterns" && "URL Patterns"}
                      {activeTab === "buttons" && "Action Buttons"}
                      {activeTab === "fields" && "Field Configuration"}
                      {activeTab === "settings" && "Settings"}
                      {activeTab === "help" && "Help"}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="gl-content-sections" style={{ gridTemplateColumns: "1fr" }}>
              <div className="gl-content-column">
                {/* URL Patterns Tab */}
                {activeTab === "patterns" && (
                  <>
                    {/* Info Alert */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-alert gl-alert-info" role="alert">
                          <div className="gl-alert-wrapper">
                            <div className="gl-alert-icon">
                              <CircleInfoIcon />
                            </div>
                            <div className="gl-alert-body">
                              <div className="gl-alert-title">
                                <span>URL Patterns</span>
                              </div>
                              <div className="gl-alert-message">
                                Define which Graylog instances the extension should activate on. Use
                                wildcards (*) to match multiple paths. Example:{" "}
                                <code>https://graylog.company.com/*</code>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patterns List */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-section-header">
                          <h2>Configured Patterns</h2>
                          <button className="gl-btn btn btn-success" onClick={handleAddPattern}>
                            <PlusIcon /> Add Pattern
                          </button>
                        </div>

                        {/* Search Input */}
                        {config.urlPatterns.length > 0 && (
                          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                            <input
                              type="text"
                              className="gl-form-control form-control"
                              placeholder="Search patterns..."
                              value={patternSearch}
                              onChange={(e) => setPatternSearch(e.target.value)}
                            />
                          </div>
                        )}

                        {config.urlPatterns.length === 0 ? (
                          <p className="gl-help-block">
                            No URL patterns configured. Add one to get started.
                          </p>
                        ) : filteredPatterns.length === 0 ? (
                          <p className="gl-help-block">No patterns match your search.</p>
                        ) : (
                          <div style={{ marginTop: "16px" }}>
                            {filteredPatterns.map((pattern) => (
                              <div key={pattern.id} className="gl-list-item">
                                <div className="gl-list-item-content">
                                  <div className="gl-list-item-title">
                                    {pattern.label || "Unnamed Pattern"}
                                  </div>
                                  <div className="gl-list-item-subtitle">{pattern.pattern}</div>
                                </div>
                                <div className="gl-list-item-actions">
                                  <label className="gl-switch">
                                    <input
                                      type="checkbox"
                                      checked={pattern.enabled}
                                      onChange={() => handleTogglePattern(pattern.id)}
                                    />
                                    <span className="slider"></span>
                                  </label>
                                  <button
                                    className="gl-btn-icon"
                                    onClick={() => setEditingPattern(pattern)}
                                    title="Edit"
                                  >
                                    <EditIcon />
                                  </button>
                                  <button
                                    className="gl-btn-icon gl-btn-icon-danger"
                                    onClick={() => handleDeletePattern(pattern.id)}
                                    title="Delete"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pattern Edit Modal */}
                    {editingPattern && (
                      <div className="gl-modal-overlay" onClick={() => setEditingPattern(null)}>
                        <div className="gl-modal" onClick={(e) => e.stopPropagation()}>
                          <div className="gl-modal-header">
                            <h2>
                              {editingPattern.id.startsWith("id-") ? "Edit Pattern" : "Add Pattern"}
                            </h2>
                          </div>
                          <div className="gl-modal-body">
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                Label
                              </label>
                              <div className="col-sm-9">
                                <input
                                  type="text"
                                  className="gl-form-control form-control"
                                  value={editingPattern.label}
                                  onChange={(e) =>
                                    setEditingPattern({ ...editingPattern, label: e.target.value })
                                  }
                                  placeholder="Production Graylog"
                                />
                                <span className="gl-help-block help-block">
                                  <span className="gl-help-text">
                                    A friendly name for this pattern.
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                URL Pattern
                              </label>
                              <div className="col-sm-9">
                                <input
                                  type="text"
                                  className="gl-form-control form-control"
                                  value={editingPattern.pattern}
                                  onChange={(e) =>
                                    setEditingPattern({
                                      ...editingPattern,
                                      pattern: e.target.value,
                                    })
                                  }
                                  placeholder="https://graylog.company.com/*"
                                />
                                <span className="gl-help-block help-block">
                                  <span className="gl-help-text">
                                    URL pattern with optional wildcard (*).
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="gl-modal-footer">
                            <button
                              className="gl-btn btn btn-default"
                              onClick={() => setEditingPattern(null)}
                            >
                              Cancel
                            </button>
                            <button className="gl-btn btn btn-success" onClick={handleSavePattern}>
                              Save Pattern
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Buttons Tab */}
                {activeTab === "buttons" && (
                  <>
                    {/* Info Alert */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-alert gl-alert-info" role="alert">
                          <div className="gl-alert-wrapper">
                            <div className="gl-alert-icon">
                              <CircleInfoIcon />
                            </div>
                            <div className="gl-alert-body">
                              <div className="gl-alert-title">
                                <span>Action Buttons</span>
                              </div>
                              <div className="gl-alert-message">
                                Configure buttons that appear on log rows. Use field bindings to
                                insert log data into URLs. Example URL:{" "}
                                <code>https://admin.company.com/users/{`{userId}`}</code>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Buttons List */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-section-header">
                          <h2>Configured Buttons</h2>
                          <button className="gl-btn btn btn-success" onClick={handleAddButton}>
                            <PlusIcon /> Add Button
                          </button>
                        </div>

                        {/* Search and Filter */}
                        {config.buttons.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              marginTop: "16px",
                              marginBottom: "16px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              className="gl-form-group"
                              style={{ flex: "1", minWidth: "200px", marginBottom: 0 }}
                            >
                              <input
                                type="text"
                                className="gl-form-control form-control"
                                placeholder="Search buttons..."
                                value={buttonSearch}
                                onChange={(e) => setButtonSearch(e.target.value)}
                              />
                            </div>
                            <div
                              className="gl-form-group"
                              style={{ width: "200px", marginBottom: 0 }}
                            >
                              <select
                                className="gl-select form-control"
                                value={buttonPatternFilter}
                                onChange={(e) => setButtonPatternFilter(e.target.value)}
                              >
                                <option value="all">All Patterns</option>
                                <option value="none">No Pattern</option>
                                {config.urlPatterns.map((pattern) => (
                                  <option key={pattern.id} value={pattern.id}>
                                    {pattern.label || pattern.pattern}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {config.buttons.length === 0 ? (
                          <p className="gl-help-block">
                            No buttons configured. Add one to get started.
                          </p>
                        ) : filteredButtons.length === 0 ? (
                          <p className="gl-help-block">No buttons match your search criteria.</p>
                        ) : (
                          <div style={{ marginTop: "16px" }}>
                            {filteredButtons.map((button) => (
                              <div key={button.id} className="gl-list-item">
                                <div className="gl-list-item-content">
                                  <div className="gl-list-item-title">
                                    <span className={`gl-badge gl-badge-${button.color}`}>
                                      {button.label || "Unnamed Button"}
                                    </span>
                                  </div>
                                  <div
                                    className="gl-list-item-subtitle"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                      gap: "6px",
                                    }}
                                  >
                                    <span>{button.url || "No URL configured"}</span>
                                    {button.url && (
                                      <span style={{ color: "var(--gl-text-muted)" }}>•</span>
                                    )}
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                      {getPatternLabels(button.urlPatternIds).map((label, idx) => (
                                        <span
                                          key={idx}
                                          style={{
                                            backgroundColor: "rgba(41, 121, 255, 0.14)",
                                            color: "#8fb5ff",
                                            border: "1px solid rgba(41, 121, 255, 0.45)",
                                            borderRadius: "12px",
                                            fontSize: "10px",
                                            padding: "1px 6px",
                                            whiteSpace: "nowrap",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="gl-list-item-actions">
                                  <label className="gl-switch">
                                    <input
                                      type="checkbox"
                                      checked={button.enabled}
                                      onChange={() => handleToggleButton(button.id)}
                                    />
                                    <span className="slider"></span>
                                  </label>
                                  <button
                                    className="gl-btn-icon"
                                    onClick={() => setEditingButton(button)}
                                    title="Edit"
                                  >
                                    <EditIcon />
                                  </button>
                                  <button
                                    className="gl-btn-icon gl-btn-icon-danger"
                                    onClick={() => handleDeleteButton(button.id)}
                                    title="Delete"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Button Edit Modal */}
                    {editingButton && (
                      <div className="gl-modal-overlay" onClick={() => setEditingButton(null)}>
                        <div
                          className="gl-modal gl-modal-large"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="gl-modal-header">
                            <h2>
                              {config.buttons.find((b) => b.id === editingButton.id)
                                ? "Edit Button"
                                : "Add Button"}
                            </h2>
                          </div>
                          <div className="gl-modal-body">
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                Label
                              </label>
                              <div className="col-sm-9">
                                <input
                                  type="text"
                                  className="gl-form-control form-control"
                                  value={editingButton.label}
                                  onChange={(e) =>
                                    setEditingButton({ ...editingButton, label: e.target.value })
                                  }
                                  placeholder="View User"
                                />
                              </div>
                            </div>
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                URL Template
                              </label>
                              <div className="col-sm-9">
                                <input
                                  type="text"
                                  className="gl-form-control form-control"
                                  value={editingButton.url}
                                  onChange={(e) =>
                                    setEditingButton({ ...editingButton, url: e.target.value })
                                  }
                                  placeholder="https://admin.company.com/users/{userId}"
                                />
                                <span className="gl-help-block help-block">
                                  <span className="gl-help-text">
                                    Use {`{fieldName}`} placeholders for dynamic values.
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                Color
                              </label>
                              <div className="col-sm-9">
                                <select
                                  className="gl-select form-control"
                                  value={editingButton.color}
                                  onChange={(e) =>
                                    setEditingButton({
                                      ...editingButton,
                                      color: e.target.value as ButtonColor,
                                    })
                                  }
                                >
                                  <option value="primary">Primary (Blue)</option>
                                  <option value="success">Success (Green)</option>
                                  <option value="warning">Warning (Yellow)</option>
                                  <option value="danger">Danger (Red)</option>
                                  <option value="default">Default (Gray)</option>
                                </select>
                              </div>
                            </div>

                            {/* URL Pattern Selection */}
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                URL Patterns
                              </label>
                              <div className="col-sm-9">
                                <div style={{ marginBottom: "8px" }}>
                                  <span
                                    className="gl-help-text"
                                    style={{ fontSize: "12px", color: "var(--gl-text-muted)" }}
                                  >
                                    Select which URL patterns this button should appear on. Leave
                                    empty for all patterns.
                                  </span>
                                </div>
                                {config.urlPatterns.length === 0 ? (
                                  <p className="gl-help-block" style={{ fontStyle: "italic" }}>
                                    No URL patterns configured. Button will appear on all pages.
                                  </p>
                                ) : (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {config.urlPatterns.map((pattern) => (
                                      <label
                                        key={pattern.id}
                                        className="gl-checkbox-pill"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          padding: "6px 12px",
                                          backgroundColor: (
                                            editingButton.urlPatternIds || []
                                          ).includes(pattern.id)
                                            ? "var(--gl-btn-primary)"
                                            : "var(--gl-bg-tertiary)",
                                          border: "1px solid var(--gl-border-color)",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "13px",
                                          transition: "all 150ms ease-in-out",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(editingButton.urlPatternIds || []).includes(
                                            pattern.id,
                                          )}
                                          onChange={() => handleToggleUrlPatternId(pattern.id)}
                                          style={{ display: "none" }}
                                        />
                                        {pattern.label || pattern.pattern}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Conditions */}
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                Conditions
                              </label>
                              <div className="col-sm-9">
                                <div style={{ marginBottom: "8px" }}>
                                  <span
                                    className="gl-help-text"
                                    style={{ fontSize: "12px", color: "var(--gl-text-muted)" }}
                                  >
                                    Button will only appear when all conditions are met.
                                  </span>
                                </div>

                                {editingButton.conditions.map((condition, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      marginBottom: "8px",
                                      alignItems: "center",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      className="gl-form-control form-control"
                                      style={{ flex: "1" }}
                                      placeholder="Field name"
                                      value={condition.field}
                                      onChange={(e) =>
                                        handleUpdateCondition(index, { field: e.target.value })
                                      }
                                    />
                                    <select
                                      className="gl-select form-control"
                                      style={{ width: "120px" }}
                                      value={condition.operator}
                                      onChange={(e) =>
                                        handleUpdateCondition(index, {
                                          operator: e.target.value as ButtonConditionOperator,
                                        })
                                      }
                                    >
                                      <option value="exists">Exists</option>
                                      <option value="equals">Equals</option>
                                      <option value="notEquals">Not Equals</option>
                                      <option value="contains">Contains</option>
                                      <option value="startsWith">Starts With</option>
                                    </select>
                                    {condition.operator !== "exists" && (
                                      <input
                                        type="text"
                                        className="gl-form-control form-control"
                                        style={{ flex: "1" }}
                                        placeholder="Value"
                                        value={condition.value || ""}
                                        onChange={(e) =>
                                          handleUpdateCondition(index, { value: e.target.value })
                                        }
                                      />
                                    )}
                                    <button
                                      type="button"
                                      className="gl-btn-icon gl-btn-icon-danger"
                                      onClick={() => handleRemoveCondition(index)}
                                      title="Remove condition"
                                    >
                                      <TrashIcon />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  className="gl-btn btn btn-default"
                                  style={{
                                    marginTop: "8px",
                                    fontSize: "13px",
                                    padding: "6px 12px",
                                  }}
                                  onClick={handleAddCondition}
                                >
                                  <PlusIcon /> Add Condition
                                </button>
                              </div>
                            </div>

                            {/* Options */}
                            <div className="gl-form-group form-group">
                              <label className="gl-control-label col-sm-3 control-label">
                                Options
                              </label>
                              <div className="col-sm-9">
                                <div className="checkbox">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={editingButton.openInNewTab}
                                      onChange={(e) =>
                                        setEditingButton({
                                          ...editingButton,
                                          openInNewTab: e.target.checked,
                                        })
                                      }
                                    />
                                    Open in new tab
                                  </label>
                                </div>
                                <div className="checkbox">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={editingButton.enabled}
                                      onChange={(e) =>
                                        setEditingButton({
                                          ...editingButton,
                                          enabled: e.target.checked,
                                        })
                                      }
                                    />
                                    Enabled
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="gl-modal-footer">
                            <button
                              className="gl-btn btn btn-default"
                              onClick={() => setEditingButton(null)}
                            >
                              Cancel
                            </button>
                            <button className="gl-btn btn btn-success" onClick={handleSaveButton}>
                              Save Button
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Field Config Tab */}
                {activeTab === "fields" && (
                  <div className="gl-content gl-row">
                    <div className="col-xs-12">
                      <div className="gl-section-header">
                        <h2>Field Discovery Configuration</h2>
                      </div>
                      <form className="gl-form form-horizontal">
                        <div className="gl-form-group form-group">
                          <label className="gl-control-label col-sm-3 control-label">
                            Default Message Field
                          </label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="gl-form-control form-control"
                              value={config.globalFieldConfig.defaultMessageField || ""}
                              onChange={(e) =>
                                handleFieldConfigChange(
                                  "defaultMessageField",
                                  e.target.value || null,
                                )
                              }
                              placeholder="Auto-detect"
                            />
                            <span className="gl-help-block help-block">
                              <span className="gl-help-text">
                                The field to parse for JSON content. Leave empty for auto-detection.
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="gl-form-group form-group">
                          <label className="gl-control-label col-sm-3 control-label">
                            Field Prefixes
                          </label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="gl-form-control form-control"
                              value={config.globalFieldConfig.rowFieldPrefixes.join(", ")}
                              onChange={(e) =>
                                handleFieldConfigChange(
                                  "rowFieldPrefixes",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                              placeholder="msg., context., "
                            />
                            <span className="gl-help-block help-block">
                              <span className="gl-help-text">
                                Comma-separated list of field prefixes to search.
                              </span>
                            </span>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="gl-content gl-row">
                    <div className="col-xs-12">
                      <div className="gl-section-header">
                        <h2>Application Settings</h2>
                      </div>
                      <form className="gl-form form-horizontal">
                        <div className="gl-form-group form-group">
                          <label className="gl-control-label col-sm-3 control-label">
                            Extension
                          </label>
                          <div className="col-sm-9">
                            <div className="checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={config.settings.enabled}
                                  onChange={(e) => handleSettingChange("enabled", e.target.checked)}
                                />
                                Enable extension
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="gl-form-group form-group">
                          <label className="gl-control-label col-sm-3 control-label">
                            Features
                          </label>
                          <div className="col-sm-9">
                            <div className="checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={config.settings.showMessageDetailButton}
                                  onChange={(e) =>
                                    handleSettingChange("showMessageDetailButton", e.target.checked)
                                  }
                                />
                                Enable message detail button
                              </label>
                            </div>
                            <div className="checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={config.settings.searchHistoryEnabled !== false}
                                  onChange={(e) =>
                                    handleSettingChange("searchHistoryEnabled", e.target.checked)
                                  }
                                />
                                Enable search history
                              </label>
                            </div>
                            <div className="checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={config.settings.jsonViewerEnabled}
                                  onChange={(e) =>
                                    handleSettingChange("jsonViewerEnabled", e.target.checked)
                                  }
                                />
                                Enable JSON viewer
                              </label>
                            </div>
                            <div className="checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={config.settings.keyboardShortcutsEnabled}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "keyboardShortcutsEnabled",
                                      e.target.checked,
                                    )
                                  }
                                />
                                Enable keyboard shortcuts
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="gl-form-group form-group">
                          <label className="gl-control-label col-sm-3 control-label">
                            Import / Export
                          </label>
                          <div className="col-sm-9">
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                className="gl-btn btn btn-default"
                                type="button"
                                onClick={handleExportConfig}
                              >
                                Export settings
                              </button>
                              <label className="gl-btn btn btn-default" style={{ marginBottom: 0 }}>
                                Import from file
                                <input
                                  type="file"
                                  accept="application/json"
                                  style={{ display: "none" }}
                                  onChange={handleImportFile}
                                />
                              </label>
                            </div>
                            <div style={{ marginTop: "12px" }}>
                              <textarea
                                className="gl-form-control form-control"
                                rows={10}
                                style={{ minHeight: "220px" }}
                                placeholder="Paste exported JSON here..."
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                              />
                            </div>
                            <div
                              style={{
                                marginTop: "8px",
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="gl-btn btn btn-success"
                                type="button"
                                onClick={handleImportText}
                              >
                                Import JSON
                              </button>
                              <button
                                className="gl-btn btn btn-default"
                                type="button"
                                onClick={() => {
                                  setImportText("");
                                  setImportStatus(null);
                                }}
                              >
                                Clear
                              </button>
                            </div>
                            {importStatus && (
                              <span
                                className="gl-help-block help-block"
                                style={{
                                  color:
                                    importStatus.type === "error"
                                      ? "var(--gl-btn-danger)"
                                      : "var(--gl-btn-success)",
                                }}
                              >
                                <span className="gl-help-text">{importStatus.message}</span>
                              </span>
                            )}
                            <span className="gl-help-block help-block">
                              <span className="gl-help-text">
                                Importing overwrites your current settings.
                              </span>
                            </span>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Help Tab */}
                {activeTab === "help" && (
                  <>
                    {/* Keyboard Shortcuts */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-section-header">
                          <h2>Keyboard Shortcuts</h2>
                        </div>
                        <div className="table-responsive">
                          <table
                            className="table table-bordered table-striped"
                            style={{
                              marginTop: "16px",
                              backgroundColor: "var(--gt-bg-card)",
                              borderRadius: "4px",
                            }}
                          >
                            <thead>
                              <tr>
                                <th style={{ width: "30%" }}>Shortcut</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <kbd
                                    style={{
                                      display: "inline-block",
                                      padding: "3px 6px",
                                      fontFamily: "monospace",
                                      fontSize: "11px",
                                      lineHeight: "10px",
                                      color: "#444",
                                      verticalAlign: "middle",
                                      backgroundColor: "#fcfcfc",
                                      border: "solid 1px #ccc",
                                      borderBottomColor: "#bbb",
                                      borderRadius: "3px",
                                      boxShadow: "inset 0 -1px 0 #bbb",
                                    }}
                                  >
                                    Ctrl/Cmd
                                  </kbd>{" "}
                                  +{" "}
                                  <kbd
                                    style={{
                                      display: "inline-block",
                                      padding: "3px 6px",
                                      fontFamily: "monospace",
                                      fontSize: "11px",
                                      lineHeight: "10px",
                                      color: "#444",
                                      verticalAlign: "middle",
                                      backgroundColor: "#fcfcfc",
                                      border: "solid 1px #ccc",
                                      borderBottomColor: "#bbb",
                                      borderRadius: "3px",
                                      boxShadow: "inset 0 -1px 0 #bbb",
                                    }}
                                  >
                                    H
                                  </kbd>
                                </td>
                                <td>Open the Search History popup (when in Graylog).</td>
                              </tr>
                              <tr>
                                <td>
                                  <kbd
                                    style={{
                                      display: "inline-block",
                                      padding: "3px 6px",
                                      fontFamily: "monospace",
                                      fontSize: "11px",
                                      lineHeight: "10px",
                                      color: "#444",
                                      verticalAlign: "middle",
                                      backgroundColor: "#fcfcfc",
                                      border: "solid 1px #ccc",
                                      borderBottomColor: "#bbb",
                                      borderRadius: "3px",
                                      boxShadow: "inset 0 -1px 0 #bbb",
                                    }}
                                  >
                                    Esc
                                  </kbd>
                                </td>
                                <td>
                                  Close open overlays (Search History, JSON Viewer, Field Selector).
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <kbd
                                    style={{
                                      display: "inline-block",
                                      padding: "3px 6px",
                                      fontFamily: "monospace",
                                      fontSize: "11px",
                                      lineHeight: "10px",
                                      color: "#444",
                                      verticalAlign: "middle",
                                      backgroundColor: "#fcfcfc",
                                      border: "solid 1px #ccc",
                                      borderBottomColor: "#bbb",
                                      borderRadius: "3px",
                                      boxShadow: "inset 0 -1px 0 #bbb",
                                    }}
                                  >
                                    Enter
                                  </kbd>
                                </td>
                                <td>
                                  Save the current query to search history and execute search (when
                                  focusing Graylog query editor).
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Useful Links */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-section-header">
                          <h2>Useful Links</h2>
                        </div>
                        <div style={{ marginTop: "16px" }}>
                          <div className="gl-list-item">
                            <div className="gl-list-item-content">
                              <div className="gl-list-item-title">
                                <a
                                  href="https://github.com/bozkurtemre/graytool/issues"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--gt-primary)", textDecoration: "none" }}
                                >
                                  Report an Issue
                                </a>
                              </div>
                              <div className="gl-list-item-subtitle">
                                Found a bug or have a feature request? Open an issue on GitHub.
                              </div>
                            </div>
                          </div>
                          <div className="gl-list-item">
                            <div className="gl-list-item-content">
                              <div className="gl-list-item-title">
                                <a
                                  href="https://github.com/bozkurtemre/graytool/blob/main/README.md"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--gt-primary)", textDecoration: "none" }}
                                >
                                  Documentation
                                </a>
                              </div>
                              <div className="gl-list-item-subtitle">
                                Read the documentation to learn how to use Graytool effectively.
                              </div>
                            </div>
                          </div>
                          <div className="gl-list-item">
                            <div className="gl-list-item-content">
                              <div className="gl-list-item-title">
                                <a
                                  href="https://github.com/bozkurtemre/graytool/releases"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--gt-primary)", textDecoration: "none" }}
                                >
                                  Changelog
                                </a>
                              </div>
                              <div className="gl-list-item-subtitle">
                                View the release history and changelog.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extension */}
                    <div className="gl-content gl-row">
                      <div className="col-xs-12">
                        <div className="gl-section-header">
                          <h2>Extension Information</h2>
                        </div>
                        <div style={{ marginTop: "16px" }}>
                          <div className="gl-list-item" style={{ cursor: "default" }}>
                            <div className="gl-list-item-content">
                              <div className="gl-list-item-title">GitHub Repository</div>
                              <div className="gl-list-item-subtitle">
                                <a
                                  href="https://github.com/bozkurtemre/graytool"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--gt-primary)", textDecoration: "none" }}
                                >
                                  https://github.com/bozkurtemre/graytool
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="gl-list-item" style={{ cursor: "default" }}>
                            <div className="gl-list-item-content">
                              <div className="gl-list-item-title">Developer</div>
                              <div className="gl-list-item-subtitle">
                                <a
                                  href="https://emreb.dev"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--gt-primary)", textDecoration: "none" }}
                                >
                                  Emre Bozkurt
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="gl-footer">Graytool Chrome Extension</footer>
    </div>
  );
};

export default OptionsPage;
