import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdvertiserInquiryFormProps {
    selectedTier?: string;
}

import { useTranslation } from 'react-i18next';

const AdvertiserInquiryForm: React.FC<AdvertiserInquiryFormProps> = ({ selectedTier }) => {
    const { t } = useTranslation();
    const form = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const sendEmail = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.current) return;

        setStatus('sending');
        setErrorMessage('');

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            setStatus('error');
            setErrorMessage(t('contact.errorConfig'));
            return;
        }

        // Note: You might want a different template for advertisers, but reusing the default one works if it includes all fields.
        emailjs.sendForm(serviceId, templateId, form.current, publicKey)
            .then(() => {
                setStatus('success');
                if (form.current) form.current.reset();
                setTimeout(() => setStatus('idle'), 5000);
            }, (error) => {
                setStatus('error');
                setErrorMessage(error.text || t('advertise.errorInquiry'));
            });
    };

    return (
        <div id="contact-form" className="w-full max-w-2xl mx-auto mt-0 scroll-mt-24">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl">
                <div className="text-center mb-0">
                    <div className="inline-flex items-center justify-center p-2 mb-0 bg-blue-500/10 rounded-full text-blue-400">
                        <Mail size={24} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-0">{t('advertise.startCampaign')}</h2>
                    <p className="text-slate-400 text-xs md:text-sm leading-tight mb-0">{t('advertise.subtitle')}</p>
                </div>
                <form ref={form} onSubmit={sendEmail} className="space-y-2 -mt-1">
                    <input type="hidden" name="subject" value={`New Ad Inquiry: ${selectedTier || 'General'}`} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="user_name" className="text-sm font-medium text-slate-300">{t('advertise.name')}</label>
                            <input
                                type="text"
                                name="user_name"
                                id="user_name"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder={t('advertise.namePlaceholder')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="user_email" className="text-sm font-medium text-slate-300">{t('contact.email')}</label>
                            <input
                                type="email"
                                name="user_email"
                                id="user_email"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="ads@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="tier_selection" className="text-sm font-medium text-slate-300">{t('advertise.tierSelection')}</label>
                        <input
                            type="text"
                            name="tier_selection"
                            id="tier_selection"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none"
                            value={selectedTier || t('common.notSelected')}
                            readOnly
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="message" className="text-sm font-medium text-slate-300">{t('advertise.message')}</label>
                        <textarea
                            name="message"
                            id="message"
                            rows={2}
                            required
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                            placeholder={t('advertise.messagePlaceholder')}
                        ></textarea>
                    </div>

                    {status === 'sending' && (
                        <button disabled className="w-full bg-emerald-600/50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-wait">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('advertise.sending')}
                        </button>
                    )}

                    {status === 'idle' && (
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20 text-sm">
                            <Send size={18} />
                            {t('advertise.submit')}
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CheckCircle2 size={24} />
                            <div>
                                <h4 className="font-bold">{t('advertise.successTitle')}</h4>
                                <p className="text-sm text-green-400/80">{t('advertise.successMessage')}</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AlertCircle size={24} />
                            <div>
                                <h4 className="font-bold">{t('contact.errorTitle')}</h4>
                                <p className="text-sm text-red-400/80">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdvertiserInquiryForm;
