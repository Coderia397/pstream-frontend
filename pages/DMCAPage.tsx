import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

const DMCAPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-[#141414] text-gray-900 dark:text-white font-inter transition-colors duration-200">

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-600 dark:text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-4">{t('dmcaPage.title')}</h1>
          <p className="text-sm text-gray-500">{t('dmcaPage.lastUpdated')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section1Title')}</h2>
          <p>{t('dmcaPage.section1Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section2Title')}</h2>
          <p>{t('dmcaPage.section2Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="dmcaPage.s2L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s2L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s2L3" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section3Title')}</h2>
          <p>{t('dmcaPage.section3Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="dmcaPage.s3L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s3L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s3L3" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s3L4" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s3L5" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="dmcaPage.s3L6" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section4Title')}</h2>
          <p>{t('dmcaPage.section4Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section5Title')}</h2>
          <p>{t('dmcaPage.section5Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('dmcaPage.section6Title')}</h2>
          <p>{t('dmcaPage.section6Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default DMCAPage;
