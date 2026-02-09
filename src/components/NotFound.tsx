
import React from 'react';
import { Home, FileQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-8 h-8 text-slate-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">{t('notFound.title')}</h1>
                <p className="text-slate-400 mb-8">
                    {t('notFound.desc')}
                </p>

                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    {t('notFound.back')}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
