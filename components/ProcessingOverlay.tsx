
import React, { useState, useEffect } from 'react';

const messages = [
  "Analyzing facial features...",
  "Straightening head position...",
  "Detecting and removing background...",
  "Enhancing image quality...",
  "Formatting to passport standards...",
  "Finalizing high-res output..."
];

export const ProcessingOverlay: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-600 text-2xl animate-pulse"></i>
        </div>
      </div>
      <p className="text-xl font-medium text-gray-800 animate-pulse">{messages[msgIndex]}</p>
      <p className="text-sm text-gray-500 mt-2">This may take a minute for high resolution</p>
    </div>
  );
};
