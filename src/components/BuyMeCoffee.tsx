import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Map app locales to PayPal supported locales
const LOCALE_MAP: Record<string, string> = {
    'en': 'en_US',
    'fr': 'fr_FR',
    'es': 'es_ES',
    'de': 'de_DE',
    'it': 'it_IT',
    'pt': 'pt_BR',
    'zh': 'zh_CN',
    'ja': 'ja_JP',
    'ru': 'ru_RU',
    'ar': 'ar_EG', // PayPal supports ar_EG
    // Fallback for others
};

const BuyMeCoffee: React.FC = () => {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const loadPayPalScript = () => {
            // 1. Cleanup existing script and global object
            const existingScript = document.getElementById('paypal-sdk-script');
            if (existingScript) existingScript.remove();
            if ((window as any).paypal) delete (window as any).paypal;

            // Clear container
            const container = document.getElementById("paypal-container-258NAXUKV2VWG");
            if (container) container.innerHTML = '';

            // 2. Determine Locale
            const appLang = i18n.language.split('-')[0]; // Handle 'en-US' -> 'en'
            const paypalLocale = LOCALE_MAP[appLang] || 'en_US';

            // 3. Create new script
            const script = document.createElement('script');
            script.id = 'paypal-sdk-script';
            script.src = `https://www.paypal.com/sdk/js?client-id=BAA_f9wbsMDeaRztJoMf4OO2ZfRmnkOqe_calvcRJBen6r3O9x2H4rgXVuXKGKdOwwj2xMQgAE3VG7_TnM&components=hosted-buttons&disable-funding=venmo&currency=USD&locale=${paypalLocale}`;
            script.async = true;

            script.onload = () => {
                if ((window as any).paypal && (window as any).paypal.HostedButtons) {
                    try {
                        (window as any).paypal.HostedButtons({
                            hostedButtonId: "258NAXUKV2VWG",
                            onApprove: function () {
                                window.location.href = "https://orbitpdf.pages.dev/thanks";
                            }
                        }).render("#paypal-container-258NAXUKV2VWG");
                    } catch (error) {
                        console.error("PayPal Render Error:", error);
                    }
                }
            };

            document.body.appendChild(script);
        };

        loadPayPalScript();

        // Cleanup on unmount or language change
        return () => {
            const script = document.getElementById('paypal-sdk-script');
            if (script) script.remove();
            const container = document.getElementById("paypal-container-258NAXUKV2VWG");
            if (container) container.innerHTML = '';
        };
    }, [i18n.language]);

    return (
        <div className="flex flex-col items-center justify-center mt-6 w-full animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <div className="flex items-center gap-2 mb-3">
                <p className="text-slate-400 text-sm">{t('common.buyMeCoffee')}</p>
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            </div>
            <div id="paypal-container-258NAXUKV2VWG" title={t('common.supportWithPaypal')} className="z-10 relative w-full max-w-[300px] min-h-[50px] text-slate-900 bg-white rounded-xl p-2"></div>
        </div>
    );
};

export default BuyMeCoffee;
