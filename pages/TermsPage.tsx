import React from 'react';
import { useTranslation } from 'react-i18next';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-[#e5e5e5] space-y-10 md:space-y-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{t('termsPage.title')}</h1>
          <p className="text-base text-[#808080] font-semibold mt-4 mb-10 block">{t('termsPage.lastUpdated')}</p>
        </div>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section1Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section1Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section2Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section2Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section3Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section3Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section4Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section4Desc')}</p>
          <ul className="list-disc pl-8 space-y-3 text-base md:text-[17px] leading-8 text-[#b3b3b3] marker:text-[#808080]">
            <li>{t('termsPage.s4L1')}</li>
            <li>{t('termsPage.s4L2')}</li>
            <li>{t('termsPage.s4L3')}</li>
            <li>{t('termsPage.s4L4')}</li>
          </ul>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section5Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section5Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section6Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section6Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section7Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section7Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section8Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section8Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section9Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section9Desc')}</p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">{t('termsPage.section10Title')}</h2>
          <p className="text-base md:text-[17px] leading-8 text-[#b3b3b3]">{t('termsPage.section10Desc')}</p>
        </section>
      </main>
    </div>
  );
};
