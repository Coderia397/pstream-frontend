import React from 'react';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ContactPage: React.FC = () => {
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
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-4">{t('contactPage.title', { defaultValue: 'Contact Us' })}</h1>
        </div>

        <section className="space-y-4">
          <p>{t('contactPage.desc', { defaultValue: 'If you have any questions or concerns about our services, please contact us at:' })}</p>
          <a href="mailto:support@pstream.watch" className="text-red-500 hover:underline">support@pstream.watch</a>
        </section>
      </main>
    </div>
  );
};
