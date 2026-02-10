
import React, { useState, useEffect, useRef } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { editPassportPhoto } from './services/geminiService';
import { ImageSize, EditorState, PreviewBgColor } from './types';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<EditorState>({
    originalImage: null,
    processedImage: null,
    isProcessing: false,
    error: null,
    selectedSize: '1K',
    previewBg: 'transparent',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const exists = await window.aistudio.hasSelectedApiKey();
      setHasKey(exists);
    };
    checkKey();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setState(prev => ({
          ...prev,
          originalImage: event.target?.result as string,
          processedImage: null,
          error: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const response = await editPassportPhoto(state.originalImage, state.selectedSize);
      if (response.imageUrl) {
        setState(prev => ({ ...prev, processedImage: response.imageUrl, isProcessing: false }));
      } else {
        throw new Error("No image returned from AI. Try a different photo.");
      }
    } catch (err: any) {
      if (err.message === "API_KEY_EXPIRED_OR_INVALID") {
        setHasKey(false);
      }
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "Something went wrong during processing." 
      }));
    }
  };

  const downloadImage = () => {
    if (!state.processedImage) return;
    const link = document.createElement('a');
    link.href = state.processedImage;
    link.download = `passport_photo_${state.selectedSize.toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setState({
      originalImage: null,
      processedImage: null,
      isProcessing: false,
      error: null,
      selectedSize: '1K',
      previewBg: 'transparent',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPreviewBgClass = (color: PreviewBgColor) => {
    switch (color) {
      case 'white': return 'bg-white';
      case 'blue': return 'bg-[#3b82f6]';
      case 'grey': return 'bg-[#4b5563]';
      default: return 'bg-gray-50'; // Default app surface
    }
  };

  if (hasKey === null) return null; // Initial loading

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fa-solid fa-id-card text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Passport Photo Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-gray-500 font-medium">Powered by Gemini 3 Pro</span>
            <button 
              onClick={() => {
                // @ts-ignore
                window.aistudio.openSelectKey();
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors p-2"
              title="Change API Key"
            >
              <i className="fa-solid fa-key"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {!hasKey ? (
          <ApiKeySelector onKeySelected={() => setHasKey(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls Side */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-blue-600"></i> Configuration
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Resolution</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setState(s => ({ ...s, selectedSize: size }))}
                          className={`py-2 px-3 rounded-lg text-sm font-bold border-2 transition-all ${
                            state.selectedSize === size
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold transition-all shadow-md"
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      {state.originalImage ? 'Change Photo' : 'Upload Portrait'}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  {state.originalImage && !state.processedImage && (
                    <button
                      onClick={processImage}
                      disabled={state.isProcessing}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 text-lg"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      Generate Passport Photo
                    </button>
                  )}

                  {state.processedImage && (
                    <div className="grid grid-cols-1 gap-2">
                       <button
                        onClick={downloadImage}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-md"
                      >
                        <i className="fa-solid fa-download"></i>
                        Download PNG
                      </button>
                      <button
                        onClick={reset}
                        className="w-full text-gray-400 hover:text-red-500 text-sm font-medium py-2 transition-colors"
                      >
                        Reset and start over
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                  <i className="fa-solid fa-circle-exclamation mt-1"></i>
                  <div className="text-sm">
                    <p className="font-bold">Processing Error</p>
                    <p>{state.error}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-blue-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-lightbulb"></i> Tips for best results:
                </h3>
                <ul className="text-blue-700/80 text-xs space-y-1 list-disc pl-4">
                  <li>Use a front-facing portrait with clear lighting.</li>
                  <li>Avoid busy backgrounds if possible.</li>
                  <li>The AI will automatically remove background and straighten posture.</li>
                </ul>
              </div>
            </div>

            {/* Preview Side */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Editor Workspace</span>
                  {state.isProcessing && (
                    <span className="text-xs font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                      <i className="fa-solid fa-circle text-[6px]"></i> AI Processing...
                    </span>
                  )}
                </div>

                <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-gray-50">
                  {state.isProcessing && <ProcessingOverlay />}
                  
                  {!state.originalImage && !state.processedImage && !state.isProcessing && (
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center cursor-pointer hover:border-blue-400 transition-all bg-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-camera text-3xl text-blue-500"></i>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">No Image Uploaded</h3>
                      <p className="text-gray-500 max-w-xs mx-auto mt-2">
                        Upload a photo to begin your professional transformation.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                    {state.originalImage && (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Original</span>
                        <div className="relative group w-[240px] h-[320px] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          <img 
                            src={state.originalImage} 
                            alt="Original" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                    )}

                    {state.originalImage && (
                      <div className="hidden md:flex flex-col items-center">
                        <i className="fa-solid fa-chevron-right text-gray-300 text-3xl"></i>
                      </div>
                    )}

                    {(state.processedImage || state.isProcessing) && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-between w-[240px]">
                          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Passport Ready</span>
                          {state.processedImage && (
                             <div className="flex gap-1">
                              {(['transparent', 'white', 'blue', 'grey'] as PreviewBgColor[]).map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setState(s => ({ ...s, previewBg: color }))}
                                  className={`w-4 h-4 rounded-full border border-gray-300 transition-transform hover:scale-125 ${
                                    state.previewBg === color ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''
                                  } ${
                                    color === 'transparent' ? 'bg-[url("https://www.transparenttextures.com/patterns/graphy.png")] bg-gray-100' : 
                                    color === 'white' ? 'bg-white' : 
                                    color === 'blue' ? 'bg-blue-500' : 'bg-gray-600'
                                  }`}
                                  title={`Preview with ${color} background`}
                                />
                              ))}
                             </div>
                          )}
                        </div>
                        <div className={`relative group w-[240px] h-[320px] rounded-lg shadow-2xl overflow-hidden border-2 border-blue-500 flex items-center justify-center transition-colors duration-300 ${getPreviewBgClass(state.previewBg)}`}>
                          {state.processedImage ? (
                            <img 
                              src={state.processedImage} 
                              alt="Processed Passport" 
                              className="w-full h-full object-contain" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                              <i className="fa-solid fa-user-tie text-gray-300 text-6xl"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {state.processedImage && (
                  <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Transformation Success!</p>
                        <p className="text-xs text-blue-100">Background removed and posture corrected.</p>
                      </div>
                    </div>
                    <button 
                      onClick={downloadImage}
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      Download PNG
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-gray-400 text-xs mt-auto">
        <p>© 2024 Passport Photo Pro • Advanced AI Image Generation</p>
      </footer>
    </div>
  );
};

export default App;
