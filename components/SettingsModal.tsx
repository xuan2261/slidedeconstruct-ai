import React, { useState, useEffect } from 'react';
import { AISettings, ProviderConfig, HybridDetectionSettings } from '../types';
import { testModel } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AISettings) => void;
  initialSettings: AISettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<AISettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'gemini' | 'openai'>('gemini');
  
  // Track testing state for individual buttons
  const [testingState, setTestingState] = useState<{
    recognition: 'idle' | 'loading' | 'success' | 'error';
    drawing: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ recognition: 'idle', drawing: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
        setSettings(initialSettings);
        setActiveTab(initialSettings.currentProvider);
        setTestingState({ recognition: 'idle', drawing: 'idle', message: '' });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const provider = e.target.value as 'gemini' | 'openai';
      setSettings(prev => ({ ...prev, currentProvider: provider }));
      setActiveTab(provider);
      setTestingState({ recognition: 'idle', drawing: 'idle', message: '' });
  };

  const handleTabChange = (tab: 'gemini' | 'openai') => {
      setActiveTab(tab);
      setTestingState({ recognition: 'idle', drawing: 'idle', message: '' });
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [name]: value
      }
    }));
  };

  const handleTestModel = async (type: 'recognition' | 'drawing') => {
      setTestingState(prev => ({ ...prev, [type]: 'loading', message: '' }));
      
      const config = settings[activeTab];
      
      // Pass the provider explicitly to ensure we test the correct one regardless of 'currentProvider' setting
      const result = await testModel(type, activeTab, config);
      
      setTestingState(prev => ({
          ...prev,
          [type]: result.success ? 'success' : 'error',
          message: result.message
      }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const currentConfig = settings[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-0 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
           <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">AI Service Settings</h2>
           
           <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 mb-2">
                <label className="text-sm font-medium px-3 text-slate-600 dark:text-slate-300">Active Provider:</label>
                <select 
                    value={settings.currentProvider} 
                    onChange={handleProviderChange}
                    className="bg-transparent font-semibold text-blue-600 dark:text-blue-400 focus:outline-none text-sm text-right pr-2"
                >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI Compatible</option>
                </select>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
             <button 
                onClick={() => handleTabChange('gemini')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'gemini' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                Google Gemini Settings
             </button>
             <button 
                onClick={() => handleTabChange('openai')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'openai' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                OpenAI Settings
             </button>
        </div>
        
        {/* Config Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
               {activeTab === 'gemini' ? 'Google API Key' : 'OpenAI API Key'}
            </label>
            <input 
                type="password" 
                name="apiKey"
                value={currentConfig.apiKey}
                onChange={handleConfigChange}
                placeholder="sk-..."
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Base URL</label>
            <input 
                type="text" 
                name="baseUrl"
                value={currentConfig.baseUrl}
                onChange={handleConfigChange}
                placeholder={activeTab === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com/v1'}
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 gap-5">
             {/* Recognition Model Row */}
             <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Recognition Model (Vision)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        name="recognitionModel"
                        value={currentConfig.recognitionModel}
                        onChange={handleConfigChange}
                        className="flex-1 rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={() => handleTestModel('recognition')}
                        disabled={testingState.recognition === 'loading'}
                        className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 min-w-[80px] justify-center
                            ${testingState.recognition === 'success' 
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                                : testingState.recognition === 'error'
                                    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                            }
                        `}
                    >
                         {testingState.recognition === 'loading' ? 'Testing...' : testingState.recognition === 'success' ? 'Connected' : 'Test'}
                    </button>
                </div>
             </div>

             {/* Drawing Model Row */}
             <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Drawing Model (Image Gen)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        name="drawingModel"
                        value={currentConfig.drawingModel}
                        onChange={handleConfigChange}
                        className="flex-1 rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                     <button
                        onClick={() => handleTestModel('drawing')}
                        disabled={testingState.drawing === 'loading'}
                        className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 min-w-[80px] justify-center
                            ${testingState.drawing === 'success' 
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                                : testingState.drawing === 'error'
                                    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                            }
                        `}
                    >
                         {testingState.drawing === 'loading' ? 'Testing...' : testingState.drawing === 'success' ? 'Connected' : 'Test'}
                    </button>
                </div>
             </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded text-xs text-slate-500 dark:text-slate-400">
             Tip: {activeTab === 'gemini' ? 'Gemini drawing model recommended: gemini-3-pro-image-preview or gemini-2.5-flash-image.' : 'OpenAI recognition model requires Vision support (e.g., gpt-4o). Drawing model requires Image Generation (e.g., dall-e-3).'}
          </div>

          {/* Advanced Settings Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Advanced Settings</h3>

            {/* Confidence Threshold */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Confidence Threshold ({(settings.confidenceThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.confidenceThreshold * 100}
                onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) / 100 }))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-1">Filter elements below this confidence level</p>
            </div>

            {/* Multi-Pass Inpainting Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Multi-Pass Inpainting</label>
                <p className="text-xs text-slate-400">2-pass text removal for higher quality (uses more API calls)</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enableMultiPassInpainting: !prev.enableMultiPassInpainting }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableMultiPassInpainting ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableMultiPassInpainting ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Hybrid Detection Section */}
            <div className="border-t border-slate-200 dark:border-slate-600 pt-3 mt-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hybrid Detection (Beta)</label>
                  <p className="text-xs text-slate-400">Use Tesseract.js for improved text box accuracy</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    hybridDetection: { ...prev.hybridDetection, enabled: !prev.hybridDetection.enabled }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.hybridDetection?.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.hybridDetection?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {settings.hybridDetection?.enabled && (
                <div className="pl-4 space-y-2 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-600 dark:text-slate-400">Use Tesseract OCR</label>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        hybridDetection: { ...prev.hybridDetection, useTesseract: !prev.hybridDetection.useTesseract }
                      }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.hybridDetection?.useTesseract ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.hybridDetection?.useTesseract ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-600 dark:text-slate-400">Prefer client-side boxes</label>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        hybridDetection: { ...prev.hybridDetection, preferClientBoxes: !prev.hybridDetection.preferClientBoxes }
                      }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.hybridDetection?.preferClientBoxes ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.hybridDetection?.preferClientBoxes ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Note: First use downloads ~15MB language data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
             {testingState.message && (
                <div className={`p-2 rounded text-xs text-center font-medium truncate ${testingState.message.toLowerCase().includes('connect') ? 'text-green-600' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                    {testingState.message}
                </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
              >
                Save Settings
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;