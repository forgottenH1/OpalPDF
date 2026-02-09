import React from 'react';
import { useTranslation } from 'react-i18next';

interface AdSpaceProps {
    placement: 'header' | 'footer' | 'sidebar' | 'interstitial';
    className?: string;
}

const AdSpace: React.FC<AdSpaceProps> = ({ placement, className = '' }) => {
    const { t } = useTranslation();

    // Fallback / Self-Promo (Default behavior now since Sanity is removed)
    if (placement === 'sidebar') {
        return (
            <div className={`w-[160px] h-[600px] bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 text-center ${className}`}>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">{t('adSpace.label')}</p>

                <a href="/advertise.html" className="group block w-full flex-grow">
                    <div className="h-full bg-gradient-to-b from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-all flex flex-col items-center justify-center gap-6">
                        <div className="text-center">
                            <p className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors mb-2">{t('adSpace.placeholderTitle')}</p>
                            <p className="text-slate-400 text-xs">{t('adSpace.placeholderDescSidebar')}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-blue-500 font-semibold uppercase tracking-wider bg-blue-500/10 px-3 py-2 rounded-full group-hover:bg-blue-500/20 transition-colors text-center">{t('adSpace.ctaSidebar')}</span>
                    </div>
                </a>
            </div>
        );
    }

    return (
        <div className={`w-full min-h-[140px] bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center p-6 text-center ${className}`}>
            <div className="w-full max-w-2xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-3">{t('adSpace.label')}</p>
                <a href="/advertise.html" className="group block">
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-left">
                                <p className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{t('adSpace.placeholderTitle')}</p>
                                <p className="text-slate-400 text-sm">{t('adSpace.placeholderDescBanner')}</p>
                            </div>
                            <span className="shrink-0 text-xs text-blue-500 font-semibold uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-full group-hover:bg-blue-500/20 transition-colors">{t('adSpace.ctaBanner')} &rarr;</span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default AdSpace;
