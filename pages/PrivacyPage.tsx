import React from 'react';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

const PrivacyPage: React.FC = () => {
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
          <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-4">{t('privacyPage.title')}</h1>
          <p className="text-sm text-gray-500">{t('privacyPage.lastUpdated')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section1Title')}</h2>
          <p>{t('privacyPage.section1Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s1L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s1L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s1L3" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section2Title')}</h2>
          <p>{t('privacyPage.section2Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s2L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s2L2" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section3Title')}</h2>
          <p>{t('privacyPage.section3Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section4Title')}</h2>
          <p>{t('privacyPage.section4Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s4L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s4L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s4L3" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section5Title')}</h2>
          <p>{t('privacyPage.section5Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t('privacyPage.section6Title')}</h2>
          <p>{t('privacyPage.section6Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;
