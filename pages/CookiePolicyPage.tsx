import React from 'react';
import { useTranslation } from 'react-i18next';

export const CookiePolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{t('cookiePage.title', { defaultValue: 'Cookie Policy' })}</h1>
          <p className="text-sm text-gray-500">{t('cookiePage.lastUpdated', { defaultValue: 'Last Updated: August 16, 2026' })}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('cookiePage.section1Title', { defaultValue: 'How we use cookies' })}</h2>
          <p>{t('cookiePage.section1Desc', { defaultValue: 'We use cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.' })}</p>
        </section>
      </main>
    </div>
  );
};
