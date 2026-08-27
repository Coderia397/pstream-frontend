import React, { useState, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useTranslation } from 'react-i18next';
import { X } from '@phosphor-icons/react';

const UpdatePrompt: React.FC = () => {
  const { t } = useTranslation();
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        // PWA is ready to work offline
      },
    });
  }, []);

  const handleClose = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 pb-6 sm:pb-8 flex justify-center pointer-events-none">
      <div className="bg-white shadow-2xl rounded-lg w-full max-w-3xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom-10 overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h3 className="text-gray-900 font-semibold text-lg">
            {t('app.updateAvailable', { defaultValue: 'Update available' })}
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} weight="bold" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 pb-5">
          <p className="text-gray-600 text-sm leading-relaxed">
            {t('app.updateDesc', { defaultValue: 'An updated version of the website is available. Reload to get the latest version.' })}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button 
            onClick={handleClose}
            className="text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors px-4 py-2 rounded-md hover:bg-gray-100 -ml-4"
          >
            {t('app.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={() => updateSWRef.current && updateSWRef.current(true)}
            className="bg-netflix-red text-white font-medium text-sm px-6 py-2 rounded-md hover:bg-[#b80710] transition-colors shadow-sm"
          >
            {t('app.update', { defaultValue: 'Update' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
