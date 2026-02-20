
import React, { useState, useEffect, useRef } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { editPassportPhoto } from './services/geminiService';
import { ImageSize, EditorState, PreviewBgColor, AttireType, AttireColor, OutputBgColor } from './types';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<EditorState>({
    originalImage: null,
    processedImage: null,
    isProcessing: false,
    error: null,
    selectedSize: '1K',
    previewBg: 'transparent',
    styleOptions: {
      attire: 'suit',
      attireColor: 'sea-blue',
      outputBg: 'transparent',
      addSmile: true
    }
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
      const response = await editPassportPhoto(
        state.originalImage, 
        state.selectedSize, 
        state.styleOptions
      );
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
      styleOptions: {
        attire: 'suit',
        attireColor: 'sea-blue',
        outputBg: 'transparent',
        addSmile: true
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setStyle = <K extends keyof EditorState['styleOptions']>(key: K, value: EditorState['styleOptions'][K]) => {
    setState(prev => ({
      ...prev,
      styleOptions: {
        ...prev.styleOptions,
        [key]: value
      }
    }));
  };

  const getPreviewBgClass = (color: PreviewBgColor) => {
    switch (color) {
      case 'white': return 'bg-white';
      case 'blue': return 'bg-blue-600';
      case 'grey': return 'bg-gray-800';
      default: return 'bg-gray-200'; // Pure neutral background for transparency check
    }
  };

  if (hasKey === null) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
              <i className="fa-solid fa-id-card text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Passport Photo Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs font-bold text-gray-400 uppercase tracking-widest">Powered by Gemini 3 Pro</span>
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
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-magic text-blue-600"></i> Studio Controls
                </h2>
                
                <div className="space-y-6">
                  {/* Resolution Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Output Resolution</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setState(s => ({ ...s, selectedSize: size }))}
                          className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                            state.selectedSize === size
                              ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                              : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 font-medium italic">Higher resolution takes longer to process.</p>
                  </div>

                  {/* Attire Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preferred Attire</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['none', 'suit', 'shirt'] as AttireType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setStyle('attire', type)}
                          className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                            state.styleOptions.attire === type
                              ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                              : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {type === 'none' ? 'Original' : type === 'suit' ? 'Suit' : 'Shirt'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attire Color */}
                  {state.styleOptions.attire !== 'none' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attire Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['sea-blue', 'navy', 'black', 'charcoal'] as AttireColor[]).map((color) => (
                          <button
                            key={color}
                            onClick={() => setStyle('attireColor', color)}
                            className={`h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                              state.styleOptions.attireColor === color
                                ? 'border-blue-600 ring-2 ring-blue-100'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                            title={color.replace('-', ' ')}
                          >
                            <div className={`w-5 h-5 rounded-full shadow-inner ${
                              color === 'sea-blue' ? 'bg-[#1e90ff]' :
                              color === 'navy' ? 'bg-[#000080]' :
                              color === 'black' ? 'bg-[#000000]' : 'bg-[#36454f]'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Output Background */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Final Image Background</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['transparent', 'white', 'light-grey', 'light-blue'] as OutputBgColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setStyle('outputBg', color)}
                          className={`h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                            state.styleOptions.outputBg === color
                              ? 'border-blue-600 ring-2 ring-blue-100'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                          title={color.replace('-', ' ')}
                        >
                          <div className={`w-5 h-5 rounded-full shadow-inner border border-gray-100 ${
                            color === 'transparent' ? 'bg-gray-100 border-dashed border-gray-300' :
                            color === 'white' ? 'bg-white' :
                            color === 'light-grey' ? 'bg-gray-200' : 'bg-[#e3f2fd]'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expression */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Add Professional Smile</span>
                    <button 
                      onClick={() => setStyle('addSmile', !state.styleOptions.addSmile)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${state.styleOptions.addSmile ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.styleOptions.addSmile ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95"
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      {state.originalImage ? 'Swap Image' : 'Select Photo'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>

                  {state.originalImage && !state.processedImage && (
                    <button
                      onClick={processImage}
                      disabled={state.isProcessing}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 text-lg active:scale-95"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      Process Photo
                    </button>
                  )}

                  {state.processedImage && (
                    <div className="grid grid-cols-1 gap-2">
                       <button
                        onClick={downloadImage}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
                      >
                        <i className="fa-solid fa-file-arrow-down"></i>
                        Download Result
                      </button>
                      <button
                        onClick={reset}
                        className="w-full text-gray-400 hover:text-red-500 text-[10px] font-bold py-2 transition-colors tracking-widest uppercase"
                      >
                        Start New
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                  <i className="fa-solid fa-triangle-exclamation mt-1"></i>
                  <div className="text-xs">
                    <p className="font-bold">Error Occurred</p>
                    <p>{state.error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Studio Workspace</span>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] text-gray-400 font-bold">PREVIEW BACKGROUND:</span>
                     <div className="flex gap-1">
                      {(['transparent', 'white', 'blue', 'grey'] as PreviewBgColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setState(s => ({ ...s, previewBg: color }))}
                          className={`w-4 h-4 rounded-full border border-gray-300 transition-transform ${
                            state.previewBg === color ? 'ring-2 ring-blue-500 ring-offset-1 scale-125' : 'hover:scale-110'
                          } ${
                            color === 'transparent' ? 'bg-gray-200' : 
                            color === 'white' ? 'bg-white' : 
                            color === 'blue' ? 'bg-blue-600' : 'bg-gray-800'
                          }`}
                        />
                      ))}
                     </div>
                  </div>
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
                      <h3 className="text-lg font-bold text-gray-800 tracking-tight">Step 1: Upload Photo</h3>
                      <p className="text-gray-400 text-sm mt-1">Selfies or portraits are perfect.</p>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                    {state.originalImage && (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Source Photo</span>
                        <div className="relative w-[220px] h-[293px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                          <img src={state.originalImage} alt="Original" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {state.originalImage && (
                      <div className="hidden md:flex flex-col items-center">
                        <i className="fa-solid fa-arrow-right-long text-gray-300 text-3xl"></i>
                      </div>
                    )}

                    {(state.processedImage || state.isProcessing) && (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Passport Result</span>
                        <div className={`relative w-[220px] h-[293px] rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500 flex items-center justify-center transition-colors duration-500 ${getPreviewBgClass(state.previewBg)}`}>
                          {state.processedImage ? (
                            <img src={state.processedImage} alt="Result" className="w-full h-full object-contain" />
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
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Transformation Successful</p>
                        <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold">Ready for submission</p>
                      </div>
                    </div>
                    <button 
                      onClick={downloadImage}
                      className="bg-white text-blue-600 px-5 py-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95"
                    >
                      DOWNLOAD PNG
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em] mt-auto">
        <p>Studio Grade AI • Passport Photo Pro • 2024</p>
      </footer>
    </div>
  );
};

export default App;
