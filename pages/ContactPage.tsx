import React from 'react';
import { useTranslation } from 'react-i18next';

export const ContactPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20 md:pt-24 flex-1 bg-black md:bg-[#141414] text-white font-sans transition-colors duration-200">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{t('contactPage.title', { defaultValue: 'Contact Us' })}</h1>
        </div>

        <section className="space-y-4">
          <p>{t('contactPage.desc', { defaultValue: 'If you have any questions or concerns about our services, please contact us at:' })}</p>
          <a href="mailto:support@pstream.watch" className="text-red-500 hover:underline">support@pstream.watch</a>
        </section>
      </main>
    </div>
  );
};
