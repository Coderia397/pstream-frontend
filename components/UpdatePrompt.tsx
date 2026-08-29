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
      <div className="bg-[#181818] border border-white/10 text-white shadow-2xl rounded-lg w-full max-w-3xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h3 className="text-white font-semibold text-lg">
            {t('app.updateAvailable', { defaultValue: 'Update available' })}
          </h3>
          <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} weight="bold" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 pb-5">
          <p className="text-white/70 text-sm leading-relaxed">
            {t('app.updateDesc', { defaultValue: 'An updated version of the website is available. Reload to get the latest version.' })}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button 
            onClick={handleClose}
            className="text-white/60 font-medium text-sm hover:text-white transition-colors duration-150 active:scale-95 px-4 py-2 rounded-[4px] hover:bg-white/5 -ml-4"
          >
            {t('app.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={() => updateSWRef.current && updateSWRef.current(true)}
            className="bg-netflix-red text-white font-bold text-sm px-6 py-2 rounded-[4px] hover:bg-[#b80710] shadow-lg transition-colors duration-150 active:scale-95"
          >
            {t('app.update', { defaultValue: 'Update' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
