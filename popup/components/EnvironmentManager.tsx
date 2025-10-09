import React, { useState } from "react";

export interface EnvironmentConfig {
  name: string;
  adminBaseUrl: string;
  isDefault?: boolean;
}

interface Props {
  environments: EnvironmentConfig[];
  saveEnvironments: (envs: EnvironmentConfig[]) => void;
}

export default function EnvironmentManager({ environments, saveEnvironments }: Props) {
  const [selectedEnvType, setSelectedEnvType] = useState<"Production" | "Staging">("Production");
  const [adminBaseUrl, setAdminBaseUrl] = useState("");

  const handleAdd = () => {
    if (!adminBaseUrl) return;
    
    // Check if this environment type already exists
    const existingEnv = environments.find(env => env.name === selectedEnvType);
    if (existingEnv) {
      alert(`${selectedEnvType} environment already exists!`);
      return;
    }
    
    const newEnv: EnvironmentConfig = {
      name: selectedEnvType,
      adminBaseUrl: adminBaseUrl
    };
    
    saveEnvironments([...environments, newEnv]);
    setAdminBaseUrl("");
  };

  const handleDelete = (index: number) => {
    const updated = environments.filter((_, i) => i !== index);
    saveEnvironments(updated);
  };

  const setAsDefault = (index: number) => {
    const updated = environments.map((env, i) => ({
      ...env,
      isDefault: i === index
    }));
    saveEnvironments(updated);
  };

  const getCurrentEnvironment = () => {
    const currentHost = window.location.hostname.toLowerCase();
    
    // Simple detection: if "stage" in URL -> staging, else -> production
    const isStaging = currentHost.includes('stage');
    const envType = isStaging ? 'staging' : 'production';
    
    return environments.find(env => 
      env.name.toLowerCase().includes(envType)
    ) || environments.find(env => env.isDefault);
  };

  const currentEnv = getCurrentEnvironment();

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">🌍 Environment Management</h3>
          <p className="text-xs text-gray-500">Configure admin URLs for automatic environment switching</p>
        </div>
        {currentEnv && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            📍 Active: {currentEnv.name}
          </span>
        )}
      </div>

      {/* Current Detection Status */}
      <div className="bg-blue-50 p-3 rounded mb-4">
        <div className="text-sm font-medium text-blue-800 mb-1">Auto-Detection Status:</div>
        <div className="text-xs text-blue-600">
          🔍 Graylog URL: <code>{window.location.hostname}</code><br/>
          🎯 Detected: <strong>{window.location.hostname.includes('stage') ? 'Staging' : 'Production'}</strong><br/>
          🎯 Using Environment: <strong>{currentEnv?.name || "Not configured (add environments below)"}</strong><br/>
          🔗 Admin Base URL: <code>{currentEnv?.adminBaseUrl || "Not configured"}</code>
        </div>
      </div>

      {/* Add New Environment */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment Type</label>
            <select
              className="border border-gray-300 p-2 rounded text-sm w-full bg-white"
              value={selectedEnvType}
              onChange={(e) => setSelectedEnvType(e.target.value as "Production" | "Staging")}
            >
              <option value="Production">🏭 Production</option>
              <option value="Staging">🚧 Staging</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Base URL</label>
            <input
              className="border border-gray-300 p-2 rounded text-sm w-full"
              placeholder="e.g., https://admin.moblyonia.com"
              value={adminBaseUrl}
              onChange={(e) => setAdminBaseUrl(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
            adminBaseUrl 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!adminBaseUrl}
        >
          ➕ Add {selectedEnvType} Environment
        </button>
      </div>

      {/* Environment List */}
      <div className="space-y-2">
        {environments.map((env, index) => (
          <div key={index} className={`border rounded p-3 ${env.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center">
                {env.isDefault && <span className="mr-2">⭐</span>}
                🌍 {env.name}
              </div>
              <div className="flex gap-2">
                {!env.isDefault && (
                  <button
                    onClick={() => setAsDefault(index)}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(index)}
                  className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              🔗 Admin URL: <code className="bg-gray-200 px-1 rounded">{env.adminBaseUrl}</code>
            </div>
          </div>
        ))}
      </div>

      {environments.length === 0 && (
        <div className="text-center text-gray-500 py-6">
          <div className="text-2xl mb-2">🌍</div>
          <div className="text-sm font-medium mb-2">No environments configured</div>
          <div className="text-xs mb-3">Configure your admin panel URLs above:</div>
          <div className="text-xs bg-gray-50 p-3 rounded text-left">
            <strong>Example setup:</strong><br/>
            📍 <strong>Production:</strong> https://admin.moblyonia.com<br/>
            📍 <strong>Staging:</strong> https://admin.stage.moblyonia.com<br/><br/>
            Extension will auto-switch based on your Graylog URL!
          </div>
        </div>
      )}
    </div>
  );
}
