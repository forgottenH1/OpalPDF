import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdSpace from '../components/AdSpace';

const Thanks: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center space-y-8">

                <div className="flex justify-center mb-8">
                    <div className="p-4 rounded-full bg-green-500/10 text-green-400 animate-in zoom-in duration-500">
                        <CheckCircle size={80} strokeWidth={1.5} />
                    </div>
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-150">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                        {t('payment.success.title', 'Thank you for your support!')}
                    </h1>
                    <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
                        {t('payment.success.message', 'Your payment is complete, and a receipt has been emailed to you.')}
                    </p>
                </div>

                <div className="pt-8 animate-in slide-in-from-bottom duration-700 delay-300">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                    >
                        <Home size={20} />
                        {t('common.backToHome', 'Back to Home')}
                    </Link>
                </div>

                {/* Optional: Show an ad on the thank you page too */}
                <div className="mt-16 pt-8 border-t border-slate-800/50 w-full animate-in fade-in duration-1000 delay-500">
                    <AdSpace placement="footer" />
                </div>

            </div>
        </div>
    );
};

export default Thanks;
