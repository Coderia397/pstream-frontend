import React from 'react';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const CookiePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-[#141414] text-gray-900 dark:text-white font-inter transition-colors duration-200">
      <header className="h-16 px-6 md:px-10 flex items-center bg-white/80 dark:bg-black/50 sticky top-0 z-50 backdrop-blur-md border-b border-gray-100 dark:border-transparent">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors" aria-label={t('nav.goBack', { defaultValue: 'Go Back' })}>
          <ArrowLeftIcon size={20} />
          <span className="font-medium text-sm">{t('nav.goBack', { defaultValue: 'Go Back' })}</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-600 dark:text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-4">{t('cookiePage.title', { defaultValue: 'Cookie Policy' })}</h1>
          <p className="text-sm text-gray-500">{t('cookiePage.lastUpdated', { defaultValue: 'Last Updated: August 16, 2026' })}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('cookiePage.section1Title', { defaultValue: 'How we use cookies' })}</h2>
          <p>{t('cookiePage.section1Desc', { defaultValue: 'We use cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.' })}</p>
        </section>
      </main>
    </div>
  );
};
