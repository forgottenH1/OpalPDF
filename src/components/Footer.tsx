import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { tools } from '../data/tools';



interface FooterProps {
    openModal: (type: 'privacy' | 'terms') => void;
}

const Footer: React.FC<FooterProps> = ({ openModal }) => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    // Select 4 random tools
    const randomTools = useMemo(() => {
        const shuffled = [...tools].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }, []);

    return (
        <footer className="w-full mt-20 border-t border-white/10 bg-slate-950/50 backdrop-blur-lg">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/logo-transparent.png" alt={t('footer.logoAlt')} className="w-8 h-8 rounded-lg" />
                            <span className="text-xl font-bold text-white">OpalPDF</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">{t('footer.toolsTitle')}</h4>
                        <ul className="text-slate-400 text-sm space-y-2">
                            {randomTools.map((tool) => (
                                <li key={tool.id}>
                                    <a href={`/?tool=${tool.id}`} className="hover:text-blue-400 transition-colors">
                                        {t(`tools.${tool.id}.title`)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">{t('footer.legalTitle')}</h4>
                        <ul className="text-slate-400 text-sm space-y-2">
                            <li><a href="/guides" className="hover:text-blue-400 transition-colors">{t('nav.guides')}</a></li>
                            <li><a href="/blog" className="hover:text-blue-400 transition-colors">{t('nav.blog', 'Blog')}</a></li>
                            <li><button onClick={() => openModal('privacy')} className="hover:text-blue-400 transition-colors text-left">{t('nav.privacy')}</button></li>
                            <li><button onClick={() => openModal('terms')} className="hover:text-blue-400 transition-colors text-left">{t('nav.terms')}</button></li>
                            <li><a href="/contact" className="hover:text-blue-400 transition-colors">{t('nav.contact')}</a></li>
                            <li><a href="/faq" className="hover:text-blue-400 transition-colors">{t('nav.faq')}</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs">
                        © {currentYear} {t('footer.rights')}
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;