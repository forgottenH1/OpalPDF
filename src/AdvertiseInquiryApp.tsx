import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import './i18n';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileMenu from './components/MobileMenu';
import LegalModal from './components/LegalModal';
import BackToTop from './components/BackToTop';
import AdvertiserInquiryForm from './components/AdvertiserInquiryForm';
import AdSpace from './components/AdSpace';



const AdvertiseInquiryApp = () => {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>('');

    useEffect(() => {
        window.scrollTo(0, 0);
        const params = new URLSearchParams(window.location.search);
        const tier = params.get('tier');
        if (tier) {
            setSelectedTier(tier);
        }
    }, []);

    // Handle RTL
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-['Outfit'] selection:bg-blue-500/30 flex flex-col">
            <Navbar
                onSearch={() => { }}
                openModal={setActiveModal}
                isMenuOpen={isMenuOpen}
                onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
            />

            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                openModal={setActiveModal}
            />

            <main className="flex-grow container mx-auto px-4 py-1 flex flex-col justify-center">
                {/* Top Ad Banner */}
                <div className="mb-4">
                    <AdSpace placement="header" className="w-full" />
                </div>

                <AdvertiserInquiryForm selectedTier={selectedTier} />


                <div className="text-center mt-8">
                    <a href="/advertise.html" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                        &larr; {t('advertise.backToPricing')}
                    </a>
                </div>

                {/* Bottom Ad Banner */}
                <div className="mt-12">
                    <AdSpace placement="footer" className="w-full" />
                </div>
            </main>


            <Footer openModal={setActiveModal} />

            <LegalModal
                isOpen={activeModal === 'privacy' || activeModal === 'terms'}
                onClose={() => setActiveModal(null)}
                title={activeModal === 'privacy' ? t('nav.privacy') : t('nav.terms')}
                content={
                    <div
                        className="space-y-4"
                        dangerouslySetInnerHTML={{
                            __html: activeModal === 'privacy'
                                ? t('legal.privacyContent')
                                : t('legal.termsContent')
                        }}
                    />
                }
            />
            <BackToTop />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AdvertiseInquiryApp />
    </React.StrictMode>,
);
