
import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const handleOpenSelector = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceed immediately as per guidelines to handle potential race condition
      onKeySelected();
    } catch (err) {
      console.error("Failed to open API key selector", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl shadow-xl border border-blue-100">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <i className="fa-solid fa-key text-3xl text-blue-600"></i>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">API Key Required</h2>
      <p className="text-gray-600 max-w-md mb-8">
        This application uses <span className="font-semibold text-blue-600">Gemini 3 Pro Image Preview</span>, which requires a paid Google Cloud project. Please select an API key to continue.
      </p>
      
      <div className="space-y-4 w-full max-w-xs">
        <button
          onClick={handleOpenSelector}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
        >
          <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
          Select API Key
        </button>
        
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-sm text-blue-500 hover:underline"
        >
          Learn about API billing & setup
        </a>
      </div>
    </div>
  );
};
