import React, { useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise } from '@phosphor-icons/react';

const UpdatePrompt: React.FC = () => {
  const { t } = useTranslation();
  const [needRefresh, setNeedRefresh] = useState(false);

  const updateSW = registerSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      // PWA is ready to work offline
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#141414] border border-gray-800 shadow-2xl rounded-lg p-4 flex flex-col gap-3 min-w-[280px] animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="bg-[#E50914] p-2 rounded-full text-white">
          <ArrowsClockwise size={20} weight="bold" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">
            {t('app.updateAvailable', { defaultValue: 'Update Available' })}
          </h4>
          <p className="text-gray-400 text-xs mt-1">
            {t('app.updateDesc', { defaultValue: 'A new version of the app is ready.' })}
          </p>
        </div>
      </div>
      <button
        onClick={() => updateSW(true)}
        className="w-full bg-white text-black font-semibold py-2 rounded text-sm hover:bg-gray-200 transition-colors"
      >
        {t('app.reloadToUpdate', { defaultValue: 'Reload to Update' })}
      </button>
    </div>
  );
};

export default UpdatePrompt;
