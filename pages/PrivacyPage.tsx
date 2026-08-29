import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{t('privacyPage.title')}</h1>
          <p className="text-sm text-gray-500">{t('privacyPage.lastUpdated')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section1Title')}</h2>
          <p>{t('privacyPage.section1Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section2Title')}</h2>
          <p>{t('privacyPage.section2Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s2L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s2L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s2L3" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section3Title')}</h2>
          <p>{t('privacyPage.section3Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s3L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L3" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L4" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section4Title')}</h2>
          <p>{t('privacyPage.section4Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s4L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s4L2" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section5Title')}</h2>
          <p>{t('privacyPage.section5Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section6Title')}</h2>
          <p>{t('privacyPage.section6Desc')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section7Title')}</h2>
          <p>{t('privacyPage.section7Desc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><Trans i18nKey="privacyPage.s7L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L3" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L4" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{t('privacyPage.section8Title')}</h2>
          <p>{t('privacyPage.section8Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;
