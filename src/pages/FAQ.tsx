import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AdSpace from '../components/AdSpace';

export default function FAQ() {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    const faqs = t('faq.items', { returnObjects: true }) as Array<{ question: string; answer: string }>;
    const title = t('faq.title', 'Frequently Asked Questions');
    const subtitle = t('faq.subtitle', 'Common questions about OrbitPDF and how it works.');

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Helmet>
                <title>{title} | OrbitPDF</title>
                <meta name="description" content={subtitle} />
                <link rel="canonical" href="https://orbitpdf.pages.dev/faq" />
            </Helmet>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="w-full mb-12">
                    <AdSpace placement="header" className="w-full" />
                </div>

                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
                    <div className="inline-block p-3 rounded-2xl bg-blue-500/10 mb-6">
                        <HelpCircle className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                        {title}
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                    {Array.isArray(faqs) && faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`group rounded-2xl border transition-all duration-300 ${openIndex === index
                                ? 'bg-slate-800/50 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                                }`}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                                aria-expanded={openIndex === index}
                            >
                                <span className={`text-lg font-medium transition-colors ${openIndex === index ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'
                                    }`}>
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                                )}
                            </button>

                            <div
                                className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-6 pb-6 text-slate-400 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20">
                    <AdSpace placement="footer" className="w-full" />
                </div>
            </main>
        </div>
    );
}
