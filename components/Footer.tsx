import React, { useState, useRef, useEffect } from 'react';
import { InstagramLogo as InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { TwitterLogo as TwitterLogoIcon } from '@phosphor-icons/react/dist/ssr/TwitterLogo';
import { YoutubeLogo as YoutubeLogoIcon } from '@phosphor-icons/react/dist/ssr/YoutubeLogo';
import { GithubLogo as GithubLogoIcon } from '@phosphor-icons/react/dist/ssr/GithubLogo';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management for A11y
  useEffect(() => {
    if (showPrivacyModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showPrivacyModal]);

  const navLinks = [
    { name: t('nav.homeTitle', { defaultValue: 'Home' }), path: '/' },
    { name: t('nav.showsTitle', { defaultValue: 'TV Shows' }), path: '/tv' },
    { name: t('nav.moviesTitle', { defaultValue: 'Movies' }), path: '/movies' },
    { name: t('nav.newTitle', { defaultValue: 'New & Popular' }), path: '/new' },
    { name: t('nav.listTitle', { defaultValue: 'My List' }), path: '/list' },
    { name: t('nav.settingsTitle', { defaultValue: 'Settings' }), path: '/settings' },
    { name: t('footer.privacyPolicy', { defaultValue: 'Privacy Policy' }), path: '/privacy' },
    { name: t('footer.cookiePolicy', { defaultValue: 'Cookie Policy' }), path: '/cookies' },
    { name: t('footer.cookiePreferences', { defaultValue: 'Cookie Preferences' }), action: () => setShowPrivacyModal(true) },
    { name: t('footer.termsOfService', { defaultValue: 'Terms of Service' }), path: '/terms' },
    { name: t('footer.contactUs', { defaultValue: 'Contact Us' }), path: '/contact' }
  ];

  return (
    <>
      <footer className="hidden w-full bg-[#141414] text-[#808080] py-12 px-6 md:px-20 lg:px-32 xl:px-44 2xl:px-56 text-sm mt-12">
        <div className="max-w-[1000px] mx-auto">

          {/* Social Icons */}
          <div className="flex space-x-6 mb-8" aria-label="Social Media Links">
            <InstagramLogoIcon size={24} weight="fill" className="hover:text-white cursor-pointer transition-colors duration-200" aria-label="Instagram" tabIndex={0} />
            <TwitterLogoIcon size={24} weight="fill" className="hover:text-white cursor-pointer transition-colors duration-200" aria-label="Twitter" tabIndex={0} />
            <YoutubeLogoIcon size={24} weight="fill" className="hover:text-white cursor-pointer transition-colors duration-200" aria-label="YouTube" tabIndex={0} />
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubLogoIcon size={24} weight="fill" className="hover:text-white cursor-pointer transition-colors duration-200" />
            </a>
          </div>

          {/* Links Grid */}
          <nav aria-label="Footer Navigation" className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 mb-8">
            {navLinks.map((link) => (
              link.path ? (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:underline hover:text-white transition-colors duration-200 text-xs md:text-sm"
                  aria-label={link.name}
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={link.action}
                  className="text-left hover:underline hover:text-white transition-colors duration-200 text-xs md:text-sm"
                  aria-label={link.name}
                >
                  {link.name}
                </button>
              )
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-xs mt-8">
            &copy; {new Date().getFullYear()} Pstream, Inc.
          </div>
        </div>
      </footer>

      {/* Basic Placeholder for Privacy Preference Center */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
        >
          <div 
            ref={modalRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#181818] text-black dark:text-white w-full max-w-2xl rounded-sm overflow-hidden flex flex-col max-h-[85vh] outline-none"
          >
            <div className="p-6 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#202020]">
              <h2 id="cookie-modal-title" className="text-xl font-bold text-gray-800 dark:text-white">
                {t('cookieConsent.title')}
              </h2>
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="text-3xl leading-none text-gray-500 hover:text-black dark:hover:text-white"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
               <div className="md:w-1/3 space-y-2 border-r pr-4 border-gray-200 dark:border-gray-800">
                  <div className="p-3 bg-red-600 text-white font-bold text-sm cursor-pointer border-l-4 border-red-800" tabIndex={0}>
                    {t('cookieConsent.generalDesc')}
                  </div>
                  <div className="p-3 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" tabIndex={0}>
                    {t('cookieConsent.essential')}
                  </div>
                  <div className="p-3 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" tabIndex={0}>
                    {t('cookieConsent.performance')}
                  </div>
               </div>
               <div className="md:w-2/3 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <h3 className="font-bold text-lg text-black dark:text-white">{t('cookieConsent.generalDesc')}</h3>
                  <p>{t('cookieConsent.desc1')}</p>
                  <p>{t('cookieConsent.desc2')}</p>
               </div>
            </div>
            
            <div className="p-4 border-t border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#202020] flex justify-start">
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-sm transition-colors"
                aria-label={t('cookieConsent.saveSettings')}
              >
                {t('cookieConsent.saveSettings')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;