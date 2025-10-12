// Content script for GrayTool extension
// Injects buttons into Graylog log rows

console.log("GrayTool: Content script starting to load...");
console.log("GrayTool: Current URL:", window.location.href);
console.log("GrayTool: Chrome APIs check:", {
  chrome: !!chrome,
  storage: !!(chrome && chrome.storage),
  runtime: !!(chrome && chrome.runtime)
});

// Add CSS for message detail popup
const popupStyles = `
  .graytool-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  .graytool-popup-content {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    color: #d4d4d4;
  }
  
  .graytool-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #404040;
    padding-bottom: 10px;
  }
  
  .graytool-popup-title {
    color: #ffffff;
    font-size: 16px;
    font-weight: bold;
  }
  
  .graytool-close-btn {
    background: #2d2d30;
    color: #cccccc;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .graytool-close-btn:hover {
    background: #3e3e42;
  }
  
  .graytool-copy-btn {
    background: #0e639c;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
  }
  
  .graytool-copy-btn:hover {
    background: #1177bb;
  }
  
  .graytool-json-container {
    background: #1e1e1e;
    border: 1px solid #404040;
    border-radius: 4px;
    padding: 15px;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-x: auto;
  }
  
  .json-key {
    color: #9cdcfe;
  }
  
  .json-string {
    color: #ce9178;
  }
  
  .json-number {
    color: #b5cea8;
  }
  
  .json-boolean {
    color: #569cd6;
  }
  
  .json-null {
    color: #569cd6;
  }
  
  .json-punctuation {
    color: #d4d4d4;
  }
  
  .json-toggle {
    color: #cccccc;
    cursor: pointer;
    user-select: none;
    margin-right: 4px;
    font-family: monospace;
    font-size: 12px;
    display: inline-block;
    width: 12px;
    text-align: center;
  }
  
  .json-toggle:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .json-length {
    color: #6a9955;
    font-style: italic;
    font-size: 11px;
    opacity: 0.8;
  }
  
  .json-collapsible {
    margin-left: 0;
  }
  
  .graytool-quick-actions-dropdown {
    background: #2d2d2d;
    border: 1px solid #404040;
    border-radius: 4px;
    margin: 10px 0;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .graytool-action-btn {
    display: block;
    width: 100%;
    background: #3c3c3c;
    color: #ffffff;
    border: 1px solid #555555;
    border-radius: 3px;
    padding: 8px 12px;
    margin: 4px 0;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
    transition: background-color 0.2s ease;
  }
  
  .graytool-action-btn:hover {
    background: #4a4a4a;
    border-color: #666666;
  }
  
  .graytool-action-btn:active {
    background: #2a2a2a;
  }
  
  .graytool-quick-actions-btn {
    background: #0e639c;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .graytool-quick-actions-btn:hover {
    background: #1177bb;
  }
  
  .graytool-context-btn {
    background: #0e639c;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .graytool-context-btn:hover {
    background: #1177bb;
  }
  
  /* Context Menu Styles */
  .graytool-context-menu {
    position: fixed;
    background: #2d2d2d;
    border: 1px solid #454545;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    z-index: 10002;
    min-width: 180px;
    padding: 4px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .graytool-context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    color: #cccccc;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.15s ease;
  }
  
  .graytool-context-menu-item:hover {
    background: #3e3e42;
    color: #ffffff;
  }
  
  .graytool-context-menu-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .graytool-context-menu-item.disabled:hover {
    background: transparent;
    color: #cccccc;
  }
  
  .graytool-context-menu-separator {
    height: 1px;
    background: #454545;
    margin: 4px 0;
  }
  
  .json-key-clickable {
    cursor: pointer;
    position: relative;
  }
  
  .json-key-clickable:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
  
  .json-value-clickable {
    cursor: pointer;
  }
  
  .json-value-clickable:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  /* Context Viewer Styles */
  .graytool-context-viewer {
    background: #1e1e1e;
    border-radius: 4px;
    margin: 10px 0;
    max-height: 500px;
    overflow-y: auto;
  }
  
  .graytool-context-section {
    border-bottom: 1px solid #404040;
    padding: 10px;
  }
  
  .graytool-context-header {
    color: #569cd6;
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .graytool-context-log {
    background: #252525;
    border-left: 3px solid #404040;
    padding: 8px;
    margin: 4px 0;
    font-size: 12px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .graytool-context-log:hover {
    background: #2d2d2d;
    border-left-color: #0e639c;
  }
  
  .graytool-context-log.current {
    background: #0e639c;
    border-left-color: #1177bb;
    font-weight: bold;
  }
  
  .graytool-context-log-time {
    color: #858585;
    font-size: 11px;
  }
  
  .graytool-context-log-level {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
    margin-right: 6px;
  }
  
  .graytool-context-log-level.ERROR {
    background: #f44336;
    color: white;
  }
  
  .graytool-context-log-level.WARN {
    background: #ff9800;
    color: white;
  }
  
  .graytool-context-log-level.INFO {
    background: #2196F3;
    color: white;
  }
  
  .graytool-context-log-level.DEBUG {
    background: #9E9E9E;
    color: white;
  }
  
  .graytool-context-log-message {
    color: #cccccc;
    margin-top: 4px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .graytool-context-loading {
    text-align: center;
    padding: 20px;
    color: #858585;
  }
  
  .graytool-context-error {
    background: #3d1f1f;
    border: 1px solid #5a2828;
    color: #f48771;
    padding: 12px;
    border-radius: 4px;
    margin: 10px;
  }
  
  /* Tab System */
  .graytool-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    border-bottom: 1px solid #404040;
  }
  
  .graytool-tab {
    background: #2d2d2d;
    color: #cccccc;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 13px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
  }
  
  .graytool-tab:hover {
    background: #3e3e42;
    color: #ffffff;
  }
  
  .graytool-tab.active {
    background: #0e639c;
    color: #ffffff;
    border-bottom-color: #1177bb;
  }
  
  .graytool-tab-content {
    display: none;
  }
  
  .graytool-tab-content.active {
    display: block;
  }
  
  .graytool-info-section {
    background: #1e1e1e;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .graytool-info-title {
    color: #569cd6;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .graytool-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    margin: 4px 0;
    background: #252525;
    border-radius: 4px;
  }
  
  .graytool-info-label {
    color: #cccccc;
    font-size: 13px;
  }
  
  .graytool-info-value {
    color: #9cdcfe;
    font-size: 13px;
    font-family: 'Monaco', 'Courier New', monospace;
  }
  
  .graytool-info-description {
    color: #858585;
    font-size: 12px;
    line-height: 1.6;
    margin-top: 8px;
  }
  
  /* Keyboard Shortcuts Help Popup */
  .graytool-shortcuts-popup {
    background: #2d2d2d;
    border: 1px solid #454545;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    max-width: 500px;
    margin: 0 auto;
  }
  
  .graytool-shortcuts-header {
    background: #1e1e1e;
    padding: 16px;
    border-bottom: 1px solid #454545;
    border-radius: 8px 8px 0 0;
  }
  
  .graytool-shortcuts-title {
    font-size: 18px;
    font-weight: bold;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .graytool-shortcuts-content {
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .graytool-shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin: 4px 0;
    background: #252525;
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .graytool-shortcut-item:hover {
    background: #2d2d2d;
  }
  
  .graytool-shortcut-description {
    color: #cccccc;
    font-size: 13px;
  }
  
  .graytool-shortcut-keys {
    display: flex;
    gap: 4px;
  }
  
  .graytool-shortcut-key {
    background: #3e3e42;
    border: 1px solid #555555;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: 'Monaco', 'Courier New', monospace;
    color: #e0e0e0;
    min-width: 24px;
    text-align: center;
    box-shadow: 0 2px 0 #1e1e1e;
  }
  
  .graytool-shortcuts-footer {
    background: #1e1e1e;
    padding: 12px 16px;
    border-top: 1px solid #454545;
    border-radius: 0 0 8px 8px;
    text-align: center;
    color: #858585;
    font-size: 12px;
  }
  
  .graytool-shortcut-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(14, 99, 156, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    animation: fadeInOut 2s ease-in-out;
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0; }
    10%, 90% { opacity: 1; }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = popupStyles;
document.head.appendChild(styleSheet);

// Keyboard Shortcuts System
const KEYBOARD_SHORTCUTS = {
  'CMD+K': { key: 'k', cmd: true, description: 'Quick search (focus search input)', action: 'quickSearch' },
  'CMD+SHIFT+C': { key: 'c', cmd: true, shift: true, description: 'Copy current log as JSON', action: 'copyAsJson' },
  'CMD+E': { key: 'e', cmd: true, description: 'Export current log', action: 'exportLog' },
  'CMD+/': { key: '/', cmd: true, description: 'Show keyboard shortcuts', action: 'showShortcuts' },
  'ESC': { key: 'Escape', description: 'Close popup', action: 'closePopup' },
  'CMD+SHIFT+F': { key: 'f', cmd: true, shift: true, description: 'Toggle filter menu', action: 'toggleFilter' }
};

// Global keyboard shortcut handler
let currentOpenPopup = null; // Track currently open popup

document.addEventListener('keydown', (e) => {
  // Check if user is typing in an input field
  const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                         document.activeElement.tagName === 'TEXTAREA' ||
                         document.activeElement.isContentEditable;
  
  // Allow some shortcuts even in input fields
  const allowInInput = (e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === 'k');
  
  if (isInputFocused && !allowInInput) {
    return; // Don't intercept when typing
  }
  
  // Detect OS (Mac uses metaKey, Windows/Linux uses ctrlKey)
  const cmdKey = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
  
  // Check each shortcut
  for (const [name, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
    const cmdMatch = shortcut.cmd ? cmdKey : !cmdKey;
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    
    if (keyMatch && cmdMatch && shiftMatch) {
      e.preventDefault();
      handleShortcutAction(shortcut.action, e);
      showShortcutIndicator(name);
      console.log("GrayTool: Keyboard shortcut triggered:", name);
      break;
    }
  }
});

// Handle shortcut actions
function handleShortcutAction(action, event) {
  switch (action) {
    case 'quickSearch':
      focusSearchInput();
      break;
    case 'copyAsJson':
      copyCurrentLogAsJson();
      break;
    case 'exportLog':
      exportCurrentLog();
      break;
    case 'showShortcuts':
      showKeyboardShortcutsHelp();
      break;
    case 'closePopup':
      closeCurrentPopup();
      break;
    case 'toggleFilter':
      toggleFilterMenu();
      break;
  }
}

// Show shortcut indicator
function showShortcutIndicator(shortcutName) {
  const indicator = document.createElement('div');
  indicator.className = 'graytool-shortcut-indicator';
  indicator.textContent = `⌨️ ${shortcutName}`;
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, 2000);
}

// Focus search input
function focusSearchInput() {
  const searchInput = document.querySelector('input[placeholder*="Search"]') || 
                      document.querySelector('input[type="search"]') ||
                      document.querySelector('.query-input input');
  
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
    showNotification('Search input focused', 'info');
  } else {
    showNotification('Search input not found', 'error');
  }
}

// Copy current log as JSON
function copyCurrentLogAsJson() {
  // Try to find the most recently opened popup's content
  const popupContent = document.querySelector('.graytool-popup-content');
  
  if (popupContent && currentOpenPopup) {
    copyToClipboard(currentOpenPopup.rawContent).then(() => {
      showNotification('Log copied as JSON!', 'success');
    }).catch(() => {
      showNotification('Failed to copy log', 'error');
    });
  } else {
    showNotification('No log popup open', 'error');
  }
}

// Export current log
function exportCurrentLog() {
  if (currentOpenPopup && currentOpenPopup.rawContent) {
    const blob = new Blob([currentOpenPopup.rawContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graylog-export-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Log exported!', 'success');
  } else {
    showNotification('No log to export', 'error');
  }
}

// Close current popup
function closeCurrentPopup() {
  const popup = document.querySelector('.graytool-popup-overlay');
  if (popup && popup.parentNode) {
    popup.parentNode.removeChild(popup);
    currentOpenPopup = null;
    console.log("GrayTool: Popup closed via keyboard shortcut");
  }
}

// Toggle filter menu
function toggleFilterMenu() {
  // Find Graylog's filter menu and toggle it
  const filterButton = document.querySelector('[data-testid="filter-button"]') ||
                       document.querySelector('.filter-button') ||
                       document.querySelector('button[title*="Filter"]');
  
  if (filterButton) {
    filterButton.click();
    showNotification('Filter menu toggled', 'info');
  } else {
    showNotification('Filter menu not found', 'error');
  }
}

// Show keyboard shortcuts help
function showKeyboardShortcutsHelp() {
  // Remove existing shortcuts popup
  const existingPopup = document.querySelector('.graytool-shortcuts-help-overlay');
  if (existingPopup) {
    existingPopup.remove();
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'graytool-popup-overlay graytool-shortcuts-help-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'graytool-shortcuts-popup';
  
  const header = document.createElement('div');
  header.className = 'graytool-shortcuts-header';
  header.innerHTML = '<div class="graytool-shortcuts-title">⌨️ Keyboard Shortcuts</div>';
  
  const content = document.createElement('div');
  content.className = 'graytool-shortcuts-content';
  
  // Detect OS for display
  const isMac = navigator.platform.includes('Mac');
  const cmdSymbol = isMac ? '⌘' : 'Ctrl';
  
  // Build shortcuts list
  Object.entries(KEYBOARD_SHORTCUTS).forEach(([name, shortcut]) => {
    const item = document.createElement('div');
    item.className = 'graytool-shortcut-item';
    
    const description = document.createElement('div');
    description.className = 'graytool-shortcut-description';
    description.textContent = shortcut.description;
    
    const keys = document.createElement('div');
    keys.className = 'graytool-shortcut-keys';
    
    // Parse shortcut name
    const parts = name.split('+');
    parts.forEach(part => {
      const key = document.createElement('span');
      key.className = 'graytool-shortcut-key';
      
      if (part === 'CMD') {
        key.textContent = cmdSymbol;
      } else if (part === 'SHIFT') {
        key.textContent = '⇧';
      } else if (part === 'ESC') {
        key.textContent = 'Esc';
      } else {
        key.textContent = part;
      }
      
      keys.appendChild(key);
    });
    
    item.appendChild(description);
    item.appendChild(keys);
    content.appendChild(item);
  });
  
  const footer = document.createElement('div');
  footer.className = 'graytool-shortcuts-footer';
  footer.textContent = 'Press Cmd+/ or Esc to close';
  
  popup.appendChild(header);
  popup.appendChild(content);
  popup.appendChild(footer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Close handlers
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });
  
  console.log("GrayTool: Keyboard shortcuts help shown");
}

// JSON formatter with interactive expand/collapse functionality
function formatJSON(obj, indent = 0, path = '') {
  const spaces = '  '.repeat(indent);
  const uniqueId = Math.random().toString(36).substring(2, 9);
  
  if (obj === null) {
    return `<span class="json-null">null</span>`;
  }
  
  if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  }
  
  if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  }
  
  if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '<span class="json-punctuation">[]</span>';
    }
    
    const containerId = `array-${uniqueId}`;
    const toggleId = `toggle-${uniqueId}`;
    
    const items = obj.map((item, index) => 
      `${spaces}  ${formatJSON(item, indent + 1, `${path}[${index}]`)}`
    ).join('<span class="json-punctuation">,</span>\n');
    
    return `<span class="json-toggle" data-container="${containerId}" data-toggle="${toggleId}">▼</span><span class="json-punctuation">[</span><span class="json-length"> // ${obj.length} items</span>
<div id="${containerId}" class="json-collapsible">${items}</div>
${spaces}<span class="json-punctuation">]</span>`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-punctuation">{}</span>';
    }
    
    const containerId = `object-${uniqueId}`;
    const toggleId = `toggle-${uniqueId}`;
    
    const items = keys.map(key => {
      const value = obj[key];
      const valueType = typeof value;
      const fullPath = path ? `${path}.${key}` : key;
      
      // Make key and primitive values clickable for filtering
      const clickableKey = `<span class="json-key json-key-clickable" data-field-name="${escapeHtml(key)}" data-field-path="${escapeHtml(fullPath)}">"${escapeHtml(key)}"</span>`;
      
      let formattedValue;
      if (value === null || valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
        const valueStr = formatJSON(value, indent + 1, fullPath);
        formattedValue = `<span class="json-value-clickable" data-field-name="${escapeHtml(key)}" data-field-value="${escapeHtml(String(value))}" data-field-path="${escapeHtml(fullPath)}">${valueStr}</span>`;
      } else {
        formattedValue = formatJSON(value, indent + 1, fullPath);
      }
      
      return `${spaces}  ${clickableKey}<span class="json-punctuation">:</span> ${formattedValue}`;
    }).join('<span class="json-punctuation">,</span>\n');
    
    return `<span class="json-toggle" data-container="${containerId}" data-toggle="${toggleId}">▼</span><span class="json-punctuation">{</span><span class="json-length"> // ${keys.length} keys</span>
<div id="${containerId}" class="json-collapsible">${items}</div>
${spaces}<span class="json-punctuation">}</span>`;
  }
  
  return escapeHtml(String(obj));
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle Quick Actions
function handleQuickAction(action, rawContent, parsedContent) {
  console.log("GrayTool: Executing quick action:", action);
  
  switch (action) {
    case 'jira':
      handleJiraTicket(rawContent, parsedContent);
      break;
    case 'ai':
      handleAIAnalysis(rawContent, parsedContent);
      break;
    case 'permalink':
      handlePermalink(rawContent, parsedContent);
      break;
    default:
      console.log("GrayTool: Unknown action:", action);
  }
}

// JIRA Ticket Creation
function handleJiraTicket(rawContent, parsedContent) {
  const summary = extractErrorSummary(parsedContent);
  const timestamp = parsedContent.timestamp || parsedContent.time || new Date().toISOString();
  const level = parsedContent.level_name || parsedContent.level || "UNKNOWN";
  const source = parsedContent.source || parsedContent.logger_name || "N/A";
  
  // Create structured JIRA ticket template
  const jiraTemplate = `
*Summary:* ${summary}

*Description:*
{code:json}
${rawContent.substring(0, 2000)}${rawContent.length > 2000 ? '\n... (truncated)' : ''}
{code}

*Details:*
* *Timestamp:* ${timestamp}
* *Level:* ${level}
* *Source:* ${source}
* *Log Link:* ${window.location.href}

*Steps to Reproduce:*
1. [Add steps]
2. [Add steps]

*Expected Behavior:*
[Describe expected behavior]

*Actual Behavior:*
[Describe actual behavior]

*Additional Context:*
[Add any additional context]
`.trim();

  // Show JIRA template popup
  showJiraTemplatePopup(jiraTemplate, summary);
  console.log("GrayTool: Showing JIRA ticket template");
}

// AI Analysis
function handleAIAnalysis(rawContent, parsedContent) {
  // Placeholder for AI analysis - can be integrated with OpenAI/Claude API
  const analysisPrompt = `Please analyze this log entry and provide:
1. Error classification
2. Possible root cause
3. Suggested solutions
4. Severity level

Log: ${rawContent.substring(0, 500)}`;
  
  // Copy the analysis prompt to clipboard
  copyToClipboard(analysisPrompt).then(() => {
    showNotification("AI Analysis prompt copied to clipboard! Paste it into ChatGPT/Claude.", "info");
    console.log("GrayTool: AI analysis prompt copied to clipboard");
  }).catch((error) => {
    console.error("GrayTool: Failed to copy AI prompt:", error);
    showNotification("Failed to copy AI prompt to clipboard", "error");
  });
}

// Permalink Generation
function handlePermalink(rawContent, parsedContent) {
  const timestamp = parsedContent.timestamp || parsedContent.time || new Date().toISOString();
  const logId = parsedContent.id || generateLogId(rawContent);
  
  // Generate a shareable link (customize based on your Graylog setup)
  const permalink = `${window.location.origin}${window.location.pathname}#log=${logId}&time=${timestamp}`;
  
  copyToClipboard(permalink).then(() => {
    showNotification("Permalink copied to clipboard!", "success");
    console.log("GrayTool: Permalink copied:", permalink);
  }).catch((error) => {
    console.error("GrayTool: Failed to copy permalink:", error);
    showNotification("Failed to copy permalink to clipboard", "error");
  });
}

// Helper functions
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject);
    } else {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        resolve();
      } catch (err) {
        reject(err);
      }
    }
  });
}

function extractErrorSummary(parsedContent) {
  const message = parsedContent.message || parsedContent.msg || "Log Entry";
  const level = parsedContent.level_name || parsedContent.level || "INFO";
  return `[${level}] ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
}

function generateLogId(content) {
  return btoa(content.substring(0, 50)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
}

function showNotification(message, type = "info") {
  const notification = document.createElement('div');
  notification.className = `graytool-notification graytool-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Show JIRA Template Popup
function showJiraTemplatePopup(template, summary) {
  const overlay = document.createElement('div');
  overlay.className = 'graytool-popup-overlay';
  
  const popupContent = document.createElement('div');
  popupContent.className = 'graytool-popup-content';
  popupContent.style.maxWidth = '700px';
  
  const header = document.createElement('div');
  header.className = 'graytool-popup-header';
  
  const title = document.createElement('div');
  title.className = 'graytool-popup-title';
  title.textContent = '🎫 JIRA Ticket Template';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  
  const copyButton = document.createElement('button');
  copyButton.className = 'graytool-copy-btn';
  copyButton.textContent = 'Copy Template';
  copyButton.style.minWidth = '120px';
  copyButton.style.height = '32px';
  
  const openJiraButton = document.createElement('button');
  openJiraButton.className = 'graytool-copy-btn';
  openJiraButton.textContent = 'Open JIRA';
  openJiraButton.style.minWidth = '100px';
  openJiraButton.style.height = '32px';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'graytool-close-btn';
  closeButton.textContent = 'Close';
  closeButton.style.minWidth = '80px';
  closeButton.style.height = '32px';
  
  buttonContainer.appendChild(copyButton);
  buttonContainer.appendChild(openJiraButton);
  buttonContainer.appendChild(closeButton);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  
  const instructionsDiv = document.createElement('div');
  instructionsDiv.style.cssText = `
    background: #2d2d2d;
    border: 1px solid #404040;
    border-radius: 4px;
    padding: 12px;
    margin: 10px 0;
    color: #d4d4d4;
    font-size: 13px;
  `;
  instructionsDiv.innerHTML = `
    <strong>📋 Instructions:</strong><br>
    1. Click "Copy Template" to copy the JIRA ticket content<br>
    2. Click "Open JIRA" to go to your JIRA instance<br>
    3. Create a new issue and paste the template
  `;
  
  const templateContainer = document.createElement('div');
  templateContainer.className = 'graytool-json-container';
  templateContainer.style.whiteSpace = 'pre-wrap';
  templateContainer.style.maxHeight = '400px';
  templateContainer.style.overflowY = 'auto';
  templateContainer.textContent = template;
  
  popupContent.appendChild(header);
  popupContent.appendChild(instructionsDiv);
  popupContent.appendChild(templateContainer);
  overlay.appendChild(popupContent);
  document.body.appendChild(overlay);
  
  // Event handlers
  copyButton.addEventListener('click', () => {
    copyToClipboard(template).then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => copyButton.textContent = 'Copy Template', 2000);
      showNotification("JIRA template copied to clipboard!", "success");
    }).catch(() => {
      showNotification("Failed to copy template", "error");
    });
  });
  
  openJiraButton.addEventListener('click', () => {
    // Load JIRA URL from config or use default
    chrome.storage.sync.get(['jiraUrl'], (result) => {
      const jiraUrl = result.jiraUrl || 'https://your-company.atlassian.net';
      window.open(jiraUrl + '/secure/CreateIssue!default.jspa', '_blank');
    });
  });
  
  closeButton.addEventListener('click', () => {
    if (overlay && overlay.parentNode) {
      document.body.removeChild(overlay);
    }
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }
  });
  
  // ESC key support
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// Helper function to get value from parsed content by field name
function getValueFromParsedContent(obj, fieldName) {
  if (!obj || typeof obj !== 'object') return null;
  
  // Direct property access
  if (obj.hasOwnProperty(fieldName)) {
    const value = obj[fieldName];
    // Convert to string for filtering (but keep original type info)
    if (value === null) return 'null';
    if (typeof value === 'object') return null; // Don't filter complex objects
    return String(value);
  }
  
  // Search in nested objects (shallow search only)
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
      if (obj[key].hasOwnProperty(fieldName)) {
        const value = obj[key][fieldName];
        if (value === null) return 'null';
        if (typeof value === 'object') return null;
        return String(value);
      }
    }
  }
  
  return null;
}

// Smart Filter Generator - Context Menu
function showFilterContextMenu(event, fieldName, fieldValue, fieldPath) {
  event.preventDefault();
  
  // Remove existing context menu
  const existingMenu = document.querySelector('.graytool-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Create context menu
  const menu = document.createElement('div');
  menu.className = 'graytool-context-menu';
  menu.style.left = event.pageX + 'px';
  menu.style.top = event.pageY + 'px';
  
  // Prepare display values
  const displayValue = fieldValue ? (fieldValue.length > 20 ? fieldValue.substring(0, 20) + '...' : fieldValue) : '';
  
  // Menu items
  const menuItems = [
    {
      icon: '🔍',
      label: fieldValue ? `Filter by: ${fieldName} = ${displayValue}` : `Filter by: ${fieldName}`,
      action: () => applyGraylogFilter(fieldName, fieldValue, 'include'),
      disabled: !fieldValue
    },
    {
      icon: '🚫',
      label: fieldValue ? `Exclude: ${fieldName} = ${displayValue}` : `Exclude: ${fieldName}`,
      action: () => applyGraylogFilter(fieldName, fieldValue, 'exclude'),
      disabled: !fieldValue
    },
    { separator: true },
    {
      icon: '📋',
      label: 'Copy field name',
      action: () => {
        copyToClipboard(fieldName).then(() => {
          showNotification(`Copied: ${fieldName}`, 'success');
        });
      }
    },
    {
      icon: '📄',
      label: 'Copy value',
      action: () => {
        copyToClipboard(String(fieldValue)).then(() => {
          showNotification(`Copied: ${fieldValue}`, 'success');
        });
      },
      disabled: !fieldValue
    },
    {
      icon: '🔗',
      label: 'Copy as query',
      action: () => {
        const query = generateGraylogQuery(fieldName, fieldValue, 'include');
        copyToClipboard(query).then(() => {
          showNotification('Query copied to clipboard!', 'success');
        });
      },
      disabled: !fieldValue
    }
  ];
  
  // Build menu
  menuItems.forEach(item => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.className = 'graytool-context-menu-separator';
      menu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.className = 'graytool-context-menu-item' + (item.disabled ? ' disabled' : '');
      menuItem.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
      
      if (!item.disabled) {
        menuItem.addEventListener('click', () => {
          item.action();
          menu.remove();
        });
      }
      
      menu.appendChild(menuItem);
    }
  });
  
  document.body.appendChild(menu);
  
  // Close menu on outside click
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
  
  console.log("GrayTool: Context menu shown for field:", fieldName);
}

// Generate Graylog query syntax
function generateGraylogQuery(fieldName, fieldValue, type = 'include') {
  if (!fieldValue) return '';
  
  let query;
  const needsQuotes = String(fieldValue).includes(' ') || String(fieldValue).includes(':');
  const formattedValue = needsQuotes ? `"${fieldValue}"` : fieldValue;
  
  if (type === 'exclude') {
    query = `NOT ${fieldName}:${formattedValue}`;
  } else {
    query = `${fieldName}:${formattedValue}`;
  }
  
  return query;
}

// Apply filter to Graylog search
function applyGraylogFilter(fieldName, fieldValue, type = 'include') {
  const query = generateGraylogQuery(fieldName, fieldValue, type);
  
  if (!query) {
    showNotification('No value to filter', 'error');
    return;
  }
  
  // Try to find Graylog search input
  const searchInput = document.querySelector('input[placeholder*="Search"]') || 
                      document.querySelector('input[type="search"]') ||
                      document.querySelector('.query-input input') ||
                      document.querySelector('[data-testid="search-input"]');
  
  if (searchInput) {
    // Get existing query
    const existingQuery = searchInput.value.trim();
    
    // Combine with AND if there's existing query
    const newQuery = existingQuery ? `${existingQuery} AND ${query}` : query;
    
    // Set new query
    searchInput.value = newQuery;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    showNotification(`Filter applied: ${query}`, 'success');
    console.log("GrayTool: Applied filter:", query);
  } else {
    // Fallback: copy to clipboard
    copyToClipboard(query).then(() => {
      showNotification('Query copied! Paste in Graylog search.', 'info');
    });
  }
}

// Log Context Viewer
function showLogContextViewer(parsedContent, rawContent) {
  console.log("GrayTool: Showing Log Context Viewer");
  
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'graytool-popup-overlay';
  
  const popupContent = document.createElement('div');
  popupContent.className = 'graytool-popup-content';
  popupContent.style.maxWidth = '900px';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'graytool-popup-header';
  
  const title = document.createElement('div');
  title.className = 'graytool-popup-title';
  title.textContent = '📊 Log Context Viewer';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'graytool-close-btn';
  closeButton.textContent = 'Close';
  closeButton.style.minWidth = '80px';
  closeButton.style.height = '32px';
  
  buttonContainer.appendChild(closeButton);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  
  // Create context viewer container
  const contextViewer = document.createElement('div');
  contextViewer.className = 'graytool-context-viewer';
  
  // Show loading state
  contextViewer.innerHTML = '<div class="graytool-context-loading">🔄 Loading context logs...</div>';
  
  // Assemble popup
  popupContent.appendChild(header);
  popupContent.appendChild(contextViewer);
  overlay.appendChild(popupContent);
  document.body.appendChild(overlay);
  
  // Close button handler
  closeButton.addEventListener('click', () => {
    if (overlay && overlay.parentNode) {
      document.body.removeChild(overlay);
    }
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }
  });
  
  // ESC key support
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  // Fetch context logs
  fetchContextLogs(parsedContent, rawContent).then(contextData => {
    renderContextViewer(contextViewer, contextData, parsedContent);
  }).catch(error => {
    console.error("GrayTool: Failed to fetch context logs:", error);
    contextViewer.innerHTML = `
      <div class="graytool-context-error">
        <strong>⚠️ Failed to fetch context logs</strong><br>
        ${error.message || 'Unable to load surrounding logs from Graylog'}
      </div>
    `;
  });
}

// Fetch context logs from Graylog
async function fetchContextLogs(parsedContent, rawContent) {
  // Extract timestamp from parsed content
  const timestamp = parsedContent.timestamp || parsedContent.time || parsedContent['@timestamp'];
  
  if (!timestamp) {
    throw new Error('No timestamp found in log entry');
  }
  
  // For now, return mock data (will integrate with actual Graylog API later)
  // In production, this would fetch from Graylog's API
  return generateMockContextLogs(parsedContent, timestamp);
}

// Generate mock context logs for demonstration
function generateMockContextLogs(currentLog, timestamp) {
  const logs = [];
  const currentTime = new Date(timestamp).getTime();
  
  // Generate 5 logs before
  for (let i = 5; i > 0; i--) {
    logs.push({
      timestamp: new Date(currentTime - (i * 10000)).toISOString(),
      level: ['INFO', 'DEBUG', 'WARN'][Math.floor(Math.random() * 3)],
      message: `Log entry ${i} before current log`,
      source: currentLog.source || 'app',
      isCurrent: false
    });
  }
  
  // Add current log
  logs.push({
    timestamp: timestamp,
    level: currentLog.level_name || currentLog.level || 'INFO',
    message: currentLog.message || currentLog.msg || 'Current log entry',
    source: currentLog.source || 'app',
    isCurrent: true
  });
  
  // Generate 5 logs after
  for (let i = 1; i <= 5; i++) {
    logs.push({
      timestamp: new Date(currentTime + (i * 10000)).toISOString(),
      level: ['INFO', 'DEBUG'][Math.floor(Math.random() * 2)],
      message: `Log entry ${i} after current log`,
      source: currentLog.source || 'app',
      isCurrent: false
    });
  }
  
  return {
    before: logs.slice(0, 5),
    current: logs[5],
    after: logs.slice(6)
  };
}

// Render context viewer with logs
function renderContextViewer(container, contextData, originalLog) {
  container.innerHTML = '';
  
  // Before section
  if (contextData.before && contextData.before.length > 0) {
    const beforeSection = document.createElement('div');
    beforeSection.className = 'graytool-context-section';
    beforeSection.innerHTML = '<div class="graytool-context-header">⬆️ Before (5 logs)</div>';
    
    contextData.before.forEach(log => {
      beforeSection.appendChild(createLogEntry(log));
    });
    
    container.appendChild(beforeSection);
  }
  
  // Current log section
  const currentSection = document.createElement('div');
  currentSection.className = 'graytool-context-section';
  currentSection.innerHTML = '<div class="graytool-context-header">📍 Current Log</div>';
  currentSection.appendChild(createLogEntry(contextData.current));
  container.appendChild(currentSection);
  
  // After section
  if (contextData.after && contextData.after.length > 0) {
    const afterSection = document.createElement('div');
    afterSection.className = 'graytool-context-section';
    afterSection.innerHTML = '<div class="graytool-context-header">⬇️ After (5 logs)</div>';
    
    contextData.after.forEach(log => {
      afterSection.appendChild(createLogEntry(log));
    });
    
    container.appendChild(afterSection);
  }
}

// Create a log entry element
function createLogEntry(log) {
  const logDiv = document.createElement('div');
  logDiv.className = 'graytool-context-log' + (log.isCurrent ? ' current' : '');
  
  const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  logDiv.innerHTML = `
    <div>
      <span class="graytool-context-log-time">${timeStr}</span>
      <span class="graytool-context-log-level ${log.level}">${log.level}</span>
      ${log.source ? `<span style="color: #9cdcfe;">[${log.source}]</span>` : ''}
    </div>
    <div class="graytool-context-log-message">${escapeHtml(log.message)}</div>
  `;
  
  // Make log clickable to show details
  if (!log.isCurrent) {
    logDiv.addEventListener('click', () => {
      showNotification('Clicked on context log - detail view coming soon!', 'info');
    });
  }
  
  return logDiv;
}

// Generate Info Tab Content
function generateInfoTabContent(parsedContent) {
  const isMac = navigator.platform.includes('Mac');
  const cmdSymbol = isMac ? '⌘' : 'Ctrl';
  
  return `
    <div class="graytool-info-section">
      <div class="graytool-info-title">⌨️ Keyboard Shortcuts</div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Quick Search (focus search input)</div>
        <div class="graytool-info-value">${cmdSymbol}+K</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Copy current log as JSON</div>
        <div class="graytool-info-value">${cmdSymbol}+Shift+C</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Export current log</div>
        <div class="graytool-info-value">${cmdSymbol}+E</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Show keyboard shortcuts help</div>
        <div class="graytool-info-value">${cmdSymbol}+/</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Close popup</div>
        <div class="graytool-info-value">Esc</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Toggle filter menu</div>
        <div class="graytool-info-value">${cmdSymbol}+Shift+F</div>
      </div>
      
      <div class="graytool-info-description">
        💡 <strong>Tip:</strong> Use these keyboard shortcuts to navigate Graylog faster. 
        Press ${cmdSymbol}+/ anywhere to see the full shortcuts help popup.
      </div>
    </div>
    
    <div class="graytool-info-section">
      <div class="graytool-info-title">🎯 Smart Filter Generator</div>
      
      <div class="graytool-info-description">
        <strong>Right-click</strong> on any JSON field name or value in the JSON View tab to:
        <br><br>
        • 🔍 <strong>Filter by:</strong> Add field to Graylog search query<br>
        • 🚫 <strong>Exclude:</strong> Exclude field from results<br>
        • 📋 <strong>Copy:</strong> Copy field name or value<br>
        • 🔗 <strong>Copy as query:</strong> Generate Graylog query syntax<br>
        <br>
        Example: Right-click on "level": "ERROR" → Filter by: level = ERROR
      </div>
    </div>
    
    <div class="graytool-info-section">
      <div class="graytool-info-title">📊 Log Context Viewer</div>
      
      <div class="graytool-info-description">
        Click the <strong>📊 Context</strong> button to view surrounding logs:
        <br><br>
        • ⬆️ <strong>Before:</strong> 5 logs before current log<br>
        • 📍 <strong>Current:</strong> Highlighted current log<br>
        • ⬇️ <strong>After:</strong> 5 logs after current log<br>
        <br>
        Helps understand the context and timeline of events.
      </div>
    </div>
    
    <div class="graytool-info-section">
      <div class="graytool-info-title">🎫 Quick Actions</div>
      
      <div class="graytool-info-description">
        Click <strong>Quick Actions ▼</strong> to access:
        <br><br>
        • 🎫 <strong>Create JIRA Ticket:</strong> Generate pre-filled JIRA ticket template<br>
        • 🤖 <strong>AI Analyse:</strong> Copy structured prompt for AI analysis<br>
        • 🔗 <strong>Copy Permalink:</strong> Generate shareable log link<br>
        <br>
        Configure JIRA URL in extension settings for direct integration.
      </div>
    </div>
    
    <div class="graytool-info-section">
      <div class="graytool-info-title">ℹ️ About GrayTool</div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Version</div>
        <div class="graytool-info-value">1.0.0</div>
      </div>
      
      <div class="graytool-info-item">
        <div class="graytool-info-label">Developer</div>
        <div class="graytool-info-value">Emre Bozkurt</div>
      </div>
      
      <div class="graytool-info-description">
        GrayTool is a powerful Chrome extension that enhances your Graylog experience 
        with advanced features like Smart Filters, Context Viewer, Keyboard Shortcuts, 
        and Quick Actions. Built to boost developer productivity and streamline log analysis.
      </div>
    </div>
  `;
}

// Toggle function for JSON nodes (removed - now using event delegation)

// Show message detail popup
function showMessageDetailPopup(messageText) {
  console.log("GrayTool: Showing message detail popup for:", messageText.substring(0, 100) + "...");
  
  // Parse message content
  let parsedContent;
  let rawContent = messageText;
  
  // Store for keyboard shortcuts
  currentOpenPopup = { rawContent, parsedContent: null };
  
  try {
    if (messageText.startsWith('{') && messageText.endsWith('}')) {
      parsedContent = JSON.parse(messageText);
    } else {
      parsedContent = { message: messageText };
    }
  } catch (e) {
    parsedContent = { 
      error: "Failed to parse JSON", 
      rawMessage: messageText 
    };
  }
  
  // Update stored parsed content
  currentOpenPopup.parsedContent = parsedContent;
  
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'graytool-popup-overlay';
  
  // Create popup content
  const popupContent = document.createElement('div');
  popupContent.className = 'graytool-popup-content';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'graytool-popup-header';
  
  const title = document.createElement('div');
  title.className = 'graytool-popup-title';
  title.textContent = '📋 Raw Data';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.alignItems = 'center';
  
  const copyButton = document.createElement('button');
  copyButton.className = 'graytool-copy-btn';
  copyButton.textContent = 'Copy';
  copyButton.style.minWidth = '80px';
  copyButton.style.height = '32px';
  
  const quickActionsButton = document.createElement('button');
  quickActionsButton.className = 'graytool-quick-actions-btn';
  quickActionsButton.textContent = 'Quick Actions ▼';
  quickActionsButton.style.minWidth = '120px';
  quickActionsButton.style.height = '32px';
  
  const contextButton = document.createElement('button');
  contextButton.className = 'graytool-context-btn';
  contextButton.textContent = 'Context';
  contextButton.style.minWidth = '100px';
  contextButton.style.height = '32px';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'graytool-close-btn';
  closeButton.textContent = 'Close';
  closeButton.style.minWidth = '80px';
  closeButton.style.height = '32px';
  
  buttonContainer.appendChild(copyButton);
  buttonContainer.appendChild(quickActionsButton);
  buttonContainer.appendChild(contextButton);
  buttonContainer.appendChild(closeButton);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  
  // Create Quick Actions dropdown
  const quickActionsDropdown = document.createElement('div');
  quickActionsDropdown.className = 'graytool-quick-actions-dropdown';
  quickActionsDropdown.style.display = 'none'; // Hidden by default
  
  // Create action buttons
  const jiraButton = document.createElement('button');
  jiraButton.className = 'graytool-action-btn';
  jiraButton.textContent = '🎫 Create JIRA Ticket';
  jiraButton.setAttribute('data-action', 'jira');
  
  const aiButton = document.createElement('button');
  aiButton.className = 'graytool-action-btn';
  aiButton.textContent = '🤖 AI Analyse';
  aiButton.setAttribute('data-action', 'ai');
  
  const permalinkButton = document.createElement('button');
  permalinkButton.className = 'graytool-action-btn';
  permalinkButton.textContent = '🔗 Copy Permalink';
  permalinkButton.setAttribute('data-action', 'permalink');
  
  quickActionsDropdown.appendChild(jiraButton);
  quickActionsDropdown.appendChild(aiButton);
  quickActionsDropdown.appendChild(permalinkButton);
  
  // Create JSON container
  const jsonContainer = document.createElement('div');
  jsonContainer.className = 'graytool-json-container';
  jsonContainer.innerHTML = formatJSON(parsedContent);
  
  // Assemble popup
  popupContent.appendChild(header);
  popupContent.appendChild(quickActionsDropdown);
  popupContent.appendChild(jsonContainer);
  overlay.appendChild(popupContent);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Add button functionality using event delegation
  header.addEventListener('click', (e) => {
    if (e.target.classList.contains('graytool-copy-btn')) {
      copyToClipboard(rawContent).then(() => {
        e.target.textContent = 'Copied!';
        setTimeout(() => e.target.textContent = 'Copy', 2000);
        showNotification("Content copied to clipboard!", "success");
        console.log("GrayTool: Copied content to clipboard");
      }).catch((error) => {
        console.error("GrayTool: Failed to copy to clipboard:", error);
        showNotification("Failed to copy to clipboard", "error");
      });
    } else if (e.target.classList.contains('graytool-quick-actions-btn')) {
      // Toggle Quick Actions dropdown
      const isVisible = quickActionsDropdown.style.display !== 'none';
      quickActionsDropdown.style.display = isVisible ? 'none' : 'block';
      e.target.textContent = isVisible ? 'Quick Actions ▼' : 'Quick Actions ▲';
      console.log("GrayTool: Toggled Quick Actions dropdown:", !isVisible ? 'opened' : 'closed');
    } else if (e.target.classList.contains('graytool-context-btn')) {
      // Show Log Context Viewer
      showLogContextViewer(parsedContent, rawContent);
      console.log("GrayTool: Opened Log Context Viewer");
    } else if (e.target.classList.contains('graytool-close-btn')) {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
        console.log("GrayTool: Closed popup");
      }
      document.removeEventListener('keydown', handleEscapeKey);
    }
  });
  
  // Add Quick Actions functionality
  quickActionsDropdown.addEventListener('click', (e) => {
    if (e.target.classList.contains('graytool-action-btn')) {
      const action = e.target.getAttribute('data-action');
      handleQuickAction(action, rawContent, parsedContent);
    }
  });
  
  // Add JSON toggle functionality using event delegation
  jsonContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('json-toggle')) {
      const containerId = e.target.getAttribute('data-container');
      const container = document.getElementById(containerId);
      
      if (container) {
        const isCollapsed = container.style.display === 'none';
        container.style.display = isCollapsed ? 'block' : 'none';
        e.target.textContent = isCollapsed ? '▼' : '▶';
        
        console.log("GrayTool: Toggled JSON node:", containerId, isCollapsed ? 'expanded' : 'collapsed');
      }
    }
  });
  
  // Add Smart Filter context menu for JSON fields
  jsonContainer.addEventListener('contextmenu', (e) => {
    // Check if right-click is on a clickable key or value
    if (e.target.classList.contains('json-key-clickable') || e.target.classList.contains('json-value-clickable')) {
      const fieldName = e.target.getAttribute('data-field-name');
      let fieldValue = e.target.getAttribute('data-field-value');
      const fieldPath = e.target.getAttribute('data-field-path');
      
      // If key was clicked (no value), try to get value from parsedContent
      if (!fieldValue && fieldName && parsedContent) {
        fieldValue = getValueFromParsedContent(parsedContent, fieldName);
      }
      
      showFilterContextMenu(e, fieldName, fieldValue, fieldPath);
    }
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
        console.log("GrayTool: Popup closed by overlay click");
      }
      document.removeEventListener('keydown', handleEscapeKey);
    }
  });
  
  // Close on ESC key press
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
        console.log("GrayTool: Popup closed with ESC key");
      }
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  
  document.addEventListener('keydown', handleEscapeKey);
}

// Extract message content from log row
function extractMessageFromRow(row) {
  console.log("GrayTool: Extracting message from row:", row);
  
  // First try to find the specific message field in Graylog expanded view
  const messageFieldHeader = row.querySelector('[data-testid="message-field-name-message"]');
  if (messageFieldHeader) {
    console.log("GrayTool: Found message field header:", messageFieldHeader);
    
    // Try to find the corresponding content
    // Method 1: Next sibling (usually <dd> after <dt>)
    let messageContent = messageFieldHeader.nextElementSibling;
    if (messageContent && messageContent.innerText.trim()) {
      const content = messageContent.innerText.trim();
      console.log("GrayTool: Found message content via nextSibling, length:", content.length);
      if (content.length > 10) { // Avoid empty or very short content
        return content;
      }
    }
    
    // Method 2: Look for <dd> in parent
    const parent = messageFieldHeader.parentElement;
    if (parent) {
      const ddElement = parent.querySelector('dd');
      if (ddElement && ddElement.innerText.trim()) {
        const content = ddElement.innerText.trim();
        console.log("GrayTool: Found message content via dd element, length:", content.length);
        if (content.length > 10) {
          return content;
        }
      }
    }
    
    // Method 3: Look for any content element near the message field
    const nearbySelectors = [
      '[data-testid*="message-field-content"]',
      '[data-testid*="message"] + *',
      '.field-content',
      'pre',
      'code'
    ];
    
    for (const selector of nearbySelectors) {
      const element = parent ? parent.querySelector(selector) : row.querySelector(selector);
      if (element && element.innerText.trim() && element.innerText.trim().length > 10) {
        const content = element.innerText.trim();
        console.log("GrayTool: Found message content via selector:", selector, "length:", content.length);
        return content;
      }
    }
  }
  
  // Fallback: Try other expanded view selectors
  const expandedSelectors = [
    '.message-body pre',        // Raw message in <pre> tag
    '.message-content pre',     // Message content in <pre>
    'pre.message',              // <pre> with message class
    '[data-testid*="message"] pre', // Message in testid with <pre>
    '.field-content pre',       // Field content with <pre>
    'pre',                      // Any <pre> tag (raw content)
    '.message-body',            // Message body div
    '.message-content',         // Message content div
    '.expanded-message',        // Expanded message area
    '.log-message-body',        // Log message body
    '.raw-message'              // Raw message area
  ];
  
  // Try to get full message content first
  for (const selector of expandedSelectors) {
    const msgElement = row.querySelector(selector);
    if (msgElement && msgElement.innerText.trim()) {
      const content = msgElement.innerText.trim();
      console.log("GrayTool: Found message with selector:", selector, "Content length:", content.length);
      
      // If it's a long content or contains JSON, prefer it
      if (content.length > 100 || content.includes('{')) {
        return content;
      }
    }
  }
  
  // Fallback to shorter message selectors
  const shortMessageSelectors = [
    '[data-field="message"]',
    '.message',
    '[data-testid*="message"]'
  ];
  
  for (const selector of shortMessageSelectors) {
    const msgElement = row.querySelector(selector);
    if (msgElement && msgElement.innerText.trim()) {
      const content = msgElement.innerText.trim();
      console.log("GrayTool: Found short message with selector:", selector, "Content:", content.substring(0, 100));
      return content;
    }
  }
  
  // Try to find the longest text content that looks like a message
  const allTextElements = row.querySelectorAll('*');
  let longestContent = '';
  
  Array.from(allTextElements).forEach(el => {
    const text = el.innerText;
    if (text && text.length > longestContent.length) {
      // Skip if it's just navigation or UI text
      if (!text.includes('timestamp') && !text.includes('source') && 
          (text.includes('{') || text.length > 50)) {
        longestContent = text;
      }
    }
  });
  
  if (longestContent) {
    console.log("GrayTool: Using longest content, length:", longestContent.length);
    return longestContent.substring(0, 5000); // Limit to 5KB
  }
  
  // Final fallback - try to find JSON in any text content
  const textContent = row.innerText;
  const jsonMatch = textContent.match(/\{.*\}/s);
  if (jsonMatch) {
    console.log("GrayTool: Found JSON match in text content");
    return jsonMatch[0];
  }
  
  console.log("GrayTool: Using fallback text content");
  return textContent.substring(0, 1000) + (textContent.length > 1000 ? '...' : '');
}

// Add Message Detail button to expanded rows/detail views
function addMessageDetailButton(element) {
  try {
    // Check if element is valid
    if (!element || !element.querySelector || typeof element.querySelector !== 'function') {
      console.log("GrayTool: Invalid element passed to addMessageDetailButton");
      return;
    }
    
    // Check if Message Detail button already exists
    if (element.querySelector('button[data-graytool-message-detail]')) {
      console.log("GrayTool: Message Detail button already exists in detail view, skipping");
      return;
    }
    
    console.log("GrayTool: Adding Message Detail button to expanded view");
  
  // Create Message Detail button
  const messageDetailButton = document.createElement("button");
  messageDetailButton.innerText = "Message detail";
  messageDetailButton.style.marginRight = "5px";
  messageDetailButton.setAttribute('data-graytool-message-detail', 'true');
  
  // Copy styles from existing buttons - look for proper button styles
  let existingButton;
  
  // First try to find buttons in the same btn-group
  const parentBtnGroup = element.querySelector(".btn-group") || element.closest(".btn-group");
  if (parentBtnGroup) {
    existingButton = parentBtnGroup.querySelector("button:not([data-graytool-message-detail]):not([data-graytool-button-id])");
  }
  
  // If not found, try parent elements
  if (!existingButton) {
    let parent = element.parentElement;
    while (parent && !existingButton) {
      const parentBtnGroup = parent.querySelector(".btn-group");
      if (parentBtnGroup) {
        existingButton = parentBtnGroup.querySelector("button:not([data-graytool-message-detail]):not([data-graytool-button-id])");
      }
      parent = parent.parentElement;
    }
  }
  
  // Global search as last resort
  if (!existingButton) {
    existingButton = document.querySelector(".btn-group button:not([data-graytool-message-detail]):not([data-graytool-button-id])");
  }
  
  if (existingButton && existingButton.className) {
    // Copy classes but ensure we don't copy active/selected states
    let classes = existingButton.className;
    classes = classes.replace(/\b(active|selected|focus|pressed)\b/g, '').trim();
    messageDetailButton.className = classes;
    console.log("GrayTool: Copied button styles from existing button:", classes);
  } else {
    // Enhanced fallback with common Graylog button classes
    messageDetailButton.className = "btn btn-sm btn-default";
    console.log("GrayTool: Using fallback button styles");
  }
  
  messageDetailButton.onclick = () => {
    const messageText = extractMessageFromRow(element);
    showMessageDetailPopup(messageText);
  };
  
  // Find btn-group in expanded view
  let btnGroup = element.querySelector(".btn-group");
  
  // Search in parent elements if not found
  if (!btnGroup) {
    let parent = element.parentElement;
    while (parent && !btnGroup) {
      btnGroup = parent.querySelector(".btn-group");
      parent = parent.parentElement;
    }
  }
  
  if (btnGroup) {
    console.log("GrayTool: Found btn-group in expanded view, adding Message Detail button");
    
    // Use same structure as custom buttons
    const existingDiv = btnGroup.querySelector("div:has(button[data-gl-clipboard-button])") || 
                       btnGroup.querySelector("div:has(span[role='button'] button)") ||
                       btnGroup.querySelector("div span[role='button']")?.parentElement;
    
    if (existingDiv) {
      console.log("GrayTool: Found existing structure in expanded view");
      
      const wrapper = document.createElement("div");
      wrapper.className = existingDiv.className;
      
      const span = document.createElement("span");
      span.setAttribute("role", "button");
      
      const existingSpan = existingDiv.querySelector("span");
      if (existingSpan) {
        span.className = existingSpan.className;
      }
      
      messageDetailButton.setAttribute("type", "button");
      span.appendChild(messageDetailButton);
      wrapper.appendChild(span);
      
      btnGroup.insertBefore(wrapper, btnGroup.firstChild);
      console.log("GrayTool: Added Message Detail button to expanded view with wrapper");
    } else {
      btnGroup.insertBefore(messageDetailButton, btnGroup.firstChild);
      console.log("GrayTool: Added Message Detail button directly to expanded view btn-group");
    }
  } else {
    // Create a button container at the top of expanded view
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginBottom = "10px";
    buttonContainer.style.padding = "5px";
    buttonContainer.style.borderBottom = "1px solid #eee";
    buttonContainer.appendChild(messageDetailButton);
    
    if (element.firstChild) {
      element.insertBefore(buttonContainer, element.firstChild);
    } else {
      element.appendChild(buttonContainer);
    }
    console.log("GrayTool: Created button container in expanded view");
  }
  } catch (e) {
    console.log("GrayTool: Error in addMessageDetailButton:", e.message);
  }
}

function parseKeyValuePairs(text) {
  const fields = {};
  if (!text) return fields;
  
  // key=value, key2=value2 formatını parse et
  const matches = text.match(/(\w+)=([^,]+)/g);
  if (matches) {
    matches.forEach(match => {
      const [, key, value] = match.match(/(\w+)=(.+)/);
      if (key && value) {
        fields[key] = value.trim();
      }
    });
  }
  
  return fields;
}

function buildAdminUrl(btn, fields, baseUrl) {
  // Custom URL varsa onu kullan, yoksa environment base URL kullan
  const effectiveBaseUrl = btn.customUrl || baseUrl;
  
  console.log("GrayTool: Building admin URL with:", {
    customUrl: btn.customUrl,
    baseUrl,
    effectiveBaseUrl,
    adminRoute: btn.adminRoute,
    paramMapping: btn.paramMapping,
    fields
  });
  
  const params = [];
  const graylogQueryParts = [];
  
  // Parameter mapping'i işle
  Object.entries(btn.paramMapping).forEach(([key, field]) => {
    console.log("GrayTool: Processing param mapping:", { key, field, fieldValue: fields[field] });
    
    if (!fields[field]) {
      console.log("GrayTool: Field value not found for:", field);
      return;
    }
    
    const fieldValue = fields[field];
    
    // Graylog query syntax: q.fieldName -> q=fieldName:"value" formatında
    if (key.startsWith('q.')) {
      const queryField = key.substring(2); // "q.requestId" -> "requestId"
      graylogQueryParts.push(`${queryField}:"${fieldValue}"`);
      console.log("GrayTool: Added Graylog query part:", `${queryField}:"${fieldValue}"`);
    } else {
      // Normal URL parameter
      params.push(`${key}=${encodeURIComponent(fieldValue)}`);
      console.log("GrayTool: Added normal parameter:", `${key}=${fieldValue}`);
    }
  });
  
  // Graylog query'leri varsa q parametresine ekle
  if (graylogQueryParts.length > 0) {
    const graylogQuery = graylogQueryParts.join(' AND ');
    params.push(`q=${encodeURIComponent(graylogQuery)}`);
    console.log("GrayTool: Built Graylog query:", graylogQuery);
  }
  
  let finalUrl = `${effectiveBaseUrl}${btn.adminRoute}`;
  
  if (params.length > 0) {
    // Final URL'de zaten parametre var mı kontrol et
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}${params.join('&')}`;
  }
  
  console.log("GrayTool: URL Building Debug:", {
    effectiveBaseUrl,
    adminRoute: btn.adminRoute,
    params,
    graylogQueryParts,
    finalUrl
  });
  
  console.log("GrayTool: Final URL:", finalUrl, btn.customUrl ? "(using custom URL)" : "(using environment base URL)");
  
  return finalUrl;
}

function appendButtonsToLogRow(logRow, fields, buttons, baseUrl) {
  console.log("GrayTool: Processing row with fields:", fields);
  console.log("GrayTool: Available buttons:", buttons);
  
  // Add custom buttons
  buttons.forEach(btn => {
    console.log("GrayTool: Checking button:", btn.buttonName, "for route:", btn.graylogRoute);
    
    // Wildcard (*) desteği - eğer * ise tüm rowlara ekle
    if (btn.graylogRoute !== '*' && !fields.route?.includes(btn.graylogRoute)) {
      console.log("GrayTool: Button route check failed. Button route:", btn.graylogRoute, "Field route:", fields.route);
      return;
    }

    // Field'ların hem mevcut olduğunu hem de anlamlı değerlere sahip olduğunu kontrol et
    const hasAll = Object.values(btn.paramMapping).every(fieldName => {
      const fieldValue = fields[fieldName];
      
      // Field yoksa false
      if (!fieldValue) return false;
      
      // Field string ise boş olmamalı
      if (typeof fieldValue === 'string' && fieldValue.trim() === '') return false;
      
      // Field number ise 0 olmamalı (çoğunlukla ID'ler için 0 anlamsız)
      if (fieldValue === '0' || fieldValue === 0) return false;
      
      // Field 'null', 'undefined', 'NaN' string'i ise false
      if (['null', 'undefined', 'NaN'].includes(String(fieldValue).toLowerCase())) return false;
      
      return true;
    });
    
    if (!hasAll) {
      const missingOrInvalid = Object.entries(btn.paramMapping)
        .filter(([key, fieldName]) => {
          const fieldValue = fields[fieldName];
          return !fieldValue || fieldValue === '0' || fieldValue === 0 || 
                 (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                 ['null', 'undefined', 'NaN'].includes(String(fieldValue).toLowerCase());
        })
        .map(([key, fieldName]) => `${fieldName}="${fields[fieldName] || 'missing'}"`);
        
      console.log("GrayTool: Missing or invalid required fields for button:", btn.buttonName, 
                 "Invalid fields:", missingOrInvalid,
                 "Required:", Object.values(btn.paramMapping), 
                 "Available:", Object.keys(fields));
      return;
    }
    
    // Check if this custom button already exists
    const buttonId = `graytool-btn-${btn.buttonName.toLowerCase().replace(/\s+/g, '-')}`;
    if (logRow.querySelector(`button[data-graytool-button-id="${buttonId}"]`)) {
      console.log("GrayTool: Custom button already exists:", btn.buttonName);
      return;
    }

    console.log("GrayTool: Adding button:", btn.buttonName);

    const url = buildAdminUrl(btn, fields, baseUrl);
    const button = document.createElement("button");
    button.innerText = btn.buttonName;
    button.setAttribute('data-graytool-button-id', buttonId);
    
    // Mevcut butonların stillerini kopyala (önce lokal sonra global)
    let existingButton = logRow.querySelector("button, .btn");
    if (!existingButton) {
      // Global olarak herhangi bir buton ara
      existingButton = document.querySelector(".btn-group button, button.btn, .btn");
    }
    
    if (existingButton) {
      // Mevcut butonun sınıflarını kopyala
      button.className = existingButton.className;
    } else {
      // Fallback: temel bootstrap sınıfları
      button.className = "btn btn-sm btn-default";
    }
    
    button.onclick = () => window.open(url, "_blank");

    // Always use btn-group position
    let btnGroup = logRow.querySelector(".btn-group");
    
    // Eğer logRow'da btn-group yoksa, parent elementlerde ara
    if (!btnGroup) {
      let parent = logRow.parentElement;
      while (parent && !btnGroup) {
        btnGroup = parent.querySelector(".btn-group");
        parent = parent.parentElement;
      }
    }
    
    if (btnGroup) {
      console.log("GrayTool: Found btn-group, adding button to it");
      console.log("GrayTool: btn-group HTML:", btnGroup.innerHTML.substring(0, 200) + "...");
      
      // Build'den bağımsız selectors
      const existingDiv = btnGroup.querySelector("div:has(button[data-gl-clipboard-button])") || 
                         btnGroup.querySelector("div:has(span[role='button'] button)") ||
                         btnGroup.querySelector("div span[role='button']")?.parentElement;
      
      if (existingDiv) {
        console.log("GrayTool: Found existing div with classes:", existingDiv.className);
        
        // Mevcut div'in yapısını tam olarak kopyala
        const wrapper = document.createElement("div");
        wrapper.className = existingDiv.className;
        
        const existingSpan = existingDiv.querySelector("span");
        const span = document.createElement("span");
        span.setAttribute("role", "button");
        
        if (existingSpan) {
          span.className = existingSpan.className;
          console.log("GrayTool: Copying span classes:", existingSpan.className);
        } else {
          // Fallback: role="button" attribute'u yeter
          console.log("GrayTool: Using minimal span structure");
        }
        
        // Button styling'i mevcut button'dan al
        const existingButton = existingDiv.querySelector("button");
        if (existingButton) {
          button.className = existingButton.className;
          button.setAttribute("type", "button");
          console.log("GrayTool: Copying button classes:", existingButton.className);
        } else {
          button.className = "btn btn-sm btn-default";
          button.setAttribute("type", "button");
        }
        
        span.appendChild(button);
        wrapper.appendChild(span);
        
        // btn-group içine, mevcut div'in sonrasına ekle
        btnGroup.appendChild(wrapper);
        console.log("GrayTool: Button added to btn-group");
      } else {
        console.log("GrayTool: No existing div found, creating new structure");
        
        // Mevcut link butonlarını bul ve onlardan class'ları al
        const existingLink = btnGroup.querySelector("a");
        
        if (existingLink) {
          // Link gibi direkt btn-group'a ekle
          button.className = existingLink.className;
          button.setAttribute("type", "button");
          btnGroup.appendChild(button);
          console.log("GrayTool: Added button directly to btn-group like existing links");
        } else {
          // Genel yapı oluştur (varsayılan)
          const wrapper = document.createElement("div");
          const span = document.createElement("span");
          span.setAttribute("role", "button");
          
          button.className = "btn btn-sm btn-default";
          button.setAttribute("type", "button");
          
          span.appendChild(button);
          wrapper.appendChild(span);
          btnGroup.appendChild(wrapper);
          console.log("GrayTool: Created generic button structure in btn-group");
        }
      }
    } else {
      console.log("GrayTool: No btn-group found, adding to row end as fallback");
      logRow.appendChild(button);
    }
  });
}

// Global variables for cached config
let cachedButtons = [];
let cachedAdminBaseUrl = "";
let configInitialized = false;

// Initialize configuration once on page load
function initializeConfig() {
  console.log("GrayTool: initializeConfig() called");
  
  if (!chrome || !chrome.storage || !chrome.runtime) {
    console.error("GrayTool: Chrome extension APIs not available");
    return;
  }

  console.log("GrayTool: Chrome APIs available, getting storage...");
  chrome.storage.sync.get(["buttons", "adminBaseUrl", "environments"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("GrayTool: Chrome storage error:", chrome.runtime.lastError);
      return;
    }
    
    console.log("GrayTool: Raw storage result:", result);
    const { buttons, adminBaseUrl, environments = [] } = result;
    
    // Auto-detect environment based on current URL (once!)
    const currentHost = window.location.hostname.toLowerCase();
    const isStaging = currentHost.includes('stage');
    const envType = isStaging ? 'staging' : 'production';
    
    const detectedEnv = environments.find(env => 
      env.name.toLowerCase().includes(envType)
    );
    const defaultEnv = environments.find(env => env.isDefault);
    const finalEnv = detectedEnv || defaultEnv;
    
    // Cache the effective admin base URL
    cachedAdminBaseUrl = finalEnv?.adminBaseUrl || adminBaseUrl || "";
    cachedButtons = buttons || [];
    configInitialized = true;
    
    console.log("GrayTool: Configuration initialized:", {
      currentHost,
      isStaging,
      envType,
      detectedEnv: detectedEnv?.name,
      defaultEnv: defaultEnv?.name,
      finalEnv: finalEnv?.name,
      cachedAdminBaseUrl,
      buttonsCount: cachedButtons.length
    });
    
    // Process existing elements after config is loaded
    processExistingElements();
  });
}

// Process existing log rows and message details
function processExistingElements() {
  console.log("GrayTool: processExistingElements() called, configInitialized:", configInitialized);
  
  if (!configInitialized) {
    console.log("GrayTool: Config not initialized yet, skipping processing");
    return;
  }
  
  const logRows = document.querySelectorAll(".table tr, .log-row");
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  console.log("GrayTool: Found", logRows.length, "log rows and", messageDetails.length, "message details");
  
  // Process normal log rows
  logRows.forEach((row, index) => {
    if (row.dataset.buttonsInjected) {
      console.log("GrayTool: Row", index, "already has buttons injected, skipping");
      return;
    }
    console.log("GrayTool: Processing log row", index);
    processLogRow(row);
  });
  
  // Process message detail pages
  messageDetails.forEach((detail, index) => {
    if (detail.dataset.buttonsInjected) {
      console.log("GrayTool: Detail", index, "already has buttons injected, skipping");
      return;
    }
    console.log("GrayTool: Processing message detail", index);
    processMessageDetail(detail);
  });
}

function processLogRow(row) {
  const fields = {};
  
  // Data-field attributelerini oku
  row.querySelectorAll("[data-field]").forEach(el => {
    if (el.dataset.field) {
      fields[el.dataset.field] = el.innerText.trim();
    }
  });
  
  // Message field'ından JSON parse et (Yeni format)
  const messageElements = row.querySelectorAll("[data-field='message'], .message, [data-testid*='message']");
  messageElements.forEach(msgEl => {
    const messageText = msgEl.innerText.trim();
    
    // JSON formatındaki mesajları parse et
    if (messageText.startsWith("{") && messageText.endsWith("}")) {
      try {
        const parsed = JSON.parse(messageText);
        console.log("GrayTool: Parsed JSON from message:", parsed);
        
        // Recursive function to flatten nested objects
        function flattenObject(obj, prefix = '') {
          Object.entries(obj).forEach(([key, value]) => {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'string' || typeof value === 'number') {
              // String/number değerleri direkt ekle
              fields[key] = String(value); // Sadece key ismi (prefix olmadan)
              if (prefix) fields[fieldName] = String(value); // Full path ile de ekle
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              // Nested object'leri recursive olarak flatten et
              flattenObject(value, fieldName);
            }
          });
        }
        
        // Ana JSON'ı flatten et
        flattenObject(parsed);
        
        // Özel durum: msg field'ı kendisi JSON string ise onu da parse et
        if (parsed.msg && typeof parsed.msg === 'string' && parsed.msg.trim().startsWith('{')) {
          try {
            console.log("GrayTool: msg field contains JSON string, parsing:", parsed.msg.substring(0, 100) + "...");
            const msgJson = JSON.parse(parsed.msg.trim());
            console.log("GrayTool: Parsed JSON from msg field:", msgJson);
            
            // msg içindeki JSON'ı da flatten et
            flattenObject(msgJson, 'msg');
            
            console.log("GrayTool: Fields after parsing msg JSON:", fields);
          } catch (e) {
            console.log("GrayTool: Failed to parse JSON from msg field:", e.message);
          }
        }
        
        // Özel handling: userId bulunamazsa msg içerisinde pattern ara
        if (!fields.userId && parsed.msg) {
          const msgContent = String(parsed.msg);
          console.log("GrayTool: userId not found in main fields, searching in msg:", msgContent);
          
          // msg içerisinde userId pattern'lerini ara
          const userIdPatterns = [
            /userId[=:]\s*(\d+)/i,           // userId=3244 veya userId:3244
            /user[_\s]?id[=:]\s*(\d+)/i,    // user_id=3244 veya user id:3244
            /\buser[=:]\s*(\d+)/i,          // user=3244
            /\bu(\d+)\b/i                   // u3244 format
          ];
          
          for (const pattern of userIdPatterns) {
            const match = msgContent.match(pattern);
            if (match && match[1]) {
              fields.userId = match[1];
              console.log("GrayTool: Found userId in msg:", match[1], "using pattern:", pattern);
              break;
            }
          }
        }
        
        // Benzer şekilde diğer kritik field'lar için de arama yapabiliriz
        if (!fields.deviceId && parsed.msg) {
          const msgContent = String(parsed.msg);
          const deviceIdPatterns = [
            /deviceId[=:]\s*(\d+)/i,
            /device[_\s]?id[=:]\s*(\d+)/i,
            /\bdevice[=:]\s*(\d+)/i,
            /\bd(\d+)\b/i
          ];
          
          for (const pattern of deviceIdPatterns) {
            const match = msgContent.match(pattern);
            if (match && match[1]) {
              fields.deviceId = match[1];
              console.log("GrayTool: Found deviceId in msg:", match[1]);
              break;
            }
          }
        }
        
        console.log("GrayTool: Extracted fields from JSON:", fields);
      } catch (e) {
        console.log("GrayTool: Failed to parse message JSON:", e.message);
        // Fallback: eski key-value parsing
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    } else {
      // Eski format: key-value pairs
      if (messageText.includes("=")) {
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    }
  });
  
  console.log("GrayTool: Final fields for row:", fields);
  appendButtonsToLogRow(row, fields, cachedButtons, cachedAdminBaseUrl);
  row.dataset.buttonsInjected = "true";
}

function processMessageDetail(detail) {
  console.log("GrayTool: Processing message detail");
  
  // Add Message Detail button to expanded row/detail view
  addMessageDetailButton(detail);
  
  const fields = {};
  
  // Mesaj detaylarından field'ları çıkar
  detail.querySelectorAll("[data-field], .field-content").forEach(el => {
    const fieldName = el.dataset.field || el.className.replace("field-content", "").trim();
    if (fieldName) {
      fields[fieldName] = el.innerText.trim();
    }
  });
  
  // JSON mesajları parse et
  const messageElement = detail.querySelector(".message-body, .message-content, [data-testid*='message']");
  if (messageElement && messageElement.innerText) {
    try {
      const messageText = messageElement.innerText.trim();
      if (messageText.startsWith("{") && messageText.endsWith("}")) {
        const parsed = JSON.parse(messageText);
        // Only assign string/number values, ignore complex objects
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            fields[key] = String(value);
          }
        });
      } else {
        const parsedFields = parseKeyValuePairs(messageText);
        Object.assign(fields, parsedFields);
      }
    } catch (e) {
      // JSON parsing failed, fallback to key-value parsing
      const parsedFields = parseKeyValuePairs(messageElement.innerText.trim());
      Object.assign(fields, parsedFields);
    }
  }
  
  appendButtonsToLogRow(detail, fields, cachedButtons, cachedAdminBaseUrl);
  detail.dataset.buttonsInjected = "true";
}

// Monitor log rows for changes
const observer = new MutationObserver(() => {
  // Chrome extension context kontrolü
  if (!chrome || !chrome.storage || !chrome.runtime || chrome.runtime.lastError) {
    console.log("GrayTool: Extension context invalidated, stopping observer");
    observer.disconnect();
    return;
  }

  // Config henüz yüklenmemişse bekle
  if (!configInitialized) {
    return;
  }

  // Log tablo satırları
  const logRows = document.querySelectorAll(".table tr, .log-row");
  
  // Mesaj detay sayfaları (buton grupları burada)
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  try {
    // Normal log satırlarını işle
    logRows.forEach(row => {
      if (row.dataset.buttonsInjected) return;
      processLogRow(row);
    });
    
    // Mesaj detay sayfalarını işle
    messageDetails.forEach(detail => {
      if (detail.dataset.buttonsInjected) return;
      processMessageDetail(detail);
    });
  } catch (error) {
    console.error("GrayTool: Processing error:", error);
  }
});

// Listen for storage changes to update config
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.buttons || changes.adminBaseUrl || changes.environments)) {
      console.log("GrayTool: Storage changed, reinitializing config");
      configInitialized = false;
      initializeConfig();
    }
  });
}

// Debug function to check current state
function debugCurrentState() {
  console.log("=== GrayTool Debug Info ===");
  console.log("Config Initialized:", configInitialized);
  console.log("Cached Buttons:", cachedButtons);
  console.log("Cached Admin Base URL:", cachedAdminBaseUrl);
  console.log("Chrome APIs available:", !!(chrome && chrome.storage && chrome.runtime));
  
  const logRows = document.querySelectorAll(".table tr, .log-row");
  const messageDetails = document.querySelectorAll(".message-detail, .message-details");
  
  console.log("Found log rows:", logRows.length);
  console.log("Found message details:", messageDetails.length);
  
  // Check if any rows already have buttons injected
  const injectedRows = document.querySelectorAll("[data-buttons-injected='true']");
  console.log("Rows with buttons already injected:", injectedRows.length);
  
  console.log("=== End Debug Info ===");
}

// Make debug function available globally for testing
window.debugGrayTool = debugCurrentState;

// Observer for expanded rows/message details
const expandedRowObserver = new MutationObserver((mutations) => {
  try {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          try {
            if (node && node.nodeType === Node.ELEMENT_NODE) {
              // Check for expanded message details
              let expandedElements = [];
              try {
                if (node.querySelectorAll && typeof node.querySelectorAll === 'function') {
                  expandedElements = node.querySelectorAll(".message-detail, .message-details, .expanded-message, [class*='message'][class*='detail']");
                }
              } catch (e) {
                console.log("GrayTool: Error in querySelectorAll:", e.message);
              }
              
              // Also check if the node itself is an expanded element
              try {
                if (node.classList && typeof node.classList.contains === 'function') {
                  const isMessageDetail = node.classList.contains('message-detail') || 
                                        node.classList.contains('message-details') ||
                                        node.classList.contains('expanded-message');
                  
                  const hasMessageDetailClass = node.className && 
                                              typeof node.className === 'string' && 
                                              node.className.includes('message') && 
                                              node.className.includes('detail');
                  
                  if (isMessageDetail || hasMessageDetailClass) {
                    console.log("GrayTool: Detected expanded row/detail:", node);
                    addMessageDetailButton(node);
                  }
                }
              } catch (e) {
                console.log("GrayTool: Error checking node classes:", e.message);
              }
              
              // Check found elements
              try {
                if (expandedElements && expandedElements.length > 0) {
                  Array.from(expandedElements).forEach(element => {
                    console.log("GrayTool: Detected expanded row/detail:", element);
                    addMessageDetailButton(element);
                  });
                }
              } catch (e) {
                console.log("GrayTool: Error processing expanded elements:", e.message);
              }
            }
          } catch (e) {
            console.log("GrayTool: Error processing node:", e.message);
          }
        });
      }
    });
  } catch (e) {
    console.log("GrayTool: Error in expandedRowObserver:", e.message);
  }
});

// Click listener for row expansion detection
document.addEventListener('click', (event) => {
  try {
    const target = event.target;
    
    // Check if clicked element might be an expand button
    if (target && target.classList && typeof target.classList.contains === 'function') {
      const isExpandButton = target.classList.contains('expand') ||
                            target.classList.contains('collapse') ||
                            target.getAttribute('aria-expanded') !== null;
      
      let hasExpandParent = false;
      try {
        hasExpandParent = target.closest('[aria-expanded]') ||
                         target.closest('.expandable') ||
                         target.closest('.collapsible');
      } catch (e) {
        // closest() not supported or other error
      }
      
      if (isExpandButton || hasExpandParent) {
        console.log("GrayTool: Detected potential row expansion click:", target);
        
        // Wait a bit for expansion to complete, then check for new expanded content
        setTimeout(() => {
          try {
            const expandedElements = document.querySelectorAll(".message-detail, .message-details, .expanded-message");
            if (expandedElements && expandedElements.length > 0) {
              Array.from(expandedElements).forEach(element => {
                try {
                  if (element && !element.querySelector('button[data-graytool-message-detail]')) {
                    console.log("GrayTool: Adding Message Detail button to newly expanded content");
                    addMessageDetailButton(element);
                  }
                } catch (e) {
                  console.log("GrayTool: Error adding button to expanded element:", e.message);
                }
              });
            }
          } catch (e) {
            console.log("GrayTool: Error in expansion timeout callback:", e.message);
          }
        }, 500);
      }
    }
  } catch (e) {
    console.log("GrayTool: Error in click listener:", e.message);
  }
}, true);

// Initialize configuration on page load
initializeConfig();

// Chrome extension API'lerinin mevcut olup olmadığını kontrol et
if (chrome && chrome.storage && chrome.runtime) {
  observer.observe(document.body, { childList: true, subtree: true });
  expandedRowObserver.observe(document.body, { childList: true, subtree: true });
  console.log("GrayTool: Content script loaded successfully with expanded row detection");
} else {
  console.error("GrayTool: Chrome extension APIs not available");
}
