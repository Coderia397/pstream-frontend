import React from 'react';
import { useTranslation } from 'react-i18next';

const DisclaimerPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{t('disclaimerPage.title')}</h1>
          <p className="text-sm text-gray-500">{t('disclaimerPage.lastUpdated')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('disclaimerPage.section1Title')}</h2>
          <p>{t('disclaimerPage.section1Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('disclaimerPage.section2Title')}</h2>
          <p>{t('disclaimerPage.section2Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('disclaimerPage.section3Title')}</h2>
          <p>{t('disclaimerPage.section3Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('disclaimerPage.section4Title')}</h2>
          <p>{t('disclaimerPage.section4Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('disclaimerPage.section5Title')}</h2>
          <p>{t('disclaimerPage.section5Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default DisclaimerPage;
