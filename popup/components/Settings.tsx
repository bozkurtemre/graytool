import React, { useRef } from "react";
import { ButtonConfig } from "../App";

import { EnvironmentConfig } from "./EnvironmentManager";

interface Props {
  buttons: ButtonConfig[];
  saveButtons: (buttons: ButtonConfig[]) => void;
  baseUrl: string;
  saveBaseUrl: (url: string) => void;
  jiraUrl: string;
  saveJiraUrl: (url: string) => void;
  environments: EnvironmentConfig[];
  saveEnvironments: (envs: EnvironmentConfig[]) => void;
}

export default function Settings({ buttons, saveButtons, baseUrl, saveBaseUrl, jiraUrl, saveJiraUrl, environments, saveEnvironments }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      version: "1.0",
      exported: new Date().toISOString(),
      buttons: buttons,
      adminBaseUrl: baseUrl,
      jiraUrl: jiraUrl,
      environments: environments.map(env => ({
        name: env.name,
        adminBaseUrl: env.adminBaseUrl,
        isDefault: env.isDefault
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `graytool-config-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate import data structure
        if (!importData.buttons || !Array.isArray(importData.buttons)) {
          alert('Invalid config file: Missing or invalid buttons array');
          return;
        }

        // Validate each button has required fields
        const isValidButton = (btn: any): btn is ButtonConfig => {
          return btn && 
                 typeof btn.graylogRoute === 'string' &&
                 typeof btn.adminRoute === 'string' &&
                 typeof btn.buttonName === 'string' &&
                 typeof btn.paramMapping === 'object';
        };

        const validButtons = importData.buttons.filter(isValidButton);
        
        if (validButtons.length === 0) {
          alert('No valid buttons found in the config file');
          return;
        }

        if (validButtons.length !== importData.buttons.length) {
          const invalidCount = importData.buttons.length - validButtons.length;
          if (!confirm(`${invalidCount} invalid button(s) will be skipped. Continue with ${validButtons.length} valid button(s)?`)) {
            return;
          }
        }

        // Import admin base URL, JIRA URL and environments if available
        const importBaseUrl = importData.adminBaseUrl || '';
        const importJiraUrl = importData.jiraUrl || '';
        const rawEnvironments = importData.environments || [];
        
        // Clean up environments - remove graylogPattern if exists
        const importEnvironments = rawEnvironments.map((env: any) => ({
          name: env.name,
          adminBaseUrl: env.adminBaseUrl,
          isDefault: env.isDefault
        })).filter((env: any) => env.name && env.adminBaseUrl);
        
        // Confirm replacement
        let confirmMessage = `Import ${validButtons.length} button(s)`;
        if (importBaseUrl) confirmMessage += ', admin base URL';
        if (importJiraUrl) confirmMessage += ', JIRA URL';
        if (importEnvironments.length > 0) confirmMessage += `, ${importEnvironments.length} environment(s)`;
        
        if (buttons.length > 0 || environments.length > 0) {
          confirmMessage = `This will replace your current configuration. ` + confirmMessage;
        }
        confirmMessage += '. Continue?';
          
        if (confirm(confirmMessage)) {
          saveButtons(validButtons);
          if (importBaseUrl) {
            saveBaseUrl(importBaseUrl);
          }
          if (importJiraUrl) {
            saveJiraUrl(importJiraUrl);
          }
          if (importEnvironments.length > 0) {
            saveEnvironments(importEnvironments);
          }
          
          let successMessage = `Successfully imported ${validButtons.length} button(s)`;
          if (importBaseUrl) successMessage += ' and admin base URL';
          if (importJiraUrl) successMessage += ' and JIRA URL';
          if (importEnvironments.length > 0) successMessage += ` and ${importEnvironments.length} environment(s)`;
          
          alert(successMessage);
        }

      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to parse config file. Please check the file format.');
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-semibold mb-3">Settings</h2>
      
      {/* JIRA URL Configuration */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎫 JIRA Base URL
        </label>
        <input
          type="text"
          value={jiraUrl}
          onChange={(e) => saveJiraUrl(e.target.value)}
          placeholder="https://your-company.atlassian.net"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your JIRA instance URL for Quick Actions integration
        </p>
      </div>
      
      {/* Export/Import Section */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
          disabled={buttons.length === 0}
        >
          📤 Export Config
        </button>
        
        <button
          onClick={handleImport}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
        >
          📥 Import Config
        </button>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        Export: Download buttons, admin base URL, and environments as JSON<br/>
        Import: Upload and replace current configuration from JSON file
      </div>
      
      <div className="text-xs text-gray-500">
        Current config: {buttons.length} button(s) • {environments.length} environment(s)
        {baseUrl && <span> • Manual admin URL set</span>}
        {jiraUrl && <span> • JIRA URL configured</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
