import React from 'react';
import { useTranslation } from 'react-i18next';

const DisclaimerPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-[#e5e5e5] space-y-10 md:space-y-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{t('disclaimerPage.title')}</h1>
          <p className="text-base text-[#808080] font-semibold mt-4 mb-10 block">{t('disclaimerPage.lastUpdated')}</p>
        </div>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('disclaimerPage.section1Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('disclaimerPage.section1Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('disclaimerPage.section2Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('disclaimerPage.section2Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('disclaimerPage.section3Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('disclaimerPage.section3Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('disclaimerPage.section4Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('disclaimerPage.section4Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('disclaimerPage.section5Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('disclaimerPage.section5Desc')}</p>
        </section>
      </main>
    </div>
  );
};

export default DisclaimerPage;
