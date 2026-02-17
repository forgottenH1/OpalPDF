import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import ContactForm from '../components/ContactForm';
import AdSpace from '../components/AdSpace';

export default function Contact() {
    const { t } = useTranslation();

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Helmet>
                <title>Contact Us | OrbitPDF</title>
                <meta name="description" content="Get in touch with the OrbitPDF team. We'd love to hear from you." />
                <link rel="canonical" href="https://orbitpdf.pages.dev/contact" />
                <meta property="og:title" content="Contact Us | OrbitPDF" />
                <meta property="og:description" content="Get in touch with the OrbitPDF team. We'd love to hear from you." />
                <meta name="twitter:title" content="Contact Us | OrbitPDF" />
                <meta name="twitter:description" content="Get in touch with the OrbitPDF team. We'd love to hear from you." />
            </Helmet>

            <div className="w-full mb-4">
                <AdSpace placement="header" className="w-full" />
            </div>

            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    {t('nav.contact')}
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    {t('contact.intro')}
                </p>
            </div>

            <ContactForm />

            <div className="mt-12 mb-8">
                <AdSpace placement="footer" className="w-full" />
            </div>
        </>
    );
}
