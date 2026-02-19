import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import PricingTable from '../components/PricingTable';
import AdSpace from '../components/AdSpace';

export default function Advertise() {
    const { t } = useTranslation();

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Helmet>
                <title>Advertise with Us | OpalPDF</title>
                <meta name="description" content="Reach thousands of users daily. Advertise your product on OpalPDF with our transparent and premium ad spots." />
                <link rel="canonical" href="https://opalpdf.com/advertise" />
                <meta property="og:title" content="Advertise with Us | TG Image" />
                <meta property="og:description" content="Reach thousands of users daily. Advertise your product on OpalPDF with our transparent and premium ad spots." />
                <meta name="twitter:title" content="Advertise with Us | TG Image" />
                <meta name="twitter:description" content="Reach thousands of users daily. Advertise your product on OpalPDF with our transparent and premium ad spots." />
            </Helmet>

            <div className="w-full mb-4">
                <AdSpace placement="header" className="w-full" />
            </div>

            <div className="text-center mb-4">
                <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-0 block">{t('advertisePage.title')}</span>
                <h1 className="text-2xl md:text-4xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    {t('advertisePage.heroTitle')}
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-4">
                    {t('advertisePage.heroDesc')}
                </p>
                <PricingTable />
            </div>

            <div className="mt-12 mb-8">
                <AdSpace placement="footer" className="w-full" />
            </div>
        </>
    );
}
