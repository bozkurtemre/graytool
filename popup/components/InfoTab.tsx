import React from "react";

export default function InfoTab() {
  const isMac = navigator.platform.includes('Mac');
  const cmdSymbol = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Keyboard Shortcuts Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3 text-base flex items-center gap-2">
          ⌨️ Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Quick Search (focus search input)</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              {cmdSymbol}+K
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Copy current log as JSON</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              {cmdSymbol}+Shift+C
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Export current log</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              {cmdSymbol}+E
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Show keyboard shortcuts help</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              {cmdSymbol}+/
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Close popup</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              Esc
            </kbd>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Toggle filter menu</span>
            <kbd className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs font-mono">
              {cmdSymbol}+Shift+F
            </kbd>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          💡 <strong>Tip:</strong> Use these keyboard shortcuts to navigate Graylog faster. 
          Press {cmdSymbol}+/ anywhere to see the full shortcuts help popup.
        </div>
      </div>

      {/* Smart Filter Generator Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3 text-base flex items-center gap-2">
          🎯 Smart Filter Generator
        </h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Right-click</strong> on any JSON field name or value in the message detail popup to:
          </p>
          <ul className="list-none space-y-1 ml-4">
            <li>• 🔍 <strong>Filter by:</strong> Add field to Graylog search query</li>
            <li>• 🚫 <strong>Exclude:</strong> Exclude field from results</li>
            <li>• 📋 <strong>Copy:</strong> Copy field name or value</li>
            <li>• 🔗 <strong>Copy as query:</strong> Generate Graylog query syntax</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Example: Right-click on "level": "ERROR" → Filter by: level = ERROR
          </p>
        </div>
      </div>

      {/* Log Context Viewer Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3 text-base flex items-center gap-2">
          📊 Log Context Viewer
        </h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Click the <strong>📊 Context</strong> button in message detail popup to view surrounding logs:
          </p>
          <ul className="list-none space-y-1 ml-4">
            <li>• ⬆️ <strong>Before:</strong> 5 logs before current log</li>
            <li>• 📍 <strong>Current:</strong> Highlighted current log</li>
            <li>• ⬇️ <strong>After:</strong> 5 logs after current log</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Helps understand the context and timeline of events.
          </p>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3 text-base flex items-center gap-2">
          🎫 Quick Actions
        </h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Click <strong>Quick Actions ▼</strong> in message detail popup to access:
          </p>
          <ul className="list-none space-y-1 ml-4">
            <li>• 🎫 <strong>Create JIRA Ticket:</strong> Generate pre-filled JIRA ticket template</li>
            <li>• 🤖 <strong>AI Analyse:</strong> Copy structured prompt for AI analysis</li>
            <li>• 🔗 <strong>Copy Permalink:</strong> Generate shareable log link</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Configure JIRA URL in Settings tab for direct integration.
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3 text-base flex items-center gap-2">
          ℹ️ About GrayTool
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Version</span>
            <span className="font-mono text-blue-600">1.0.0</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-700">Developer</span>
            <span className="font-semibold text-gray-800">Emre Bozkurt</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600 leading-relaxed">
          GrayTool is a powerful Chrome extension that enhances your Graylog experience 
          with advanced features like Smart Filters, Context Viewer, Keyboard Shortcuts, 
          and Quick Actions. Built to boost developer productivity and streamline log analysis.
        </div>
      </div>
    </div>
  );
}
