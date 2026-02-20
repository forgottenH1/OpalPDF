import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Guides from './components/Guides';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToolCard from './components/ToolCard';
import LegalModal from './components/LegalModal';
import BackToTop from './components/BackToTop';
// Lazy load the heavy ToolProcessor
const ToolProcessor = lazy(() => import('./components/ToolProcessor'));
const Contact = lazy(() => import('./pages/Contact'));
const Thanks = lazy(() => import('./pages/Thanks'));
const FAQ = lazy(() => import('./pages/FAQ'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
import MobileMenu from './components/MobileMenu';
import AdSpace from './components/AdSpace';
import NotFound from './components/NotFound';
import LanguageSuggestion from './components/LanguageSuggestion';
import CookieConsent from './components/CookieConsent';
import { tools } from './data/tools';

// Wrapper for ToolProcessor to extract ID from params
const ToolRoute = () => {
    const { toolId } = useParams();
    const { t } = useTranslation();

    const activeToolData = tools.find(t => t.id === toolId);

    if (!activeToolData) {
        return <NotFound />;
    }

    return (
        <>
            <div className="w-full mb-8">
                <AdSpace placement="header" className="w-full" />
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-lg animate-pulse">{t('common.loading')}</p>
                </div>
            }>
                <ToolProcessor
                    toolId={activeToolData.id}
                    toolName={t(`tools.${activeToolData.id}.title`)}
                    onBack={() => window.location.href = '/'}
                />
            </Suspense>

            <div className="mt-12 mb-8">
                <AdSpace placement="footer" className="w-full" />
            </div>
        </>
    );
};

export default function App() {
    const { t, i18n } = useTranslation();
    const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle RTL
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    // Tools filtering
    const filteredTools = tools.filter(tool =>
        t(`tools.${tool.id}.title`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(`tools.${tool.id}.desc`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Dynamic SEO Metadata helper
    const ToolMetadata = () => {
        const { toolId } = useParams();
        const activeToolData = tools.find(t => t.id === toolId);

        if (!activeToolData) return null;

        const pageTitle = `${t(`tools.${activeToolData.id}.title`)} - OpalPDF`;
        const socialTitle = `${t(`tools.${activeToolData.id}.title`)} - OpalPDF`;
        const pageDescription = t(`tools.${activeToolData.id}.desc`);
        const canonicalUrl = `https://opalpdf.com/${activeToolData.id}`; // Clean URL

        return (
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={socialTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta name="twitter:title" content={socialTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <link rel="canonical" href={canonicalUrl} />
            </Helmet>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            {/* Global Helmet for Home (overridden by ToolMetadata) */}
            <Routes>
                <Route path="/" element={
                    <Helmet>
                        <title>{t('hero.title')} | OpalPDF</title>
                        <meta name="description" content={t('hero.description')} />
                        <meta property="og:title" content={`${t('hero.title')} | OpalPDF`} />
                        <meta property="og:description" content={t('hero.description')} />
                        <link rel="canonical" href="https://opalpdf.com/" />
                    </Helmet>
                } />
                <Route path="/thanks" element={
                    <Helmet>
                        <title>{t('payment.success.title', 'Thank You')} | OpalPDF</title>
                        <meta name="robots" content="noindex" />
                    </Helmet>
                } />
                <Route path="/faq" element={
                    <Helmet>
                        <title>{t('faq.title')} | OpalPDF</title>
                        <meta name="description" content={t('faq.subtitle')} />
                        <link rel="canonical" href="https://opalpdf.com/faq" />
                    </Helmet>
                } />
                <Route path="/blog" element={
                    <Helmet>
                        <title>Blog - PDF Guides & Tips | OpalPDF</title>
                    </Helmet>
                } />
                <Route path="/guides" element={
                    <Helmet>
                        <title>{t('guides.title')} | OpalPDF</title>
                        <meta name="description" content={t('guides.subtitle')} />
                    </Helmet>
                } />
                <Route path="/guides/:id" element={
                    <Helmet>
                        {/* Title will be handled inside Guides component for specific IDs */}
                        <title>{t('guides.title')} | OpalPDF</title>
                    </Helmet>
                } />
                <Route path="/:toolId" element={<ToolMetadata />} />
            </Routes>

            <Navbar
                onSearch={setSearchQuery}
                openModal={setActiveModal}
                isMenuOpen={isMenuOpen}
                onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
            />

            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                openModal={setActiveModal}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-1">
                <Routes>
                    {/* Homepage - Tool Grid */}
                    <Route path="/" element={
                        <>
                            <div className="w-full mb-4 py-4">
                                <AdSpace placement="header" className="w-full" />
                            </div>

                            <header className="text-center mb-6 px-4">
                                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                                    {t('hero.title')}
                                </h1>
                                <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto">
                                    {t('hero.description')}
                                </p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredTools.map((tool) => (
                                    <ToolCard
                                        key={tool.id}
                                        title={t(`tools.${tool.id}.title`)}
                                        description={t(`tools.${tool.id}.desc`)}
                                        icon={tool.icon}
                                        tag={tool.category}
                                        toolId={tool.id}
                                    />
                                ))}
                            </div>

                            <div className="mt-12 mb-8">
                                <AdSpace placement="footer" className="w-full" />
                            </div>

                            {filteredTools.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-slate-500 text-lg">{t('common.noToolsFound', { query: searchQuery })}</p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4 text-blue-400 hover:underline"
                                    >
                                        {t('common.search')}
                                    </button>
                                </div>
                            )}
                        </>
                    } />

                    {/* Guides Routes with Ads */}
                    <Route path="/guides" element={
                        <>
                            <div className="w-full mb-4">
                                <AdSpace placement="header" className="w-full" />
                            </div>
                            <Guides externalSearch={searchQuery} />
                            <div className="mt-12 mb-8">
                                <AdSpace placement="footer" className="w-full" />
                            </div>
                        </>
                    } />
                    <Route path="/guides/:id" element={
                        <>
                            <div className="w-full mb-4">
                                <AdSpace placement="header" className="w-full" />
                            </div>
                            <Guides externalSearch={searchQuery} />
                            <div className="mt-12 mb-8">
                                <AdSpace placement="footer" className="w-full" />
                            </div>
                        </>
                    } />

                    {/* Tool Route - Clean URL /merge-pdf etc */}
                    <Route path="/:toolId" element={<ToolRoute />} />

                    <Route path="/thanks" element={
                        <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin mx-auto mt-20 text-blue-500" />}>
                            <Thanks />
                        </Suspense>
                    } />

                    <Route path="/faq" element={
                        <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin mx-auto mt-20 text-blue-500" />}>
                            <FAQ />
                        </Suspense>
                    } />

                    <Route path="/contact" element={
                        <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin mx-auto mt-20 text-blue-500" />}>
                            <Contact />
                        </Suspense>
                    } />

                    <Route path="/blog" element={
                        <>
                            <div className="w-full mb-4">
                                <AdSpace placement="header" className="w-full" />
                            </div>
                            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin mx-auto mt-20 text-blue-500" />}>
                                <BlogList />
                            </Suspense>
                            <div className="mt-12 mb-8">
                                <AdSpace placement="footer" className="w-full" />
                            </div>
                        </>
                    } />

                    <Route path="/blog/:id" element={
                        <>
                            <div className="w-full mb-4">
                                <AdSpace placement="header" className="w-full" />
                            </div>
                            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin mx-auto mt-20 text-blue-500" />}>
                                <BlogPost />
                            </Suspense>
                            <div className="mt-12 mb-8">
                                <AdSpace placement="footer" className="w-full" />
                            </div>
                        </>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
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
            <LanguageSuggestion />
            <CookieConsent />
        </div>
    );
}