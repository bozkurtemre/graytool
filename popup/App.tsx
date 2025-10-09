import React, { useState, useEffect } from "react";
import ButtonForm from "./components/ButtonForm";
import ButtonList from "./components/ButtonList";
import BaseUrlForm from "./components/BaseUrlForm";
import Settings from "./components/Settings";
import EnvironmentManager, { EnvironmentConfig } from "./components/EnvironmentManager";

// Chrome extension API access
const getChromeAPI = () => {
  return (window as any).chrome || (globalThis as any).chrome;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 w-96">
          <h2 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            Please reload the extension or check the console for more details.
          </p>
          <button
            className="mt-4 px-3 py-1 bg-blue-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface ButtonConfig {
  graylogRoute: string;
  adminRoute: string;
  paramMapping: Record<string, string>;
  buttonName: string;
  customUrl?: string; // Optional custom URL, if provided, overrides adminBaseUrl
}

function AppContent() {
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'buttons' | 'settings'>('buttons');

  useEffect(() => {
    // Check if chrome APIs are available
    const chrome = getChromeAPI();
    if (chrome && chrome.storage) {
      chrome.storage.sync.get(["buttons", "adminBaseUrl", "environments"], (result: { buttons?: ButtonConfig[]; adminBaseUrl?: string; environments?: EnvironmentConfig[] }) => {
        setButtons(result.buttons || []);
        setBaseUrl(result.adminBaseUrl || "");
        setEnvironments(result.environments || []);
        setIsLoading(false);
      });
    } else {
      console.error("Chrome extension APIs not available");
      setIsLoading(false);
    }
  }, []);

  const saveButtons = (newButtons: ButtonConfig[]) => {
    const chrome = getChromeAPI();
    if (chrome && chrome.storage) {
      chrome.storage.sync.set({ buttons: newButtons }, () => {
        setButtons(newButtons);
      });
    }
  };

  const saveBaseUrl = (url: string) => {
    const chrome = getChromeAPI();
    if (chrome && chrome.storage) {
      chrome.storage.sync.set({ adminBaseUrl: url }, () => setBaseUrl(url));
    }
  };

  const saveEnvironments = (newEnvironments: EnvironmentConfig[]) => {
    const chrome = getChromeAPI();
    if (chrome && chrome.storage) {
      chrome.storage.sync.set({ environments: newEnvironments }, () => setEnvironments(newEnvironments));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 w-96 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 w-96">
      {/* Navigation */}
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 px-3 rounded-l text-sm font-medium ${
            currentPage === 'buttons' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setCurrentPage('buttons')}
        >
          ➕ Buttons {buttons.length > 0 && (
            <span className="ml-1 bg-white bg-opacity-20 text-xs px-1.5 py-0.5 rounded-full">
              {buttons.length}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-r text-sm font-medium ${
            currentPage === 'settings' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setCurrentPage('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Page Content */}
      {currentPage === 'buttons' ? (
        <>
          <h1 className="text-xl font-bold mb-4">Button Management</h1>
          <ButtonForm buttons={buttons} saveButtons={saveButtons} />
          <ButtonList buttons={buttons} saveButtons={saveButtons} baseUrl={baseUrl} />
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold mb-4">Settings</h1>
          <EnvironmentManager environments={environments} saveEnvironments={saveEnvironments} />
          <Settings buttons={buttons} saveButtons={saveButtons} baseUrl={baseUrl} saveBaseUrl={saveBaseUrl} environments={environments} saveEnvironments={saveEnvironments} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
