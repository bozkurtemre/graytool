import React, { useState } from "react";
import { ButtonConfig } from "../App";

interface Props {
  buttons: ButtonConfig[];
  saveButtons: (buttons: ButtonConfig[]) => void;
}

export default function ButtonForm({ buttons, saveButtons }: Props) {
  const [graylogRoute, setGraylogRoute] = useState("");
  const [adminRoute, setAdminRoute] = useState("");
  const [paramMapping, setParamMapping] = useState("");
  const [buttonName, setButtonName] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const parseMapping = (input: string) => {
    const mapping: Record<string, string> = {};
    input.split(",").forEach(pair => {
      const [key, value] = pair.split("=").map(s => s.trim());
      if (key && value) mapping[key] = value;
    });
    return mapping;
  };

  const handleAdd = () => {
    const newButton: ButtonConfig = {
      graylogRoute,
      adminRoute,
      paramMapping: parseMapping(paramMapping),
      buttonName,
      ...(customUrl && { customUrl }) // Only add customUrl if it's not empty
    };
    saveButtons([...buttons, newButton]);
    setGraylogRoute("");
    setAdminRoute("");
    setParamMapping("");
    setButtonName("");
    setCustomUrl("");
  };

  const isFormValid = graylogRoute && adminRoute && buttonName;

  return (
    <div className="bg-white p-5 rounded-lg shadow-md mb-4 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <span className="text-blue-600 text-lg">🚀</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Create New Button</h3>
          <p className="text-xs text-gray-500">Add a custom button to Graylog interface</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Graylog Route */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            🎯 <span className="ml-1">Graylog Route</span>
          </label>
          <input
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="e.g., /homepage or * for all routes"
            value={graylogRoute}
            onChange={(e) => setGraylogRoute(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Use * to show button on all log entries</p>
        </div>

        {/* Admin Route */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            🔗 <span className="ml-1">Admin Route</span>
          </label>
          <input
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="e.g., /user-details or /dashboard/users"
            value={adminRoute}
            onChange={(e) => setAdminRoute(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Path will be appended to your base URL</p>
        </div>

        {/* Custom URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            🌐 <span className="ml-1">Custom URL (Optional)</span>
          </label>
          <input
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="e.g., https://custom-dashboard.company.com"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {customUrl ? 
              <span className="text-green-600 font-medium">✅ Using custom URL (overrides environment base URL)</span> : 
              <span>Leave empty to use environment base URL</span>
            }
          </p>
        </div>

        {/* Parameter Mapping */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            📊 <span className="ml-1">Parameter Mapping</span>
          </label>
          <input
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="e.g., id=userId,trackingNumber=trackingNumber"
            value={paramMapping}
            onChange={(e) => setParamMapping(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Format: urlParam=logField,urlParam2=logField2</p>
        </div>

        {/* Button Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            🏷️ <span className="ml-1">Button Name</span>
          </label>
          <input
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="e.g., View User, Check Order"
            value={buttonName}
            onChange={(e) => setButtonName(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">This will appear as the button text</p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
              isFormValid 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleAdd}
            disabled={!isFormValid}
          >
            ➕ Create Button
          </button>
          {!isFormValid && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Please fill in Graylog Route, Admin Route, and Button Name
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
