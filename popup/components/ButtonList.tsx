import React from "react";
import { ButtonConfig } from "../App";

interface Props {
  buttons: ButtonConfig[];
  saveButtons: (buttons: ButtonConfig[]) => void;
  baseUrl: string;
}

export default function ButtonList({ buttons, saveButtons, baseUrl }: Props) {
  const handleDelete = (index: number) => {
    const newButtons = [...buttons];
    newButtons.splice(index, 1);
    saveButtons(newButtons);
  };

  const handleTest = (btn: ButtonConfig) => {
    // Custom URL varsa onu kullan, yoksa base URL kullan
    const effectiveBaseUrl = btn.customUrl || baseUrl;
    
    // Example URL'i build et
    const exampleParams: Record<string, string> = { userId: "123", trackingNumber: "abc-123", requestId: "app-g4ct-REQ-68e77edfb0997" };
    
    const params: string[] = [];
    const graylogQueryParts: string[] = [];
    
    // Parameter mapping'i işle (content-script ile aynı logic)
    (Object.entries(btn.paramMapping) as [string, string][]).forEach(([key, field]: [string, string]) => {
      const fieldValue = exampleParams[field] || field;
      
      // Graylog query syntax: q.fieldName -> q=fieldName:"value" formatında
      if (key.startsWith('q.')) {
        const queryField = key.substring(2); // "q.requestId" -> "requestId"
        graylogQueryParts.push(`${queryField}:"${fieldValue}"`);
      } else {
        // Normal URL parameter
        params.push(`${key}=${encodeURIComponent(fieldValue)}`);
      }
    });
    
    // Graylog query'leri varsa q parametresine ekle
    if (graylogQueryParts.length > 0) {
      const graylogQuery = graylogQueryParts.join(' AND ');
      params.push(`q=${encodeURIComponent(graylogQuery)}`);
    }
    
    let url = `${effectiveBaseUrl}${btn.adminRoute}`;
    
    if (params.length > 0) {
      // Final URL'de zaten parametre var mı kontrol et
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${params.join('&')}`;
    }
    
    window.open(url, "_blank");
  };


  const getRouteIcon = (route: string) => {
    return route === '*' ? '🌐' : '🎯';
  };

  if (buttons.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-gray-400 text-4xl mb-2">📋</div>
        <div className="text-gray-500 font-medium">No buttons created yet</div>
        <div className="text-gray-400 text-sm">Add your first button above</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 flex items-center">
          📋 Existing Buttons
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
          {buttons.length}
        </span>
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-3">
        {buttons.map((btn, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1 flex items-center">
                  🚀 {btn.buttonName}
                </div>
              </div>
            </div>

            {/* Routes */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">{getRouteIcon(btn.graylogRoute)}</span>
                <span className="font-medium mr-1">Graylog:</span>
                <code className="bg-gray-200 px-1 rounded text-xs">{btn.graylogRoute}</code>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🔗</span>
                <span className="font-medium mr-1">Admin:</span>
                <code className="bg-gray-200 px-1 rounded text-xs truncate max-w-48">{btn.adminRoute}</code>
              </div>
              {btn.customUrl && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🌐</span>
                  <span className="font-medium mr-1">Custom URL:</span>
                  <code className="bg-green-100 px-1 rounded text-xs truncate max-w-48 text-green-800">{btn.customUrl}</code>
                  <span className="ml-1 text-xs text-green-600">✅ Override</span>
                </div>
              )}
            </div>

            {/* Parameter Mapping */}
            {Object.keys(btn.paramMapping).length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1">📊 Parameter Mapping:</div>
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(btn.paramMapping) as [string, string][]).map(([k, v]: [string, string]) => (
                    <span key={k} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      {k} → {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button 
                className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-xs flex-1 transition-colors"
                onClick={() => handleDelete(index)}
              >
                🗑️ Delete
              </button>
              <button 
                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-xs flex-1 transition-colors"
                onClick={() => handleTest(btn)}
              >
                🚀 Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
