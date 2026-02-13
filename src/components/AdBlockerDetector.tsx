import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const AdBlockerDetector: React.FC = () => {
    const { t } = useTranslation();
    const [isAdBlockActive, setIsAdBlockActive] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check for dismissal cooldown
        const dismissedAt = localStorage.getItem('adBlockDismissedAt');

        if (dismissedAt) {
            const timePassed = Date.now() - parseInt(dismissedAt, 10);

            if (timePassed < 5 * 60 * 1000) { // 5 minutes
                return;
            }
        }

        // Method 1: Create a bait element
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner doubleclick ad-placeholder ad-badge';
        bait.style.position = 'absolute';
        bait.style.top = '-1000px';
        bait.style.left = '-1000px';
        bait.style.width = '1px';
        bait.style.height = '1px';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);

        // Method 2: Check if bait is blocked (Cosmetic Filtering)
        const checkBait = () => {
            if (
                bait.offsetParent === null ||
                bait.offsetHeight === 0 ||
                bait.offsetWidth === 0
            ) {
                // Bait detected as hidden!
                setIsAdBlockActive(true);
                setIsVisible(true);
            }
            document.body.removeChild(bait);
        };

        // Method 3: Script Trap (Network Filtering)
        const checkScript = () => {
            const script = document.createElement('script');
            script.src = 'https://exterminatordesperate.com/b6081800cc3b82edbc24e2a9c3cda3da/invoke.js';
            script.async = true;
            script.onerror = () => {
                // Script trap blocked (exterminatordesperate.com)!
                setIsAdBlockActive(true);
                setIsVisible(true);
                document.body.removeChild(script);
            };
            script.onload = () => {
                // Script trap loaded successfully (no blocker).
                document.body.removeChild(script);
            };
            document.body.appendChild(script);
        };

        // Delay checks
        const timeout = setTimeout(() => {
            checkBait();
            checkScript();
        }, 2000);

        return () => {
            clearTimeout(timeout);
            if (document.body.contains(bait)) {
                document.body.removeChild(bait);
            }
        };
    }, []);

    if (!isAdBlockActive || !isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in slide-in-from-bottom-10 duration-500">
                <button
                    onClick={() => {
                        localStorage.setItem('adBlockDismissedAt', Date.now().toString());
                        setIsVisible(false);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-500"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        {t('adBlock.title', 'Ad Blocker Detected')}
                    </h3>

                    <p className="text-slate-300 mb-6 leading-relaxed">
                        {t('adBlock.message', 'OrbitPDF is free and supported by ads. Please consider disabling your ad blocker to help us keep this tool free for everyone.')}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
                    >
                        {t('adBlock.button', 'I\'ve Disabled It, Refresh')}
                    </button>

                    <button
                        onClick={() => {
                            localStorage.setItem('adBlockDismissedAt', Date.now().toString());
                            setIsVisible(false);
                        }}
                        className="mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                        {t('adBlock.dismiss', 'Continue without disabling')} 😢
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdBlockerDetector;
