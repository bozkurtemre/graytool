import React, { useState } from "react";

interface Props {
  baseUrl: string;
  saveBaseUrl: (url: string) => void;
}

export default function BaseUrlForm({ baseUrl, saveBaseUrl }: Props) {
  const [url, setUrl] = useState(baseUrl);

  const handleSave = () => {
    saveBaseUrl(url);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <input
        className="border p-2 w-full mb-2 rounded"
        placeholder="Admin Base URL (e.g., https://admin.myapp.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        className="bg-indigo-600 text-white w-full py-2 rounded hover:bg-indigo-700 text-sm"
        onClick={handleSave}
      >
        💾 Save Base URL
      </button>
    </div>
  );
}
