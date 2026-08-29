import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-[#141414] text-gray-900 dark:text-white font-inter transition-colors duration-200">

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-600 dark:text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-4">{t('termsPage.title')}</h1>
          <p className="text-sm text-gray-500">{t('termsPage.lastUpdated')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section1Title')}</h2>
          <p>{t('termsPage.section1Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section2Title')}</h2>
          <p>{t('termsPage.section2Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section3Title')}</h2>
          <p>{t('termsPage.section3Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section4Title')}</h2>
          <p>{t('termsPage.section4Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('termsPage.s4L1')}</li>
            <li>{t('termsPage.s4L2')}</li>
            <li>{t('termsPage.s4L3')}</li>
            <li>{t('termsPage.s4L4')}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section5Title')}</h2>
          <p>{t('termsPage.section5Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section6Title')}</h2>
          <p>{t('termsPage.section6Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section7Title')}</h2>
          <p>{t('termsPage.section7Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section8Title')}</h2>
          <p>{t('termsPage.section8Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section9Title')}</h2>
          <p>{t('termsPage.section9Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('termsPage.section10Title')}</h2>
          <p>{t('termsPage.section10Desc')}</p>
        </section>
      </main>
    </div>
  );
};
