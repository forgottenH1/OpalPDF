import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Guides from './components/Guides';
import LegalModal from './components/LegalModal';
import BackToTop from './components/BackToTop';
import MobileMenu from './components/MobileMenu'; // Import MobileMenu
import AdSpace from './components/AdSpace';


// Legal Content removed - using translations

export default function GuidesApp() {
    const { t, i18n } = useTranslation();
    const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile Menu State

    // Handle RTL
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    // On this page, we don't have tool selection, so 'guides' isn't really a modal state 
    // needed for navigation, but we keep the structure for Navbar compatibility.
    // 'guides' modal/link in Navbar will just reload or start here.

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            <Navbar
                onSearch={(q) => {
                    setSearchQuery(q);
                    // We might want to pass this search query down to Guides if we want global search to work here
                }}
                openModal={setActiveModal}
                isMenuOpen={isMenuOpen}
                onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
            />

            {/* Mobile Menu (Portal-like behavior via root render) */}
            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                openModal={setActiveModal}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-1">
                {/* Top Ad Banner */}
                <div className="mb-4">
                    <AdSpace placement="header" className="w-full" />
                </div>

                <Guides externalSearch={searchQuery} onBack={() => window.history.back()} />

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
}
