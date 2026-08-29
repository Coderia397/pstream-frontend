import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-[#e5e5e5] space-y-10 md:space-y-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{t('privacyPage.title')}</h1>
          <p className="text-base text-[#808080] font-semibold mt-4 mb-10 block">{t('privacyPage.lastUpdated')}</p>
        </div>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section1Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section1Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section2Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section2Desc')}</p>
          <ul className="list-disc pl-8 space-y-3 text-base md:text-[17px] leading-8 text-[#b3b3b3] marker:text-[#808080]">
            <li><Trans i18nKey="privacyPage.s2L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s2L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s2L3" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section3Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section3Desc')}</p>
          <ul className="list-disc pl-8 space-y-3 text-base md:text-[17px] leading-8 text-[#b3b3b3] marker:text-[#808080]">
            <li><Trans i18nKey="privacyPage.s3L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L3" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s3L4" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section4Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section4Desc')}</p>
          <ul className="list-disc pl-8 space-y-3 text-base md:text-[17px] leading-8 text-[#b3b3b3] marker:text-[#808080]">
            <li><Trans i18nKey="privacyPage.s4L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s4L2" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section5Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section5Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section6Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section6Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section7Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section7Desc')}</p>
          <ul className="list-disc pl-8 space-y-3 text-base md:text-[17px] leading-8 text-[#b3b3b3] marker:text-[#808080]">
            <li><Trans i18nKey="privacyPage.s7L1" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L2" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L3" components={[<strong key="0" />]} /></li>
            <li><Trans i18nKey="privacyPage.s7L4" components={[<strong key="0" />]} /></li>
          </ul>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('privacyPage.section8Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('privacyPage.section8Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;
